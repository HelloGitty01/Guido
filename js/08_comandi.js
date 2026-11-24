// Guido · 08 comandi — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ================= INPUT =================
const keys={};
// ================= COMANDI RIMAPPABILI (tastiera e gamepad) =================
const CTRL_DEF={keys:{thr:['KeyA','ArrowUp'],brk:['KeyZ','ArrowDown'],hold:['KeyS',''],left:['Comma','ArrowLeft'],right:['Period','ArrowRight'],hb:['Space',''],horn:['KeyH',''],
    gD:['KeyD',''],gR:['KeyR',''],lights:['KeyL',''],view:['KeyC',''],blL:['KeyQ',''],blR:['KeyE',''],haz:['KeyX',''],pause:['KeyP',''],end:['KeyF',''],unflip:['Enter',''],car:['KeyV',''],radio:['KeyM',''],radioP:['KeyN',''],navMute:['KeyU',''],flash:['KeyG',''],volUp:['Equal','NumpadAdd'],volDn:['Minus','NumpadSubtract'],map:['Tab','KeyT'],photo:['KeyO',''],rec:['KeyJ','']},
  pad:{steer:{a:0,s:1},pedal:{mode:'one',a:'auto',s:-1},thrA:{a:-1,rest:0,full:1},brkA:{a:-1,rest:0,full:1},
    btn:{radioP:-1,navMute:-1,gear:7,horn:6,view:0,lights:3,haz:2,blL:14,blR:15,hb:1,unflip:1,car:-1,radio:-1,flash:-1,volUp:-1,volDn:-1,map:-1,photo:-1,rec:-1}}};
const CTRL_LBL={thr:'Acceleratore',brk:'Freno',hold:'Mantieni velocità (tenere premuto)',left:'Sterzo a sinistra',right:'Sterzo a destra',hb:'Freno a mano',horn:'Clacson',gD:'Marcia D',gR:'Retromarcia R',
  lights:'Fari',view:'Cambia vista',blL:'Freccia sinistra',blR:'Freccia destra',haz:'Quattro frecce',pause:'Pausa',end:'Fine corsa',unflip:'Raddrizza auto',gear:'Cambio D↔R',car:'Cambia auto',radio:'Autoradio (stazione successiva)',radioP:'Autoradio (stazione precedente)',navMute:'Voce del navigatore sì/no',flash:'Lampeggio abbaglianti',volUp:'Volume radio +',volDn:'Volume radio −',map:'Mappa grande',photo:'Modalità foto',rec:'Registra clip (avvia/ferma)'};
let CTRL=JSON.parse(JSON.stringify(CTRL_DEF));
try{const sv=JSON.parse(localStorage.getItem('sim_ctrl')||'null');if(sv){Object.assign(CTRL.keys,sv.keys||{});if(sv.pad){Object.assign(CTRL.pad,sv.pad);CTRL.pad.btn=Object.assign({},CTRL_DEF.pad.btn,sv.pad.btn||{});}}}catch(e){}
function saveCtrl(){try{localStorage.setItem('sim_ctrl',JSON.stringify(CTRL));}catch(e){}}
const actOf=code=>{for(const k in CTRL.keys)if(CTRL.keys[k].includes(code)&&code)return k;return null;};
const keyName=c=>!c?'—':({ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'}[c])||c.replace(/^Key/,'').replace(/^Digit/,'').replace('Arrow','Freccia ').replace('Comma',',').replace('Period','.').replace('Space','Spazio').replace('Enter','Invio').replace('Shift','Maiusc ').replace('Control','Ctrl ');
let ctrlWait=null;   // {kind:'key',act,slot} | {kind:'btn',act} | {kind:'axis',what}
function ctrlUI(){const ov=document.getElementById('ctrlOv'),bx=document.getElementById('ctrlBody');if(!ov)return;
  const P=CTRL.pad,ax=a=>a==='auto'?'auto':(a<0?'—':'asse '+a);
  let h='<h3>Tastiera</h3><table>';
  Object.keys(CTRL.keys).forEach(k=>{h+=`<tr><td>${CTRL_LBL[k]}</td>`+[0,1].map(i=>`<td><button class="sm cb" data-k="${k}" data-i="${i}">${ctrlWait&&ctrlWait.act===k&&ctrlWait.slot===i?'premi…':keyName(CTRL.keys[k][i])}</button></td>`).join('')+'</tr>';});
  h+='</table><h3>Gamepad / volante</h3><table>';
  h+=`<tr><td>Sterzo</td><td colspan=2><button class="sm ca" data-w="steer">${ctrlWait&&ctrlWait.what==='steer'?'gira a destra…':ax(P.steer.a)+(P.steer.s<0?' (invertito)':'')}</button></td></tr>`;
  h+=`<tr><td>Pedali</td><td colspan=2><select id="pedMode"><option value="one"${P.pedal.mode==='one'?' selected':''}>un asse (su gas, giù freno)</option><option value="two"${P.pedal.mode==='two'?' selected':''}>due assi separati</option></select></td></tr>`;
  if(P.pedal.mode==='one')h+=`<tr><td>Asse gas/freno</td><td colspan=2><button class="sm ca" data-w="pedal">${ctrlWait&&ctrlWait.what==='pedal'?'spingi verso il gas…':ax(P.pedal.a)}</button></td></tr>`;
  else{h+=`<tr><td>Asse acceleratore</td><td colspan=2><button class="sm ca" data-w="thrA">${ctrlWait&&ctrlWait.what==='thrA'?'premi a fondo…':ax(P.thrA.a)}</button></td></tr>`;
    h+=`<tr><td>Asse freno</td><td colspan=2><button class="sm ca" data-w="brkA">${ctrlWait&&ctrlWait.what==='brkA'?'premi a fondo…':ax(P.brkA.a)}</button></td></tr>`;}
  Object.keys(P.btn).forEach(k=>{h+=`<tr><td>${CTRL_LBL[k]}</td><td colspan=2><button class="sm cp" data-k="${k}">${ctrlWait&&ctrlWait.kind==='btn'&&ctrlWait.act===k?'premi un pulsante…':(P.btn[k]<0?'—':'pulsante '+P.btn[k])}</button></td></tr>`;});
  h+='</table><p style="opacity:.7;font-size:12px">Clicca un comando e premi il tasto (o muovi l\'asse, o premi il pulsante). Canc toglie il tasto, Esc annulla.</p>';
  bx.innerHTML=h;
  bx.querySelectorAll('.cb').forEach(b=>b.onclick=()=>{ctrlWait={kind:'key',act:b.dataset.k,slot:+b.dataset.i};ctrlUI();});
  bx.querySelectorAll('.cp').forEach(b=>b.onclick=()=>{ctrlWait={kind:'btn',act:b.dataset.k,base:padSnap()};ctrlUI();});
  bx.querySelectorAll('.ca').forEach(b=>b.onclick=()=>{ctrlWait={kind:'axis',what:b.dataset.w,base:padSnap()};ctrlUI();});
  const pm=document.getElementById('pedMode');if(pm)pm.onchange=()=>{P.pedal.mode=pm.value;saveCtrl();ctrlUI();};}
function padSnap(){const gp=(navigator.getGamepads?[...navigator.getGamepads()]:[]).find(g=>g);return gp?{ax:[...gp.axes],bt:gp.buttons.map(b=>b.pressed||b.value>0.5)}:{ax:[],bt:[]};}
// cattura dei tasti prima del gioco
addEventListener('keydown',e=>{if(!ctrlWait||ctrlWait.kind!=='key')return;e.preventDefault();e.stopImmediatePropagation();
  if(e.code==='Escape'){ctrlWait=null;ctrlUI();return;}
  const {act,slot}=ctrlWait;if(e.code==='Delete'||e.code==='Backspace')CTRL.keys[act][slot]='';
  else{for(const k in CTRL.keys)CTRL.keys[k]=CTRL.keys[k].map(c=>c===e.code?'':c);CTRL.keys[act][slot]=e.code;}
  ctrlWait=null;saveCtrl();ctrlUI();},true);
// cattura di assi e pulsanti del gamepad
(function padPoll(){if(ctrlWait&&ctrlWait.kind!=='key'){const gp=(navigator.getGamepads?[...navigator.getGamepads()]:[]).find(g=>g);
    if(gp){const B=ctrlWait.base;
      if(ctrlWait.kind==='btn'){const i=gp.buttons.findIndex((b,j)=>(b.pressed||b.value>0.5)&&!B.bt[j]);if(i>=0){CTRL.pad.btn[ctrlWait.act]=i;ctrlWait=null;saveCtrl();ctrlUI();}}
      else{let bi=-1,bd=0;gp.axes.forEach((v,j)=>{const d=v-(B.ax[j]||0);if(Math.abs(d)>Math.abs(bd)){bd=d;bi=j;}});
        if(bi>=0&&Math.abs(bd)>0.6){const w=ctrlWait.what,P=CTRL.pad;
          if(w==='steer')P.steer={a:bi,s:bd>0?1:-1};
          else if(w==='pedal')P.pedal={mode:'one',a:bi,s:bd>0?1:-1};
          else P[w]={a:bi,rest:B.ax[bi]||0,full:gp.axes[bi]};
          ctrlWait=null;saveCtrl();ctrlUI();}}}}
  requestAnimationFrame(padPoll);})();
const KEYMAP=CTRL.keys;
const kd=list=>list.some(k=>keys[k]);
addEventListener('keydown',e=>{const tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT')return;if(e.repeat){keys[e.code]=true;return;}keys[e.code]=true;
  const A=actOf(e.code);
  if(PHOTO.on){if(e.code==='Escape'||A==='photo')photoToggle();else if(e.code==='Space'||e.code==='Enter')photoShot();e.preventDefault();return;}
  if(MAP.on){if(e.code==='Escape'||A==='map')mapToggle();e.preventDefault();return;}
  if(started&&HOME.mode&&menu.style.display!=='flex'){if(e.code==='Escape'){showMenu();return;}if(A==='map'){mapToggle();e.preventDefault();return;}if(A==='photo'){photoToggle();e.preventDefault();return;}if(A==='rec'){recToggle();return;}
    if(HOME.mode==='walk'&&(e.code==='Enter'||e.code==='NumpadEnter'||e.code==='KeyE')&&HOME.near)HOME.enter(HOME.near);if(HOME.mode==='return'&&(e.code==='Enter'||e.code==='NumpadEnter'))HOME.finish();if(e.code.startsWith('Arrow')||e.code==='Space'||e.code==='Tab')e.preventDefault();return;}
  if(e.code==='Escape')showMenu();
  if(A==='map'&&started&&!pl.ended&&menu.style.display!=='flex'){mapToggle();e.preventDefault();return;}
  if(A==='photo'&&started&&!pl.ended&&menu.style.display!=='flex'){photoToggle();e.preventDefault();return;}
  if(A==='rec'&&started)recToggle();
  if(e.code==='KeyK'&&started&&!pl.ended&&menu.style.display!=='flex'){const ov=document.getElementById('jobOv');if(ov.style.display==='flex')JOB.close();else JOB.open();e.preventDefault();return;}
  if(A==='pause'&&started)togglePause();
  if(started&&!paused){
    if(A==='view')toggleView();
    if(A==='horn')setHorn(true);
    if(A==='gR')selectGear('R');if(A==='gD')selectGear('D');
    if(A==='lights')toggleLights();
    if(A==='unflip'){if(pl.wat)unflip();else if(pl.flip)unflip();else fuelRescue();}
    if(A==='car')cycleCar(1);
    if(A==='radio')RADIO.next();if(A==='radioP')RADIO.prev();if(A==='navMute')navMute();
    if(A==='volDn')radioVol((CFG.vol??0.6)-0.1);if(A==='volUp')radioVol((CFG.vol??0.6)+0.1);
    if(A==='end')endRun('fine');
    if(A==='blL')manualBlink(-1);if(A==='blR')manualBlink(1);if(A==='haz')pl.hazard=!pl.hazard;
  }
  if(A||['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();});
addEventListener('keyup',e=>{keys[e.code]=false;if(actOf(e.code)==='horn')setHorn(false);});
// ---- comandi touch: trascinamento a partire dal punto in cui si appoggia il dito ----
const touch={on:false,id:null,x0:0,y0:0,steer:0,thr:0,brk:0};
const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
const stickEl=document.getElementById('stick'),knobEl=document.getElementById('knob');
const cl1=v=>Math.max(-1,Math.min(1,v));
renderer.domElement.addEventListener('touchstart',e=>{if(touch.on||paused||MOB)return;const t=e.changedTouches[0];
  Object.assign(touch,{on:true,id:t.identifier,x0:t.clientX,y0:t.clientY,steer:0,thr:0,brk:0});
  stickEl.style.left=t.clientX+'px';stickEl.style.top=t.clientY+'px';stickEl.style.display='block';knobEl.style.transform='';
  document.getElementById('hint').style.display='none';AC&&AC.resume();e.preventDefault();},{passive:false});
renderer.domElement.addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(t.identifier!==touch.id)continue;
  const dx=t.clientX-touch.x0,dy=t.clientY-touch.y0,R=Math.min(innerWidth,innerHeight)*0.3;
  const sx=cl1(dx/R),sy=cl1(dy/R);
  touch.steer=Math.sign(sx)*Math.max(0,Math.abs(sx)-0.06)/0.94;
  touch.thr=Math.max(0,-sy-0.08)/0.92;touch.brk=Math.max(0,sy-0.08)/0.92;
  knobEl.style.transform=`translate(${sx*48}px,${sy*48}px)`;}e.preventDefault();},{passive:false});
// smartphone: pollice sinistro = gas (su) e freno (giù), pollice destro = sterzo; ogni cursore parte da dove appoggi il dito e torna al centro quando lo alzi
const MOB=isTouch&&matchMedia('(pointer:coarse)').matches;if(MOB)document.body.classList.add('mob');
const MZ={L:{id:null,v:0},R:{id:null,v:0}};
function mzSync(){touch.on=MZ.L.id!=null||MZ.R.id!=null;touch.thr=Math.max(0,MZ.L.v);touch.brk=Math.max(0,-MZ.L.v);touch.steer=MZ.R.v;}
[['L','mobL',0],['R','mobR',1]].forEach(([k,id,hor])=>{const el=document.getElementById(id),trk=el.querySelector('.trk'),kn=el.querySelector('.kn'),Z=MZ[k];
  const set=(t)=>{const r=trk.getBoundingClientRect();let v;if(hor){const R0=r.width*0.42;v=cl1((t.clientX-Z.a)/R0);kn.style.transform=`translateX(${v*R0}px)`;}else{const R0=r.height*0.42;v=cl1(-(t.clientY-Z.a)/R0);kn.style.transform=`translateY(${-v*R0}px)`;}
    Z.v=Math.sign(v)*Math.max(0,Math.abs(v)-0.05)/0.95;mzSync();};
  el.addEventListener('touchstart',e=>{if(paused)return;for(const t of e.changedTouches){if(t.target.closest('button'))continue;if(Z.id!=null)continue;Z.id=t.identifier;Z.a=hor?t.clientX:t.clientY;trk.classList.add('act');set(t);AC&&AC.resume();}e.preventDefault();},{passive:false});
  el.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===Z.id)set(t);e.preventDefault();},{passive:false});
  const end=e=>{for(const t of e.changedTouches)if(t.identifier===Z.id){Z.id=null;Z.v=0;kn.style.transform='';trk.classList.remove('act');mzSync();}};
  el.addEventListener('touchend',end);el.addEventListener('touchcancel',end);});
// ---- volante a schermo: si gira col pollice attorno al centro (mezzo giro = tutto sterzo), lasciato torna dritto; al centro il clacson ----
const MW={ang:0,id:null,last:0},MP={gas:{id:null,v:0},brk:{id:null,v:0}},TL={z:null,v:0};
function mobCtl(){const c=CFG.touchCtl||'volante';document.body.classList.remove('c-volante','c-tilt','c-cursori');document.body.classList.add('c-'+c);}
if(MOB)mobCtl();
function mobSync(){const c=CFG.touchCtl||'volante';if(c==='cursori')return;
  touch.on=true;touch.thr=MP.gas.v;touch.brk=MP.brk.v;touch.steer=c==='tilt'?TL.v:Math.max(-1,Math.min(1,MW.ang/180));}
{const el=document.getElementById('mobW'),g=document.getElementById('mwG');
  const ctr=()=>{const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2,r.width/2];};
  el.addEventListener('touchstart',e=>{if(paused)return;for(const t of e.changedTouches){const[cx,cy,R0]=ctr(),dx=t.clientX-cx,dy=t.clientY-cy;
      if(Math.hypot(dx,dy)<R0*0.3){MW.hornId=t.identifier;setHorn(true);continue;}if(MW.id!=null)continue;MW.id=t.identifier;MW.last=Math.atan2(dy,dx);}AC&&AC.resume();e.preventDefault();},{passive:false});
  el.addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(t.identifier!==MW.id)continue;const[cx,cy]=ctr(),a=Math.atan2(t.clientY-cy,t.clientX-cx);let d=a-MW.last;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;MW.last=a;
      MW.ang=Math.max(-200,Math.min(200,MW.ang+d*57.3));}e.preventDefault();},{passive:false});
  const end=e=>{for(const t of e.changedTouches){if(t.identifier===MW.id)MW.id=null;if(t.identifier===MW.hornId){MW.hornId=null;setHorn(false);}}};
  el.addEventListener('touchend',end);el.addEventListener('touchcancel',end);
  let tp=performance.now();(()=>{const mwLoop=()=>{const now=performance.now(),dt=Math.min(0.05,(now-tp)/1000);tp=now;
    if(MW.id==null&&MW.ang!==0){const k=Math.min(Math.abs(MW.ang),dt*(260+Math.abs(pl.vx||0)*12));MW.ang-=Math.sign(MW.ang)*k;}   // lasciato, il volante torna dritto da solo (più in fretta in velocità)
    g.setAttribute('transform','rotate('+MW.ang.toFixed(1)+')');try{if(MOB&&started&&!paused)mobSync();}catch(e){}requestAnimationFrame(mwLoop);};requestAnimationFrame(mwLoop);})();}
// ---- pedali: più in alto appoggi il dito, più premi ----
[['gas','mpGas'],['brk','mpBrk']].forEach(([k,id])=>{const el=document.getElementById(id),bar=el.querySelector('b'),Z=MP[k];
  const set=t=>{const r=el.getBoundingClientRect(),f=Math.max(0,Math.min(1,(r.bottom-t.clientY)/r.height));Z.v=0.25+0.75*Math.min(1,f*1.15);bar.style.height=(Z.v*100).toFixed(0)+'%';};
  el.addEventListener('touchstart',e=>{if(paused)return;for(const t of e.changedTouches){if(Z.id!=null)continue;Z.id=t.identifier;el.classList.add('act');set(t);}AC&&AC.resume();e.preventDefault();e.stopPropagation();},{passive:false});
  el.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===Z.id)set(t);e.preventDefault();},{passive:false});
  const end=e=>{for(const t of e.changedTouches)if(t.identifier===Z.id){Z.id=null;Z.v=0;bar.style.height='0';el.classList.remove('act');}};el.addEventListener('touchend',end);el.addEventListener('touchcancel',end);});
document.querySelectorAll('#mpGear button').forEach(b=>b.addEventListener('touchstart',e=>{selectGear(b.dataset.g);e.preventDefault();e.stopPropagation();},{passive:false}));
// ---- inclinazione: il telefono in orizzontale si gira come un volante (30° = tutto sterzo); "centra" azzera la posizione di guida ----
function tiltAsk(){try{if(window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission)DeviceOrientationEvent.requestPermission().catch(()=>{});}catch(e){}}
addEventListener('deviceorientation',e=>{if(e.beta==null)return;const ang=(screen.orientation&&screen.orientation.angle)||window.orientation||0,raw=ang===90?e.beta:(ang===270||ang===-90)?-e.beta:e.gamma;
  if(TL.z==null)TL.z=raw;let d=raw-TL.z;if(d>180)d-=360;if(d<-180)d+=360;TL.raw=raw;const a=Math.max(0,Math.abs(d)-1.5);TL.v=Math.max(-1,Math.min(1,Math.sign(d)*a/30));});
document.getElementById('mtZero').onclick=()=>{if(TL.raw!=null)TL.z=TL.raw;};
{const h=document.getElementById('mtHorn');h.addEventListener('touchstart',e=>{setHorn(true);e.preventDefault();},{passive:false});h.addEventListener('touchend',()=>setHorn(false));}
document.querySelectorAll('#mGear button').forEach(b=>b.addEventListener('touchstart',e=>{selectGear(b.dataset.g);e.preventDefault();e.stopPropagation();},{passive:false}));
{const h=document.getElementById('mHorn');h.addEventListener('touchstart',e=>{setHorn(true);e.preventDefault();e.stopPropagation();},{passive:false});h.addEventListener('touchend',()=>setHorn(false));h.addEventListener('touchcancel',()=>setHorn(false));}
document.querySelectorAll('#mobTop button').forEach(b=>b.onclick=e=>{e.currentTarget.blur();const t=document.getElementById(b.dataset.p);if(t)t.click();});
setInterval(()=>{if(!MOB)return;const run=started&&!pl.ended&&menu.style.display!=='flex';document.body.classList.toggle('run',run);if(!run)return;
  document.querySelectorAll('#mGear button,#mpGear button').forEach(b=>b.classList.toggle('on',pl.sel===b.dataset.g));document.getElementById('mJob').classList.toggle('off',MODE!=='career');
  const pb=document.querySelector('#mobTop [data-p="pauseBtn"]');{const k=paused?'p':'s';if(pb.dataset.ic!==k){pb.dataset.ic=k;pb.innerHTML=paused?'<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>':'<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>';}}},250);
function touchEnd(e){for(const t of e.changedTouches){if(t.identifier===touch.id){touch.on=false;touch.id=null;touch.steer=touch.thr=touch.brk=0;stickEl.style.display='none';}}}
renderer.domElement.addEventListener('touchend',touchEnd);renderer.domElement.addEventListener('touchcancel',touchEnd);
document.getElementById('tView').onclick=()=>toggleView();
// selettore del cambio automatico: R e D solo da fermo o quasi (come nelle auto vere), N sempre
function selectGear(g){if(!pl.P)return;// D, N e R si inseriscono anche in movimento, sotto i 15 km/h (in folle sempre)
  if(g!=='N'&&pl.sel!==g&&Math.abs(pl.vx)>15/3.6&&!(g==='D'&&pl.sel==='N'&&pl.vx>-0.5)){pl.navMsg='Rallenta sotto i 15 km/h per cambiare';pl.navMsgT=1.6;return;}
  if(pl.sel!==g&&g!=='N'&&Math.abs(pl.vx)>0.8&&AC)clunk(0.5);pl.sel=g;if(g==='D')pl.gear=1;}
document.getElementById('tFix').onclick=()=>unflip();
document.getElementById('tGear').onclick=()=>selectGear(pl.sel==='R'?'D':'R');
document.getElementById('tMenu').onclick=()=>showMenu();
const th=document.getElementById('tHorn');
th.addEventListener('touchstart',e=>{setHorn(true);e.preventDefault();},{passive:false});th.addEventListener('touchend',()=>setHorn(false));
th.addEventListener('mousedown',()=>setHorn(true));th.addEventListener('mouseup',()=>setHorn(false));
function readInput(dt){
  if(CINE.intro){pl.thrIn=0;pl.brkIn=1;pl.steerIn*=0.9;return;}
  pl.hb=kd(KEYMAP.hb);pl.flash=kd(KEYMAP.flash||[]);let thr=kd(KEYMAP.thr)?1:0,brk=kd(KEYMAP.brk)?1:0,steerT=(kd(KEYMAP.right)?1:0)-(kd(KEYMAP.left)?1:0),analog=false;
  // tastiera progressiva: un tocco dà poco gas o poco freno, tenendo premuto si arriva al massimo (più in fretta nel profilo Facile)
  {const ramp=[0.8,0.6,0.45][CFG.aids??1]||0.6;pl.kbT=thr?Math.min(1,(pl.kbT||0)+dt/ramp):0;pl.kbB=brk?Math.min(1,(pl.kbB||0)+dt/(ramp*0.85)):0;if(thr)thr=0.3+0.7*pl.kbT;if(brk)brk=0.25+0.75*pl.kbB;}
  // mantenimento della velocità: tenendo premuto il tasto l'auto tiene la velocità che aveva; con l'acceleratore la si alza, il freno lo annulla
  {const hk=kd(KEYMAP.hold||[]);if(!hk||brk||pl.sel==='R'){pl.holdV=null;pl.holdI=0;if(brk)pl.holdBlk=hk;}if(!hk)pl.holdBlk=false;
    if(hk&&!brk&&!pl.holdBlk&&pl.vx>1.5){if(pl.holdV==null){pl.holdV=pl.vx;pl.holdI=0;}if(thr){pl.holdV=Math.max(pl.holdV,pl.vx);}
      else{const e=pl.holdV-pl.vx;pl.holdI=Math.max(-0.3,Math.min(0.6,(pl.holdI||0)+e*0.3*dt));thr=Math.max(0,Math.min(1,0.2+e*0.5+pl.holdI));if(e<-1.2)brk=Math.min(0.35,(-e-1.2)*0.12);}}
    const hi=document.getElementById('holdInd');if(hi){const on=pl.holdV!=null;if(on!==hi._on){hi._on=on;hi.style.display=on?'block':'none';}if(on){const t='▶ '+Math.round(pl.holdV*3.6);if(hi.textContent!==t)hi.textContent=t;}}}
  const v=Math.abs(pl.vx||0);
  const gps=navigator.getGamepads?navigator.getGamepads():[];
  // gamepad: stick sinistro = sterzo, stick destro su/giù = gas/freno, grilletto destro = marcia (D→N→R→N→D), grilletto sinistro = clacson
  for(const gp of gps){if(!gp||ctrlWait)continue;const CP=CTRL.pad,BT=CP.btn,ax=(gp.axes[CP.steer.a]||0)*CP.steer.s;
    const B=i=>i>=0&&gp.buttons[i]&&(gp.buttons[i].pressed||gp.buttons[i].value>0.5),prev=pl.gpPrev||{};if(B(BT.hb))pl.hb=true;if(B(BT.flash))pl.flash=true;const now={};Object.keys(BT).forEach(k=>now[k]=B(BT[k]));
    const ed=k=>now[k]&&!prev[k];
    if(ed('gear')){selectGear(pl.sel==='R'?'D':'R');}
    if(now.horn!==!!prev.horn)setHorn(now.horn);
    if(ed('view'))toggleView();if(ed('lights'))toggleLights();if(ed('haz'))pl.hazard=!pl.hazard;
    if(ed('blL'))manualBlink(-1);if(ed('blR'))manualBlink(1);if(ed('unflip')&&(pl.wat||pl.flip))unflip();if(ed('car'))cycleCar(1);if(ed('radio'))RADIO.next();if(ed('radioP'))RADIO.prev();if(ed('navMute'))navMute();if(ed('volUp'))radioVol((CFG.vol??0.6)+0.1);if(ed('volDn'))radioVol((CFG.vol??0.6)-0.1);
    pl.gpPrev=now;
    let gT=0,gB=0;
    if(CP.pedal.mode==='two'){const nv=(A)=>{if(A.a<0)return 0;const r=gp.axes[A.a]||0,d=(A.full-A.rest)||1;return Math.max(0,Math.min(1,(r-A.rest)/d));};gT=nv(CP.thrA);gB=nv(CP.brkA);}
    else{const yAx=CP.pedal.a==='auto'?((gp.axes.length>3&&Math.abs(gp.axes[3])>0.02)?gp.axes[3]:(gp.axes[1]||0)):(gp.axes[CP.pedal.a]||0);const yv=yAx*(CP.pedal.a==='auto'?-1:CP.pedal.s);gT=Math.max(0,yv);gB=Math.max(0,-yv);}
    const jdz=CFG.jdz??0.08,jg=CFG.jgain??1;if(Math.abs(ax)>jdz||gT>0.06||gB>0.06){analog=true;pl.steerTgt=Math.sign(ax)*Math.min(1,Math.max(0,Math.abs(ax)-jdz)/(1-jdz)*jg);
      if(gT>0.06)thr=Math.max(thr,(gT-0.06)/0.94);if(gB>0.06)brk=Math.max(brk,(gB-0.06)/0.94);}break;}
  if(touch.on){analog=true;thr=Math.max(thr,touch.thr);brk=Math.max(brk,touch.brk);pl.steerTgt=touch.steer;}
  if(analog){const d=pl.steerTgt-pl.steerIn;pl.steerIn+=Math.sign(d)*Math.min(Math.abs(d),1.8*CFG.rap*dt);pl.steerAnalog=true;}
  else{
    pl.steerAnalog=false;
    if(steerT!==0){
      // tasto premuto: si arriva in circa due decimi di secondo alla "curva giusta" per la velocità (vedi stepPhysics), controsterzo ancora più rapido
      const opp=pl.steerIn!==0&&Math.sign(steerT)!==Math.sign(pl.steerIn);
      const rate=(opp?9:5)*CFG.rap;
      pl.steerIn=Math.max(-1,Math.min(1,pl.steerIn+steerT*rate*dt));
      // tenendo premuto oltre mezzo secondo la curva si stringe gradualmente (come girare di più il volante)
      pl.kbHold=opp?0:Math.abs(pl.steerIn)>0.99?Math.min(1.4,(pl.kbHold||0)+dt):0;
    } else {
      // tasti rilasciati: il volante torna al centro da solo, in modo progressivo (più deciso in velocità)
      // autoallineamento: da fermo nessun ritorno, piano lento, veloce rapido (come la coppia di autoallineamento reale)
      const rate=v<0.4?0:Math.min(6,1.5+v*0.5)*CFG.rit;const k=Math.min(Math.abs(pl.steerIn),rate*dt);
      pl.steerIn-=Math.sign(pl.steerIn)*k;if(Math.abs(pl.steerIn)<0.004)pl.steerIn=0;pl.kbHold=0;
    }
  }
  pl.thrIn+=((pl.fuel!=null&&pl.fuel<=0&&(CFG.fuel??1))?0-pl.thrIn:(pl.P.gov&&Math.abs(pl.vx)*3.6>pl.P.gov?0:thr)-pl.thrIn)*Math.min(1,dt*(thr>pl.thrIn?3:8));pl.brkIn+=(brk-pl.brkIn)*Math.min(1,dt*(brk>pl.brkIn?4:10));
}

