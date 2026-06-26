/* ===== FUTURE ME · MIRROR v2 — runtime ===== */

/* ---- scale 1080×1920 to viewport ---- */
function scaleMirror(){
  const m = document.querySelector('.mirror');
  if(!m) return;
  const s = Math.min(window.innerWidth/1080, window.innerHeight/2664) * 1.32;
  // Сдвигаем зеркало вверх, чтобы контент начинался от верха, а не обрезался
  const shift = 1332 - 540 / s;
  m.style.transform = `scale(${s}) translateY(${shift}px)`;
}
window.addEventListener('resize', scaleMirror);
scaleMirror();

/* ============ CINEMATIC SCREEN NAV ============ */
const ORDER = ['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11'];
let current = 's1';
let animating = false;

/* ---- transition: faint drifting dust (replaces the mint gradient flash) ---- */
window.Dust = (function(){
  const cv = document.getElementById('transDust');
  if(!cv) return { burst(){} };
  const dpr = Math.min(devicePixelRatio||1, 2);
  cv.width = 1080*dpr; cv.height = 2664*dpr; cv.style.width='1080px'; cv.style.height='2664px';
  const ctx = cv.getContext('2d'); ctx.scale(dpr,dpr);
  let parts=[], running=false;
  function burst(){
    for(let i=0;i<110;i++){
      const ang=Math.random()*6.2832, sp=Math.random()*3.2+0.4;
      parts.push({ x:540+(Math.random()-0.5)*960, y:1332+(Math.random()-0.5)*1900,
        vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp-0.25,
        r:Math.random()*1.5+0.4, life:1, dec:Math.random()*0.011+0.005 });
    }
    if(!running){ running=true; requestAnimationFrame(frame); }
  }
  function frame(){
    ctx.clearRect(0,0,1080,2664);
    parts = parts.filter(p=>p.life>0);
    for(const p of parts){
      p.x+=p.vx; p.y+=p.vy; p.vx*=0.985; p.vy*=0.985; p.life-=p.dec;
      const a=Math.max(0,p.life)*0.42;
      ctx.beginPath(); ctx.fillStyle='rgba(245,215,150,'+a+')';
      ctx.shadowColor='rgba(232,172,100,0.55)'; ctx.shadowBlur=p.r*3;
      ctx.arc(p.x,p.y,p.r,0,6.2832); ctx.fill();
    }
    if(parts.length){ requestAnimationFrame(frame); }
    else { running=false; ctx.clearRect(0,0,1080,2664); }
  }
  return { burst };
})();
function flash(){ if(window.Dust) window.Dust.burst(); }

function go(id){
  if(animating || id===current) return;
  const from = document.getElementById(current);
  const to = document.getElementById(id);
  if(!to) return;
  const fwd = ORDER.indexOf(id) > ORDER.indexOf(current);
  animating = true;

  to.className = 'screen ' + (fwd ? 'enter-fwd' : 'enter-back');
  void to.offsetWidth;                       // reflow to lock initial state
  to.classList.add('active');
  to.classList.remove('enter-fwd','enter-back');

  from.classList.remove('active');
  from.classList.add(fwd ? 'leave-fwd' : 'leave-back');

  flash();
  const prev = current;
  current = id;
  onEnter(id);
  setTimeout(()=>{
    from.classList.remove('leave-fwd','leave-back');
    onLeave(prev);
    animating = false;
  }, 840);
}
window.go = go;

/* ---- animated pill button: circle+arrow slides right, then navigate ---- */
function btnGo(btn, id){
  if(animating || btn.classList.contains('fire')) return;
  const handle = btn.querySelector('.m-handle');
  const label  = btn.querySelector('.m-label');
  const chev   = btn.querySelector('.m-chev');
  const dx = btn.clientWidth - (handle ? handle.offsetWidth : 74) - 36;
  btn.classList.add('fire');

  // silver-white glowing contour that draws itself around the pill
  const w = btn.clientWidth, h = btn.clientHeight, r = h/2;
  const svgNS = 'http://www.w3.org/2000/svg';
  const trace = document.createElementNS(svgNS, 'svg');
  trace.setAttribute('class', 'm-trace');
  trace.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  trace.setAttribute('preserveAspectRatio', 'none');
  const rect = document.createElementNS(svgNS, 'rect');
  rect.setAttribute('x', 1.5); rect.setAttribute('y', 1.5);
  rect.setAttribute('width', w - 3); rect.setAttribute('height', h - 3);
  rect.setAttribute('rx', r - 1.5); rect.setAttribute('ry', r - 1.5);
  rect.setAttribute('pathLength', 100);
  trace.appendChild(rect);
  btn.appendChild(trace);
  requestAnimationFrame(()=> trace.classList.add('draw'));

  if(label) label.style.opacity='0';
  if(chev)  chev.style.opacity='0';
  if(handle){ handle.style.transition='transform 1.0s cubic-bezier(.32,0,.16,1)'; handle.style.transform='translateX('+dx+'px)'; }
  setTimeout(()=> go(id), 980);
  setTimeout(()=>{
    btn.classList.remove('fire');
    const tr = btn.querySelector('.m-trace');
    if(tr){ tr.classList.add('fade'); setTimeout(()=>tr.remove(), 560); }
    if(handle){ handle.style.transition='none'; handle.style.transform='none'; }
    if(label) label.style.opacity=''; if(chev) chev.style.opacity='';
  }, 1700);
}
window.btnGo = btnGo;

function onEnter(id){
  if(id==='s1' && window.scanCtl) window.scanCtl.start();
  if(id==='s5' && window.snapCtl) window.snapCtl.arm();
  if(id==='s7' && window.morphCtl) window.morphCtl.reveal();
}
function onLeave(id){
  if(id==='s5' && window.snapCtl) window.snapCtl.stop();
  if(id==='s7' && window.morphCtl) window.morphCtl.reset();
}

/* ---- DRUM picker (2D wheel, Safari-safe; drag + wheel + snap) ---- */
(function(){
  const picker=document.getElementById('kgPicker');
  const drum=document.getElementById('kgDrum');
  if(!picker||!drum) return;
  const VALUES=[1,2,3,4,5,6,7,8,10,12,15];
  const SP=104;                         // px spacing between items
  let pos=VALUES.indexOf(5); if(pos<0) pos=4;   // float index
  drum.innerHTML='';
  const items=VALUES.map((v)=>{
    const el=document.createElement('div');
    el.className='drum-item';
    el.innerHTML='<span class="num">− '+v+'</span><span class="unit">kg</span>';
    drum.appendChild(el); return el;
  });
  function render(){
    items.forEach((el,i)=>{
      const d=i-pos, ad=Math.abs(d);
      const yy = d*SP*(1 - Math.min(ad,4)*0.06);
      const scale=Math.max(0.55, 1-ad*0.14);
      const op = ad>3.3 ? 0 : Math.max(0, 1-ad*0.24);
      el.style.transform='translateY('+yy+'px) scale('+scale+')';
      el.style.opacity=op;
      el.classList.toggle('sel', Math.round(pos)===i);
    });
  }
  function snap(){ pos=Math.max(0,Math.min(VALUES.length-1,Math.round(pos))); render(); }
  render();

  let dragging=false, startY=0, startPos=0, moved=false;
  function down(y){ dragging=true; startY=y; startPos=pos; moved=false; }
  function move(y){ if(!dragging) return; const dy=y-startY; if(Math.abs(dy)>3) moved=true;
    pos=Math.max(-0.4,Math.min(VALUES.length-0.6, startPos - dy/SP)); render(); }
  function up(){ if(!dragging) return; dragging=false; snap(); }
  picker.addEventListener('pointerdown',e=>{ down(e.clientY); try{picker.setPointerCapture(e.pointerId);}catch(_){} });
  picker.addEventListener('pointermove',e=>move(e.clientY));
  picker.addEventListener('pointerup',up);
  picker.addEventListener('pointercancel',up);
  picker.addEventListener('wheel',e=>{ e.preventDefault(); pos=Math.max(0,Math.min(VALUES.length-1,Math.round(pos)+(e.deltaY>0?1:-1))); render(); },{passive:false});
  window.kgPicker={ get value(){ return VALUES[Math.round(pos)]; } };
})();

/* ============ S1 · PARTICLE SCAN FIELD ============ */
(function(){
  const canvas=document.getElementById('scanField'); if(!canvas) return;
  const ctx=canvas.getContext('2d'); const dpr=Math.min(devicePixelRatio||1,2);
  const S=1040, cx=S/2, cy=S/2, R=336;
  canvas.width=S*dpr; canvas.height=S*dpr; canvas.style.width=S+'px'; canvas.style.height=S+'px'; ctx.scale(dpr,dpr);

  let parts=[], head=0, speed=0.042, phase='idle', t0=0, running=false;
  const RECOG=2200;

  function build(){
    parts=[];
    // two concentric bands of particles
    for(let i=0;i<150;i++){
      const ang=Math.random()*6.2832;
      const band=Math.random()<0.62?R:R-58;
      const rad=band + (Math.random()*22-11);
      parts.push({ang,rad,baseRad:rad, sz:Math.random()*1.8+0.7,
        spin:(Math.random()*0.006+0.0024)*(Math.random()<0.5?1:-1),
        tw:Math.random()*6.28, tws:Math.random()*0.04+0.01,
        vx:0, vy:0, x:0, y:0, burst:false });
    }
    // ambient dust drifting through the whole field
    for(let i=0;i<150;i++){
      const ang=Math.random()*6.2832;
      const rad=Math.random()*(R+70);
      parts.push({ang,rad,baseRad:rad, sz:Math.random()*1.3+0.35,
        spin:(Math.random()*0.005+0.0012)*(Math.random()<0.5?1:-1),
        tw:Math.random()*6.28, tws:Math.random()*0.05+0.012,
        vx:0, vy:0, x:0, y:0, burst:false });
    }
  }
  build();

  function start(){
    phase='scan'; head=0; speed=0.042; t0=performance.now();
    parts.forEach(p=>{ p.burst=false; p.rad=p.baseRad; p.vx=0; p.vy=0; });
    const hi=document.querySelector('.scan-hi');
    const l=document.getElementById('scanLabel'), h=document.getElementById('scanHint');
    if(hi){ hi.classList.remove('burst'); }
    if(l){ l.textContent='Recognising you'; l.classList.add('blink'); l.style.opacity='1'; }
    if(h){ h.style.opacity='1'; }
    if(canvas){ canvas.style.opacity='1'; canvas.style.transform='translate(-50%,-50%) scale(1)'; }
    if(!running){ running=true; requestAnimationFrame(frame); }
  }
  window.scanCtl={start};

  function recognise(){
    phase='recog';
    const l=document.getElementById('scanLabel'), h=document.getElementById('scanHint');
    if(l){ l.textContent='Welcome back, Katya'; l.classList.remove('blink'); }
    if(h){ h.style.opacity='0'; }
    setTimeout(()=>{
      phase='burst';
      // gentle in-place dissolve (no outward fling -> no square clipping at canvas edges)
      parts.forEach(p=>{ p.burst=true;
        const a=p.ang, v=Math.random()*1.1+0.3;
        p.vx=Math.cos(a)*v; p.vy=Math.sin(a)*v;
        p.dec=Math.random()*0.05+0.06; p.fade=1; });
      const hi=document.querySelector('.scan-hi');
      if(hi) hi.classList.add('burst');
      if(l) l.style.opacity='0';
      if(canvas){ canvas.style.opacity='0'; canvas.style.transform='translate(-50%,-50%) scale(1.12)'; }
      setTimeout(()=>{ running=false; go('s2'); }, 620);
    }, 640);
  }

  function frame(now){
    ctx.clearRect(0,0,S,S);
    if(phase==='scan' && now-t0>RECOG){ recognise(); }
    if(phase==='recog'){ speed += (0.085-speed)*0.05; }

    // faint base rings
    ctx.lineWidth=2; ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(230,180,110,0.08)';
    ctx.beginPath(); ctx.arc(cx,cy,R,0,6.2832); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,cy,R-58,0,6.2832); ctx.stroke();

    // particles
    for(const p of parts){
      p.tw+=p.tws;
      if(p.burst){ p.x+=p.vx; p.y+=p.vy; p.vx*=0.99; p.vy*=0.99; }
      else { p.ang+=p.spin; p.x=Math.cos(p.ang)*p.rad; p.y=Math.sin(p.ang)*p.rad; }
      const px=cx+p.x, py=cy+p.y;
      let a=(Math.sin(p.tw)*0.5+0.5)*0.85;
      if(p.burst){ p.fade=Math.max(0,(p.fade||1)-(p.dec||0.08)); a*=p.fade; }
      // warm at the top of the sphere, brightening to white toward the bottom
      const k=Math.max(0,Math.min(1,(p.y+R)/(2*R)));   // 0 top -> 1 bottom
      const rr=Math.round(248), gg=Math.round(228+27*k), bb=Math.round(198+57*k);
      ctx.beginPath();
      ctx.fillStyle='rgba('+rr+','+gg+','+bb+','+Math.min(1,a*1.15)+')';
      ctx.shadowColor='rgba(245,225,190,0.9)'; ctx.shadowBlur=p.sz*4.5;
      ctx.arc(px,py,p.sz,0,6.2832); ctx.fill();
    }

    if(phase==='scan' || phase==='recog'){
      // glowing comet head sweeping the outer ring
      const trail=Math.PI*1.4, steps=120;
      for(let i=0;i<steps;i++){
        const t=i/steps, ang=head - t*trail, al=(1-t)*(1-t);
        ctx.beginPath(); ctx.arc(cx,cy,R, ang-0.02, ang+0.02);
        ctx.strokeStyle='rgba(245,205,140,'+(al*0.95)+')';
        ctx.lineWidth=2.5+(1-t)*3; ctx.shadowColor='rgba(230,180,110,0.95)'; ctx.shadowBlur=(1-t)*24; ctx.stroke();
      }
      const hx=cx+Math.cos(head)*R, hy=cy+Math.sin(head)*R;
      ctx.beginPath(); ctx.arc(hx,hy,5,0,6.2832);
      ctx.fillStyle='#fff6e6'; ctx.shadowColor=' #F5D9A0'; ctx.shadowBlur=32; ctx.fill();
      head+=speed;
    }
    if(running) requestAnimationFrame(frame);
  }
  start();
})();

/* ============ S5 · SCAN SWEEP + SEQUENTIAL CHECKS ============ */
(function(){
  const line=document.querySelector('#s5 .scanline');
  let timers=[];
  function clear(){ timers.forEach(clearTimeout); timers=[]; }
  window.snapCtl={
    arm(){
      clear();
      const poses=[...document.querySelectorAll('#s5 .pose')];
      poses.forEach(p=>p.classList.remove('lit'));
      if(line) line.classList.add('run');
      // light up checks one by one as the scan passes
      poses.forEach((p,i)=> timers.push(setTimeout(()=>p.classList.add('lit'), 700+i*720)));
      // auto-advance once capture confirmed
      timers.push(setTimeout(()=>{ if(current==='s5'){ flash(); setTimeout(()=>go('s6'),360); } }, 3600));
    },
    stop(){ clear(); if(line) line.classList.remove('run'); }
  };
})();

/* ============ S7 · FUTURE ME MORPH ============ */
(function(){
  const fig=document.getElementById('fmFig'); if(!fig) return;
  window.morphCtl={
    reveal(){ setTimeout(()=>{ fig.classList.add('future'); flash(); }, 650); },
    reset(){ fig.classList.remove('future'); }
  };
})();

/* ============ S8 · CATALOGUE CAROUSEL ============ */
const COLLECTIONS=[
  { title:'Soft sport', sub:'Sport collection', items:[
    {img:'assets/cardimg-sport-blu.png',   name:'Soft sport blu',   price:'40 $'},
    {img:'assets/cardimg-sport-pink.png',  name:'Soft sport pink',  price:'40 $'},
    {img:'assets/cardimg-sport-white.png', name:'Soft sport white', price:'36 $'},
    {img:'assets/cardimg-sport-grey.png',  name:'Soft sport grey',  price:'38 $'},
  ]},
  { title:'Sunny beach', sub:'Beach collection', items:[
    {img:'assets/cardimg-beach-blu.png',   name:'Tanzania blu',   price:'62 $'},
    {img:'assets/cardimg-beach-mint.png',  name:'Tanzania mint',  price:'60 $'},
    {img:'assets/cardimg-beach-green.png', name:'Tanzania green', price:'60 $'},
    {img:'assets/cardimg-beach-white.png', name:'Tanzania white', price:'58 $'},
  ]},
];
let collIdx=0;

function renderCollection(animate){
  const c=COLLECTIONS[collIdx];
  const titleEl=document.getElementById('catColl');
  const subEl=document.getElementById('catSub');
  const grid=document.getElementById('catGrid');
  if(titleEl) titleEl.textContent=c.title;
  if(subEl) subEl.textContent=c.sub;
  if(!grid) return;
  grid.innerHTML='';
  c.items.forEach((it,i)=>{
    const card=document.createElement('div');
    card.className='card'+(i===0?' on':'');
    card.innerHTML='<div class="gwrap"><img src="'+it.img+'" alt="'+it.name+'"></div>'+
      '<span class="card-name">'+it.name+'</span><span class="card-price">'+it.price+'</span>';
    card.addEventListener('click',()=>{
      grid.querySelectorAll('.card').forEach(x=>x.classList.remove('on'));
      card.classList.add('on');
      setTimeout(()=>openTryOn(it),260);
    });
    if(animate){ card.style.animation='rise .7s var(--ease) both'; card.style.animationDelay=(i*0.06)+'s'; }
    grid.appendChild(card);
  });
}
function cycleColl(dir){
  collIdx=(collIdx+dir+COLLECTIONS.length)%COLLECTIONS.length;
  renderCollection(true);
}
window.cycleColl=cycleColl;

function openTryOn(it){
  const hero=document.getElementById('tryonHero');
  const eyebrow=document.getElementById('tryonEyebrow');
  const title=document.getElementById('tryonTitle');
  if(hero) hero.src=it.img;
  if(eyebrow) eyebrow.textContent=it.name;
  if(title) title.textContent='Try on · '+it.name;
  go('s9');
}

function pickChip(el){
  el.closest('.chips').querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
}
window.pickChip=pickChip;

/* ============ AMBIENT MINT DUST ============ */
(function(){
  const c=document.getElementById('sparkles'); if(!c) return;
  const ctx=c.getContext('2d'); const dpr=Math.min(devicePixelRatio||1,2);
  c.width=1080*dpr; c.height=2664*dpr; ctx.scale(dpr,dpr);
  const N=130, ps=[];
  for(let i=0;i<N;i++) ps.push({x:Math.random()*1080,y:Math.random()*2664,r:Math.random()*1.7+0.4,
    vy:-(Math.random()*0.24+0.04),tw:Math.random()*6.28,tws:Math.random()*0.035+0.008});
  const DUSTY = new Set(['s1','s2','s3','s4','s5']);
  let curOp = 1;
  function f(){
    const target = DUSTY.has(current) ? 1 : 0;
    curOp += (target - curOp) * 0.07;
    c.style.opacity = curOp.toFixed(3);
    ctx.clearRect(0,0,1080,2664);
    if(curOp < 0.01){ requestAnimationFrame(f); return; }
    for(const p of ps){
      p.y+=p.vy; p.tw+=p.tws; if(p.y<-10){p.y=2674;p.x=Math.random()*1080;}
      const a=(Math.sin(p.tw)*0.5+0.5)*0.55;
      ctx.beginPath(); ctx.fillStyle='rgba(245,222,175,'+a+')';
      ctx.shadowColor='rgba(232,184,118,0.75)'; ctx.shadowBlur=p.r*4.5;
      ctx.arc(p.x,p.y,p.r,0,6.2832); ctx.fill();
    }
    requestAnimationFrame(f);
  } f();
})();

/* init */
renderCollection(false);
