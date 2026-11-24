// Guido · 12 extra carriera — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ================= EXTRA: telecamera orbitale, mappa, modalità foto, clip, carburante, sfide =================
// ---- uscita audio comune: tutto passa da qui, così le clip registrano anche i suoni ----
function ACOUT(){if(!AC.__m){AC.__m=AC.createGain();AC.__m.connect(AC.destination);}return AC.__m;}
// ---- telecamera orbitale nella vista esterna ----
const ORB={yaw:0,pitch:0,zoom:1,w:0,t:-99,drag:null,touch:null};
function orbOK(){return started&&!paused&&view==='chase'&&!PHOTO.on;}
renderer.domElement.addEventListener('mousedown',e=>{if(PHOTO.on){PHOTO.drag={x:e.clientX,y:e.clientY};return;}if(!orbOK())return;ORB.drag={x:e.clientX,y:e.clientY};});
addEventListener('mousemove',e=>{if(PHOTO.on&&PHOTO.drag){PHOTO.yaw-=(e.clientX-PHOTO.drag.x)*0.004;PHOTO.pitch=Math.max(-1.45,Math.min(1.45,PHOTO.pitch-(e.clientY-PHOTO.drag.y)*0.004));PHOTO.drag={x:e.clientX,y:e.clientY};return;}
  if(!ORB.drag)return;ORB.yaw-=(e.clientX-ORB.drag.x)*0.007;ORB.pitch=Math.max(-0.25,Math.min(1.25,ORB.pitch+(e.clientY-ORB.drag.y)*0.005));ORB.drag={x:e.clientX,y:e.clientY};ORB.t=simT;});
addEventListener('mouseup',()=>{ORB.drag=null;PHOTO.drag=null;});
renderer.domElement.addEventListener('wheel',e=>{if(PHOTO.on){PHOTO.fov=Math.max(15,Math.min(90,PHOTO.fov*Math.exp(e.deltaY*0.001)));e.preventDefault();return;}
  if(!orbOK())return;ORB.zoom=Math.max(0.45,Math.min(3.2,ORB.zoom*Math.exp(e.deltaY*0.0012)));ORB.t=simT;e.preventDefault();},{passive:false});
const t2=e=>{const a=e.touches[0],b=e.touches[1];return{x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2,d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)};};
renderer.domElement.addEventListener('touchstart',e=>{if(PHOTO.on){const t=e.touches[0];PHOTO.drag={x:t.clientX,y:t.clientY};if(e.touches.length===2)PHOTO.pinch=t2(e).d;e.preventDefault();return;}
  if(e.touches.length===2&&orbOK())ORB.touch=t2(e);},{passive:false});
renderer.domElement.addEventListener('touchmove',e=>{if(PHOTO.on){if(e.touches.length===2&&PHOTO.pinch){const d=t2(e).d;PHOTO.move+=(d-PHOTO.pinch)*0.08;PHOTO.pinch=d;}else if(PHOTO.drag){const t=e.touches[0];PHOTO.yaw-=(t.clientX-PHOTO.drag.x)*0.005;PHOTO.pitch=Math.max(-1.45,Math.min(1.45,PHOTO.pitch-(t.clientY-PHOTO.drag.y)*0.005));PHOTO.drag={x:t.clientX,y:t.clientY};}e.preventDefault();return;}
  if(e.touches.length===2&&ORB.touch){const q=t2(e);ORB.yaw-=(q.x-ORB.touch.x)*0.008;ORB.pitch=Math.max(-0.25,Math.min(1.25,ORB.pitch+(q.y-ORB.touch.y)*0.006));ORB.zoom=Math.max(0.45,Math.min(3.2,ORB.zoom*ORB.touch.d/Math.max(20,q.d)));ORB.touch=q;ORB.t=simT;}},{passive:false});
renderer.domElement.addEventListener('touchend',e=>{if(e.touches.length<2)ORB.touch=null;if(!e.touches.length){PHOTO.drag=null;PHOTO.pinch=null;}});
function orbUpdate(dt){const active=ORB.drag||ORB.touch||simT-ORB.t<3.5;
  ORB.w+=((active||Math.abs(pl.vx)<2?1:0)-ORB.w)*Math.min(1,dt*(active?6:0.8));
  if(!active&&Math.abs(pl.vx)>=2){ORB.yaw*=Math.exp(-dt*0.9);ORB.pitch*=Math.exp(-dt*0.9);}
  ORB.yaw=Math.atan2(Math.sin(ORB.yaw),Math.cos(ORB.yaw));}
// ---- modalità foto: gioco in pausa, telecamera libera, scatto PNG ----
const PHOTO={on:false,yaw:0,pitch:0,fov:55,move:0,drag:null,pinch:null,pos:new THREE.Vector3()};
function photoToggle(){if(!started||pl.ended)return;const ui=document.getElementById('photoUI');
  if(!PHOTO.on){if(MAP.on)mapToggle();PHOTO.on=true;PHOTO.wasPaused=paused;paused=true;RADIO.pause(true);if(AC)AC.suspend();setHorn(false);PHOTO.pos.copy(camera.position);
    const d=new THREE.Vector3();camera.getWorldDirection(d);PHOTO.yaw=Math.atan2(-d.x,-d.z);PHOTO.pitch=Math.asin(Math.max(-1,Math.min(1,d.y)));PHOTO.fov=camera.fov;PHOTO.fov0=camera.fov;
    PHOTO.view=view;if(view==='cockpit'){view='chase';applyView();}ui.style.display='flex';document.body.classList.add('photo');}
  else{PHOTO.on=false;ui.style.display='none';document.body.classList.remove('photo');camera.fov=PHOTO.fov0;camera.updateProjectionMatrix();view=PHOTO.view||view;applyView();
    if(!PHOTO.wasPaused){paused=false;RADIO.pause(false);if(AC)AC.resume();}}}
function photoUpdate(dt){const sp=(keys.ShiftLeft||keys.ShiftRight?40:12)*dt,f=new THREE.Vector3(-Math.sin(PHOTO.yaw)*Math.cos(PHOTO.pitch),Math.sin(PHOTO.pitch),-Math.cos(PHOTO.yaw)*Math.cos(PHOTO.pitch)),r=new THREE.Vector3(Math.cos(PHOTO.yaw),0,-Math.sin(PHOTO.yaw));
  const k=c=>keys[c]?1:0;let fw=k('ArrowUp')+k('KeyW')-k('ArrowDown')-k('KeyS'),st=k('ArrowRight')+k('KeyD')-k('ArrowLeft')-k('KeyA'),up=k('KeyR')+k('PageUp')-k('KeyF')-k('PageDown');
  if(PHOTO.move){fw+=PHOTO.move/sp*dt*3;PHOTO.move*=0.7;if(Math.abs(PHOTO.move)<0.01)PHOTO.move=0;}
  PHOTO.pos.addScaledVector(f,fw*sp).addScaledVector(r,st*sp);PHOTO.pos.y+=up*sp;
  // resta vicino all'auto e sopra il terreno
  const dx=PHOTO.pos.x-pl.x,dz=PHOTO.pos.z-pl.z,dd=Math.hypot(dx,dz);if(dd>250){PHOTO.pos.x=pl.x+dx/dd*250;PHOTO.pos.z=pl.z+dz/dd*250;}
  const g=(NW?NW.Hg(PHOTO.pos.x,PHOTO.pos.z):0)+0.4;if(PHOTO.pos.y<g)PHOTO.pos.y=g;if(PHOTO.pos.y>pl.terrH+150)PHOTO.pos.y=pl.terrH+150;
  camera.position.copy(PHOTO.pos);camera.lookAt(PHOTO.pos.clone().add(f));if(Math.abs(camera.fov-PHOTO.fov)>0.01){camera.fov=PHOTO.fov;camera.updateProjectionMatrix();}}
function stamp(){const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);}
function photoShot(){renderer.render(scene,camera);renderer.domElement.toBlob(b=>{if(!b)return;download(b,'guido_foto_'+stamp()+'.png');const fl=document.getElementById('photoFlash');fl.style.opacity=0.85;setTimeout(()=>fl.style.opacity=0,120);},'image/png');}
// ---- clip con audio: MP4 se il browser lo sa fare, altrimenti WebM ----
const REC={on:false,mr:null,chunks:[],t0:0,mime:'',ext:'webm',MAX:60};
function recMime(){const L=[['video/mp4;codecs=avc1.42E01E,mp4a.40.2','mp4'],['video/mp4;codecs=avc1,mp4a','mp4'],['video/mp4','mp4'],['video/webm;codecs=vp9,opus','webm'],['video/webm;codecs=vp8,opus','webm'],['video/webm','webm']];
  if(!window.MediaRecorder)return null;for(const [m,e] of L)if(MediaRecorder.isTypeSupported(m))return[m,e];return['',''+'webm'];}
function recToggle(){const ind=document.getElementById('recInd');
  if(REC.on){REC.on=false;try{REC.mr.stop();}catch(e){}ind.style.display='none';return;}
  const mm=recMime();if(!mm||!renderer.domElement.captureStream){pl.navMsg='Questo browser non sa registrare video';pl.navMsgT=3;return;}
  initAudio();const vs=renderer.domElement.captureStream(30),tr=[...vs.getVideoTracks()];
  if(AC){const dst=AC.createMediaStreamDestination();ACOUT().connect(dst);REC.dst=dst;
    // autoradio vera (flusso web): si prova ad aggiungerla, se il browser lo permette
    try{const el=RADIO.el&&RADIO.el();if(el){const cs=el.captureStream?el.captureStream():el.mozCaptureStream?el.mozCaptureStream():null;if(cs&&cs.getAudioTracks().length){const s=AC.createMediaStreamSource(cs);s.connect(dst);REC.rs=s;}}}catch(e){}
    tr.push(...dst.stream.getAudioTracks());}
  let mr;try{mr=new MediaRecorder(new MediaStream(tr),mm[0]?{mimeType:mm[0],videoBitsPerSecond:MOBILE?4e6:8e6}:{});}catch(e){try{mr=new MediaRecorder(new MediaStream(tr));mm[1]='webm';}catch(e2){pl.navMsg='Registrazione non disponibile';pl.navMsgT=3;return;}}
  REC.chunks=[];REC.mr=mr;REC.ext=(mr.mimeType||mm[0]).includes('mp4')?'mp4':'webm';
  mr.ondataavailable=e=>{if(e.data&&e.data.size)REC.chunks.push(e.data);};
  mr.onstop=()=>{const b=new Blob(REC.chunks,{type:mr.mimeType||('video/'+REC.ext)});if(REC.dst){try{ACOUT().disconnect(REC.dst);}catch(e){}REC.dst=null;}if(REC.rs){try{REC.rs.disconnect();}catch(e){}REC.rs=null;}vs.getTracks().forEach(t=>t.stop());
    if(b.size>1000){download(b,'guido_clip_'+stamp()+'.'+REC.ext);pl.navMsg='Clip salvata ('+REC.ext.toUpperCase()+', '+(b.size/1048576).toFixed(1)+' MB)';pl.navMsgT=3;}};
  mr.start(1000);REC.on=true;REC.t0=performance.now();ind.style.display='block';}
function recTick(){if(!REC.on)return;const s=(performance.now()-REC.t0)/1000;document.getElementById('recInd').textContent='● REC '+Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0')+' · '+REC.ext.toUpperCase();if(s>=REC.MAX)recToggle();}
// ---- mappa grande di Ornavia ----
const MAP={on:false,base:null,S:2048,cx:0,cz:0,sc:1,drag:null,pinch:null};
function mapBase(){if(MAP.base||!NW)return MAP.base;const S=MAP.S,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
  const W0=NW.J.meta.OX||8000,SZ=22000;MAP.x0=W0;MAP.z0=W0;MAP.sz=SZ;const k=S/SZ,N=256,cell=S/N,img=g.createImageData(N,N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=W0+(i+0.5)/N*SZ,z=W0+(j+0.5)/N*SZ,h=NW.Hg(x,z),o=(j*N+i)*4;let c3;
    const lk=NW.lakeAt&&NW.lakeAt(x,z);if(h<0.8||(lk&&h<NW.lakes[lk-1].lv))c3=[70,118,170];else if(h>1250)c3=[236,238,240];else{const t=Math.min(1,h/1100);c3=[150-50*t+40*Math.max(0,t-0.6),178-60*t,118-30*t];}
    img.data[o]=c3[0];img.data[o+1]=c3[1];img.data[o+2]=c3[2];img.data[o+3]=255;}
  const tmp=document.createElement('canvas');tmp.width=tmp.height=N;tmp.getContext('2d').putImageData(img,0,0);g.imageSmoothingEnabled=true;g.drawImage(tmp,0,0,S,S);
  NW.cities.forEach(C=>{g.fillStyle=C.v?'rgba(200,190,175,.55)':'rgba(205,195,180,.75)';g.beginPath();g.arc((C.wx-W0)*k,(C.wz-W0)*k,(C.R||300)*k*0.8,0,7);g.fill();});
  const rc=document.createElement('canvas');rc.width=rc.height=S;MAP.roadsC=rc;{const g=rc.getContext('2d');
  g.lineCap='round';g.lineJoin='round';const col=c=>c===0?'#f2b632':c===1?'#e8d27a':c<=6?'#ffffff':'#e8e4dc',wid=c=>c===0?5:c===1?2.5:c<=6?2.6:c<=7?1.4:0.9;
  [8,7,6,5,4,3,2,1,0].forEach(cl=>{NW.roads.forEach(R=>{if(R.c!==cl&&!(cl===8&&R.c>8))return;g.strokeStyle=R.c===0?'#9c6c10':'rgba(60,60,60,.55)';g.lineWidth=wid(R.c)+1.6;g.beginPath();for(let i=0;i<R.N;i++){const x=(R.X[i]-W0)*k,z=(R.Z[i]-W0)*k;i?g.lineTo(x,z):g.moveTo(x,z);}g.stroke();
    g.strokeStyle=col(R.c);g.lineWidth=wid(R.c);g.stroke();});});}
  MAP.base=c;return c;}
function mapToggle(){const ov=document.getElementById('mapOv');if(!MAP.on){if(!started||!NW)return;MAP.on=true;MAP.wasPaused=paused;paused=true;if(AC)AC.suspend();setHorn(false);mapBase();MAP.cx=pl.x;MAP.cz=pl.z;MAP.sc=Math.min(innerWidth,innerHeight)/6000;ov.style.display='block';mapDraw();}
  else{MAP.on=false;ov.style.display='none';if(!MAP.wasPaused){paused=false;if(AC)AC.resume();}}}
function mapDraw(){if(!MAP.on)return;const cv=document.getElementById('mapCv'),W=cv.width=innerWidth*devicePixelRatio,H=cv.height=innerHeight*devicePixelRatio,g=cv.getContext('2d'),dp=devicePixelRatio,sc=MAP.sc*dp,k=MAP.S/MAP.sz;
  const tp=(x,z)=>[W/2+(x-MAP.cx)*sc,H/2+(z-MAP.cz)*sc];g.fillStyle='#4a6f99';g.fillRect(0,0,W,H);
  const [ax,az]=tp(MAP.x0,MAP.z0);g.imageSmoothingEnabled=true;g.drawImage(MAP.base,ax,az,MAP.sz*sc,MAP.sz*sc);if(MAP.sc<=0.12)g.drawImage(MAP.roadsC,ax,az,MAP.sz*sc,MAP.sz*sc);
  if(MAP.sc>0.12){if(!MAP.bb)MAP.bb=NW.roads.map(R=>{let a=1e9,b=-1e9,c=1e9,d=-1e9;for(let i=0;i<R.N;i++){a=Math.min(a,R.X[i]);b=Math.max(b,R.X[i]);c=Math.min(c,R.Z[i]);d=Math.max(d,R.Z[i]);}return[a,b,c,d];});
    const hx=W/2/sc+60,hz=H/2/sc+60,vis=[];NW.roads.forEach((R,ri)=>{const B=MAP.bb[ri];if(B[1]<MAP.cx-hx||B[0]>MAP.cx+hx||B[3]<MAP.cz-hz||B[2]>MAP.cz+hz)return;vis.push(R);});
    vis.sort((a,b)=>b.c-a.c);g.lineCap='round';g.lineJoin='round';
    for(let pass=0;pass<2;pass++)vis.forEach(R=>{const w=Math.max(1.2*dp,R.w*sc*(R.c===0?1.1:1));g.lineWidth=pass?w:w+2*dp;g.strokeStyle=pass?(R.c===0?'#f2b632':R.c===1?'#ecd78a':R.c>8?'#e4dfd4':'#ffffff'):'rgba(70,70,70,.7)';
      g.beginPath();for(let i=0;i<R.N;i++){const[x,z]=tp(R.X[i],R.Z[i]);i?g.lineTo(x,z):g.moveTo(x,z);}g.stroke();});}
  if(route&&route.P){g.strokeStyle='#2f8cff';g.lineWidth=5*dp;g.lineCap='round';g.beginPath();route.P.pts.forEach((p,i)=>{const[a,b]=tp(p[0],p[1]);i?g.lineTo(a,b):g.moveTo(a,b);});g.stroke();const[dx,dz]=tp(route.dest.x,route.dest.z);g.fillStyle='#e23c3c';g.beginPath();g.arc(dx,dz,8*dp,0,7);g.fill();}
  if(CH.ring&&MODE==='ring'){CH.ring.forEach((p,i)=>{const[a,b]=tp(p[0],p[1]);g.fillStyle=i<CH.next?'#4cd964':i===CH.next?'#ffcc00':'rgba(255,255,255,.6)';g.beginPath();g.arc(a,b,(i===CH.next?7:4)*dp,0,7);g.fill();});}
  FUEL.st.forEach(f=>{const[a,b]=tp(f.x,f.z);g.font=(15*dp)+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';g.beginPath();g.arc(a,b,10*dp,0,7);g.fill();g.fillText('⛽',a,b+1);});
  if(HOME.ok){const[a,b]=tp(HOME.x,HOME.z);g.font=(20*dp)+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';g.beginPath();g.arc(a,b,13*dp,0,7);g.fill();g.fillText('🏠',a,b+1);if(MAP.sc>0.06){g.font='700 '+(12*dp)+'px sans-serif';g.lineWidth=4*dp;g.strokeStyle='rgba(0,0,0,.6)';g.strokeText('Casa di Guido',a,b+22*dp);g.fillStyle='#fff';g.fillText('Casa di Guido',a,b+22*dp);}}
  g.textAlign='center';g.textBaseline='middle';NW.cities.forEach(C=>{const[a,b]=tp(C.wx,C.wz);if(C.v&&MAP.sc<0.09)return;g.font=(C.v?'600 '+12*dp:'800 '+16*dp)+'px sans-serif';g.lineWidth=4*dp;g.strokeStyle='rgba(0,0,0,.6)';g.strokeText(C.n,a,b);g.fillStyle=C.v?'#f3efe6':'#fff';g.fillText(C.n,a,b);});
  {const[a,b]=tp(pl.x,pl.z),h=pl.h;g.save();g.translate(a,b);g.rotate(-h+Math.PI/2);g.fillStyle='#ff3b30';g.strokeStyle='#fff';g.lineWidth=2*dp;g.beginPath();g.moveTo(0,-13*dp);g.lineTo(8*dp,9*dp);g.lineTo(0,4*dp);g.lineTo(-8*dp,9*dp);g.closePath();g.fill();g.stroke();g.restore();}
  g.fillStyle='rgba(0,0,0,.55)';g.fillRect(12*dp,H-44*dp,250*dp,32*dp);g.fillStyle='#fff';g.font=(13*dp)+'px sans-serif';g.textAlign='left';const km=Math.max(0.5,Math.round(160/MAP.sc/1000*2)/2);
  g.fillRect(22*dp,H-24*dp,km*1000*sc,3*dp);g.fillText(km+' km  ·  trascina per spostare, rotella o pizzico per lo zoom',22*dp,H-34*dp);}
{const cv=()=>document.getElementById('mapCv');setTimeout(()=>{const c=cv();if(!c)return;
  c.addEventListener('mousedown',e=>{MAP.drag={x:e.clientX,y:e.clientY};});addEventListener('mousemove',e=>{if(!MAP.drag)return;MAP.cx-=(e.clientX-MAP.drag.x)/MAP.sc;MAP.cz-=(e.clientY-MAP.drag.y)/MAP.sc;MAP.drag={x:e.clientX,y:e.clientY};mapDraw();});addEventListener('mouseup',()=>MAP.drag=null);
  c.addEventListener('wheel',e=>{e.preventDefault();const f=Math.exp(-e.deltaY*0.0015),mx=(e.clientX-innerWidth/2)/MAP.sc+MAP.cx,mz=(e.clientY-innerHeight/2)/MAP.sc+MAP.cz;MAP.sc=Math.max(0.03,Math.min(2.5,MAP.sc*f));MAP.cx=mx-(e.clientX-innerWidth/2)/MAP.sc;MAP.cz=mz-(e.clientY-innerHeight/2)/MAP.sc;mapDraw();},{passive:false});
  c.addEventListener('touchstart',e=>{const t=e.touches[0];MAP.drag={x:t.clientX,y:t.clientY};if(e.touches.length===2)MAP.pinch=t2(e).d;e.preventDefault();},{passive:false});
  c.addEventListener('touchmove',e=>{if(e.touches.length===2&&MAP.pinch){const d=t2(e).d;MAP.sc=Math.max(0.03,Math.min(2.5,MAP.sc*d/MAP.pinch));MAP.pinch=d;}else if(MAP.drag){const t=e.touches[0];MAP.cx-=(t.clientX-MAP.drag.x)/MAP.sc;MAP.cz-=(t.clientY-MAP.drag.y)/MAP.sc;MAP.drag={x:t.clientX,y:t.clientY};}mapDraw();e.preventDefault();},{passive:false});
  c.addEventListener('touchend',e=>{if(e.touches.length<2)MAP.pinch=null;if(!e.touches.length)MAP.drag=null;});
  document.getElementById('mapClose').onclick=()=>mapToggle();document.getElementById('mapMe').onclick=()=>{MAP.cx=pl.x;MAP.cz=pl.z;mapDraw();};
  document.getElementById('mapIn').onclick=()=>{MAP.sc=Math.min(2.5,MAP.sc*1.5);mapDraw();};document.getElementById('mapOut').onclick=()=>{MAP.sc=Math.max(0.03,MAP.sc/1.5);mapDraw();};
  addEventListener('resize',()=>mapDraw());},0);}
// ---- carburante e distributori ----
const FUEL={st:[],msgT:0,fill:false,low:false,paid:0,price:1.79};
function fuelInit(){FUEL.st=NW?(NW.J.lms||[]).filter(e=>e[0]==='fuel').map(e=>({x:e[1],z:e[2],rot:e[3],n:e[4],hw:e[5]==='hw'})):[];}
function tankOf(P){return P.tank||(P.m>1700?70:P.m<1000?35:P.m<1250?45:55);}
function fuelTick(dt){if(!pl.P)return;const mode=CFG.fuel??1;if(mode===0){pl.fuel=tankOf(pl.P);return;}
  const tank=tankOf(pl.P);if(pl.fuel==null||pl.fuelFor!==selKey){pl.fuel=pl.fuel==null?tank*0.6:Math.min(tank,pl.fuel);pl.fuelFor=selKey;}
  const P=pl.P,frac=Math.max(0.04,pl.thrIn||0)*Math.min(1,(pl.rpm||P.idle)/P.red),kw=P.Pkw*frac,ls=(0.00022+kw*(P.diesel?0.23:0.27)/3600)*(mode===2?6:1);
  if(pl.sel!=='N'||pl.thrIn>0.05)pl.fuel=Math.max(0,pl.fuel-ls*dt);
  // al distributore: fermi vicino alle pompe si fa il pieno
  let at=null;for(const f of FUEL.st){if(Math.abs(f.x-pl.x)+Math.abs(f.z-pl.z)<16){const c=Math.cos(f.rot),s=Math.sin(f.rot),dx=pl.x-f.x,dz=pl.z-f.z,al=dx*c+dz*s,lt=-dx*s+dz*c;if(Math.abs(al)<11&&Math.abs(lt)<4.5){at=f;break;}}}
  if(at&&Math.abs(pl.vx)<0.4&&pl.fuel<tank-0.05){if(!FUEL.fill){FUEL.fill=true;FUEL.paid=0;}const q=Math.min(tank-pl.fuel,dt*5);pl.fuel+=q;FUEL.paid+=q;pl.navMsg='⛽ Rifornimento… '+FUEL.paid.toFixed(1)+' L · '+(FUEL.paid*FUEL.price).toFixed(2).replace('.',',')+' €';pl.navMsgT=0.6;}
  else if(FUEL.fill){FUEL.fill=false;if(FUEL.paid>0.5){CAR.add(-FUEL.paid*FUEL.price,'Carburante');pl.navMsg='Pieno fatto: '+FUEL.paid.toFixed(1)+' L, '+(FUEL.paid*FUEL.price).toFixed(2).replace('.',',')+' €. Buon viaggio!';pl.navMsgT=3.5;ding(1);}}
  else if(at&&pl.fuel<tank-0.5&&Math.abs(pl.vx)>=0.4){pl.navMsg='⛽ Fermati vicino alle pompe per fare il pieno';pl.navMsgT=0.5;}
  const r=pl.fuel/tank;if(r<0.1&&!FUEL.low){FUEL.low=true;ding(2);let nd=1e9;FUEL.st.forEach(f=>nd=Math.min(nd,Math.hypot(f.x-pl.x,f.z-pl.z)));pl.navMsg='Riserva! Distributore più vicino a '+(nd/1000).toFixed(1)+' km (mappa: tasto Tab)';pl.navMsgT=5;}
  if(r>0.15)FUEL.low=false;
  if(pl.fuel<=0&&!pl.dry){pl.dry=true;pl.navMsg='Serbatoio vuoto! Tasto Invio: arriva il soccorso con una tanica';pl.navMsgT=6;}
  if(pl.fuel>0)pl.dry=false;}
function fuelRescue(){if(pl.fuel<=0.01){pl.fuel=Math.min(tankOf(pl.P),8);pl.navMsg='Il soccorso ti ha portato 8 litri. Vai al distributore!';pl.navMsgT=4;ding(1);return true;}return false;}
function fuelTxt(){if((CFG.fuel??1)===0||pl.fuel==null)return'';return' · ⛽ '+Math.round(pl.fuel/tankOf(pl.P)*100)+'%';}
// ---- sfide: consegne a tempo e giro dell'anello a cronometro ----
const CARGO=['pizze ancora calde','medicinali urgenti','un mazzo di fiori','documenti da firmare','una torta nuziale','pezzi di ricambio','il pane fresco','un pacco fragile'];
const CH={dl:null,score:0,n:0,left:0,ring:null,next:0,t0:0,lap:0};
function lbKey(k){return'sim_lb_'+k;}
function lbLoad(k){try{return JSON.parse(localStorage.getItem(lbKey(k))||'[]');}catch(e){return[];}}
function lbAdd(k,e,better){const L=lbLoad(k);L.push(e);L.sort(better);const top=L.slice(0,10);try{localStorage.setItem(lbKey(k),JSON.stringify(top));}catch(x){}return top.indexOf(e);}
function lbHtml(k,fmt){const L=lbLoad(k);if(!L.length)return'<i>ancora nessun risultato</i>';return'<ol>'+L.map(e=>`<li>${fmt(e)}</li>`).join('')+'</ol>';}
function chStart(){CH.dl=null;CH.score=0;CH.n=0;CH.ring=null;CH.next=0;CH.hits0=pl.hits;
  if(MODE==='deliv'){CH.left=0;chNewDelivery(true);}
  if(MODE==='ring'&&NW&&NW.J.meta.ring){CH.ring=NW.J.meta.ring;const r=CH.ring,a=r[0],b=r[1],S0=NW.J.meta.ringStart;if(S0){pl.x=S0[0];pl.z=S0[1];pl.h=S0[2];}else{pl.x=a[0];pl.z=a[1];pl.h=Math.atan2(-(b[1]-a[1]),b[0]-a[0]);}NW.yh=NaN;pl.terrH=NW.H(pl.x,pl.z);NW.yh=pl.terrH;NWT.update(0,true);
    CH.next=0;CH.t0=null;CH.lap=0;say('Giro dell\'anello a cronometro: il tempo parte al primo traguardo. '+r.length+' intermedi, circa '+Math.round(r.length*1.5)+' chilometri.');destMark.position.set(a[0],TH(a[0],a[1])+30,a[1]);destMark.visible=true;}}
function chNewDelivery(first){const cands=NW.places.map((p,i)=>({p,i})).filter(o=>o.p.t!==1&&o.p.t!==5&&Math.hypot(o.p.x-pl.x,o.p.z-pl.z)>(first?1800:1500)&&Math.hypot(o.p.x-pl.x,o.p.z-pl.z)<9000);
  if(!cands.length)return;const o=cands[(Math.random()*cands.length)|0],r=NWT.buildRoute('nwp_'+o.i);if(!r){return;}
  route=r;r.started=true;destMark.position.set(r.dest.x,TH(r.dest.x,r.dest.z)+30,r.dest.z);destMark.visible=true;const lim=Math.round(r.P.len/15.5+25);CH.left+=lim;CH.dl={n:o.p.n,cargo:CARGO[(Math.random()*CARGO.length)|0],lim,t0:simT,hits:pl.hits};
  say((first?'':'Consegna fatta! ')+'Porta '+CH.dl.cargo+' a '+o.p.n+'. Hai '+Math.floor(CH.left/60)+' minuti e '+Math.round(CH.left%60)+' secondi.');}
function chArrive(){if(JOB.arrive())return true;if(MODE!=='deliv'||!CH.dl)return false;const D=CH.dl,hits=pl.hits-D.hits,pts=Math.max(20,100+Math.max(0,Math.round((D.lim-(simT-D.t0))*1.5))-hits*15);CH.score+=pts;CH.n++;ding(2);route=null;
  pl.navMsg='+'+pts+' punti'+(hits?' ('+hits+' urti)':'');pl.navMsgT=3;CH.left+=10;chNewDelivery(false);return true;}
function chTick(dt){const box=document.getElementById('chBox');if(!started||pl.ended||(MODE!=='deliv'&&MODE!=='ring')){box.style.display='none';return;}box.style.display='block';const fm=x=>Math.floor(x/60)+':'+String(Math.floor(x%60)).padStart(2,'0');
  if(MODE==='deliv'){if(!paused)CH.left-=dt;if(CH.left<=0){CH.left=0;endRun('tempo');return;}box.innerHTML=`📦 <b>${CH.dl?CH.dl.cargo+' → '+CH.dl.n:'…'}</b><br>⏱ <b style="color:${CH.left<20?'#ff6b5b':'#fff'}">${fm(CH.left)}</b> · consegne ${CH.n} · punti ${CH.score}`;}
  if(MODE==='ring'&&CH.ring){const r=CH.ring,p=r[CH.next%r.length];if(Math.hypot(pl.x-p[0],pl.z-p[1])<28){if(CH.t0==null){CH.t0=simT;ding(1);say('Via! Il cronometro è partito');}else{ding(1);const sp=simT-CH.t0;pl.navMsg='Intermedio '+CH.next+'/'+r.length+' · '+fm(sp)+'.'+String(Math.floor(sp*10%10));pl.navMsgT=2.5;}
      CH.next++;if(CH.next>r.length){CH.lap=simT-CH.t0;endRun('giro');return;}const q=r[CH.next%r.length];destMark.position.set(q[0],TH(q[0],q[1])+30,q[1]);}
    const t=CH.t0==null?0:simT-CH.t0;box.innerHTML=`🏁 <b>Giro dell'anello</b> · intermedio ${Math.min(CH.next,r.length)}/${r.length}<br>⏱ <b>${fm(t)}.${Math.floor(t*10%10)}</b> · km ${(Math.hypot(pl.x-p[0],pl.z-p[1])/1000).toFixed(1)} al prossimo`;}}
// ================= RADIO GUIDO: lo speaker commenta le imprese di Guido =================
const DJ={t:-99,q:null,lines:{
  velocita:['Qualcuno ha fretta oggi! Occhio all\'autovelox, Guido.','Piede pesante, eh? La multa arriva a casa.','Più piano, che le strade di Ornavia non scappano!'],
  rosso:['Rosso è rosso, Guido. Anche per te.','Semaforo rosso bruciato: i vigili prendono nota.'],
  contromano:['Contromano! Ma da dove vengono quelle macchine?','Guido, la corsia giusta è l\'altra!'],
  pedone:['Attenzione ai pedoni! Ci sentiamo dopo la pubblicità.','Ahi! Quel signore non l\'ha presa bene.'],
  salto:['Che salto! Le sospensioni ringraziano.','In volo sopra le colline di Ornavia!','Guido decolla! Ricordiamo che non è un aereo.'],
  lavoro:['Lavoro fatto, soldi in tasca!','Un altro cliente soddisfatto. Bravo Guido!','Ecco come si porta avanti la ditta!'],
  presa:['La polizia ha fermato Guido. Sorridi, sei su Radio Guido.','Patente e libretto, prego.'],
  seminata:['Guido ha seminato la pattuglia! Noi non abbiamo visto niente.'],
  pulito:['Tanti chilometri senza un\'infrazione: patente d\'oro!'],
  auto:['Macchina nuova, vita nuova! Complimenti Guido.'],
  galleria:['Entriamo in galleria: il segnale potrebbe…','Galleria: accendete i fari!']},
  pick(k){const L=this.lines[k];return L?L[(Math.random()*L.length)|0]:k;},
  // parla solo se è accesa Radio Guido; i fatti importanti (eventi) anche col testo a schermo
  say(k,force,txt){const now=performance.now()/1000;if(!force&&now-this.t<18)return;if(!(window.RADIO_LBL||'').includes('Radio Guido'))return;this.t=now;const t=txt||this.pick(k);
    const e=document.getElementById('radioTag');if(e){e.textContent='🎙 Radio Guido: '+t;e.style.display='block';clearTimeout(this.q);this.q=setTimeout(()=>e.style.display='none',5000);}
    VOCE.speak(t,{dj:true,duck:true,pitch:1.18,rate:1.08,vol:0.9});}};

// ================= CARRIERA: soldi, lavori, spese, garage =================
const CAR={on:false,s:null,saveT:0,toastT:0,
  def(){return{money:3000,own:{utilitaria:1},earned:0,spent:0,jobs:0,fines:0,best:{}};},
  load(){try{this.s=Object.assign(this.def(),JSON.parse(localStorage.getItem('sim_career')||'null')||{});}catch(e){this.s=this.def();}},
  save(){try{localStorage.setItem('sim_career',JSON.stringify(this.s));}catch(e){}},
  owns(k){return !this.on||!!this.s.own[k];},
  fmt(v){return Math.round(v).toLocaleString('it-IT')+' €';},
  add(v,why){if(!this.on||!v)return;this.s.money+=v;if(v>0)this.s.earned+=v;else this.s.spent-=v;this.save();
    const e=document.getElementById('cashTag');if(e){e.textContent=(v>0?'+':'−')+this.fmt(Math.abs(v))+(why?' · '+why:'');e.className=v>0?'pos':'neg';e.style.display='block';clearTimeout(this.toastT);this.toastT=setTimeout(()=>e.style.display='none',3200);}},
  price(k){return(PHYS[k]&&PHYS[k].price)||0;},
  buy(k){if(!this.on||this.s.own[k])return false;const p=this.price(k);if(this.s.money<p){pl.navMsg='Ti mancano '+this.fmt(p-this.s.money)+' per comprarla';pl.navMsgT=3;return false;}
    this.add(-p,'Acquisto '+PHYS[k].label);this.s.own[k]=1;this.save();ding(3);DJ.say('auto',true);return true;},
  repairCost(){const D=pl.dmg||{};const t=(D.front||0)+(D.rear||0)+(D.left||0)+(D.right||0);return t<0.04?0:Math.round(t*pl.P.m*0.35+40);},
  repair(){const c=this.repairCost();if(!c)return;this.add(-c,'Officina: riparazione');Object.keys(pl.dmg).forEach(k=>pl.dmg[k]=0);},
  start(){this.load();this.on=true;JOB.cur=null;JOB.offers=[];if(!this.s.own[selKey]){selKey='utilitaria';}
    say('Carriera: hai '+this.fmt(this.s.money)+'. Tasto K per vedere i lavori disponibili.');},
  tick(dt){const e=document.getElementById('cashHud');if(!this.on||!started){if(e)e.style.display='none';return;}if(e){e.style.display='block';e.textContent='💶 '+this.fmt(this.s.money)+(JOB.cur?' · '+JOB.cur.short():'');}
    this.saveT+=dt;if(this.saveT>15){this.saveT=0;this.save();}
    if(pl.cleanKm!=null&&(pl.km||0)-pl.cleanKm>10&&!pl.djClean){pl.djClean=true;DJ.say('pulito');}}};
CAR.load();

// ---- lavori: consegne con qualsiasi mezzo, merci col camion, taxi col taxi, cronoscalate in montagna ----
const JOB={cur:null,offers:[],pax:null,
  places(min,max,from){const f=from||pl;return NW.places.map((p,i)=>({p,i})).filter(o=>!o.p.home&&o.p.t!==5&&Math.hypot(o.p.x-f.x,o.p.z-f.z)>min&&Math.hypot(o.p.x-f.x,o.p.z-f.z)<max);},
  rnd(a){return a[(Math.random()*a.length)|0];},
  make(){const O=[],near=this.places(400,2500),far=this.places(2500,9000);
    if(near.length&&far.length){const a=this.rnd(near),b=this.rnd(this.places(1800,8000,a.p));if(b){const d=Math.hypot(a.p.x-b.p.x,a.p.z-b.p.z);O.push({k:'cons',t:'Consegna: '+this.rnd(CARGO),from:a,to:b,pay:Math.round(50+d*0.035),need:null,d});}}
    {const C=NW.cities.filter(c=>Math.hypot(c.wx-pl.x,c.wz-pl.z)<7000);const a=this.rnd(near.length?near:far),b=far.length?this.rnd(far):null;if(a&&b){const d=Math.hypot(a.p.x-b.p.x,a.p.z-b.p.z)+1500;O.push({k:'merci',t:'Trasporto merci: '+this.rnd(['bancali di piastrelle','sacchi di cemento','tondini di ferro','casse di vino','legname','fieno']),from:a,to:b,pay:Math.round(180+d*0.06),need:'zil',d});}}
    O.push({k:'taxi',t:'Turno di taxi: clienti che fanno segno sul marciapiede',pay:null,need:'taxi'});
    {const M=NW.roads.filter(R=>R.c===6&&R.n&&!R.b&&!R.t&&R.cum[R.N-1]>900);const byN=new Map();M.forEach(R=>{const e=byN.get(R.n);if(!e||R.cum[R.N-1]>e.cum[e.N-1])byN.set(R.n,R);});
     const L=[...byN.values()].map(R=>{const h0=R.Hh[0],h1=R.Hh[R.N-1];return{R,up:Math.abs(h1-h0),rev:h1<h0};}).filter(o=>o.up>40).sort((a,b)=>b.up-a.up);
     if(L.length){const o=L[(Math.random()*Math.min(3,L.length))|0],len=o.R.cum[o.R.N-1];O.push({k:'crono',t:'Cronoscalata: '+o.R.n+' ('+(len/1000).toFixed(1)+' km, +'+Math.round(o.up)+' m)',R:o.R,rev:o.rev,pay:Math.round(120+len*0.05),target:len/(17.5),need:null});}}
    this.offers=O;return O;},
  open(){if(!CAR.on){pl.navMsg='I lavori ci sono in modalità Carriera (menu)';pl.navMsgT=3;return;}if(pl.ended)return;const ov=document.getElementById('jobOv');if(!this.offers.length||!this.cur)this.make();
    let h=`<h2>Lavori disponibili</h2><p class="note">Saldo: <b>${CAR.fmt(CAR.s.money)}</b> · lavori fatti: ${CAR.s.jobs}</p>`;
    if(this.cur)h+=`<p>In corso: <b>${this.cur.t}</b> <button class="sm" id="jobDrop">Abbandona</button></p>`;
    this.offers.forEach((o,i)=>{const lock=o.need&&selKey!==o.need,own=!o.need||CAR.s.own[o.need];h+=`<div class="job"><b>${o.t}</b><span>${o.k==='taxi'?'tariffa a km + mance per la guida dolce':(o.k==='crono'?'premio fino a '+CAR.fmt(o.pay*2):'paga '+CAR.fmt(o.pay))+(o.from?' · ritiro a '+o.from.p.n+', consegna a '+o.to.p.n:'')}</span>`+
      (lock?`<i>${own?'Serve '+PHYS[o.need].label+': prendilo dal garage':'Serve '+PHYS[o.need].label+' ('+CAR.fmt(CAR.price(o.need))+' nel garage di casa)'}</i>`:`<button class="sm" data-j="${i}">Accetta</button>`)+'</div>';});
    h+=`<button class="sm" id="jobNew">Altre offerte</button> <button id="jobClose">Chiudi</button>`;
    ov.firstElementChild.innerHTML=h;ov.style.display='flex';paused=true;
    ov.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>{this.accept(this.offers[+b.dataset.j]);this.close();});
    const dr=document.getElementById('jobDrop');if(dr)dr.onclick=()=>{this.drop();this.close();};
    document.getElementById('jobNew').onclick=()=>{this.make();this.open();};document.getElementById('jobClose').onclick=()=>this.close();},
  close(){document.getElementById('jobOv').style.display='none';paused=false;},
  go(x,z,id){if(id!=null){const r=NWT.buildRoute('nwp_'+id);if(r){route=r;r.started=true;}}else route=null;destMark.position.set(x,TH(x,z)+30,z);destMark.visible=true;},
  accept(o){this.drop(true);const J=Object.assign({},o,{st:0,t0:simT,hits:pl.hits,harsh:0});this.cur=J;
    J.short=()=>J.k==='taxi'?(this.pax?'🚕 a '+this.pax.to.p.n:'🚕 cerca clienti'):J.k==='crono'?(J.st===2?'⏱ '+fmtT(simT-J.tc):'⏱ vai alla partenza'):(J.st===0?'📦 ritiro a '+J.from.p.n:'📦 a '+J.to.p.n);
    if(J.k==='cons'||J.k==='merci'){this.go(J.from.p.x,J.from.p.z,J.from.i);say((J.k==='merci'?'Carico da ritirare a ':'Ritira il pacco a ')+J.from.p.n);}
    if(J.k==='taxi'){say('Turno di taxi iniziato: cerca chi fa segno sul marciapiede in città');destMark.visible=false;route=null;}
    if(J.k==='crono'){const R=J.R,i=J.rev?R.N-1:0;J.sx=R.X[i];J.sz=R.Z[i];J.cp=[];const n=Math.max(3,Math.floor(R.cum[R.N-1]/500));for(let q=1;q<=n;q++){const s=R.cum[R.N-1]*q/n,s2=J.rev?R.cum[R.N-1]-s:s;let k=0;while(k<R.N-2&&R.cum[k+1]<s2)k++;J.cp.push([R.X[k],R.Z[k]]);}
      this.go(J.sx,J.sz,null);say('Vai alla partenza della cronoscalata (il segnale sulla mappa), poi fermati per il via');}},
  drop(silent){if(this.pax){this.paxRemove();}if(this.cur&&!silent){pl.navMsg='Lavoro abbandonato';pl.navMsgT=2.5;}this.cur=null;route=null;destMark.visible=false;},
  pay(base){const J=this.cur,hits=pl.hits-J.hits,D=pl.dmg||{},dm=(D.front||0)+(D.rear||0)+(D.left||0)+(D.right||0);let p=base*Math.max(0.3,1-hits*0.08-dm*0.6);return Math.round(p);},
  arrive(){const J=this.cur;if(!J||!CAR.on)return false;
    if(J.k==='cons'||J.k==='merci'){if(J.st===0){J.st=1;J.hits=pl.hits;ding(1);this.go(J.to.p.x,J.to.p.z,J.to.i);say((J.k==='merci'?'Caricato! Ora vai a ':'Pacco ritirato. Consegna a ')+J.to.p.n);return true;}
      const p=this.pay(J.pay);CAR.add(p,J.k==='merci'?'Merce consegnata':'Consegna');CAR.s.jobs++;CAR.save();ding(2);DJ.say('lavoro',true);this.cur=null;this.offers=[];route=null;destMark.visible=false;say('Lavoro completato: '+CAR.fmt(p));return true;}
    if(J.k==='taxi'&&this.pax&&this.pax.on){this.paxDrop();return true;}
    return false;},
  // ---- taxi ----
  paxSpawn(){if(!NW)return;const ch=Math.cos(pl.h),sh=-Math.sin(pl.h);for(let tr=0;tr<12;tr++){const d=90+Math.random()*220,a=(Math.random()-0.5)*1.6,x=pl.x+(ch*Math.cos(a)-sh*Math.sin(a))*d,z=pl.z+(sh*Math.cos(a)+ch*Math.sin(a))*d;
      if(!NW.cityAt(x,z))continue;const q=NW.roadAt(x,z,30);if(!q||!NW.swRoad(q.R)||q.R.b||q.R.t)continue;const R=q.R,ax=R.X[q.i],az=R.Z[q.i],ex=R.X[q.i+1]-ax,ez=R.Z[q.i+1]-az,L=Math.hypot(ex,ez)||1,nx=-ez/L,nz=ex/L,sd=Math.random()<0.5?1:-1;
      const px=ax+ex*q.t+nx*sd*(R.w/2+1.6),pz=az+ez*q.t+nz*sd*(R.w/2+1.6),dests=this.places(900,5500,{x:px,z:pz});if(!dests.length)return;
      const P=PPL?PPL.make(Math.random()<0.5?'woman':'man'):null,g=new THREE.Group();if(P)g.add(P.w);else g.add(makePed());g.position.set(px,NW.H(px,pz),pz);g.rotation.y=Math.atan2(-nx*sd,-nz*sd)-Math.PI/2;scene.add(g);
      this.pax={g,P,x:px,z:pz,to:this.rnd(dests),on:false,wait:0};this.go(px,pz,null);pl.navMsg='🙋 Un cliente fa segno più avanti!';pl.navMsgT=3;return;}},
  paxRemove(){if(this.pax&&this.pax.g){scene.remove(this.pax.g);}this.pax=null;},
  paxDrop(){const X=this.pax,J=this.cur,km=X.dist/1000,base=10+km*14,smooth=Math.max(0,1-J.harsh*0.12-(pl.hits-X.hits)*0.25),tip=Math.round(base*0.3*smooth*10)/10,p=Math.round(this.pay(base))+tip;
    CAR.add(p,'Corsa taxi'+(tip>0.5?' (mancia '+tip.toFixed(1).replace('.',',')+' €)':''));CAR.s.jobs++;CAR.save();ding(2);
    say(smooth>0.7?'Grazie, guida bellissima! Tenga il resto.':smooth>0.3?'Grazie, arrivederci.':'Mamma mia che corsa… ecco i soldi, niente mancia.');if(smooth>0.7)DJ.say('lavoro');
    const g=X.g;g.position.set(pl.x+Math.sin(pl.h)*2.2,TH(pl.x,pl.z),pl.z+Math.cos(pl.h)*2.2);g.visible=true;scene.add(g);setTimeout(()=>scene.remove(g),9000);this.pax=null;route=null;destMark.visible=false;J.next=simT+4;},
  tick(dt){const J=this.cur;if(!J||!CAR.on||!started||pl.ended)return;
    if(J.need&&selKey!==J.need){pl.navMsg='Questo lavoro si fa con '+PHYS[J.need].label;pl.navMsgT=1;}
    if(J.k==='taxi'&&selKey==='taxi'){const X=this.pax;
      if(!X){if(simT>(J.next||0))this.paxSpawn();return;}
      if(!X.on){X.wait+=dt;if(X.P)PPL.wave(X.P,simT);const d=Math.hypot(pl.x-X.x,pl.z-X.z);
        if(d<9&&Math.abs(pl.vx)<0.6){X.on=true;X.hits=pl.hits;J.harsh=0;X.dist=Math.hypot(X.to.p.x-X.x,X.to.p.z-X.z)*1.25;scene.remove(X.g);ding(1);this.go(X.to.p.x,X.to.p.z,X.to.i);say('Buongiorno! Mi porti a '+X.to.p.n+', per favore.');}
        else if(d>700||X.wait>150){this.paxRemove();J.next=simT+3;}return;}
      // corsa in atto: guida dolce = mancia
      const ha=Math.abs(pl.ax||0),la=Math.abs(pl.ay||0);if((ha>3.6||la>4.2)&&simT-(J.hT||0)>1.2){J.harsh++;J.hT=simT;if(J.harsh===3)say('Piano, per favore!');}return;}
    if(J.k==='crono'){if(J.st===0){if(Math.hypot(pl.x-J.sx,pl.z-J.sz)<30){if(Math.abs(pl.vx)<0.5){J.st=1;J.cd=3.5;say('Pronti… via al verde!');}else{pl.navMsg='Fermati alla partenza';pl.navMsgT=0.5;}}return;}
      if(J.st===1){J.cd-=dt;pl.navMsg='Partenza tra '+Math.ceil(J.cd);pl.navMsgT=0.3;if(J.cd<=0){J.st=2;J.tc=simT;J.ci=0;ding(1);const c=J.cp[0];this.go(c[0],c[1],null);}return;}
      if(J.st===2){const c=J.cp[J.ci];if(Math.hypot(pl.x-c[0],pl.z-c[1])<30){J.ci++;ding(1);if(J.ci>=J.cp.length){const t=simT-J.tc,k=Math.max(0,Math.min(2,1+(J.target-t)/J.target*2)),p=Math.round(this.pay(J.pay*k));
            const bk=J.R.n,old=CAR.s.best[bk];if(!old||t<old)CAR.s.best[bk]=t;CAR.add(p,'Cronoscalata '+fmtT(t)+(old&&t<old?' · record!':''));CAR.s.jobs++;CAR.save();DJ.say('lavoro',true,'Cronoscalata '+bk+' chiusa in '+fmtT(t)+'!');this.cur=null;destMark.visible=false;route=null;return;}
          const q=J.cp[J.ci];this.go(q[0],q[1],null);pl.navMsg='Intermedio '+J.ci+'/'+J.cp.length+' · '+fmtT(simT-J.tc);pl.navMsgT=2;}}}}};
window.__c={get CAR(){return CAR;},get JOB(){return JOB;},get POL(){return POL;},get EVT(){return EVT;},get DJ(){return DJ;}};

// ================= FUMO: gomme che sgommano o slittano, e gas di scarico (quantità diversa per ogni mezzo) =================
const SMOKE=(()=>{const N=QG.lo?220:650,pos=new Float32Array(N*3),col=new Float32Array(N*3),siz=new Float32Array(N),alp=new Float32Array(N),P=[];let head=0;
  for(let i=0;i<N;i++){P.push({t:9,life:1,vx:0,vy:0,vz:0,s0:1,s1:2,a0:0});alp[i]=0;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('size',new THREE.BufferAttribute(siz,1));g.setAttribute('alpha',new THREE.BufferAttribute(alp,1));
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{scale:{value:innerHeight*0.6},lum:{value:1}}]),
    vertexShader:'#include <common>\nattribute float size;attribute float alpha;attribute vec3 color;varying float vA;varying vec3 vC;uniform float scale;\n#include <fog_pars_vertex>\n#include <logdepthbuf_pars_vertex>\nvoid main(){vA=alpha;vC=color;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*scale/max(0.5,-mvPosition.z);gl_Position=projectionMatrix*mvPosition;\n#include <logdepthbuf_vertex>\n#include <fog_vertex>\n}',
    fragmentShader:'#include <common>\nvarying float vA;varying vec3 vC;uniform float lum;\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\nvoid main(){\n#include <logdepthbuf_fragment>\nvec2 d=gl_PointCoord-0.5;float r=length(d)*2.0;if(r>1.0)discard;float a=vA*(1.0-r*r)*(0.75+0.25*sin(d.x*9.0+d.y*7.0));gl_FragColor=vec4(vC*lum,a);\n#include <fog_fragment>\n}'});
  const pts=new THREE.Points(g,m);pts.frustumCulled=false;pts.renderOrder=5;scene.add(pts);
  const V=new THREE.Vector3();let acc={tyre:0,exh:0};
  function emit(x,y,z,vx,vy,vz,life,s0,s1,a0,c){const p=P[head],i=head;head=(head+1)%N;Object.assign(p,{t:0,life,vx,vy,vz,s0,s1,a0});pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=z;col[i*3]=c;col[i*3+1]=c;col[i*3+2]=c*1.03;}
  // quantità di fumo dello scarico per mezzo (la Panda poco, Volvo e Wagoneer molto, il camion moltissimo)
  const EXH={utilitaria:0.3,volvo:1,wagoneer:1,hellcat:0.6,zil:1.7,taxi:0.6,daily:1.1};
  function update(dt){if(!pl.P||!pl.mesh||!started){return;}const M=pl.mesh,T=pl.T,v=Math.abs(pl.vx),ch=Math.cos(pl.h),sh=-Math.sin(pl.h),rx=Math.sin(pl.h),rz=Math.cos(pl.h);
    const air=WX==='rain'?0.5:1,sf=pl.surfR||'asphalt',ud=M.userData;
    // gomme: pattinamento in accelerazione, bloccaggio in frenata, derapata laterale; sull'asfalto fumo bianco, sullo sterrato polvere
    if(!pl.air&&sf!=='water'){const W=ud.wheels||[],lat=Math.max(0,(pl.slip||0)/(pl.alPk||0.2)-0.85)*0.45*Math.min(1,v/7),spk=pl.P.sport||(pl.P.Pkw/pl.P.m>0.12?1:0.3),sp=pl.spinA||[],lk=pl.lockA||[];
      for(let j=0;j<4&&j<W.length;j++){let k=lat*2.2;if(sp[j])k+=0.9*spk*Math.min(1,Math.abs(pl.rpm||0)/3000+0.3);if(lk[j]&&v>4)k+=0.7;if(k<0.05)continue;
        acc.tyre+=k*dt*(sf==='asphalt'?38:26)*air;W[j].getWorldPosition(V);
        while(acc.tyre>=1){acc.tyre-=1;const c=sf==='asphalt'?0.86:0.62;emit(V.x+(Math.random()-0.5)*0.3,pl.terrH+0.25,V.z+(Math.random()-0.5)*0.3,-ch*v*0.25+(Math.random()-0.5)*1.2,0.5+Math.random()*0.6,-sh*v*0.25+(Math.random()-0.5)*1.2,1.6+Math.random()*1.2,0.6,3.4+Math.random()*1.5,0.5*Math.min(1,k),sf==='asphalt'?c:0.55);}}}
    // scarico: più fumo col gas e ai bassi giri, il diesel più scuro (sbuffi neri quando il camion spinge)
    const ex=EXH[selKey]??0.5,thr=pl.thrIn||0,rpm=pl.rpm||800,dz=pl.P.truck?-0.9:-0.42;
    let rate=ex*(1.2+thr*7*(1-Math.min(1,v/25)*0.6))*(pl.engineOn===false?0:1);acc.exh+=rate*dt*air;
    if(acc.exh>=1){const ox=-T.L/2-0.05,oy=pl.P.truck?0.75:0.28;M.localToWorld(V.set(ox,oy,dz));}
    while(acc.exh>=1){acc.exh-=1;const dark=pl.P.diesel?(0.32+0.25*(1-thr)):0.78,c=dark-(pl.P.diesel&&thr>0.7&&rpm<1800?0.18:0);
      emit(V.x,V.y,V.z,-ch*(1.5+v*0.15)+(Math.random()-0.5)*0.5,0.25+Math.random()*0.35,-sh*(1.5+v*0.15)+(Math.random()-0.5)*0.5,0.9+Math.random()*0.8,0.12,0.9+ex*0.6,0.16+0.12*ex*Math.min(1,0.3+thr),c);}
    // invecchiamento: salgono, si allargano, si diradano; il vento le porta via
    const wx=0.6,wz=0.3;for(let i=0;i<N;i++){const p=P[i];if(p.t>=p.life){if(alp[i]){alp[i]=0;}continue;}p.t+=dt;const f=p.t/p.life,dr=Math.exp(-dt*1.6);
      p.vx=p.vx*dr+wx*dt;p.vz=p.vz*dr+wz*dt;p.vy=p.vy*Math.exp(-dt*0.8)+0.25*dt;pos[i*3]+=p.vx*dt;pos[i*3+1]+=p.vy*dt;pos[i*3+2]+=p.vz*dt;
      siz[i]=p.s0+(p.s1-p.s0)*Math.sqrt(f);alp[i]=p.a0*Math.min(1,f*6)*(1-f)*(1-f);}
    g.attributes.position.needsUpdate=g.attributes.alpha.needsUpdate=g.attributes.size.needsUpdate=g.attributes.color.needsUpdate=true;
    pts.visible=true;m.uniforms.scale.value=innerHeight*0.6;m.uniforms.lum.value=Math.min(1,0.18+0.82*ENVB.sun/1.75)*(1-0.6*(TUNL.k||0))+0.15*(TUNL.k||0);}
  return{update,emit,live:()=>P.filter(p=>p.t<p.life).length};})();window.__smoke=()=>SMOKE;

function fmtT(x){return Math.floor(x/60)+':'+String(Math.floor(x%60)).padStart(2,'0')+'.'+Math.floor(x*10%10);}

// ================= PATTUGLIA: più punti persi, più è probabile che arrivi =================
const POL={c:null,trail:[],tT:0,
  onInfr(kind){if(!NW||this.c||!started)return;const lic=pl.lic??20,p=kind==='pedone'?0.9:Math.min(0.9,0.22+(20-lic)*0.035);if(Math.random()<p)setTimeout(()=>this.spawn(kind),2500);},
  spawn(kind){if(this.c||pl.ended||!started)return;const m=makeCar('berlina',0xf4f4f2,true,false);const bar=new THREE.Group();const T=TYPES.berlina;
    const bM=new THREE.MeshBasicMaterial({color:0x1a4dff}),rM=new THREE.MeshBasicMaterial({color:0x0a1030});const l1=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.1,0.5),bM),l2=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.1,0.5),rM);l1.position.z=-0.3;l2.position.z=0.3;bar.add(l1,l2);bar.position.set(-0.2,(T.roofY||T.H)+0.06,0);m.add(bar);
    {const s=new THREE.Mesh(new THREE.BoxGeometry(T.L*0.62,0.12,T.W+0.01),new THREE.MeshStandardMaterial({color:0x1f3f9a}));s.position.set(0,0.62,0);m.add(s);}
    scene.add(m);const tr=this.trail;let i=Math.max(0,tr.length-1);let back=0;while(i>0&&back<230){back+=Math.hypot(tr[i][0]-tr[i-1][0],tr[i][1]-tr[i-1][1]);i--;}
    const pre=back<150||!tr.length,st=pre?[pl.x-Math.cos(pl.h)*160,pl.z+Math.sin(pl.h)*160]:tr[i];this.c={m,l1,l2,bM,rM,i:pre?Math.max(0,tr.length-1):i,f:0,x:st[0],z:st[1],v:20,hold:0,lost:0,why:kind,pre};
    this.siren=initSiren();say('Una pattuglia ti sta seguendo: accosta e fermati');pl.navMsg='🚓 Polizia! Accosta e fermati';pl.navMsgT=4;},
  end(caught){const c=this.c;if(!c)return;if(caught){const f=kind2fine(c.why);CAR.add(-f,'Verbale della polizia');if(!CAR.on){pl.fines=(pl.fines||0)+f;}say('Fermato dalla polizia: verbale di '+f+' euro');DJ.say('presa',true);}
    else{say('Hai seminato la pattuglia');DJ.say('seminata',true);}
    if(this.siren)this.siren.stop();this.siren=null;const m=c.m;this.c=null;setTimeout(()=>scene.remove(m),caught?6000:100);},
  tick(dt){if(!started||!isFinite(pl.x))return;this.tT-=dt;if(this.tT<=0){this.tT=0.2;const L=this.trail,lx=L.length?L[L.length-1]:null;if(!lx||!(Math.hypot(lx[0]-pl.x,lx[1]-pl.z)<=2))L.push([pl.x,pl.z]);if(L.length>900){L.splice(0,300);if(this.c)this.c.i=Math.max(0,this.c.i-300);}}
    const c=this.c;if(!c)return;const L=this.trail;if(!isFinite(c.x)||!isFinite(c.v)){c.x=pl.x-Math.cos(pl.h)*150;c.z=pl.z+Math.sin(pl.h)*150;c.v=20;c.i=Math.max(0,L.length-1);c.f=0;}
    // segue la scia del giocatore: sulle stesse strade, senza scorciatoie
    const dPl=Math.hypot(pl.x-c.x,pl.z-c.z),vp=Math.hypot(pl.vx,pl.vy),vt=dPl>40?Math.max(16,vp+9):dPl>14?vp+3:Math.min(vp,dPl>9?4:0);
    c.v+=(Math.min(46,vt)-c.v)*Math.min(1,dt*1.5);let mv=c.v*dt;
    if(c.pre){const t=L[c.i]||[pl.x,pl.z],dx=t[0]-c.x,dz=t[1]-c.z,dd=Math.hypot(dx,dz);if(dd<3)c.pre=false;else{const k=Math.min(1,mv/dd);c.x+=dx*k;c.z+=dz*k;mv=0;c.m.rotation.y=Math.atan2(-dz,dx);}}
    while(!c.pre&&mv>0&&c.i<L.length-1){const a=L[c.i],b=L[c.i+1],sl=Math.hypot(b[0]-a[0],b[1]-a[1])||0.01,rem=sl*(1-c.f);if(mv<rem){c.f+=mv/sl;mv=0;}else{mv-=rem;c.i++;c.f=0;}}
    if(c.pre){}else if(c.i>=L.length-1){c.x=L[L.length-1][0];c.z=L[L.length-1][1];}else{const a=L[c.i],b=L[c.i+1];c.x=a[0]+(b[0]-a[0])*c.f;c.z=a[1]+(b[1]-a[1])*c.f;const h=Math.atan2(-(b[1]-a[1]),b[0]-a[0]);c.m.rotation.y+=(Math.atan2(Math.sin(h-c.m.rotation.y),Math.cos(h-c.m.rotation.y)))*Math.min(1,dt*6);}
    c.m.position.set(c.x,TH(c.x,c.z),c.z);const fl=Math.sin(simT*14)>0;c.l1.material=fl?c.bM:c.rM;c.l2.material=fl?c.rM:c.bM;
    if(this.siren)this.siren.set(dPl,simT);
    if(dPl<22&&vp<1.2){c.hold+=dt;if(c.hold>2)this.end(true);}else c.hold=Math.max(0,c.hold-dt*0.5);
    if(dPl>520){c.lost+=dt;if(c.lost>8)this.end(false);}else c.lost=0;}};
function kind2fine(k){return k==='pedone'?300:k==='rosso'?200:k==='velocita'?180:120;}
function initSiren(){if(!AC)return null;const o=AC.createOscillator();o.type='square';const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=2000;const g=AC.createGain();g.gain.value=0;o.connect(f).connect(g).connect(ACOUT());o.start();
  return{set(d,t){if(!isFinite(d))return;const hi=((t/0.55)|0)%2;o.frequency.setTargetAtTime(hi?880:660,AC.currentTime,0.01);g.gain.setTargetAtTime(Math.min(0.12,0.12/(1+(d/25)**2)),AC.currentTime,0.08);},stop(){g.gain.setTargetAtTime(0,AC.currentTime,0.1);setTimeout(()=>{try{o.stop();}catch(e){}},500);}};}

// ================= EVENTI NEL MONDO: mercato, incidente con coda, nebbia serale in montagna =================
const EVT={t:40,list:[],acc:null,
  hour(){return TIME==='cycle'?CLOCK:TIME==='night'?0:TIME==='sunset'?19:11;},
  tick(dt){if(!NW||!started||pl.ended)return;this.t-=dt;
    this.list=this.list.filter(e=>{const far=Math.hypot(e.x-pl.x,e.z-pl.z)>2200&&simT-e.t0>60;if(far||simT-e.t0>600){this.remove(e);return false;}return true;});
    if(this.t>0)return;this.t=70+Math.random()*80;if(this.list.length>=2)return;
    const h=this.hour();if(h>7&&h<14&&Math.random()<0.55&&this.market())return;this.accident();},
  remove(e){e.objs.forEach(o=>scene.remove(o));if(e.dyn)NWT.remDyn(e.dyn);if(this.acc===e)this.acc=null;},
  // tratto di strada adatto a una certa distanza dal giocatore
  findSeg(test,dmin,dmax){for(let tr=0;tr<40;tr++){const a=Math.random()*6.283,d=dmin+Math.random()*(dmax-dmin),x=pl.x+Math.cos(a)*d,z=pl.z+Math.sin(a)*d,q=NW.roadAt(x,z,40);if(!q||q.R.b||q.R.t||!test(q.R,x,z))continue;
      const R=q.R,i=q.i;if(R.cum[R.N-1]<80)continue;return{R,i:Math.min(i,R.N-2)};}return null;},
  box(w,h,d,col,x,y,z,ry,em){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:col,roughness:0.8,emissive:em||0}));m.position.set(x,y,z);m.rotation.y=ry;m.castShadow=true;scene.add(m);return m;},
  market(){const S=this.findSeg((R,x,z)=>R.c>=6&&R.c<=7&&!!NW.cityAt(x,z),300,1000);if(!S)return false;const R=S.R;let a=S.i,b=S.i,L=0;while(b<R.N-2&&L<60){L+=R.cum[b+1]-R.cum[b];b++;}if(L<35)return false;
    const objs=[],segs=[],ang=i=>Math.atan2(-(R.Z[i+1]-R.Z[i]),R.X[i+1]-R.X[i]),COL=[0xc8202a,0x2a6fd1,0x2f9e44,0xf0b400,0xffffff];
    // bancarelle con tendoni colorati lungo la via, transenne bianche e rosse alle due estremità
    for(let s=6;s<L-4;s+=7){let k=a;while(k<b&&R.cum[k+1]-R.cum[a]<s)k++;const t=(s-(R.cum[k]-R.cum[a]))/Math.max(0.1,R.cum[k+1]-R.cum[k]),x=R.X[k]+(R.X[k+1]-R.X[k])*t,z=R.Z[k]+(R.Z[k+1]-R.Z[k])*t,y=NW.H(x,z),ry=ang(k),nx=Math.sin(ry),nz=Math.cos(ry);
      for(const sd of [-1,1]){const ox=x+nx*sd*R.w*0.28,oz=z+nz*sd*R.w*0.28;objs.push(this.box(2.6,0.9,1.4,0x8b5a2b,ox,y+0.45,oz,ry),this.box(3.0,0.08,1.9,COL[(Math.random()*5)|0],ox,y+2.3,oz,ry));
        for(const px of [-1.3,1.3])for(const pz of [-0.8,0.8]){const p=this.box(0.06,2.3,0.06,0x444444,ox+Math.cos(ry)*px+nx*pz,y+1.15,oz-Math.sin(ry)*px+nz*pz,ry);objs.push(p);}
        for(let q=0;q<4;q++)objs.push(this.box(0.4,0.25,0.35,[0xff8c00,0xd62828,0x6a994e,0xffd60a][q],ox+Math.cos(ry)*(-0.9+q*0.6),y+1.02,oz-Math.sin(ry)*(-0.9+q*0.6),ry));}}
    for(const k of [a,b]){const x=R.X[k],z=R.Z[k],y=NW.H(x,z),ry=ang(Math.min(k,R.N-2)),nx=Math.sin(ry),nz=Math.cos(ry),hw=R.w/2;objs.push(this.box(R.w,0.9,0.25,0xf2f2f2,x,y+0.6,z,ry),this.box(R.w,0.18,0.27,0xc8202a,x,y+0.75,z,ry));segs.push([x-nx*hw,z-nz*hw,x+nx*hw,z+nz*hw]);}
    const e={k:'mercato',x:R.X[a],z:R.Z[a],t0:simT,objs,dyn:NWT.addDyn(segs)};this.list.push(e);const c=NW.cityAt(R.X[a],R.Z[a]);
    DJ.say('',true,'Oggi c\'è il mercato in '+(R.n||'centro')+(c?' a '+c.n:'')+': strada chiusa, prendete un\'altra via.');if(!(window.RADIO_LBL||'').includes('Radio Guido')){pl.navMsg='🧺 Mercato in '+(R.n||'centro')+(c?' a '+c.n:'')+': strada chiusa';pl.navMsgT=4;}return true;},
  accident(){const S=this.findSeg((R,x,z)=>R.c<=5&&!NW.cityAt(x,z),500,1400);if(!S)return false;const R=S.R,i=S.i,x=R.X[i],z=R.Z[i],y=NW.H(x,z),ry=Math.atan2(-(R.Z[i+1]-R.Z[i]),R.X[i+1]-R.X[i]),nx=Math.sin(ry),nz=Math.cos(ry),fx=Math.cos(ry),fz=-Math.sin(ry);
    const objs=[],side=R.o?1:(Math.random()<0.5?1:-1),lo=side*R.w*0.25;const K=['berlina','sw','suv','utilitaria'],C=[0x8a1f1f,0x1c2a44,0xbfc3c7,0x3e4a3b];
    for(let q=0;q<2;q++){const m=makeCar(K[(Math.random()*4)|0],C[(Math.random()*4)|0],true,false);const px=x+fx*(q*4.2)+nx*(lo+(q?0.6:-0.4)),pz=z+fz*(q*4.2)+nz*(lo+(q?0.6:-0.4));m.position.set(px,NW.H(px,pz),pz);m.rotation.y=ry+(q?0.55:-0.35);scene.add(m);objs.push(m);}
    {const m=makeCar('berlina',0xf4f4f2,true,false);const px=x-fx*14+nx*lo,pz=z-fz*14+nz*lo;m.position.set(px,NW.H(px,pz),pz);m.rotation.y=ry;scene.add(m);objs.push(m);const T=TYPES.berlina;const l=this.box(0.22,0.1,1,0x1a4dff,0,0,0,0,0x1a4dff);l.position.set(-0.2,(T.roofY||T.H)+0.06,0);l.rotation.y=0;m.add(l);objs.push(l);}
    for(let q=0;q<7;q++){const px=x-fx*(26-q*4)+nx*(lo-side*(1.2+q*0.28)),pz=z-fz*(26-q*4)+nz*(lo-side*(1.2+q*0.28));const c=new THREE.Mesh(new THREE.ConeGeometry(0.18,0.55,10),new THREE.MeshStandardMaterial({color:0xff5a00,emissive:0x331000}));c.position.set(px,NW.H(px,pz)+0.28,pz);scene.add(c);objs.push(c);}
    const segs=[];{const a0=-30,a1=8,o0=lo-side*R.w*0.25,o1=lo+side*R.w*0.25;[[a0,o0,a1,o0],[a0,o1,a1,o1],[a0,o0,a0,o1],[a1,o0,a1,o1]].forEach(([s0,q0,s1,q1])=>segs.push([x+fx*s0+nx*q0,z+fz*s0+nz*q0,x+fx*s1+nx*q1,z+fz*s1+nz*q1]));}
    const e={k:'incidente',x,z,t0:simT,objs,dyn:NWT.addDyn(segs)};this.list.push(e);this.acc=e;
    DJ.say('',true,'Notizie dal traffico: incidente su '+(R.n||'una statale')+', code e rallentamenti. Prudenza!');if(!(window.RADIO_LBL||'').includes('Radio Guido')){pl.navMsg='⚠ Incidente su '+(R.n||'una statale')+': coda e rallentamenti';pl.navMsgT=4;}return true;}};

function chSummary(reason,rows){const fm=x=>Math.floor(x/60)+':'+String(Math.floor(x%60)).padStart(2,'0')+'.'+Math.floor(x*10%10);const day=new Date().toLocaleDateString('it-IT');
  if(MODE==='deliv'){const e={s:CH.score,n:CH.n,car:pl.P.label,d:day};const pos=CH.n||CH.score?lbAdd('deliv',e,(a,b)=>b.s-a.s):-1;
    rows.unshift(['Consegne',CH.n],['Punti',CH.score+(pos===0?' · nuovo record!':pos>0?' · '+(pos+1)+'° in classifica':'')]);rows.push(['Classifica consegne',lbHtml('deliv',e=>`${e.s} punti · ${e.n} consegne · ${e.car} · ${e.d}`)]);return reason==='tempo'?'Tempo scaduto!':null;}
  if(MODE==='ring'){if(reason==='giro'){const e={t:CH.lap,car:pl.P.label,k:selKey,d:day};const pos=lbAdd('ring_'+selKey,e,(a,b)=>a.t-b.t);rows.unshift(['Tempo sul giro',fm(CH.lap)+(pos===0?' · nuovo record!':' · '+(pos+1)+'° in classifica')]);}
    rows.push(['Classifica giro ('+pl.P.label+')',lbHtml('ring_'+selKey,e=>`${fm(e.t)} · ${e.d}`)]);return reason==='giro'?'Giro completato!':null;}
  return null;}
function lbMenu(m){const fm=x=>Math.floor(x/60)+':'+String(Math.floor(x%60)).padStart(2,'0')+'.'+Math.floor(x*10%10);
  if(m==='deliv')return'<b>Classifica consegne</b>'+lbHtml('deliv',e=>`${e.s} punti · ${e.n} consegne · ${e.car} · ${e.d}`)+'<span class="note">Porta il carico alla destinazione prima che scada il tempo: ogni consegna aggiunge tempo. Gli urti tolgono punti.</span>';
  if(m==='ring')return'<b>Classifica giro dell\'anello ('+(PHYS[selKey]?PHYS[selKey].label:'')+')</b>'+lbHtml('ring_'+selKey,e=>`${fm(e.t)} · ${e.d}`)+'<span class="note">Si parte in autostrada: passa tutti gli intermedi (colonna blu) e torna al via.</span>';return'';}
// freni ad aria del camion: sbuffo quando si ferma
let hissArm=false;
function airHiss(){if(!AC)return;const t=AC.currentTime,n=AC.createBufferSource(),b=AC.createBuffer(1,AC.sampleRate*0.8,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.5);n.buffer=b;
  const f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=2500;const g=AC.createGain();g.gain.value=0.22;n.connect(f).connect(g).connect(ACOUT());n.start(t);}
