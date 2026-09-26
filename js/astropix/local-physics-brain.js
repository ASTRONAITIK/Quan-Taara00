/* ━━━━━━━━━━━━ LOCAL ASTROPIX CORE ━━━━━━━━━━━━
   Offline physics "brain": canned facts + small word-problem solvers for
   motion and common physics formulas. Pure functions, no DOM access.
   Consumed by 09-ai-chat.js via localBrain(). Must load before it. */
const localFacts=[
  {keys:['speed of light','how fast is light','speed light'],answer:'Light travels through vacuum at exactly 299,792,458 metres per second. That is the universal speed limit for information.'},
  {keys:['what is gravity','define gravity','gravity'],answer:'Gravity is the curvature of spacetime caused by mass and energy. In Newtonian language, two masses attract with F = Gm₁m₂/r².'},
  {keys:['what is a black hole','black hole','event horizon'],answer:'A black hole is a region where gravity curves spacetime so strongly that crossing its event horizon makes escape impossible, even for light.'},
  {keys:['what is quantum mechanics','define quantum','quantum mechanics'],answer:'Quantum mechanics describes nature at atomic scales. It uses a wavefunction to predict probabilities, with measurement outcomes that are inherently quantised.'},
  {keys:['what is relativity','special relativity','general relativity'],answer:'Relativity says measurements of space and time depend on motion, while gravity is geometry: mass and energy curve spacetime.'},
  {keys:['what is an atom','define atom','atom'],answer:'An atom is the smallest electrically neutral unit of an element: a compact nucleus of protons and neutrons surrounded by quantum electron states.'},
  {keys:['why is the sky blue','sky blue','rayleigh'],answer:'Air scatters short blue wavelengths more strongly than long red wavelengths. From Earth, that scattered blue light arrives from every direction.'},
  {keys:['what is entropy','define entropy','entropy'],answer:'Entropy measures how many microscopic arrangements correspond to a macroscopic state. For an isolated system, the total entropy does not decrease.'},
  {keys:['who are you','what are you','your name'],answer:'I am ASTROPIX, the local science guide inside Quan-Taara. I can answer common questions offline and can use Ollama or Groq when available.'}
];
let ollamaState='unknown';
function solveMotionWordProblem(question){
  const q=String(question||'').toLowerCase().replace(/[−–—]/g,'-');
  const number='(-?\\d+(?:\\.\\d+)?)';
  const forceMatch=q.match(new RegExp(number+'\\s*(?:newtons?|n)\\b'));
  const massMatch=q.match(new RegExp(number+'\\s*(?:kilograms?|kg)\\b'));
  if(!forceMatch||!massMatch)return null;
  const force=Number(forceMatch[1]),mass=Number(massMatch[1]);
  if(!Number.isFinite(force)||!Number.isFinite(mass)||mass===0)return null;
  const acceleration=force/mass;
  const accelerationAsked=/\b(acceleration|accelerate|accelerating)\b/.test(q);
  const speedAsked=/\b(speed|velocity|fast|moving)\b/.test(q);
  if(!accelerationAsked&&!speedAsked)return null;
  const timeMatch=q.match(new RegExp('(?:after|for|in|over)\\s+'+number+'\\s*(?:seconds?|secs?|s)\\b'));
  const time=timeMatch?Number(timeMatch[1]):null;
  const rest=/\b(?:from|at)\s+rest\b|\bstarts?\s+from\s+rest\b/.test(q);
  const initialMatch=q.match(new RegExp('(?:initial\\s+(?:speed|velocity)|initial\\s+u|u)\\s*(?:is|=|of)?\\s*'+number+'\\s*(?:m/s|mps|meters?\\s+per\\s+second)\\b'));
  const initial=initialMatch?Number(initialMatch[1]):(rest?0:null);
  const fmt=value=>Number(value.toFixed(8)).toString();
  const lines=[];
  if(accelerationAsked||speedAsked){
    lines.push(`1. Acceleration: a = F_net / m = ${fmt(force)} N / ${fmt(mass)} kg = ${fmt(acceleration)} m/s².`);
  }
  if(speedAsked&&time!==null&&Number.isFinite(time)){
    const u=initial===null?0:initial;
    const velocity=u+acceleration*time;
    lines.push(`2. Speed after ${fmt(time)} s: v = u + at = ${fmt(u)} + (${fmt(acceleration)} × ${fmt(time)}) = ${fmt(velocity)} m/s${initial===null?' (assuming it started from rest).':'.'}`);
  }
  return lines.join('\n');
}
function physicsQuantity(question,units){
  const unitPattern=units.join('|');
  const match=String(question||'').match(new RegExp('(-?\\d+(?:\\.\\d+)?)\\s*(?:'+unitPattern+')\\b','i'));
  return match?Number(match[1]):null;
}
function physicsNumberAfter(question,labels){
  const labelPattern=labels.join('|');
  const match=String(question||'').match(new RegExp('(?:'+labelPattern+')\\s*(?:is|=|of|at|to)?\\s*(-?\\d+(?:\\.\\d+)?)','i'));
  return match?Number(match[1]):null;
}
function solvePhysicsWordProblem(question){
  const q=String(question||'').toLowerCase().replace(/[−–—]/g,'-');
  const fmt=value=>Number(Number(value).toFixed(8)).toString();
  const g=physicsQuantity(q,['m/s\\^?2','m/s2','mps2'])||9.8;

  /* Free fall and projectile motion are kept separate from the force solver:
     their givens often contain no mass, but still have a closed-form model. */
  if(/\bfree[-\s]?fall|dropped|falls?\b|falling\b/.test(q)){
    const h=physicsQuantity(q,['m','meters?','metres?']);
    const t=physicsQuantity(q,['seconds?','secs?','s']);
    const asksTime=/\b(time|how long)\b/.test(q);
    const asksSpeed=/\b(speed|velocity|fast|moving)\b/.test(q);
    const asksDistance=/\b(distance|height|fall)\b/.test(q);
    if(h!==null&&asksTime){
      return `Free-fall model (from rest): h = ½gt²\n1. t = √(2h/g) = √(2 × ${fmt(h)} m / ${fmt(g)} m/s²) = ${fmt(Math.sqrt(2*h/g))} s.`;
    }
    if(t!==null&&(asksSpeed||asksDistance)){
      const lines=[];
      if(asksSpeed)lines.push(`1. Speed: v = gt = ${fmt(g)} × ${fmt(t)} = ${fmt(g*t)} m/s downward.`);
      if(asksDistance)lines.push(`${lines.length+1}. Distance fallen: h = ½gt² = ½ × ${fmt(g)} × ${fmt(t)}² = ${fmt(.5*g*t*t)} m.`);
      return lines.join('\n');
    }
  }
  if(/\bprojectile|launched|launch angle|thrown at\b/.test(q)){
    const u=physicsQuantity(q,['m/s','mps']);
    const angle=physicsQuantity(q,['degrees?','deg']);
    if(u!==null&&angle!==null){
      const radians=angle*Math.PI/180;
      const range=u*u*Math.sin(2*radians)/g;
      const maxHeight=u*u*Math.sin(radians)**2/(2*g);
      const flight=2*u*Math.sin(radians)/g;
      return `Projectile model (level launch and no air resistance):\n1. Flight time: T = 2u sinθ/g = ${fmt(flight)} s.\n2. Range: R = u² sin(2θ)/g = ${fmt(range)} m.\n3. Maximum height: H = u² sin²θ/(2g) = ${fmt(maxHeight)} m.`;
    }
  }

  const mass=physicsQuantity(q,['kilograms?','kg']);
  const speed=physicsQuantity(q,['m/s','mps','km/h']);
  const height=physicsQuantity(q,['meters?','metres?','m']);
  const force=physicsQuantity(q,['newtons?','n']);
  const distance=physicsQuantity(q,['meters?','metres?','m']);
  const time=physicsQuantity(q,['seconds?','secs?','s']);
  const energy=physicsQuantity(q,['joules?','j']);
  const volume=physicsQuantity(q,['m\\^?3','m3','litres?','liters?','l']);
  const current=physicsQuantity(q,['amperes?','amps?','a']);
  const voltage=physicsQuantity(q,['volts?','v']);
  const resistance=physicsQuantity(q,['ohms?','ohm']);
  const wavelength=physicsQuantity(q,['nanometers?','nm','micrometers?','μm','um','meters?','metres?','m']);
  const frequency=physicsQuantity(q,['hertz','hz']);
  const pressure=physicsQuantity(q,['pascals?','pa']);
  const temperature=physicsQuantity(q,['kelvin','k']);
  const moles=physicsQuantity(q,['moles?','mol']);

  if(/\bkinetic energy\b|\benergy of (?:the )?moving\b/.test(q)&&mass!==null&&speed!==null){
    const v=/\bkm\/h\b/.test(q)?speed/3.6:speed;
    return `Kinetic energy:\nEₖ = ½mv² = ½ × ${fmt(mass)} kg × ${fmt(v)}² m²/s² = ${fmt(.5*mass*v*v)} J.`;
  }
  if(/\bpotential energy\b|\bgravitational energy\b/.test(q)&&mass!==null&&height!==null){
    return `Gravitational potential energy:\nEₚ = mgh = ${fmt(mass)} × ${fmt(g)} × ${fmt(height)} = ${fmt(mass*g*height)} J.`;
  }
  if(/\bwork\b/.test(q)&&force!==null&&distance!==null){
    const angle=physicsQuantity(q,['degrees?','deg']);
    const factor=angle===null?1:Math.cos(angle*Math.PI/180);
    return `Work done:\nW = Fd${angle===null?'':' cos θ'} = ${fmt(force)} × ${fmt(distance)}${angle===null?'':` × cos(${fmt(angle)}°)`} = ${fmt(force*distance*factor)} J.`;
  }
  if(/\bpower\b/.test(q)&&energy!==null&&time!==null){
    return `Power:\nP = E/t = ${fmt(energy)} J / ${fmt(time)} s = ${fmt(energy/time)} W.`;
  }
  if(/\bmomentum\b/.test(q)&&mass!==null&&speed!==null){
    const v=/\bkm\/h\b/.test(q)?speed/3.6:speed;
    return `Linear momentum:\np = mv = ${fmt(mass)} kg × ${fmt(v)} m/s = ${fmt(mass*v)} kg·m/s.`;
  }
  if(/\bimpulse\b/.test(q)&&force!==null&&time!==null){
    return `Impulse:\nJ = FΔt = ${fmt(force)} N × ${fmt(time)} s = ${fmt(force*time)} N·s.`;
  }
  if(/\bdensity\b/.test(q)&&mass!==null&&volume!==null){
    const v=/\b(?:litres?|liters?|l)\b/.test(q)?volume/1000:volume;
    return `Density:\nρ = m/V = ${fmt(mass)} kg / ${fmt(v)} m³ = ${fmt(mass/v)} kg/m³.`;
  }
  if(/\bpressure\b/.test(q)&&force!==null){
    const area=physicsQuantity(q,['m\\^?2','m2','square meters?','square metres?']);
    if(area!==null)return `Pressure:\np = F/A = ${fmt(force)} N / ${fmt(area)} m² = ${fmt(force/area)} Pa.`;
  }
  if(/\bohm|resistance|circuit|voltage\b/.test(q)){
    if(voltage!==null&&resistance!==null&&current===null){
      return `Ohm's law:\nI = V/R = ${fmt(voltage)} V / ${fmt(resistance)} Ω = ${fmt(voltage/resistance)} A.`;
    }
    if(current!==null&&resistance!==null&&voltage===null){
      return `Ohm's law:\nV = IR = ${fmt(current)} A × ${fmt(resistance)} Ω = ${fmt(current*resistance)} V.`;
    }
    if(voltage!==null&&current!==null){
      return `Electrical power:\nP = VI = ${fmt(voltage)} V × ${fmt(current)} A = ${fmt(voltage*current)} W.`;
    }
  }
  if(/\bwave speed\b|\bspeed of (?:a )?wave\b|\bwave\b.*\bspeed\b/.test(q)&&wavelength!==null&&frequency!==null){
    let lambda=wavelength;
    if(/\bnm\b/.test(q))lambda*=1e-9;
    else if(/\b(?:μm|um)\b/.test(q))lambda*=1e-6;
    return `Wave relation:\nv = fλ = ${fmt(frequency)} Hz × ${lambda.toExponential(3)} m = ${fmt(frequency*lambda)} m/s.`;
  }
  if(/\bideal gas|gas law|gas pressure\b|\bgas\b.*\bpressure\b|\bpressure\b.*\bgas\b/.test(q)&&moles!==null&&temperature!==null&&volume!==null){
    const v=/\b(?:litres?|liters?|l)\b/.test(q)?volume/1000:volume;
    return `Ideal gas law:\nPV = nRT\nP = nRT/V = ${fmt(moles)} × 8.314 × ${fmt(temperature)} / ${fmt(v)} = ${fmt(moles*8.314*temperature/v)} Pa.`;
  }
  return null;
}
function localBrain(question){
  const q=String(question||'').trim().toLowerCase();
  if(!q)return null;
  const arithmetic=q.match(/^\s*(-?\d+(?:\.\d+)?)\s*([+\-*\/])\s*(-?\d+(?:\.\d+)?)\s*[?]?\s*$/);
  if(arithmetic){
    const a=Number(arithmetic[1]),b=Number(arithmetic[3]),op=arithmetic[2];
    if(op==='/'&&b===0)return 'That operation is undefined because division by zero has no finite result.';
    const value=op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:a/b;
    return `The answer is ${Number(value.toFixed(8))}.`;
  }
  const motionAnswer=solveMotionWordProblem(q);
  if(motionAnswer)return motionAnswer;
  const physicsAnswer=solvePhysicsWordProblem(q);
  if(physicsAnswer)return physicsAnswer;
  if(/^(hi|hello|hey|yo|good morning|good evening)\b/.test(q))return 'Hello, stargazer. Ask me a simple physics or space question and I will explain it clearly.';
  const fact=localFacts.find(item=>item.keys.some(key=>q.includes(key)));
  if(fact)return fact.answer;
  if(q.includes('f = ma')||q.includes('f=ma')||q.includes('newton second law'))return 'Newton’s second law is F = ma: net force equals mass times acceleration. Double the force and acceleration doubles if mass stays fixed.';
  if(q.includes('e = mc')||q.includes('e=mc'))return 'E = mc² says mass is concentrated energy. The c² factor is enormous, so a small amount of mass corresponds to a large amount of energy.';
  return null;
}