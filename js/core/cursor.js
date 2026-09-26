/* ━━━━━━━━━━━━ CURSOR ━━━━━━━━━━━━
   Custom pointer (dot + trailing ring) and a shared hover-helper used by
   many other modules (cards, buttons, inputs) to trigger the "hov" style.
   No dependencies. Must load before any module that calls addHov(). */
const $dot=document.getElementById('cur-dot'),
      $ring=document.getElementById('cur-ring');
let _mx=0,_my=0,_rx=0,_ry=0;
document.addEventListener('mousemove',e=>{_mx=e.clientX;_my=e.clientY;$dot.style.left=_mx+'px';$dot.style.top=_my+'px';});
(function cl(){_rx+=(_mx-_rx)*.13;_ry+=(_my-_ry)*.13;$ring.style.left=_rx+'px';$ring.style.top=_ry+'px';requestAnimationFrame(cl)})();
function addHov(el){el.addEventListener('mouseenter',()=>document.body.classList.add('hov'));el.addEventListener('mouseleave',()=>document.body.classList.remove('hov'));}