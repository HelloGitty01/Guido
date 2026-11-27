// Guido · 08 comandi — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ================= INPUT =================
const keys={};
// ================= COMANDI RIMAPPABILI (tastiera e gamepad) =================
const CTRL_DEF={keys:{thr:['KeyA','ArrowUp'],brk:['KeyZ','ArrowDown'],hold:['KeyS',''],left:['Comma','ArrowLeft'],right:['Period','ArrowRight'],hb:['Space',''],horn:['KeyH',''],
    gD:['KeyD',''],gR:['KeyR',''],lights:['KeyL',''],view:['KeyC',''],blL:['KeyQ',''],blR:['KeyE',''],haz:['KeyX',''],pause:['KeyP',''],end:['KeyF',''],unflip:['Enter',''],car:['KeyV',''],radio:['KeyM',''],radioP:['KeyN',''],navMute:['KeyU',''],flash:['KeyG',''],volUp:['Equal','NumpadAdd'],volDn:['Minus','NumpadSubtract'],map:['Tab','KeyT'],photo:['KeyO',''],rec:['KeyJ','']},
  pad:{steer:{a:0,s:1},pedal:{mode:'one',a:'auto',s:-1},thrA:{a:-1,rest:0,full:1},brkA:{a:-1,rest:0,full:1},
    btn:{gD:-1,gR:-1,radioP:-1,navMute:-1,gear:7,horn:6,view:0,lights:3,haz:2,blL:14,blR:15,hb:1,unflip:1,car:-1,radio:-1,flash:-1,volUp:-1,volDn:-1,map:-1,photo:-1,rec:-1}}};
const CTRL_LBL={thr:'Acceleratore',brk:'Freno',hold:'Mantieni velocità (tenere premuto)',left:'Sterzo a sinistra',right:'Sterzo a destra',hb:'Freno a mano',horn:'Clacson',gD:'Marcia D',gR:'Retromarcia R',
  lights:'Fari',view:'Cambia vista',blL:'Freccia sinistra',blR:'Freccia destra',haz:'Quattro frecce',pause:'Pausa',end:'Fine corsa',unflip:'Raddrizza auto',gear:'Cambio D↔R',car:'Cambia auto',radio:'Autoradio (stazione successiva)',radioP:'Autoradio (stazione precedente)',navMute:'Voce del navigatore sì/no',flash:'Lampeggio abbaglianti',volUp:'Volume radio +',volDn:'Volume radio −',map:'Mappa grande',photo:'Scatta una foto (va nell\'Album)',rec:'Registra clip, avvia/ferma (va nell\'Album)'};
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
  h+='</table><h3>Gamepad / volante</h3>';
  {const C=CTRL.pad.cal;h+=`<div class="row" style="gap:8px;flex-wrap:wrap;margin:6px 0 10px"><button class="sm" id="calGo">🎮 Calibra volante e pedali</button>`+(C&&C.ok?`<span style="color:#9fdc9f">✓ calibrato</span><button class="sm" id="calDel">Togli calibrazione</button>`:'')+`</div>`;
   if(C&&C.ok)h+=`<div class="row" style="gap:10px;flex-wrap:wrap;font-size:13px"><label>Curva sterzo <input type="range" id="calGs" min="1" max="2" step="0.05" value="${C.gs}"> <b id="calGsV">${C.gs.toFixed(2)}</b></label><label>Curva freno <input type="range" id="calGb" min="1" max="2.5" step="0.05" value="${C.gb}"> <b id="calGbV">${C.gb.toFixed(2)}</b></label><label>Zona morta <input type="range" id="calDz" min="0" max="0.1" step="0.005" value="${C.dz}"> <b id="calDzV">${Math.round(C.dz*100)}%</b></label></div>`;}
  h+='<table>';
  h+=`<tr><td>Sterzo</td><td colspan=2><button class="sm ca" data-w="steer">${ctrlWait&&ctrlWait.what==='steer'?'gira a destra…':ax(P.steer.a)+(P.steer.s<0?' (invertito)':'')}</button></td></tr>`;
  h+=`<tr><td>Pedali</td><td colspan=2><select id="pedMode"><option value="one"${P.pedal.mode==='one'?' selected':''}>un asse (su gas, giù freno)</option><option value="two"${P.pedal.mode==='two'?' selected':''}>due assi separati</option></select></td></tr>`;
  if(P.pedal.mode==='one')h+=`<tr><td>Asse gas/freno</td><td colspan=2><button class="sm ca" data-w="pedal">${ctrlWait&&ctrlWait.what==='pedal'?'spingi verso il gas…':ax(P.pedal.a)}</button></td></tr>`;
  else{h+=`<tr><td>Asse acceleratore</td><td colspan=2><button class="sm ca" data-w="thrA">${ctrlWait&&ctrlWait.what==='thrA'?'premi a fondo…':ax(P.thrA.a)}</button></td></tr>`;
    h+=`<tr><td>Asse freno</td><td colspan=2><button class="sm ca" data-w="brkA">${ctrlWait&&ctrlWait.what==='brkA'?'premi a fondo…':ax(P.brkA.a)}</button></td></tr>`;}
  {const L=P.lever||(P.lever={mode:'one'}),nm=q=>!q?'—':q.t==='b'?'pulsante '+q.i:'asse '+q.i+(q.s>0?' +':' −'),w=x=>ctrlWait&&ctrlWait.kind==='lever'&&ctrlWait.which===x;
   h+=`<tr><td>Leva del cambio</td><td colspan=2><select id="levMode"><option value="one"${L.mode!=='two'?' selected':''}>un comando: alterna D e R</option><option value="two"${L.mode==='two'?' selected':''}>indietro = D, avanti = R</option></select></td></tr>`;
   if(L.mode==='two'){h+=`<tr><td>Leva indietro → D</td><td colspan=2><button class="sm cl" data-w="D">${w('D')?'tira la leva indietro…':nm(L.D)}</button></td></tr>`;h+=`<tr><td>Leva avanti → R</td><td colspan=2><button class="sm cl" data-w="R">${w('R')?'spingi la leva avanti…':nm(L.R)}</button></td></tr>`;}}
  Object.keys(P.btn).forEach(k=>{if(P.lever&&P.lever.mode==='two'&&(k==='gear'||k==='gD'||k==='gR'))return;h+=`<tr><td>${CTRL_LBL[k]}</td><td colspan=2><button class="sm cp" data-k="${k}">${ctrlWait&&ctrlWait.kind==='btn'&&ctrlWait.act===k?'premi un pulsante…':(P.btn[k]<0?'—':'pulsante '+P.btn[k])}</button></td></tr>`;});
  h+='</table><p style="opacity:.7;font-size:12px">Clicca un comando e premi il tasto (o muovi l\'asse, o premi il pulsante). Canc toglie il tasto, Esc annulla.</p>';
  bx.innerHTML=h;
  bx.querySelectorAll('.cb').forEach(b=>b.onclick=()=>{ctrlWait={kind:'key',act:b.dataset.k,slot:+b.dataset.i};ctrlUI();});
  bx.querySelectorAll('.cp').forEach(b=>b.onclick=()=>{ctrlWait={kind:'btn',act:b.dataset.k,base:padSnap()};ctrlUI();});
  bx.querySelectorAll('.cl').forEach(b=>b.onclick=()=>{ctrlWait={kind:'lever',which:b.dataset.w,base:padSnap()};ctrlUI();});
  {const lm=document.getElementById('levMode');if(lm)lm.onchange=()=>{P.lever.mode=lm.value;saveCtrl();ctrlUI();};}
  bx.querySelectorAll('.ca').forEach(b=>b.onclick=()=>{ctrlWait={kind:'axis',what:b.dataset.w,base:padSnap()};ctrlUI();});
  const pm=document.getElementById('pedMode');if(pm)pm.onchange=()=>{P.pedal.mode=pm.value;saveCtrl();ctrlUI();};
  const cg=document.getElementById('calGo');if(cg)cg.onclick=()=>CAL.start();const cd=document.getElementById('calDel');if(cd)cd.onclick=()=>{CTRL.pad.cal=null;saveCtrl();ctrlUI();};
  [['calGs','gs',v=>v.toFixed(2)],['calGb','gb',v=>v.toFixed(2)],['calDz','dz',v=>Math.round(v*100)+'%']].forEach(([id,k,f])=>{const e=document.getElementById(id);if(e)e.oninput=()=>{CTRL.pad.cal[k]=+e.value;document.getElementById(id+'V').textContent=f(+e.value);saveCtrl();};});}
// volante/pedaliera: tra i dispositivi collegati sceglie quello vero (con assi), preferendo quello calibrato; ignora cuffie, tastiere e dispositivi virtuali senza assi
function padMain(){const L=(navigator.getGamepads?[...navigator.getGamepads()]:[]).filter(g=>g&&g.connected!==false);if(!L.length)return null;const id=CTRL&&CTRL.pad&&CTRL.pad.cal&&CTRL.pad.cal.id;
  if(id){const m=L.find(g=>g.id===id&&g.axes.length);if(m)return m;}
  const A=L.filter(g=>g.axes.length>=1);if(!A.length)return L[0];return A.sort((a,b)=>(b.axes.length-a.axes.length)||(b.timestamp-a.timestamp))[0];}
function padSnap(){const gp=padMain();return gp?{ax:[...gp.axes],bt:gp.buttons.map(b=>b.pressed||b.value>0.5)}:{ax:[],bt:[]};}
// cattura dei tasti prima del gioco
addEventListener('keydown',e=>{if(!ctrlWait||ctrlWait.kind!=='key')return;e.preventDefault();e.stopImmediatePropagation();
  if(e.code==='Escape'){ctrlWait=null;ctrlUI();return;}
  const {act,slot}=ctrlWait;if(e.code==='Delete'||e.code==='Backspace')CTRL.keys[act][slot]='';
  else{for(const k in CTRL.keys)CTRL.keys[k]=CTRL.keys[k].map(c=>c===e.code?'':c);CTRL.keys[act][slot]=e.code;}
  ctrlWait=null;saveCtrl();ctrlUI();},true);
// cattura di assi e pulsanti del gamepad
(function padPoll(){if(ctrlWait&&ctrlWait.kind!=='key'){const gp=padMain();
    if(gp){const B=ctrlWait.base;
      if(ctrlWait.kind==='lever'){const P=CTRL.pad,L=P.lever||(P.lever={mode:'two'});let q=null;const i=gp.buttons.findIndex((b,j)=>(b.pressed||b.value>0.5)&&!B.bt[j]);
        if(i>=0){q={t:'b',i};Object.keys(P.btn).forEach(k=>{if(P.btn[k]===i)P.btn[k]=-1;});}
        else{let bi=-1,bd=0;gp.axes.forEach((v,j)=>{const d=v-(B.ax[j]||0);if(Math.abs(d)>Math.abs(bd)){bd=d;bi=j;}});if(bi>=0&&Math.abs(bd)>0.5&&bi!==P.steer.a)q={t:'a',i:bi,s:bd>0?1:-1,rest:B.ax[bi]||0};}
        if(q){L[ctrlWait.which]=q;ctrlWait=null;saveCtrl();ctrlUI();}}
      else if(ctrlWait.kind==='btn'){const i=gp.buttons.findIndex((b,j)=>(b.pressed||b.value>0.5)&&!B.bt[j]);if(i>=0){CTRL.pad.btn[ctrlWait.act]=i;ctrlWait=null;saveCtrl();ctrlUI();}}
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
  if(started&&!HOME.mode&&HOME.swapK&&(e.code==='Enter'||e.code==='NumpadEnter')&&menu.style.display!=='flex'){HOME.swap(HOME.swapK);e.preventDefault();return;}
  if(started&&HOME.mode&&menu.style.display!=='flex'){if(e.code==='Escape'){showMenu();return;}if(A==='map'){mapToggle();e.preventDefault();return;}if(A==='photo'){SHOT.take();e.preventDefault();return;}if(A==='rec'){recToggle();return;}
    if(HOME.mode==='walk'&&(e.code==='Enter'||e.code==='NumpadEnter'||e.code==='KeyE')&&HOME.near)HOME.enter(HOME.near);if(HOME.mode==='return'&&(e.code==='Enter'||e.code==='NumpadEnter'))HOME.finish();if(e.code.startsWith('Arrow')||e.code==='Space'||e.code==='Tab')e.preventDefault();return;}
  if(e.code==='Escape')showMenu();
  if(A==='map'&&started&&!pl.ended&&menu.style.display!=='flex'){mapToggle();e.preventDefault();return;}
  if(A==='photo'&&started&&!pl.ended&&menu.style.display!=='flex'){SHOT.take();e.preventDefault();return;}
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
// cambiando scheda il browser perde i "tasto rilasciato" e, al ritorno, il volante può riportare assi fermi a 0 (pedali letti come premuti a metà):
// si azzerano i tasti e si ignorano i pedali finché non si muove davvero qualcosa
let PADSTALE=null;const clrKeys=()=>{for(const k in keys)keys[k]=false;try{setHorn(false);}catch(e){}};
addEventListener('blur',clrKeys);
document.addEventListener('visibilitychange',()=>{clrKeys();if(!document.hidden){const gp=padMain();PADSTALE=gp?{ax:[...gp.axes],t:performance.now()}:{ax:null,t:performance.now()};}});
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
function mobCtl(){const c=CFG.touchCtl||'arco';document.body.classList.remove('c-volante','c-tilt','c-cursori','c-arco');document.body.classList.add('c-'+c);}
if(MOB)mobCtl();
function mobSync(){const c=CFG.touchCtl||'arco';if(c==='cursori')return;if(c==='arco'){MA.sync();return;}
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
  const gps=[padMain()].filter(Boolean);
  // gamepad: stick sinistro = sterzo, stick destro su/giù = gas/freno, grilletto destro = marcia (D→N→R→N→D), grilletto sinistro = clacson
  if(PADSTALE){const gp0=[...gps].find(g=>g);if(gp0&&PADSTALE.ax==null)PADSTALE.ax=[...gp0.axes];if(gp0&&PADSTALE.ax&&gp0.axes.some((v,i)=>Math.abs(v-(PADSTALE.ax[i]||0))>0.03))PADSTALE=null;}
  for(const gp of gps){if(!gp||ctrlWait||PADSTALE)continue;const CP=CTRL.pad,BT=CP.btn,ax=(gp.axes[CP.steer.a]||0)*CP.steer.s;
    const PB=CP.cal&&CP.cal.ok?[CP.cal.thr,CP.cal.brk].filter(q=>q&&q.t==='b').map(q=>q.i):[],B=i=>i>=0&&!PB.includes(i)&&gp.buttons[i]&&(gp.buttons[i].pressed||gp.buttons[i].value>0.5),prev=pl.gpPrev||{};if(B(BT.hb))pl.hb=true;if(B(BT.flash))pl.flash=true;const now={};Object.keys(BT).forEach(k=>now[k]=B(BT[k]));
    const ed=k=>now[k]&&!prev[k];
    {const L=CP.lever;if(L&&L.mode==='two'){const on=q=>!!q&&(q.t==='b'?B(q.i):((gp.axes[q.i]||0)-(q.rest||0))*q.s>0.5),lp=pl.lvPrev||{},nD=on(L.D),nR=on(L.R);if(nD&&!lp.D)selectGear('D');if(nR&&!lp.R)selectGear('R');pl.lvPrev={D:nD,R:nR};}
      else if(ed('gear')){selectGear(pl.sel==='R'?'D':'R');}}
    if(ed('gD'))selectGear('D');if(ed('gR'))selectGear('R');
    if(now.horn!==!!prev.horn)setHorn(now.horn);
    if(ed('view'))toggleView();if(ed('lights'))toggleLights();if(ed('haz'))pl.hazard=!pl.hazard;
    if(ed('blL'))manualBlink(-1);if(ed('blR'))manualBlink(1);if(ed('unflip')&&(pl.wat||pl.flip))unflip();if(ed('car'))cycleCar(1);if(ed('radio'))RADIO.next();if(ed('radioP'))RADIO.prev();if(ed('navMute'))navMute();if(ed('volUp'))radioVol((CFG.vol??0.6)+0.1);if(ed('volDn'))radioVol((CFG.vol??0.6)-0.1);
    pl.gpPrev=now;
    let gT=0,gB=0;
    if(CP.cal&&CP.cal.ok){const R=CAL.read(gp);analog=true;pl.wheelIn=true;pl.steerTgt=R.s;thr=Math.max(thr,R.t);brk=Math.max(brk,R.b);break;}
    pl.wheelIn=false;
    if(CP.pedal.mode==='two'){const nv=(A)=>{if(A.a<0)return 0;const r=gp.axes[A.a]||0,d=(A.full-A.rest)||1;return Math.max(0,Math.min(1,(r-A.rest)/d));};gT=nv(CP.thrA);gB=nv(CP.brkA);}
    else{const yAx=CP.pedal.a==='auto'?((gp.axes.length>3&&Math.abs(gp.axes[3])>0.02)?gp.axes[3]:(gp.axes[1]||0)):(gp.axes[CP.pedal.a]||0);const yv=yAx*(CP.pedal.a==='auto'?-1:CP.pedal.s);gT=Math.max(0,yv);gB=Math.max(0,-yv);}
    const jdz=CFG.jdz??0.08,jg=CFG.jgain??1;if(Math.abs(ax)>jdz||gT>0.06||gB>0.06){analog=true;pl.steerTgt=Math.sign(ax)*Math.min(1,Math.max(0,Math.abs(ax)-jdz)/(1-jdz)*jg);
      if(gT>0.06)thr=Math.max(thr,(gT-0.06)/0.94);if(gB>0.06)brk=Math.max(brk,(gB-0.06)/0.94);}break;}
  if(touch.on){analog=true;thr=Math.max(thr,touch.thr);brk=Math.max(brk,touch.brk);pl.steerTgt=touch.steer;}
  if(analog){const d=pl.steerTgt-pl.steerIn;pl.steerIn+=Math.sign(d)*Math.min(Math.abs(d),(pl.wheelIn&&!touch.on?12:1.8*CFG.rap)*dt);pl.steerAnalog=true;}
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


// ---- comandi "velocità e arco": a sinistra il pallino fissa la velocità voluta e resta lì (l'auto ci arriva e la tiene),
//      il freno è un pulsante; a destra lo sterzo si trascina lungo un arco e lasciato torna dritto ----
const MA={tgt:0,thrId:null,brkId:null,arcId:null,steer:0,vmax:130,
  sync(){const P=pl.P||{};this.vmax=Math.min(170,P.vmax||150);const v=Math.abs(pl.vx||0)*3.6,t=this.tgt*this.vmax;let thr=0,brk=0;
    if(this.brkId!=null)brk=1;else if(t>1){const e=t-v;thr=e>0?Math.min(1,0.25+e/14):Math.max(0,0.15+e/20);if(e<-12)brk=Math.min(0.5,(-e-12)/30);}
    else if(v>2)brk=0.35;
    touch.on=true;touch.thr=thr;touch.brk=brk;touch.steer=this.steer;
    const sp=document.getElementById('maSpd');if(sp){const s=Math.round(t);if(sp.textContent!==String(s))sp.textContent=s;}}};
{const el=document.getElementById('maThr'),kn=el&&el.querySelector('.kn');
  if(el){const set=t=>{const r=el.getBoundingClientRect();MA.tgt=Math.max(0,Math.min(1,(r.bottom-t.clientY)/r.height));if(MA.tgt<0.03)MA.tgt=0;kn.style.bottom=(MA.tgt*100).toFixed(1)+'%';};
    el.addEventListener('touchstart',e=>{if(paused)return;for(const t of e.changedTouches){if(MA.thrId!=null)continue;MA.thrId=t.identifier;el.classList.add('act');set(t);}AC&&AC.resume();e.preventDefault();e.stopPropagation();},{passive:false});
    el.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===MA.thrId)set(t);e.preventDefault();},{passive:false});
    const end=e=>{for(const t of e.changedTouches)if(t.identifier===MA.thrId){MA.thrId=null;el.classList.remove('act');}};el.addEventListener('touchend',end);el.addEventListener('touchcancel',end);
    MA.reset=()=>{MA.tgt=0;kn.style.bottom='0%';};}}
{const el=document.getElementById('maBrk');if(el){
  el.addEventListener('touchstart',e=>{if(paused)return;for(const t of e.changedTouches)if(MA.brkId==null)MA.brkId=t.identifier;el.classList.add('act');AC&&AC.resume();e.preventDefault();e.stopPropagation();},{passive:false});
  const end=e=>{for(const t of e.changedTouches)if(t.identifier===MA.brkId){MA.brkId=null;el.classList.remove('act');}};el.addEventListener('touchend',end);el.addEventListener('touchcancel',end);}}
document.querySelectorAll('#maGear button').forEach(b=>b.addEventListener('touchstart',e=>{selectGear(b.dataset.g);e.preventDefault();e.stopPropagation();},{passive:false}));
{const el=document.getElementById('maArc'),kn=document.getElementById('maKn');
  if(el){const R=110,CY=100;   // arco di raggio 110 con centro in (0,100) nelle coordinate dell'svg
    const svgPt=t=>{const r=el.getBoundingClientRect(),k=Math.min(r.width,r.height)/200,cx=r.left+r.width/2,cy=r.top+r.height/2;return[(t.clientX-cx)/k,(t.clientY-cy)/k];};
    const MAXA=0.73;   // circa 42° per parte = tutto sterzo
    const put=a=>{kn.setAttribute('cx',(Math.sin(a)*R).toFixed(1));kn.setAttribute('cy',(CY-Math.cos(a)*R).toFixed(1));};
    const set=t=>{const[x,y]=svgPt(t),aa=Math.max(-MAXA,Math.min(MAXA,Math.atan2(x,CY-y)));MA.steer=aa/MAXA;put(aa);};
    el.addEventListener('touchstart',e=>{if(paused)return;for(const t of e.changedTouches){if(MA.arcId!=null)continue;MA.arcId=t.identifier;set(t);}AC&&AC.resume();e.preventDefault();e.stopPropagation();},{passive:false});
    el.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===MA.arcId)set(t);e.preventDefault();},{passive:false});
    const end=e=>{for(const t of e.changedTouches)if(t.identifier===MA.arcId)MA.arcId=null;};el.addEventListener('touchend',end);el.addEventListener('touchcancel',end);
    let tp=performance.now();const loop=()=>{const now=performance.now(),dt=Math.min(0.25,(now-tp)/1000);tp=now;
      if(MA.arcId==null&&MA.steer!==0){const k=Math.min(Math.abs(MA.steer),dt*(3.2+Math.abs(pl.vx||0)*0.05));MA.steer-=Math.sign(MA.steer)*k;put(MA.steer*MAXA);}
      document.querySelectorAll('#maGear button').forEach(b=>b.classList.toggle('on',b.dataset.g===(pl.sel||'D')));
      requestAnimationFrame(loop);};requestAnimationFrame(loop);}}

// ---- calibrazione guidata di volante e pedaliera: riposo, sterzo a fondo corsa, pedali a fondo; ogni pedale può essere un asse o un pulsante analogico (i grilletti in X-Input) ----
const CAL={st:-1,base:null,cand:null,
  gp(){return padMain();},
  snap(g){return{a:[...g.axes],b:g.buttons.map(b=>b.value||0)};},
  val(g,q){return q.t==='a'?(g.axes[q.i]||0):((g.buttons[q.i]&&g.buttons[q.i].value)||0);},
  read(g){const C=CTRL.pad.cal,dz=C.dz||0;let s=0;{const v=g.axes[C.steer.i]||0,c=C.steer.c;const dl=(C.steer.l-c)||-1,dr=(C.steer.r-c)||1;let n=Math.sign(v-c)===Math.sign(dl)?-(v-c)/dl:(v-c)/dr;   // lato sinistro = dalla parte del valore registrato a sinistra, qualunque sia il verso dell'asse
      n=Math.max(-1,Math.min(1,n));const m=Math.max(0,Math.abs(n)-dz)/(1-dz);s=Math.sign(n)*Math.pow(m,C.gs||1);}
    const ped=(q,gm)=>{if(!q)return 0;const v=this.val(g,q),n=Math.max(0,Math.min(1,(v-q.rest)/((q.full-q.rest)||1)));return Math.pow(Math.max(0,n-dz)/(1-dz),gm||1);};
    return{s,t:ped(C.thr,1),b:ped(C.brk,C.gb||1.5)};},
  msg:['Lascia volante e pedali a riposo, poi premi Avanti.','Gira il volante <b>tutto a sinistra</b> e tienilo lì, poi Avanti.','Ora <b>tutto a destra</b> e tienilo lì, poi Avanti.','Premi <b>a fondo l\'acceleratore</b> e tienilo, poi Avanti.','Premi <b>a fondo il freno</b> e tienilo, poi Avanti.','Spingi la leva del cambio <b>giù</b> (Drive) e tienila, poi Avanti. Se non hai il cambio, Salta.','Spingi la leva del cambio <b>su</b> (Retromarcia) e tienila, poi Avanti. Se non hai il cambio, Salta.','Prova: gira e premi i pedali, le barre devono seguirti. Se va bene, Salva.'],
  start(){if(!this.gp()){alert('Collega il volante e muovilo un attimo, poi riprova.');return;}this.st=0;this.tmp={gs:1.5,gb:1.5,dz:0.02,ok:true,id:this.gp().id};
    let o=document.getElementById('calOv');if(!o){o=document.createElement('div');o.id='calOv';o.style.cssText='position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;font:15px Inter,system-ui;color:#eee';
      o.innerHTML='<div style="background:#1b1d22;border:1px solid #444;border-radius:14px;padding:22px;width:min(520px,92vw)"><h3 style="margin:0 0 6px">Calibrazione volante e pedali</h3><div id="calStep" style="color:#aaa;font-size:13px"></div><p id="calMsg" style="min-height:44px"></p><div id="calBars"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button class="sm" id="calNo">Annulla</button><button class="sm" id="calSk">Salta</button><button class="sm" id="calOk" style="background:#b3242b;color:#fff">Avanti</button></div></div>';document.body.appendChild(o);
      document.getElementById('calNo').onclick=()=>this.stop();document.getElementById('calSk').onclick=()=>{this.st++;this.show();};document.getElementById('calOk').onclick=()=>this.next();}
    o.style.display='flex';this.show();this.loop();},
  stop(){this.st=-1;const o=document.getElementById('calOv');if(o)o.style.display='none';},
  show(){document.getElementById('calStep').textContent='Passo '+(this.st+1)+' di 8';document.getElementById('calMsg').innerHTML=this.msg[this.st];document.getElementById('calOk').textContent=this.st===7?'Salva':'Avanti';document.getElementById('calSk').style.display=(this.st===5||this.st===6)?'':'none';},
  best(g,skip){const S=this.snap(g),B=this.base;let bi=null,bd=0.25;S.a.forEach((v,i)=>{if(skip.some(q=>q.t==='a'&&q.i===i))return;const d=Math.abs(v-B.a[i]);if(d>bd){bd=d;bi={t:'a',i,rest:B.a[i],full:v};}});
    S.b.forEach((v,i)=>{if(skip.some(q=>q.t==='b'&&q.i===i))return;const d=Math.abs(v-B.b[i]);if(d>bd){bd=d;bi={t:'b',i,rest:B.b[i],full:v};}});return bi;},
  next(){const g=this.gp();if(!g)return;const T=this.tmp;
    if(this.st===0){this.base=this.snap(g);}
    else if(this.st===1){let bi=-1,bd=0.3;g.axes.forEach((v,i)=>{const d=Math.abs(v-this.base.a[i]);if(d>bd){bd=d;bi=i;}});if(bi<0){document.getElementById('calMsg').innerHTML='Non ho visto muoversi il volante: giralo tutto a sinistra e riprova.';return;}T.steer={i:bi,c:this.base.a[bi],l:g.axes[bi]};}
    else if(this.st===2){T.steer.r=g.axes[T.steer.i];if(Math.sign(T.steer.r-T.steer.c)===Math.sign(T.steer.l-T.steer.c)){document.getElementById('calMsg').innerHTML='Sembra lo stesso lato: gira tutto a <b>destra</b> e riprova.';return;}}
    else if(this.st===3){const q=this.best(g,[{t:'a',i:T.steer.i}]);if(!q){document.getElementById('calMsg').innerHTML='Non ho visto muoversi l\'acceleratore: premilo a fondo e riprova.';return;}T.thr=q;}
    else if(this.st===4){const q=this.best(g,[{t:'a',i:T.steer.i},T.thr]);if(!q){document.getElementById('calMsg').innerHTML='Non ho visto muoversi il freno: premilo a fondo e riprova.';return;}T.brk=q;}
    else if(this.st===5||this.st===6){const ped=[T.thr,T.brk].filter(q=>q.t==='b').map(q=>q.i),i=g.buttons.findIndex((b,j)=>!ped.includes(j)&&(b.pressed||b.value>0.5)&&!(this.base.b[j]>0.5));if(i<0){document.getElementById('calMsg').innerHTML='Non ho visto la leva: spingila e tienila mentre premi Avanti (o Salta).';return;}if(this.st===5)T.gD=i;else T.gR=i;}
    else if(this.st===7){const BT=CTRL.pad.btn;if(T.gD!=null){BT.gD=T.gD;}if(T.gR!=null){BT.gR=T.gR;}Object.keys(BT).forEach(k=>{if(k!=='gD'&&k!=='gR'&&(BT[k]===T.gD||BT[k]===T.gR))BT[k]=-1;});delete T.gD;delete T.gR;CTRL.pad.cal=T;saveCtrl();this.stop();ctrlUI();return;}
    this.st++;this.show();},
  loop(){if(this.st<0)return;requestAnimationFrame(()=>this.loop());const g=this.gp(),el=document.getElementById('calBars');if(!g||!el)return;
    const bar=(lbl,v,c)=>`<div style="display:flex;align-items:center;gap:8px;margin:5px 0"><span style="width:90px">${lbl}</span><div style="flex:1;height:12px;background:#333;border-radius:6px;position:relative;overflow:hidden">${c?`<div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:#888"></div><div style="position:absolute;top:0;bottom:0;background:#e0565d;left:${50+Math.min(0,v)*50}%;width:${Math.abs(v)*50}%"></div>`:`<div style="height:100%;width:${v*100}%;background:#e0565d"></div>`}</div><span style="width:44px;text-align:right">${Math.round(v*100)}</span></div>`;
    if(this.st===7){const sv=CTRL.pad.cal;CTRL.pad.cal=this.tmp;const R=this.read(g);CTRL.pad.cal=sv;el.innerHTML=bar('Sterzo',R.s,true)+bar('Gas',R.t)+bar('Freno',R.b)+'<div style="font:12px monospace;color:#9aa">asse '+this.tmp.steer.i+': ora '+(g.axes[this.tmp.steer.i]||0).toFixed(2)+' · sx '+this.tmp.steer.l.toFixed(2)+' · centro '+this.tmp.steer.c.toFixed(2)+' · dx '+this.tmp.steer.r.toFixed(2)+'</div>';}
    else el.innerHTML='<div style="font:12px monospace;color:#9aa;word-break:break-all">dispositivo: '+g.id.replace(/[<>&]/g,'')+' ('+(navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean).length:0)+' collegati)<br>assi: '+g.axes.map(v=>v.toFixed(2)).join(' ')+'<br>pulsanti analogici: '+g.buttons.map((b,i)=>b.value>0.02?i+':'+b.value.toFixed(2):'').filter(Boolean).join(' ')+'</div>';}};
addEventListener('keydown',e=>{if(CAL.st>=0&&(e.code==='Enter'||e.code==='NumpadEnter')){e.preventDefault();e.stopImmediatePropagation();CAL.next();}},true);
