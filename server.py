#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quan-Taara Interface · Mark-I — local account backend.

Dependency-free (Python 3 stdlib only). Run:

    python server.py

Then open http://localhost:8787  (the HTML front-end auto-detects the
backend via GET /api/public/auth/me and switches into "cloud account"
mode automatically).

Endpoints implemented to match quantaaraPrototype.backup.html:
    GET  /                      -> serves the HTML file
    GET  /api/public/auth/me    -> {username} if token valid, else 401
    POST /api/public/auth/register
    POST /api/public/auth/login
    POST /api/public/ai       -> optional OpenAI-compatible model proxy
    GET  /api/public/chat       -> chat history for the token holder
    POST /api/public/chat       -> stores a question + generated answer

Optional model configuration:
    QT_AI_BASE_URL=http://127.0.0.1:1234/v1
    QT_AI_MODEL=your-model-name
    QT_AI_API_KEY=optional-provider-key
"""
import json
import os
import re
import sqlite3
import hashlib
import hmac
import secrets
import time
import threading
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

HOST = "127.0.0.1"
PORT = 8787
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_FILE = os.path.join(BASE_DIR, "quantaaraPrototype.backup.html")
DB_FILE = os.path.join(BASE_DIR, "quantaara.db")
TOKEN_SECRET = None  # lazily persisted so tokens survive restarts

DB_LOCK = threading.Lock()

# Optional OpenAI-compatible model adapter. This works with LM Studio, vLLM,
# OpenRouter, or any local/remote endpoint that exposes /chat/completions.
AI_BASE_URL = os.environ.get("QT_AI_BASE_URL", "").strip().rstrip("/")
AI_API_URL = os.environ.get("QT_AI_API_URL", "").strip()
AI_API_KEY = os.environ.get("QT_AI_API_KEY", "").strip()
AI_MODEL = os.environ.get("QT_AI_MODEL", "local-model").strip() or "local-model"
try:
    AI_TIMEOUT = max(3, min(int(os.environ.get("QT_AI_TIMEOUT", "25")), 120))
except ValueError:
    AI_TIMEOUT = 25


def _load_secret():
    global TOKEN_SECRET
    secret_file = os.path.join(BASE_DIR, "quantaara.secret")
    if TOKEN_SECRET is None:
        if os.path.exists(secret_file):
            with open(secret_file, "r", encoding="utf-8") as fh:
                TOKEN_SECRET = fh.read().strip()
        else:
            TOKEN_SECRET = secrets.token_hex(32)
            with open(secret_file, "w", encoding="utf-8") as fh:
                fh.write(TOKEN_SECRET)
    return TOKEN_SECRET


def _db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    with DB_LOCK:
        conn = _db()
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    salt TEXT NOT NULL,
                    pass_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS chat (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    is_ridiculous INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.commit()
        finally:
            conn.close()


def _hash_password(password, salt=None):
    if salt is None:
        salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000
    )
    return salt, digest.hex()


def _make_token(user_id, username):
    payload = f"{user_id}.{username}.{int(time.time())}"
    sig = hmac.new(
        _load_secret().encode("utf-8"), payload.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    return payload + "." + sig


def _parse_token(token):
    if not token or not isinstance(token, str):
        return None
    parts = token.split(".")
    if len(parts) != 4:
        return None
    payload = ".".join(parts[:3])
    sig = parts[3]
    expected = hmac.new(
        _load_secret().encode("utf-8"), payload.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        user_id = int(parts[0])
        username = parts[1]
        issued = int(parts[2])
    except (ValueError, IndexError):
        return None
    if time.time() - issued > 60 * 60 * 24 * 30:  # 30 day expiry
        return None
    return {"id": user_id, "username": username}


def _bearer(headers):
    auth = headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return _parse_token(auth[7:].strip())
    return None


def _json(handler, status, obj):
    body = json.dumps(obj).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


def _tiny_answer(question):
    """Very small offline answer generator for the chat-history endpoint."""
    q = (question or "").lower()
    if any(k in q for k in ("black hole", "singularity", "event horizon")):
        return "The region beyond the event horizon is causally disconnected from us — no signal can escape. General relativity predicts a singularity at its core."
    if any(k in q for k in ("einstein", "relativity", "e=mc")):
        return "Special relativity unifies space and time into spacetime; E=mc² states mass and energy are interchangeable."
    if any(k in q for k in ("quantum", "schrodinger", "wavefunction")):
        return "Quantum mechanics describes nature at atomic scales via wavefunctions that evolve by the Schrödinger equation."
    if any(k in q for k in ("gravity", "gravit", "newton")):
        return "Newton's law of gravitation says any two masses attract with F = Gm₁m₂/r²."
    return "Processed and stored by the Quan-Taara account backend."


def _model_endpoint():
    if AI_API_URL:
        return AI_API_URL
    if AI_BASE_URL:
        return AI_BASE_URL if AI_BASE_URL.endswith("/chat/completions") else AI_BASE_URL + "/chat/completions"
    return ""


def _ask_configured_model(question, history):
    endpoint = _model_endpoint()
    if not endpoint:
        raise RuntimeError("AI model is not configured. Set QT_AI_BASE_URL and QT_AI_MODEL.")
    messages = [
        {
            "role": "system",
            "content": (
                "You are ASTROPIX, a careful physics and astronomy tutor. "
                "Solve numerical problems step by step, show units, state assumptions, "
                "and keep the answer concise and readable."
            ),
        }
    ]
    for item in (history or [])[-24:]:
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        content = item.get("content")
        if role in ("user", "assistant") and isinstance(content, str) and content.strip():
            messages.append({"role": role, "content": content[:6000]})
    messages.append({"role": "user", "content": question[:6000]})
    payload = json.dumps(
        {
            "model": AI_MODEL,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 700,
        }
    ).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if AI_API_KEY:
        headers["Authorization"] = "Bearer " + AI_API_KEY
    request = urllib.request.Request(endpoint, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=AI_TIMEOUT) as response:
            raw = response.read()
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"Configured AI model returned HTTP {exc.code}.") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError("Configured AI model could not be reached.") from exc
    try:
        result = json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeDecodeError) as exc:
        raise RuntimeError("Configured AI model returned invalid JSON.") from exc
    answer = ""
    if isinstance(result, dict):
        choices = result.get("choices")
        if isinstance(choices, list) and choices and isinstance(choices[0], dict):
            message = choices[0].get("message")
            if isinstance(message, dict):
                answer = str(message.get("content", "")).strip()
        if not answer and isinstance(result.get("message"), dict):
            answer = str(result["message"].get("content", "")).strip()
    if not answer:
        raise RuntimeError("Configured AI model returned an empty answer.")
    return answer


class Handler(BaseHTTPRequestHandler):
    server_version = "QuanTaara/1.0"

    def log_message(self, fmt, *args):
        pass  # keep console clean

    def _read_body(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
        except (TypeError, ValueError):
            length = 0
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return {}

    # ── GET ──────────────────────────────────────────────────────────
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/public/auth/me":
            user = _bearer(self.headers)
            if not user:
                _json(self, 401, {"error": "Unauthorized"})
                return
            _json(self, 200, {"username": user["username"]})
            return

        if path == "/api/public/chat":
            user = _bearer(self.headers)
            if not user:
                _json(self, 401, {"error": "Unauthorized"})
                return
            with DB_LOCK:
                conn = _db()
                try:
                    rows = conn.execute(
                        "SELECT question, answer, is_ridiculous, created_at FROM chat "
                        "WHERE user_id=? ORDER BY id DESC LIMIT 200",
                        (user["id"],),
                    ).fetchall()
                finally:
                    conn.close()
            _json(
                self,
                200,
                [
                    {
                        "question": r["question"],
                        "answer": r["answer"],
                        "is_ridiculous": bool(r["is_ridiculous"]),
                        "created_at": r["created_at"],
                    }
                    for r in rows
                ],
            )
            return

        if path == "/" or path == "/index.html":
            if not os.path.exists(HTML_FILE):
                _json(self, 500, {"error": "quantaaraPrototype.backup.html not found next to server.py"})
                return
            with open(HTML_FILE, "rb") as fh:
                body = fh.read()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return

        _json(self, 404, {"error": "Not found"})

    # ── POST ─────────────────────────────────────────────────────────
    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._read_body()

        if path == "/api/public/auth/register":
            username = str(body.get("username", "")).strip()
            email = str(body.get("email", "")).strip().lower()
            password = str(body.get("password", ""))
            if len(username) < 2:
                _json(self, 400, {"error": "Username must be at least 2 characters."})
                return
            if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
                _json(self, 400, {"error": "Please enter a valid email."})
                return
            if len(password) < 6:
                _json(self, 400, {"error": "Password must be at least 6 characters."})
                return
            with DB_LOCK:
                conn = _db()
                try:
                    existing = conn.execute(
                        "SELECT id FROM users WHERE email=?", (email,)
                    ).fetchone()
                    if existing:
                        _json(self, 400, {"error": "Account already exists for that email."})
                        return
                    salt, phash = _hash_password(password)
                    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                    cur = conn.execute(
                        "INSERT INTO users (username, email, salt, pass_hash, created_at) "
                        "VALUES (?,?,?,?,?)",
                        (username, email, salt, phash, now),
                    )
                    conn.commit()
                    uid = cur.lastrowid
                finally:
                    conn.close()
            token = _make_token(uid, username)
            _json(self, 200, {"token": token, "username": username})
            return

        if path == "/api/public/auth/login":
            email = str(body.get("email", "")).strip().lower()
            password = str(body.get("password", ""))
            with DB_LOCK:
                conn = _db()
                try:
                    row = conn.execute(
                        "SELECT id, username, salt, pass_hash FROM users WHERE email=?",
                        (email,),
                    ).fetchone()
                finally:
                    conn.close()
            if not row:
                _json(self, 400, {"error": "No account for that email. Register first."})
                return
            _, check = _hash_password(password, row["salt"])
            if not hmac.compare_digest(check, row["pass_hash"]):
                _json(self, 400, {"error": "Incorrect password."})
                return
            token = _make_token(row["id"], row["username"])
            _json(self, 200, {"token": token, "username": row["username"]})
            return

        if path == "/api/public/chat":
            user = _bearer(self.headers)
            if not user:
                _json(self, 401, {"error": "Unauthorized"})
                return
            question = str(body.get("question", "")).strip()
            if not question:
                _json(self, 400, {"error": "Empty question"})
                return
            answer = str(body.get("answer", "") or _tiny_answer(question)).strip()
            is_rid = 1 if body.get("isRidiculous") else 0
            now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            with DB_LOCK:
                conn = _db()
                try:
                    conn.execute(
                        "INSERT INTO chat (user_id, question, answer, is_ridiculous, created_at) "
                        "VALUES (?,?,?,?,?)",
                        (user["id"], question, answer, is_rid, now),
                    )
                    conn.commit()
                finally:
                    conn.close()
            _json(self, 200, {"ok": True})
            return

        if path == "/api/public/ai":
            user = _bearer(self.headers)
            if not user:
                _json(self, 401, {"error": "Unauthorized"})
                return
            question = str(body.get("question", "")).strip()
            if not question:
                _json(self, 400, {"error": "Empty question", "code": "invalid_request"})
                return
            if len(question) > 6000:
                _json(self, 413, {"error": "Question is too long.", "code": "invalid_request"})
                return
            history = body.get("history", [])
            if not isinstance(history, list):
                history = []
            try:
                answer = _ask_configured_model(question, history)
            except RuntimeError as exc:
                message = str(exc)
                code = "not_configured" if message.startswith("AI model is not configured") else "model_unavailable"
                _json(self, 503, {"error": message, "code": code})
                return
            _json(self, 200, {"answer": answer, "model": AI_MODEL})
            return

        _json(self, 404, {"error": "Not found"})


def main():
    _init_db()
    _load_secret()
    srv = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Quan-Taara backend running at http://{HOST}:{PORT}")
    print(f"Serving: {HTML_FILE}")
    print(f"Model adapter: {AI_MODEL if _model_endpoint() else 'not configured'}")
    print("Press Ctrl+C to stop.")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        srv.shutdown()


if __name__ == "__main__":
    main()
