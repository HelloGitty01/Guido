// Guido · 09 fisica autoradio — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ================= FISICA =================
function resetPlayer(){
  const P=PHYS[selKey],T=TYPES[selKey];
  if(pl.mesh)scene.remove(pl.mesh);
  pl.P=P;pl.T=T;pl.t0=simT;pl.yb=null;pl.vb=0;pl.air=false;pl.nLoad=1;pl.mesh=makeCar(selKey,0x8a1f1f,true,true);pl.paint=pl.mesh.userData.paint;scene.add(pl.mesh);
  pl.ck=buildCockpit(T,P);pl.mesh.add(pl.ck.g);pl.mesh.add(rearCam);
  const clipM=pl.paint.clone();pl.clipPlanes=[new THREE.Plane(),new THREE.Plane()];clipM.clippingPlanes=pl.clipPlanes;clipM.clipIntersection=true;clipM.side=THREE.DoubleSide;
  rearCam.near=pl.ck.model?Math.max(1.2,pl.ck.eye.x+T.L/2+0.25):0.3;rearCam.updateProjectionMatrix();
  if(pl.mesh.userData.glb){pl.bodyClip=new THREE.Object3D();pl.mesh.add(pl.bodyClip);pl.clipXf=pl.ck.model?-100:Math.max(T.wsX-0.04,pl.ck.wsx-0.25);pl.clipXr=pl.ck.model?-101:T.rearX+0.05;}
  else{pl.bodyClip=new THREE.Mesh(pl.mesh.userData.body.geometry,clipM);pl.bodyClip.visible=false;pl.mesh.add(pl.bodyClip);
  pl.clipXf=pl.ck.wsx-0.03;pl.clipXr=T.van?-T.L/2+0.6:T.gh[0][0]+0.04;}
  const ln=lanes.find(l=>l.axis==='X'&&l.road===0&&l.d.x===1),p=ln.pos(-70,LANE_OFF);
  Object.assign(pl,{wh:null,fy:[0,0,0,0],lx:0,lxv:0,ly:0,lyv:0,axR:0,ayR:0,espCut:0,alignK:1,hazard:false,blinkMan:false,blinkArmed:false,flip:null,wat:null,flips:0,tipT:0,skid:false,spinW:0,blink:0,blinkOn:false,blinkT:0,slopeP:0,slopeR:0,terrH:0,camInit:false,lastLimit:0,surfR:'asphalt',x:p.x,z:p.z,h:0,vx:0,vy:0,r:0,delta:0,steerIn:0,thrIn:0,brkIn:0,gear:1,sel:'D',lights:false,steerTgt:0,steerAnalog:false,infr:{rosso:0,contromano:0},inBox:null,infrT:0,infrMsg:'',shiftT:0,rpm:P.idle,revHold:0,ax:0,km:0,hits:0,hitCd:0,overArmed:true,fyF:0,fyR:0,susp:{h:0,hv:0,p:0,pv:0,r:0,rv:0,hF:0},ay:0,dmg:{front:0,rear:0,left:0,right:0},pull:0,pullSign:0,dmgFlash:0,load:0,slip:0,wheelSpin:0});
  // libera la corsia davanti all'auto
  ln.cars.forEach(c=>{if(c.s>-80&&c.s<-55)c.s=-110;});
  cars.forEach(c=>{if(!c.ln)return;const q=lanePos(c.ln,c.s,c.ln.off);if(Math.hypot(q.x-p.x,q.z-p.z)<9)c.s-=20;});
  initAudio();
}
// ================= AUTORADIO =================
// "Radio Guido" è musica generata in tempo reale (funziona ovunque); su GitHub ci sono anche le radio vere in streaming.
const RADIO=(()=>{const web=/github\.io$|^localhost$|^127\./.test(location.hostname);
  const DEF=[{n:'Rai Radio 1',u:'https://icestreaming.rai.it/1.mp3'},{n:'Rai Radio 2',u:'https://icestreaming.rai.it/2.mp3'},{n:'Rai Radio 3',u:'https://icestreaming.rai.it/3.mp3'},
    {n:'Radio 105',u:'https://icy.unitedradio.it/Radio105.mp3'},{n:'Virgin Radio',u:'https://icy.unitedradio.it/Virgin.mp3'},{n:'R101',u:'https://icy.unitedradio.it/R101.mp3'}];
  const user=()=>{try{const l=JSON.parse(localStorage.getItem('sim_radio')||'null');return Array.isArray(l)?l:DEF.slice();}catch(e){return DEF.slice();}};
  let ST=[];const build=()=>{ST=[{n:'Radio Guido',gen:true}].concat(web?user().filter(s=>s&&s.u&&/^https?:\/\//.test(s.u)).map(s=>({n:s.n||'Stazione',u:s.u})):[]);};build();
  let idx=-1,audio=null,gen=null,vol=(typeof CFG!=='undefined'&&CFG.vol!=null)?CFG.vol:0.6,paused=false,tagT=null;
  const tag=t=>{const e=document.getElementById('radioTag');e.textContent=t;e.style.display='block';clearTimeout(tagT);tagT=setTimeout(()=>e.style.display='none',2600);};
  function stop(){if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null;}if(gen){gen.stop();gen=null;}}
  // --- musica generata: pop allegro in Do, 104 bpm, giro Do-Sol-Lam-Fa ---
  function startGen(){initAudio();if(!AC)return null;const out=AC.createGain();out.gain.value=vol*0.5;out.connect(ACOUT());
    const nb=AC.createBuffer(1,AC.sampleRate*0.5,AC.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
    const bpm=104,beat=60/bpm,CH=[[60,64,67],[55,59,62],[57,60,64],[53,57,60]],PEN=[72,74,76,79,81,84];let t0=AC.currentTime+0.1,step=0,seed=7;
    const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};const f=m=>440*Math.pow(2,(m-69)/12);
    const tone=(type,freq,t,d,g,fc)=>{const o=AC.createOscillator(),a=AC.createGain();o.type=type;o.frequency.value=freq;a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(g,t+0.02);a.gain.exponentialRampToValueAtTime(0.001,t+d);
      if(fc){const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=fc;o.connect(lp);lp.connect(a);}else o.connect(a);a.connect(out);o.start(t);o.stop(t+d+0.05);};
    const noise=(t,d,g,hp)=>{const s=AC.createBufferSource(),a=AC.createGain(),fl=AC.createBiquadFilter();s.buffer=nb;fl.type='highpass';fl.frequency.value=hp;a.gain.setValueAtTime(g,t);a.gain.exponentialRampToValueAtTime(0.001,t+d);s.connect(fl);fl.connect(a);a.connect(out);s.start(t);s.stop(t+d);};
    const kick=t=>{const o=AC.createOscillator(),a=AC.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(45,t+0.12);a.gain.setValueAtTime(0.9,t);a.gain.exponentialRampToValueAtTime(0.001,t+0.2);o.connect(a);a.connect(out);o.start(t);o.stop(t+0.22);};
    const iv=setInterval(()=>{while(t0<AC.currentTime+0.4){const bar=Math.floor(step/8)%4,e=step%8,c=CH[bar],t=t0;
        if(e===0)c.forEach(m=>tone('triangle',f(m),t,beat*4,0.05,1800));
        if(e===0||e===4||e===6)tone('square',f(c[0]-24),t,beat*0.45,0.12,500);
        if(e===0||e===4)kick(t);if(e===2||e===6)noise(t,0.14,0.25,1500);noise(t,0.04,0.08,7000);
        if(e%2===0&&rnd()<0.62)tone('sine',f(PEN[Math.floor(rnd()*PEN.length)]),t,beat*0.6,0.08);
        step++;t0+=beat/2;}},100);
    return {stop(){clearInterval(iv);out.gain.setTargetAtTime(0,AC.currentTime,0.05);setTimeout(()=>out.disconnect(),400);},vol(v){out.gain.value=v*0.5;}};}
  // --- Radio Guido: i brani della stazione in ordine casuale, senza ripetere subito l'ultimo ---
  const PL=[{f:'music/radio1.mp3',t:'Broken Radio',a:'mangmaru'},{f:'music/radio2.mp3',t:'Radio Active',a:'BearStockMusic'},{f:'music/radio3.mp3',t:'Radio Jingle',a:'Alex Morgan'},{f:'music/radio4.mp3',t:'Got a Space Shuttle Parked in My Yard',a:'Tim Kraaijvanger'}];
  let order=[],oi=0,duck=1;
  function startPL(){const a=new Audio();a.preload='auto';audio=a;const me=a;
    const go=()=>{if(audio!==me)return;if(oi>=order.length){const last=order[order.length-1];let o;do{o=PL.map((_,i)=>i).sort(()=>_rnd()-0.5);}while(PL.length>1&&o[0]===last);order=o;oi=0;}
      const tr=PL[order[oi++]];a.src=tr.f;a.volume=vol*duck;window.RADIO_LBL='♪ Radio Guido';if(!paused)a.play().catch(()=>{});tag('♪ Radio Guido · '+tr.t+' — '+tr.a);};
    a.onended=go;a.onerror=()=>setTimeout(go,600);go();}
  function play(){stop();const s=ST[idx];window.RADIO_LBL='♪ '+s.n;tag('♪ '+s.n);
    if(s.gen){startPL();return;}
    audio=new Audio();audio.preload='none';audio.src=s.u;audio.volume=vol;const me=audio;
    const fail=()=>{if(audio!==me)return;tag(s.n+': non raggiungibile');setTimeout(()=>{if(audio===me)next();},900);};
    audio.onerror=fail;audio.play().catch(fail);}
  function next(){idx++;if(idx>=ST.length){idx=-1;stop();window.RADIO_LBL='Radio spenta';tag('Radio spenta');return;}if(!paused)play();else window.RADIO_LBL='♪ '+ST[idx].n;}
  return {web,DEF,user,reload(){stop();idx=-1;window.RADIO_LBL='Radio spenta';build();},next,pause(b){if(b===paused)return;paused=b;if(b){if(audio)audio.pause();}else if(idx>=0){if(audio)audio.play().catch(()=>{});else if(!gen)play();}},
    setVol(v){vol=v;if(audio)audio.volume=v*duck;if(gen)gen.vol(v);},duck(on){duck=on?0.28:1;if(audio)audio.volume=vol*duck;},el:()=>audio};
})();
// cambio d'auto al volo: stessa posizione, stessa velocità, la corsa continua
function switchCar(k){if(!PHYS[k]||k===selKey)return;if(!CAR.owns(k)){pl.navMsg=PHYS[k].label+': si compra nel garage di casa ('+CAR.fmt(CAR.price(k))+')';pl.navMsgT=3;return;}const S={};['x','z','h','vx','vy','r','terrH','sel','lights','km','hits','infr','dmg','overN','vmax','ended','hazard'].forEach(q=>S[q]=pl[q]);
  const cam=camera.position.clone();selKey=k;[...vl.children].forEach((b,i)=>b.classList.toggle('sel',Object.keys(PHYS)[i]===k));
  resetPlayer();Object.assign(pl,S);pl.camInit=true;camera.position.copy(cam);
  if(pl.sel==='D')pl.gear=Math.min(pl.P.gears.length,Math.max(1,pl.gear||1));pl.rpm=pl.P.idle;applyView();
  pl.navMsg='Ora guidi: '+PHYS[k].label;pl.navMsgT=3;try{savePrefs();}catch(e){}}
function cycleCar(d){if(!started||pl.flip)return;const K=Object.keys(PHYS).filter(k=>CAR.owns(k)||k===selKey);if(K.length<2)return;const i=K.indexOf(selKey);switchCar(K[(i+d+K.length)%K.length]);}
const G=9.81;
function startFlip(dir,strong){if(pl.flip)return;setTimeout(()=>crashSound(8,'side',dir),300);pl.flip={phi:pl.susp.r+pl.slopeR,w:dir*(strong?3.2:2.2),dir,target:dir*(strong?Math.PI:Math.PI/2),done:false,t:0};pl.flips=(pl.flips||0)+1;crashSound(10);
  pl.infrMsg='Ribaltamento!';pl.infrT=4;}
function stepFlip(dt){const F=pl.flip;F.t+=dt;
  if(!F.done){F.w+=F.dir*7*dt;F.phi+=F.w*dt;if(Math.abs(F.phi)>=Math.abs(F.target)){F.phi=F.target;F.done=true;F.w=0;crashSound(6);}}
  // l'auto striscia sul fianco/tetto fino a fermarsi
  const[wx,wz]=getWorldVel(),v=Math.hypot(wx,wz);if(v>0.01){const k=Math.max(0,v-5.5*dt)/v;setWorldVel(wx*k,wz*k);}
  const[ux,uz]=getWorldVel();pl.x+=ux*dt;pl.z+=uz*dt;pl.r*=Math.max(0,1-dt*2);pl.h-=pl.r*dt;pl.km+=Math.hypot(ux,uz)*dt/1000;
  const c0=Math.cos(pl.h),s0=Math.sin(pl.h);pl.terrH=TH(pl.x,pl.z);pl.rpm+=(pl.P.idle-pl.rpm)*dt*2;collide(dt);}
// ---- in acqua: l'auto galleggia un po' (cofano giù, sale l'acqua), poi affonda; si torna in strada col tasto "Raddrizza" ----
function waterLv(x,z){if(!NW||!NW.lakeAt||!NW.lakes)return null;const lk=NW.lakeAt(x,z);if(!lk)return null;const L=NW.lakes[lk-1];return NW.Hg(x,z)<L.lv-0.6?L:null;}
function waterStep(dt){let W=pl.wat;
  if(!W){const L=waterLv(pl.x,pl.z);if(!L)return false;const yb=pl.yb??pl.terrH;if(yb>L.lv+0.5)return false;
    const heavy=pl.P.truck||pl.P.m>2600;W=pl.wat={lv:L.lv,amp:NW.waveAmp?NW.waveAmp(L):0.3,t:0,y:Math.max(NW.Hg(pl.x,pl.z),Math.min(yb,L.lv+1)),vy:Math.min(-1,(pl.vb||0)),pitch:pl.slopeP||0,roll:0,float:heavy?3+Math.random()*2:7+Math.random()*5,sunk:false,ex:pl.x,ez:pl.z,eh:pl.h};
    crashSound(Math.min(10,4+Math.abs(pl.vx)*0.4),'front');pl.infrMsg='In acqua!';pl.infrT=3;if(window.SPLASH)SPLASH(pl.x,L.lv,pl.z,Math.min(1,0.3+Math.abs(pl.vx)/20));}
  W.t+=dt;pl.thrIn=0;pl.brkIn=0;pl.rpm+=((W.t<1.5?pl.P.idle:0)-pl.rpm)*Math.min(1,dt*1.5);
  // avanti per inerzia, frenata dall'acqua; un po' di deriva
  const[wx,wz]=getWorldVel(),k=Math.exp(-dt*(W.t<1?1.1:2.2));setWorldVel(wx*k,wz*k);const[ux,uz]=getWorldVel();pl.x+=ux*dt;pl.z+=uz*dt;pl.r*=Math.exp(-dt*1.5);pl.h-=pl.r*dt;
  // galleggiamento, poi l'acqua entra e l'auto scende verso il fondo (col muso avanti)
  const bottom=NW.Hg(pl.x,pl.z),sk=Math.max(0,W.t-W.float),bob=W.amp*(0.10*Math.sin(W.t*1.7)+0.05*Math.sin(W.t*2.9+1.3))*Math.max(0,1-sk/4);
  const tgt=Math.max(bottom,W.lv-0.62*pl.T.H-0.06*Math.min(W.t,W.float)-0.05*sk*sk)+bob;
  if(W.y>tgt+0.25)W.vy-=9.8*dt;else W.vy+=((tgt-W.y)*5-W.vy*2.4)*dt;W.vy=Math.max(-8,Math.min(3,W.vy));W.y+=W.vy*dt;if(W.y<bottom){W.y=bottom;W.vy=0;}
  W.pitch+=((-0.06-Math.min(0.45,sk*0.09))*(W.y>bottom+0.05?1:0.3)-W.pitch)*Math.min(1,dt*0.8);W.roll+=(W.amp*0.07*Math.sin(W.t*1.25)-W.roll)*Math.min(1,dt*2);
  if(!W.sunk&&(W.y<W.lv-pl.T.H-0.25||(W.y<=bottom+0.01&&sk>2))){W.sunk=true;pl.infrMsg=(isTouch?'Auto affondata: tocca Raddrizza per tornare in strada':'Auto affondata: premi '+keyName((KEYMAP.unflip||[])[0])+' per tornare in strada');pl.infrT=30;}
  pl.terrH=W.y;pl.yb=W.y;pl.vb=0;pl.air=false;pl.slopeP=0;pl.slopeR=0;return true;}
function waterRescue(){const W=pl.wat;if(!W)return false;let best=null;for(const r of [40,90,180,360])if(!best)for(const q of NW.near(pl.x,pl.z,r)){const h=q.R.Hh[q.i];if(q.R.b||q.R.t||h<W.lv+0.6||waterLv(q.R.X[q.i],q.R.Z[q.i]))continue;if(!best||q.d<best.d)best=q;}
  if(best){const R=best.R,i=Math.min(best.i,R.N-2);pl.x=R.X[i];pl.z=R.Z[i];pl.h=Math.atan2(-(R.Z[i+1]-R.Z[i]),R.X[i+1]-R.X[i]);}
  else{// nessuna strada vicina: si torna a riva, dove l'auto è entrata in acqua, voltati verso terra
    let x=W.ex,z=W.ez;for(let k=0;k<60&&waterLv(x,z);k++){x-=Math.cos(W.eh)*3;z+=Math.sin(W.eh)*3;}x-=Math.cos(W.eh)*6;z+=Math.sin(W.eh)*6;pl.x=x;pl.z=z;pl.h=W.eh+Math.PI;}pl.wat=null;pl.vx=pl.vy=pl.r=0;pl.yb=null;pl.terrH=TH(pl.x,pl.z);
  Object.assign(pl.susp,{h:0.3,hv:0,p:0,pv:0,r:0,rv:0});pl.sel='D';pl.gear=1;pl.infrT=0;pl.navMsg='Recuperata e riportata in strada';pl.navMsgT=3;return true;}
function unflip(){if(pl.wat){waterRescue();return;}if(!pl.flip)return;pl.flip=null;pl.vx=pl.vy=pl.r=0;Object.assign(pl.susp,{h:0.3,hv:0,p:0,pv:0,r:0,rv:0});pl.sel='D';pl.gear=1;}
// ---- fisica a quattro ruote: carichi dinamici con molle e ammortizzatori, gomme con curva di aderenza, differenziale, aiuti alla guida ----
function stepPhysics(dt){if(NW)NW.yh=pl.terrH;
  if(pl.flip){stepFlip(dt);return;}
  if(!pl.flip&&waterStep(dt))return;
  const P=pl.P,m=P.m,wb=pl.T.L*0.6,a=wb*(1-P.wf),b=wb*P.wf,Iz=m*a*b*1.05,tw=pl.T.W/2-0.15,AID=CFG.aids??1;
  const c0=Math.cos(pl.h),s0=Math.sin(pl.h);
  // le quattro ruote: 0 ant. sx, 1 ant. dx, 2 post. sx, 3 post. dx (x avanti, y a destra)
  const WX=[a,a,-b,-b],WY=[-tw,tw,-tw,tw];
  const hw=[0,1,2,3].map(i=>TH(pl.x+c0*WX[i]+s0*WY[i],pl.z-s0*WX[i]+c0*WY[i]));
  const hF=(hw[0]+hw[1])/2,hR=(hw[2]+hw[3])/2,hL=(hw[0]+hw[2])/2,hRt=(hw[1]+hw[3])/2;
  pl.slopeP=Math.atan2(hF-hR,wb);pl.slopeR=-Math.atan2(hRt-hL,2*tw);pl.terrH=(hF+hR)/2;
  // scocca libera in verticale: sulle creste prese forte le ruote si staccano, poi si riatterra
  {const g0=pl.terrH;if(pl.yb==null||!isFinite(pl.yb)||Math.abs(pl.yb-g0)>6){pl.yb=g0;pl.vb=0;pl.gy0=g0;pl.gyS=g0;}
   // profilo "sentito" dalla scocca: gomme e sospensioni assorbono gradini, cordoli e piccole buche (non lanciano la macchina)
   pl.gyS+=(g0-pl.gyS)*Math.min(1,dt/0.11);const gy=pl.gyS,sp=Math.hypot(pl.vx,pl.vy);
   const vg=Math.max(-9,Math.min(9,(gy-pl.gy0)/dt));pl.gy0=gy;const droop=P.truck?0.2:0.14,rel=pl.yb-gy;
   const wz=2*Math.PI*(P.fq||1.3)*1.05,kz=wz*wz,cz=2*Math.min(0.9,(P.zeta||0.3)*1.6)*wz;let acc,N;
   // staccarsi da terra richiede che la strada "scappi" sotto più in fretta della gravità: solo in velocità, su creste vere
   const canFly=sp>14;
   if(rel<droop||!canFly){acc=kz*(gy-pl.yb)+cz*(vg-pl.vb);if(canFly)acc=Math.max(-G,acc);else acc=Math.max(-2.5*G,acc);N=Math.max(canFly?0:0.15,(acc+G)/G);}else{acc=-G;N=0;}
   if(pl.air&&(rel<droop||!canFly)){const vi=vg-pl.vb;if(vi>1.5)landing(Math.min(1,vi/6),pl.airT||0);pl.air=false;}
   if(canFly&&!pl.air&&N<0.02&&rel>0.04){pl.air=true;pl.airT=0;}if(pl.air)pl.airT=(pl.airT||0)+dt;
   pl.vb+=acc*dt;pl.yb+=pl.vb*dt;
   if(pl.yb<gy-0.11){if(pl.vb<vg-3)landing(Math.min(1,(vg-pl.vb)/8),1);pl.yb=gy-0.11;pl.vb=Math.max(pl.vb,vg);}  // finecorsa
   pl.nLoad=Math.max(0,Math.min(2.6,N));}
  // velocità verticale della strada sotto ogni ruota (dossi, cordoli, buche)
  if(!pl.wh||pl.wh.length!==4)pl.wh=hw.slice();const vroad=hw.map((h,i)=>Math.max(-3,Math.min(3,(h-pl.wh[i])/dt)));pl.wh=hw;
  const sfF=surfaceAt(pl.x+c0*a,pl.z-s0*a),sfR=surfaceAt(pl.x-c0*b,pl.z+s0*b);pl.surfR=sfR;
  const wf=s0=>WET<1?(s0==='asphalt'?WET:s0==='dirt'?0.82:0.9):1;
  const ofr=sf=>sf==='asphalt'?1:(P.offroad||1);
  const muF=P.mu*SURF[sfF].mu*wf(sfF)*ofr(sfF),muR=P.mu*SURF[sfR].mu*wf(sfR)*ofr(sfR);const rr=(SURF[sfF].rr+SURF[sfR].rr)/2;
  const sel=pl.sel,fwd=sel==='D',rev=sel==='R',neu=sel==='N';
  if(fwd&&pl.gear>1&&Math.abs(pl.vx)<1.5)pl.gear=1;
  const drive=neu?pl.thrIn:Math.max(pl.thrIn,pl.brkIn<0.05?0.045:0),brake=pl.brkIn;
  const ratio=(rev?3.5:P.gears[pl.gear-1])*P.fd;
  // giri del motore: con le ruote motrici che pattinano salgono
  const wheelRpm=Math.abs(pl.vx)/P.rw*30/Math.PI;let rpmW=wheelRpm*ratio;if(pl.spinW>0.05&&!neu)rpmW+=(P.red*0.9-rpmW)*Math.min(1,pl.spinW)*drive;
  if(fwd&&pl.shiftT<=0){
    const up=P.diesel?1700+drive*(P.red-2000):2000+drive*(P.red-2400);
    const dn=P.diesel?1050+drive*1400:1150+drive*2300;
    if(rpmW>up&&pl.gear<P.gears.length&&!(pl.spinW>0.05)){pl.gear++;pl.shiftT=P.shiftT||(P.diesel?0.4:0.32);}
    else if(pl.gear>1&&rpmW<dn&&rpmW*P.gears[pl.gear-2]/P.gears[pl.gear-1]<Math.min(up*0.92,P.red-500)){pl.gear--;pl.shiftT=0.28;}
  }
  pl.shiftT-=dt;
  const stall=P.diesel?1900:2400;
  const rpmT=neu?P.idle+pl.thrIn*(P.red*0.9-P.idle):Math.max(rpmW,P.idle+drive*(stall-P.idle));
  pl.rpm+=(Math.min(rpmT,P.red+150)-pl.rpm)*Math.min(1,dt*(pl.shiftT>0?5:9));
  const tcv=1+0.9*Math.max(0,1-wheelRpm*ratio/Math.max(pl.rpm,1));
  const D=pl.dmg,pw=1-Math.max(0,D.front-0.55)*1.1;
  let Te=torque(P,pl.rpm)*drive*tcv*Math.max(0.45,pw);
  if(pl.rpm>=P.red)Te*=0.1;
  if(rev&&Math.abs(pl.vx)>4.5)Te*=0.15;
  if(pl.shiftT>0)Te*=0.62;
  let Fdrive=neu?0:Te*ratio*0.92/P.rw*(rev?-1:1);
  if(fwd&&pl.vx>1)Fdrive-=(1-drive)*[0.12,0.09,0.045][CFG.aids??1]*P.Tmax*ratio/P.rw*(pl.rpm/P.red);
  if(pl.espCut)Fdrive*=pl.espCut;
  // trasferimenti di carico con la dinamica di molle e ammortizzatori (oscillano, non sono istantanei)
  const om=2*Math.PI*(P.fq||1.45)*0.95,ze=Math.min(1.2,P.zeta||0.32)*1.15;
  pl.lx=pl.lx||0;pl.lxv=pl.lxv||0;pl.ly=pl.ly||0;pl.lyv=pl.lyv||0;
  const tx=Math.max(-12,Math.min(12,pl.axR||0)),ty=Math.max(-12,Math.min(12,pl.ayR||0));
  pl.lxv+=(om*om*(tx-pl.lx)-2*ze*om*pl.lxv)*dt;pl.lx+=pl.lxv*dt;
  const omr=om*Math.sqrt(1.2/(P.rollK||1));pl.lyv+=(omr*omr*(ty-pl.ly)-2*ze*omr*pl.lyv)*dt;pl.ly+=pl.lyv*dt;
  const Fs=[m*G*P.wf/2,m*G*P.wf/2,m*G*(1-P.wf)/2,m*G*(1-P.wf)/2],dLong=m*pl.lx*P.h/wb,dLat=m*pl.ly*P.h/(2*tw),rsd=P.rsd??0.55;
  const Fz=[0,1,2,3].map(i=>{let f=Fs[i]+(i<2?-dLong/2:dLong/2)+(WY[i]<0?1:-1)*dLat*(i<2?rsd:1-rsd);
    const mi=Fs[i]/G,cb=2*ze*om*mi;f+=Math.max(-0.7*Fs[i],Math.min(1.0*Fs[i],cb*vroad[i]*0.6));return Math.max(0.04*Fs[i],f)*(pl.nLoad??1);});
  // aderenza di ogni gomma (cala un po' quando la gomma è molto caricata)
  const muW=[muF,muF,muR,muR],Dm=Fz.map((f,i)=>muW[i]*f*(1-0.09*(f/Fs[i]-1)));
  pl.fy=pl.fy&&pl.fy.length===4?pl.fy:[0,0,0,0];
  const cap=Dm.map((d,i)=>Math.sqrt(Math.max(0.03*d*d,d*d-pl.fy[i]*pl.fy[i]))*0.97);
  // trazione: differenziale aperto o autobloccante, controllo trazione
  const Fx=[0,0,0,0],spin=[false,false,false,false],lock=[false,false,false,false];
  const axle=(Fd,iL,iR,lsd)=>{if(!Fd)return;const sg=Math.sign(Fd),F=Math.abs(Fd),cL=cap[iL],cR=cap[iR],lo=Math.min(cL,cR),loI=cL<=cR?iL:iR,hiI=loI===iL?iR:iL,hiC=Math.max(cL,cR),TBR=(1+lsd)/(1-lsd);
    if(F/2<=lo){Fx[iL]=Fx[iR]=sg*F/2;return;}
    const tot=lo+Math.min(hiC,lo*TBR);
    if(F<=tot||P.tc!==false){Fx[loI]=sg*lo;Fx[hiI]=sg*Math.min(hiC,lo*TBR,Math.max(0,F-lo));return;}
    const kl=lo*0.85;Fx[loI]=sg*kl;spin[loI]=true;const hiF=Math.min(hiC,kl*TBR);Fx[hiI]=sg*hiF;if(F-kl>hiC*1.05&&hiF>=hiC*0.99){spin[hiI]=true;Fx[hiI]=sg*hiC*0.85;}};
  const lsd=P.lsd??0;
  if(P.awd){axle(Fdrive*0.5,0,1,lsd);axle(Fdrive*0.5,2,3,Math.max(lsd,0.2));}
  else if(P.rwd)axle(Fdrive,2,3,lsd);else axle(Fdrive,0,1,lsd);
  if(sfF!=='asphalt'&&!P.rwd)for(const i of [0,1])if(spin[i])Fx[i]*=0.9;
  // freni ruota per ruota: ABS o bloccaggio
  const sgn=Math.sign(pl.vx);let Fb=brake*P.brake*m*9.5;
  if(AID===2&&brake>0.6&&Math.abs(pl.vx)>8)Fb=Math.max(Fb,P.brake*m*9.5);   // frenata assistita
  const bb=P.bb??0.7;pl.absOn=false;
  for(let i=0;i<4;i++){const req=Fb*(i<2?bb:1-bb)/2;if(req<=0)continue;let fb=req;
    if(P.abs!==false){if(req>cap[i]&&Math.abs(pl.vx)>3)pl.absOn=true;fb=Math.min(req,cap[i]);}
    else if(req>Dm[i]&&Math.abs(pl.vx)>1){lock[i]=true;fb=Dm[i]*0.78;}
    Fx[i]-=fb*sgn;}
  if(pl.hb&&Math.abs(pl.vx)>0.5)for(const i of [2,3]){lock[i]=true;Fx[i]=-Dm[i]*0.8*sgn;}
  for(let i=0;i<4;i++)Fx[i]=Math.max(-Dm[i],Math.min(Dm[i],Fx[i]));
  pl.lockF=lock[0]||lock[1];pl.lockR=lock[2]||lock[3];pl.spinF=spin[0]||spin[1];
  pl.spinW=spin.some(Boolean)?0.6:0;pl.spinA=spin;pl.lockA=lock;
  // sterzo, con assistenza che non lascia superare il limite di aderenza delle gomme anteriori
  const v=Math.hypot(pl.vx,pl.vy),maxD=0.6/(1+v*v/115)*(P.truck?0.85:1),avx=Math.max(Math.abs(pl.vx),0.5);   // sterzo progressivo: in velocità serve più volante per lo stesso angolo
  const si=pl.steerIn;// risposta progressiva: un tocco di tasto o un filo di levetta = poco sterzo; il pieno arriva solo tenendo premuto (o a fondo corsa)
  let tgtD;
  if(pl.steerAnalog)tgtD=Math.sign(si)*Math.pow(Math.abs(si),touch.on?1.2+0.5*CFG.prec:1.6+0.5*CFG.prec)*maxD;
  else{// tastiera: il tasto chiede una curva "normale" per la velocità (accelerazione laterale di circa mezza g, con Maiusc più stretta);
    // da fermo o in manovra è tutto sterzo, in città una decina di gradi, in autostrada pochi gradi
    const lock=0.6*(P.truck?0.85:1),aL=G*0.9*(P.mu||0.8),vv=Math.max(0.8,avx);
    const dN=Math.min(lock,Math.max(maxD*0.55,Math.atan(wb*aL/(vv*vv)))),hk=Math.max(0,Math.min(1,((pl.kbHold||0)-0.4)/0.9));
    tgtD=si*(dN+(Math.max(dN,maxD)-dN)*hk);}
  // profilo Facile: un leggero richiamo verso il centro della corsia quando non si sterza
  pl.lka=0;if(AID===2&&pl.vx>8&&Math.abs(si)<0.12&&NW&&pl.x>6000&&!pl.air){const q=NW.roadAt(pl.x,pl.z,3);if(q&&!q.R.priv&&q.R.w>=5){const R=q.R,i=Math.min(q.i,R.N-2);let tx=R.X[i+1]-R.X[i],tz=R.Z[i+1]-R.Z[i];const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;
    const fx=Math.cos(pl.h),fz=-Math.sin(pl.h),fw=fx*tx+fz*tz;if(Math.abs(fw)>0.9){const sg=Math.sign(fw),rx=-tz*sg,rz=tx*sg,lat=(pl.x-R.X[i])*rx+(pl.z-R.Z[i])*rz,want=R.o?(R.w>=9?(lat>0?1.75:-1.75):0):Math.min(R.w/4,2.1),e=lat-want,psi=fx*rx+fz*rz;
      if(Math.abs(e)<2.2){const corr=Math.max(-0.03,Math.min(0.03,(-0.03*e-0.35*psi)/(1+v/25)))*(1-Math.abs(si)/0.12);tgtD+=corr;pl.lka=corr;}}}}
  if(AID>0&&avx>7&&pl.vx>0){const bF=Math.atan2(pl.vy+pl.r*a,avx),lim=AID===2?0.19:0.24;tgtD=Math.max(bF-lim,Math.min(bF+lim,tgtD));}
  const dd=tgtD-pl.delta,rateD=0.9*CFG.rap*(P.steerRate||1)/(1+v/13);
  pl.delta+=Math.sign(dd)*Math.min(Math.abs(dd),rateD*dt);
  const d=pl.delta+pl.pull,td=Math.tan(d);
  // gomme: curva di aderenza (tipo Pacejka) e forza laterale con ritardo di risposta
  const Bf=P.tyreB||9.5,Cc=1.45,Ee=0.25,_pk=(pl.alPk=Math.tan(Math.PI/2/1.45)/Bf*1.1),relax=Math.min(1,dt*Math.max(avx,2)/0.6);
  let Fbx=0,Fby=0,Mz=0,aFmax=0,aRmax=0,alignF=0;
  for(let i=0;i<4;i++){
    const vxi=pl.vx-pl.r*WY[i],vyi=pl.vy+pl.r*WX[i];
    const di=i<2?Math.atan(td/(1-WY[i]*td*0.6/wb)):0;
    const al=Math.atan2(vyi,Math.max(Math.abs(vxi),0.5))-di*Math.sign(vxi||1);
    const B=i<2?Bf:Bf*1.08,Ba=B*al,Fy0=-Dm[i]*Math.sin(Cc*Math.atan(Ba-Ee*(Ba-Math.atan(Ba))));
    let k=Math.sqrt(Math.max(0.06,1-(Fx[i]/Math.max(1,Dm[i]))**2));if(lock[i])k=i<2?0.12:0.22;else if(spin[i])k=0.35;
    pl.fy[i]+=(Fy0*k-pl.fy[i])*relax;const fy=pl.fy[i],cd=Math.cos(di),sd=Math.sin(di);
    const bx=Fx[i]*cd-fy*sd,by=Fx[i]*sd+fy*cd;Fbx+=bx;Fby+=by;Mz+=WX[i]*by-WY[i]*bx;
    if(i<2){aFmax=Math.max(aFmax,Math.abs(al));alignF+=Math.abs(fy)*Math.max(0,1-Math.abs(al)/0.22);}else aRmax=Math.max(aRmax,Math.abs(al));}
  // sterzo "che parla": quando l'anteriore perde aderenza il volante si alleggerisce e torna al centro più piano
  pl.alignK=Math.min(1,alignF/Math.max(1,(Dm[0]+Dm[1])*0.45));
  const drag=0.5*1.2*P.CdA*pl.vx*Math.abs(pl.vx)+rr*m*G*Math.tanh(pl.vx*2);
  const meff=neu?m*1.03:m*(1.03+0.0006*ratio*ratio);
  let ax=(Fbx-drag)/meff+pl.r*pl.vy-G*Math.sin(pl.slopeP);
  pl.latA=Fby/m;
  let ay=pl.latA-pl.r*pl.vx+G*Math.sin(pl.slopeR)*0.6;
  const dTot=Math.min(1,(D.front+D.rear+D.left+D.right)/2);
  const wob=dTot>0.15?Math.sin(simT*9.3)*Math.sin(simT*3.1)*dTot*0.35*Math.min(1,Math.abs(pl.vx)/20):0;
  let rd=Mz/Iz-pl.r*0.6/(1+v/5)+wob;
  // controllo di stabilità: se l'auto gira più di quanto chiede lo sterzo (sovrasterzo) frena la rotazione e taglia il gas
  pl.espCut=0;
  if(AID>0&&pl.vx>6){const rT0=pl.vx*td/wb,rMax=(muF+muR)/2*G/pl.vx,rT=Math.max(-rMax,Math.min(rMax,rT0)),over=Math.abs(pl.r)-Math.abs(rT)-0.06;
    if(over>0&&(Math.sign(pl.r)!==Math.sign(rT)||Math.abs(pl.r)>Math.abs(rT))){const kk=AID===2?3.2:1.6;rd-=Math.sign(pl.r)*Math.min(over*kk*8,AID===2?3:1.6);pl.espCut=AID===2?0.35:0.65;ax-=Math.min(2,over*6);}
    const beta=Math.atan2(pl.vy,Math.abs(pl.vx));if(Math.abs(beta)>0.2)pl.vy*=1-dt*(AID===2?1.6:0.6)*(Math.abs(beta)-0.2)*4;}
  if(Math.abs(pl.vx)<0.4&&brake>0.2&&Math.abs(Fdrive)+Math.abs(m*G*Math.sin(pl.slopeP))<Fb){pl.vx*=Math.max(0,1-dt*8);ax=0;}
  pl.vx+=ax*dt;pl.vy+=ay*dt;pl.r+=rd*dt;
  const k=Math.min(1,Math.max(0,(Math.abs(pl.vx)-1.5)/3)),rk=pl.vx*td/wb;
  pl.r=k*pl.r+(1-k)*rk;pl.vy=k*pl.vy+(1-k)*rk*b;
  pl.axR=(Fbx-drag)/meff;pl.ayR=pl.latA;
  pl.ax+=(pl.axR-pl.ax)*Math.min(1,dt*6);
  pl.load=pl.thrIn;pl.slip=Math.max(aFmax,aRmax)*k;pl.fyF=pl.fy[0]+pl.fy[1];pl.fyR=pl.fy[2]+pl.fy[3];pl.Fz=Fz;
  const ch=Math.cos(pl.h),sh=Math.sin(pl.h);
  const wx=ch*pl.vx+sh*pl.vy,wz=-sh*pl.vx+ch*pl.vy;
  pl.x+=wx*dt;pl.z+=wz*dt;pl.h-=pl.r*dt;pl.km+=Math.hypot(wx,wz)*dt/1000;
  collide(dt);
  suspension(dt,ax);
  {const P2=pl.P,ssf=(pl.T.W-0.2)/(2*P2.h),lat=(pl.ay||0)/G+Math.tan(pl.slopeR),tilt=pl.slopeR+pl.susp.r,sf=pl.surfR;
   pl.tipT=(Math.abs(lat)>ssf*0.97)?(pl.tipT||0)+dt:0;
   // niente ribaltamenti appena partiti o da fermi: un'inclinazione letta male dal terreno (bordo strada, banchina) non deve rovesciare l'auto
   const mv=Math.hypot(pl.vx,pl.vy),fresh=simT-(pl.t0??-99)<2.5;
   if(!fresh&&(pl.tipT>0.18||(Math.abs(tilt)>0.72&&mv>3)||(sf!=='asphalt'&&Math.abs(pl.vy)>7&&Math.abs(pl.vx)>6)))startFlip(Math.sign((Math.abs(tilt)>0.72?tilt:-(pl.ay||pl.vy)))||1,Math.hypot(pl.vx,pl.vy)>13);}
  pl.skid=((pl.lockF||pl.lockR)&&Math.abs(pl.vx)>3)||(pl.spinW>0&&Math.abs(pl.vx)<25)||(pl.slip>(pl.alPk||0.2)*0.9&&Math.abs(pl.vx)>4)||(pl.brkIn>0.95&&Math.abs(pl.vx)>8&&pl.surfR!=='asphalt');
}
function suspension(dt,axInst){
  const P=pl.P,T=pl.T,S=pl.susp,ch=Math.cos(pl.h),sh=Math.sin(pl.h),wx=T.L/2-(T.van?0.85:0.75),tw=T.W/2-0.15;
  // altezza del terreno sotto le quattro ruote
  const at=(fx,rz)=>heightAt(pl.x+ch*fx+sh*rz,pl.z-sh*fx+ch*rz);
  const FL=at(wx,-tw),FR=at(wx,tw),RLh=at(-wx,-tw),RR=at(-wx,tw);
  const hF=(FL+FR)/2,hR=(RLh+RR)/2,hLs=(FL+RLh)/2,hRs=(FR+RR)/2;
  // salita sul cordolo: colpo e un po' di velocità persa
  const v=Math.abs(pl.vx);
  if(hF-S.hF>0.08&&v>1){S.hv+=Math.min(1.2,0.08*v);S.pv+=Math.min(1.5,0.1*v);pl.vx*=0.985;thump(Math.min(1,v/12));}
  if(S.hF-hF>0.08&&v>1){S.pv-=Math.min(1,0.06*v);thump(Math.min(0.6,v/18));}
  S.hF=hF;
  pl.ay+=((pl.latA!=null?pl.latA:pl.r*pl.vx)-(pl.ay||0))*Math.min(1,dt*12);
  const soft=Math.pow(P.h/0.55,0.6)*(pl.T.van?1.2:1);
  const pitchT=Math.atan2(hF-hR,2*wx)+Math.max(-9,Math.min(9,pl.ax))*0.0042*soft;     // affondamento in frenata, accucciata in accelerazione
  const rollT=-Math.atan2(hRs-hLs,2*tw)-Math.max(-9,Math.min(9,pl.ay))*0.0068*soft*(P.rollK||1);     // rollio in curva
  const heaveT=(hF+hR)/2-Math.abs(pl.ay)*0.002;
  const fq=(P.fq||(T.van?1.15:1.45))*2*Math.PI,z=P.zeta||0.32,k=fq*fq,c=2*z*fq;
  S.hv+=(k*(heaveT-S.h)-c*S.hv)*dt;S.h+=S.hv*dt;
  S.pv+=(k*(pitchT-S.p)-c*S.pv)*dt;S.p+=S.pv*dt;
  S.rv+=(k*1.2*(rollT-S.r)-c*1.1*S.rv)*dt;S.r+=S.rv*dt;
  // piccole irregolarità dell'asfalto
}
let thumpCd=0;
// colpo sordo di sospensione: più grave e lungo per i mezzi pesanti, secco per le sportive
function thump(vol){if(!AC||performance.now()<thumpCd)return;thumpCd=performance.now()+250;const P=pl.P||{m:1300},t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(),hv=Math.pow(1300/P.m,0.22),len=0.22/hv;
  o.type='sine';o.frequency.setValueAtTime(95*hv,t);o.frequency.exponentialRampToValueAtTime(38*hv,t+len*0.8);g.gain.setValueAtTime(0.5*vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+len);o.connect(g).connect(ACOUT());o.start(t);o.stop(t+len+0.03);
  noiseHit(vol*0.5,700*hv,0.08,t);}
function noiseHit(vol,f,len,t){if(!AC)return;t=t||AC.currentTime;const b=AC.createBuffer(1,Math.max(1,AC.sampleRate*len)|0,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
  const n=AC.createBufferSource();n.buffer=b;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f;bp.Q.value=1.2;const g=AC.createGain();g.gain.value=vol;n.connect(bp).connect(g).connect(ACOUT());n.start(t);}
// atterraggio dopo un salto: tonfo della scocca, gomme che schiacciano e stridono un attimo, finecorsa che batte
let landCd=0;
function landing(vol,air){if(!AC||performance.now()<landCd)return;landCd=performance.now()+300;const P=pl.P||{m:1300},t=AC.currentTime,hv=Math.pow(1300/P.m,0.22);
  const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(70*hv,t);o.frequency.exponentialRampToValueAtTime(28*hv,t+0.3/hv);g.gain.setValueAtTime(0.9*vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.38/hv);o.connect(g).connect(ACOUT());o.start(t);o.stop(t+0.42/hv);
  noiseHit(0.6*vol,420*hv,0.12,t);if(vol>0.45)noiseHit(0.5*(vol-0.3),1900,0.06,t+0.02);   // il metallo del finecorsa
  if(Math.abs(pl.vx)>8&&air>0.12){const s=AC.createOscillator(),sg=AC.createGain(),bp=AC.createBiquadFilter();s.type='triangle';s.frequency.setValueAtTime(980,t);s.frequency.linearRampToValueAtTime(760,t+0.18);bp.type='bandpass';bp.frequency.value=900;bp.Q.value=4;
    sg.gain.setValueAtTime(0.12*vol,t);sg.gain.exponentialRampToValueAtTime(0.001,t+0.22);s.connect(bp).connect(sg).connect(ACOUT());s.start(t);s.stop(t+0.24);}
  pl.susp.hv-=vol*1.6;pl.susp.pv+=(Math.random()-0.5)*vol*1.2;camKick(vol);if(air>0.55&&air<1)DJ.say('salto');}
function clunk(vol){if(!AC)return;noiseHit(0.35*vol,260,0.09);const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='square';o.frequency.setValueAtTime(55,t);g.gain.setValueAtTime(0.12*vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.09);o.connect(g).connect(ACOUT());o.start(t);o.stop(t+0.1);}
function setWorldVel(wx,wz){const ch=Math.cos(pl.h),sh=Math.sin(pl.h);pl.vx=wx*ch+wz*(-sh);pl.vy=wx*sh+wz*ch;}
function getWorldVel(){const ch=Math.cos(pl.h),sh=Math.sin(pl.h);return[ch*pl.vx+sh*pl.vy,-sh*pl.vx+ch*pl.vy];}
function deformMesh(mesh,lx,ly,lz,nlx,nlz,depth){
  const g=mesh.geometry,pos=g.attributes.position,o=g.userData.orig;if(!o)return;const R=0.95;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    const dist=Math.hypot(x-lx,(y-ly)*0.7,z-lz);if(dist>=R)continue;const f=(1-dist/R)**2*depth;
    let nx=x+nlx*f,nz=z+nlz*f,ny=y-f*0.25;
    const ox=o[i*3],oy=o[i*3+1],oz=o[i*3+2],dx=nx-ox,dy=ny-oy,dz=nz-oz,dl=Math.hypot(dx,dy,dz);
    if(dl>0.32){const k=0.32/dl;nx=ox+dx*k;ny=oy+dy*k;nz=oz+dz*k;}
    pos.setXYZ(i,nx,ny,nz);}
  pos.needsUpdate=true;g.computeVertexNormals();
}
const DAMAGE=false;
function crashSound(vn,zone,pan){if(!AC)return;zone=zone||'front';const t=AC.currentTime,out=AC.createGain(),P=AC.createStereoPanner?AC.createStereoPanner():null;
  out.gain.value=Math.min(1,0.2+vn*0.06);if(P){P.pan.value=pan||0;out.connect(P).connect(ACOUT());}else out.connect(ACOUT());
  const noise=(len,type,f,q,vol,dec)=>{const b=AC.createBuffer(1,AC.sampleRate*len,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,dec);
    const src=AC.createBufferSource();src.buffer=b;const fl=AC.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=AC.createGain();g.gain.value=vol;src.connect(fl).connect(g).connect(out);src.start(t);};
  const thump=(f0,f1,len,vol)=>{const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+len);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+len);o.connect(g).connect(out);o.start(t);o.stop(t+len+0.02);};
  if(zone==='front'){thump(85,35,0.35,0.9);noise(0.35+Math.min(0.3,vn*0.02),'lowpass',1400+vn*60,0.7,0.8,2.5);if(vn>5){noise(0.25,'highpass',4500,1,0.35,1.5);noise(0.12,'bandpass',2600,3,0.4,4);}}
  else if(zone==='rear'){thump(110,55,0.25,0.7);noise(0.3,'bandpass',420,2.5,0.9,2);noise(0.12,'bandpass',1900,4,0.5,5);}
  else{thump(130,70,0.2,0.6);noise(0.55+Math.min(0.5,vn*0.04),'bandpass',950,1.8,0.9,1.2);noise(0.4,'bandpass',3200,6,0.25,1.5);}}
function impact(vn,cx,cz,nx,nz){
  if(vn<1.2||pl.hitCd>0)return;pl.hitCd=0.5;if(vn>2)pl.hits++;
  if(!DAMAGE){const ch=Math.cos(pl.h),sh=Math.sin(pl.h),dx=cx-pl.x,dz=cz-pl.z,lx=dx*ch-dz*sh,lz=dx*sh+dz*ch,T=pl.T;
    const zone=Math.abs(lx)/(T.L/2)>Math.abs(lz)/(T.W/2)?(lx>0?'front':'rear'):'side';
    pl.susp.pv+=(zone==='front'?-1:zone==='rear'?1:0)*Math.min(2,vn*0.1);pl.susp.rv+=(zone==='side'?Math.sign(lz):0)*Math.min(2,vn*0.1);pl.susp.hv+=Math.min(0.6,vn*0.03);
    crashSound(vn,zone,Math.max(-1,Math.min(1,lz/(T.W/2))));return;}
  // punto d'urto e direzione in coordinate dell'auto
  const ch=Math.cos(pl.h),sh=Math.sin(pl.h),dx=cx-pl.x,dz=cz-pl.z;
  const lx=dx*ch-dz*sh,lz=dx*sh+dz*ch,nlx=nx*ch-nz*sh,nlz=nx*sh+nz*ch;
  const sev=Math.min(1,vn*vn*0.0045*pl.P.m/1300);
  const D=pl.dmg,T=pl.T,zone=Math.abs(lx)/(T.L/2)>Math.abs(lz)/(T.W/2)?(lx>0?'front':'rear'):(lz>0?'right':'left');
  D[zone]=Math.min(1,D[zone]+sev);
  if(zone==='front'&&!pl.pullSign)pl.pullSign=Math.random()<0.5?-1:1;
  pl.pull=(pl.pullSign||0)*0.012*Math.min(1,D.front+D.left*0.5+D.right*0.5);
  const depth=Math.min(0.16,0.018*vn);
  deformMesh(pl.mesh.userData.body,lx,0.55,lz,nlx,nlz,depth);
  if(pl.ck.hood&&zone==='front')deformMesh(pl.ck.hood,lx,0.55,lz,nlx,nlz,depth);
  // fari/fanali rotti
  const ud=pl.mesh.userData;
  if(D.front>0.3)ud.heads.forEach(h=>{if(Math.sign(h.position.z)===Math.sign(lz)||D.front>0.6)h.visible=false;});
  if(D.rear>0.3)ud.tails.forEach(t=>{if(Math.sign(t.position.z)===Math.sign(lz)||D.rear>0.6)t.visible=false;});
  pl.dmgFlash=1.5;pl.susp.pv+=-nlx*Math.min(2.5,vn*0.12);pl.susp.rv+=-nlz*Math.min(2.5,vn*0.12);pl.susp.hv+=Math.min(0.8,vn*0.04);
  if(AC){const t=AC.currentTime,len=0.25+Math.min(0.4,vn*0.03),b=AC.createBuffer(1,AC.sampleRate*len,AC.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
    const s=AC.createBufferSource();s.buffer=b;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=900+vn*80;const gg=AC.createGain();gg.gain.value=Math.min(0.9,0.15+vn*0.05);
    s.connect(f).connect(gg).connect(ACOUT());s.start(t);}
}
// ---- oggetti leggeri (cassonetti, sacchi, pile di gomme): restano nel lotto statico finché non vengono urtati, poi diventano oggetti mobili ----
const LOOSE={cells:new Map(),dyn:[],mat:null},_LAX=new THREE.Vector3();
function lkey(x,z){return Math.floor(x/8)+','+Math.floor(z/8);}
function loose(T,pb,x,z,y,r,m,fn,wheels){const v0=pb.n;fn();const it={x,z,y,y0:y,r,m,pb,v0,v1:pb.n,T,wheels:!!wheels};(T.loose=T.loose||[]).push(it);const k=lkey(x,z);let l=LOOSE.cells.get(k);if(!l)LOOSE.cells.set(k,l=[]);l.push(it);}
function looseDrop(T){(T.loose||[]).forEach(it=>{const l=LOOSE.cells.get(it.k||lkey(it.x,it.z));if(l){const i=l.indexOf(it);if(i>=0)l.splice(i,1);}if(it.mesh){scene.remove(it.mesh);it.mesh.geometry.dispose();const j=LOOSE.dyn.indexOf(it);if(j>=0)LOOSE.dyn.splice(j,1);}});T.loose=[];}
function looseDetach(it){const M=it.pb.m;if(!M)return false;const P=M.geometry.attributes.position,C=M.geometry.attributes.color,n=it.v1-it.v0,ox=it.x-it.pb.x0,oz=it.z-it.pb.z0;
  const pos=new Float32Array(n*3),col=new Float32Array(n*3);
  for(let i=0;i<n;i++){const j=it.v0+i;pos[i*3]=P.getX(j)-ox;pos[i*3+1]=P.getY(j)-it.y;pos[i*3+2]=P.getZ(j)-oz;col[i*3]=C.getX(j);col[i*3+1]=C.getY(j);col[i*3+2]=C.getZ(j);P.setXYZ(j,ox,-80,oz);}
  P.needsUpdate=true;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
  const m=new THREE.Mesh(g,LOOSE.mat);m.position.set(it.x,it.y,it.z);m.userData.x0=it.x;m.userData.z0=it.z;m.castShadow=true;scene.add(m);Object.assign(it,{mesh:m,yaw:0,vx:0,vz:0,vy:0,wy:0,tip:0,tipV:0,tax:0,taz:0,k:lkey(it.x,it.z)});LOOSE.dyn.push(it);return true;}
// urto auto-oggetto: impulso secondo le masse; l'auto perde solo la quantità di moto che cede all'oggetto
function looseHit(it,c,rad){const dx=it.x-c.x,dz=it.z-c.z,dd=Math.hypot(dx,dz)||1e-3,rr=rad+it.r;if(dd>=rr)return;
  if(!it.mesh&&!looseDetach(it))return;const nx=dx/dd,nz=dz/dd,m1=pl.P.m,m2=it.m;it.x+=nx*(rr-dd);it.z+=nz*(rr-dd);
  let[wx,wz]=getWorldVel();const vr=(wx-it.vx)*nx+(wz-it.vz)*nz;if(vr<=0)return;
  const j=(1+0.35)*vr/(1/m1+1/m2);it.vx+=nx*j/m2;it.vz+=nz*j/m2;wx-=nx*j/m1;wz-=nz*j/m1;setWorldVel(wx,wz);
  const tv=Math.hypot(wx,wz);it.wy+=(Math.random()-0.5)*Math.min(8,vr*0.9);if(vr>2.5){it.vy=Math.min(5,vr*0.22);}
  if(vr>4&&it.r>0.4){it.tipV=Math.min(6,vr*0.5);it.tax=nz;it.taz=-nx;}
  if(vr>1.2)crashSound(Math.min(2.2,vr*0.12*Math.sqrt(m2/60)),'front',0);}
function looseUpdate(dt){for(const it of LOOSE.dyn){const sp=Math.hypot(it.vx,it.vz);if(sp<0.01&&it.vy===0&&Math.abs(it.wy)<0.01&&it.tipV===0)continue;
  const gH=TH(it.x,it.z),gnd=Math.max(gH,Math.hypot(it.x-it.mesh.userData.x0,it.z-it.mesh.userData.z0)<0.9?it.y0:gH);
  it.x+=it.vx*dt;it.z+=it.vz*dt;it.y+=it.vy*dt;
  if(it.y>gnd+0.01){it.vy-=9.8*dt;}else{it.y=gnd;if(it.vy<-2)it.vy*=-0.25;else it.vy=0;
    const mu=it.tip>0.8?0.7:(it.wheels?0.25:0.55),d=Math.min(sp,mu*9.8*dt);if(sp>0){it.vx-=it.vx/sp*d;it.vz-=it.vz/sp*d;}it.wy*=Math.max(0,1-dt*3);}
  if(it.tipV){it.tip+=it.tipV*dt;if(it.tip>=Math.PI/2){it.tip=Math.PI/2;it.tipV=0;it.y=gnd;}}
  const M=it.mesh;it.yaw+=it.wy*dt;M.position.set(it.x,it.y+(it.tip?Math.sin(it.tip)*0.35:0),it.z);
  if(it.tip){M.quaternion.setFromAxisAngle(_LAX.set(it.tax,0,it.taz),it.tip);M.rotateY(it.yaw);}else M.rotation.set(0,it.yaw,0);
  const k=lkey(it.x,it.z);if(k!==it.k){const a=LOOSE.cells.get(it.k);if(a){const i=a.indexOf(it);if(i>=0)a.splice(i,1);}let b=LOOSE.cells.get(k);if(!b)LOOSE.cells.set(k,b=[]);b.push(it);it.k=k;}}}
// auto del traffico urtata: scivola e ruota con l'attrito delle gomme, poi l'autista la rimette piano in corsia
function knock(c,dt){const K=c.kn;if(!K)return;const sp=Math.hypot(K.vx,K.vz);
  if(sp>0){const d=Math.min(sp,7*dt);K.vx-=K.vx/sp*d;K.vz-=K.vz/sp*d;}K.r-=Math.sign(K.r)*Math.min(Math.abs(K.r),5*dt);
  K.x+=K.vx*dt;K.z+=K.vz*dt;K.yaw+=K.r*dt;
  if(sp<0.05&&Math.abs(K.r)<0.05&&(c.hold||0)<=0.5){const ds=Math.hypot(K.x,K.z),st=Math.min(ds,0.9*dt);if(ds>1e-3){K.x-=K.x/ds*st;K.z-=K.z/ds*st;}K.yaw-=Math.sign(K.yaw)*Math.min(Math.abs(K.yaw),0.35*dt);
    if(ds<0.02&&Math.abs(K.yaw)<0.01){c.kn=null;return;}if(ds>0.3)c.v=Math.min(c.v,1.5);}
  else c.v=Math.min(c.v,0.5);
  c.mesh.position.x+=K.x;c.mesh.position.z+=K.z;c.mesh.rotation.y+=K.yaw;}
function collide(dt){if(window.__nocol)return;
  pl.hitCd-=dt;const T=pl.T,ch=Math.cos(pl.h),sh=Math.sin(pl.h),rad=T.W/2+0.03;
  const circ=[-1,-0.33,0.33,1].map(t=>({x:pl.x+ch*t*(T.L/2-rad),z:pl.z-sh*t*(T.L/2-rad)}));
  // urto con un'auto del traffico: si scambiano quantità di moto in base alle masse (il furgone ti sposta, tu sposti la Panda)
  function carHit(nx,nz,pen,c,car){const m1=pl.P.m,m2=car.m,cdx=car.dx||1,cdz=car.dz||0,along=nx*cdx+nz*cdz,K=car.kn||(car.kn={x:0,z:0,vx:0,vz:0,yaw:0,r:0});
    pl.x+=nx*pen*m2/(m1+m2);pl.z+=nz*pen*m2/(m1+m2);const pc=pen*m1/(m1+m2);car.s-=along*pc;K.x-=(nx-along*cdx)*pc;K.z-=(nz-along*cdz)*pc;
    let[wx,wz]=getWorldVel();const vcx=cdx*car.v+K.vx,vcz=cdz*car.v+K.vz,vr=(wx-vcx)*nx+(wz-vcz)*nz;if(vr>=0)return;
    const j=-(1.25)*vr/(1/m1+1/m2);wx+=nx*j/m1;wz+=nz*j/m1;setWorldVel(wx,wz);
    // l'auto urtata: la parte lungo la sua direzione cambia la sua velocità, quella di lato la fa scivolare, il braccio la fa ruotare
    const dvL=-along*j/m2;if(car.v+dvL<0){K.vx+=cdx*(car.v+dvL);K.vz+=cdz*(car.v+dvL);car.v=0;}else car.v+=dvL;
    K.vx+=(-nx+along*cdx)*j/m2;K.vz+=(-nz+along*cdz)*j/m2;
    {const p=car.mesh.position,rx=c.x-nx*rad-p.x,rz=c.z-nz*rad-p.z,I=m2*(car.T.L*car.T.L+car.T.W*car.T.W)/12;K.r+=(rz*(-nx*j)-rx*(-nz*j))/I;}
    car.hold=Math.max(car.hold||0,2.5);
    const ch=Math.cos(pl.h),sh=Math.sin(pl.h),lev=(c.x-pl.x)*ch+(c.z-pl.z)*(-sh),jy=(nx*sh+nz*ch)*j;pl.r+=lev*jy/(m1*1.6)*0.6;
    impact(-vr*Math.min(1.4,2*m2/(m1+m2)),c.x-nx*rad,c.z-nz*rad,nx,nz);}
  function resolve(nx,nz,pen,c,other){pl.x+=nx*pen;pl.z+=nz*pen;let[wx,wz]=getWorldVel();let vn=wx*nx+wz*nz;
    if(other)vn-=(other.dx*nx+other.dz*nz)*other.v;
    if(vn<0){impact(-vn,c.x-nx*rad,c.z-nz*rad,nx,nz);wx-=1.25*vn*nx;wz-=1.25*vn*nz;wx*=0.85;wz*=0.85;setWorldVel(wx,wz);pl.r*=0.6;}}
  for(const c of circ){
    for(const o of obstaclesBox){if(c.x<o.x0-3||c.x>o.x1+3||c.z<o.z0-3||c.z>o.z1+3)continue;
      const qx=Math.max(o.x0,Math.min(c.x,o.x1)),qz=Math.max(o.z0,Math.min(c.z,o.z1));let dx=c.x-qx,dz=c.z-qz,dd=Math.hypot(dx,dz);
      if(dd<rad){if(dd<1e-4){dx=0;dz=1;dd=0;}resolve(dx/(dd||1),dz/(dd||1),rad-dd,c);}}
    for(const o of obstaclesCirc){const dx=c.x-o.x,dz=c.z-o.z,dd=Math.hypot(dx,dz);if(dd<rad+o.r&&dd>1e-4)resolve(dx/dd,dz/dd,rad+o.r-dd,c);}
    for(const o of gridQ(c.x,c.z)){
      if(o.seg){const ex=o.x2-o.x1,ez=o.z2-o.z1,l2=ex*ex+ez*ez||1;let t=((c.x-o.x1)*ex+(c.z-o.z1)*ez)/l2;t=Math.max(0,Math.min(1,t));
        const qx=o.x1+ex*t,qz=o.z1+ez*t,dx=c.x-qx,dz=c.z-qz,dd=Math.hypot(dx,dz);if(dd<rad+o.r&&dd>1e-4)resolve(dx/dd,dz/dd,rad+o.r-dd,c);}
      else{const dx=c.x-o.x,dz=c.z-o.z,dd=Math.hypot(dx,dz);if(dd<rad+o.r&&dd>1e-4)resolve(dx/dd,dz/dd,rad+o.r-dd,c);}}
    if(NWT&&c.x>6000){for(const o of NWT.segQ(c.x,c.z)){const ex=o[2]-o[0],ez=o[3]-o[1],l2=ex*ex+ez*ez;let t=l2>1e-6?((c.x-o[0])*ex+(c.z-o[1])*ez)/l2:0;t=t<0?0:t>1?1:t;
        const qx=o[0]+ex*t,qz=o[1]+ez*t,dx=c.x-qx,dz=c.z-qz,dd=Math.hypot(dx,dz),r2=l2<1?rad+0.35:rad;if(dd<r2&&dd>1e-4)resolve(dx/dd,dz/dd,r2-dd,c);}
      // parapetti dei ponti
      const onFlat=NW.near(c.x,c.z,0).some(o=>!o.R.b&&o.d<o.R.w/2+0.3&&Math.abs(o.h-pl.terrH)<1.5);
      if(!onFlat)for(const q of NW.near(c.x,c.z,NW.BRX+0.8)){if(!q.R.b||Math.abs(q.h-pl.terrH)>1.5||q.t<=0.002||q.t>=0.998)continue;const hw=q.R.w/2+NW.BRX;if(q.d>hw-rad&&q.d<hw+0.8){const R=q.R,ax=R.X[q.i],az=R.Z[q.i],ex=R.X[q.i+1]-ax,ez=R.Z[q.i+1]-az,qx=ax+ex*q.t,qz=az+ez*q.t,dx=qx-c.x,dz=qz-c.z,dd=Math.hypot(dx,dz)||1;resolve(dx/dd,dz/dd,q.d-(hw-rad),c);}}}
    {const cx=Math.floor(c.x/8),cz=Math.floor(c.z/8);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const l=LOOSE.cells.get((cx+a)+','+(cz+b));if(l)for(let i=l.length-1;i>=0;i--)looseHit(l[i],c,rad);}}
    for(const A of animals){const dx=c.x-A.x,dz=c.z-A.z;if(Math.abs(dx)>3||Math.abs(dz)>3)continue;const dd=Math.hypot(dx,dz),ar=A.kind==='cow'?0.95:0.55;
      if(dd<rad+ar&&dd>1e-4){const[wx,wz]=getWorldVel();const vn=-(wx*dx+wz*dz)/dd;A.x-=dx/dd*0.6;A.z-=dz/dd*0.6;A.st='flee';A.t=4;A.hd=Math.atan2(-dz,-dx);
        pl.x+=dx/dd*(rad+ar-dd)*0.6;pl.z+=dz/dd*(rad+ar-dd)*0.6;if(vn>0.5){setWorldVel(wx*0.6,wz*0.6);if(vn>2&&pl.hitCd<=0){pl.hitCd=1;pl.hits++;crashSound(Math.min(6,vn),'front',0);}}}}
    for(const pd of peds){if(pd.down)continue;const q=pd.m.position;const dx=c.x-q.x,dz=c.z-q.z;if(Math.abs(dx)>3||Math.abs(dz)>3)continue;const dd=Math.hypot(dx,dz);
      if(dd<rad+0.3){const sp=Math.hypot(pl.vx,pl.vy);if(sp>1.6)pedHit(pd,sp);else{pd.t=Math.max(0,pd.t-0.02);if(dd>1e-3){pl.x+=dx/dd*(rad+0.3-dd);pl.z+=dz/dd*(rad+0.3-dd);}pl.vx*=0.5;}}}
    for(const car of cars){const p=car.mesh.position;if(Math.abs(p.x-c.x)>6||Math.abs(p.z-c.z)>6)continue;
      const ry=car.mesh.rotation.y,d={x:Math.cos(ry),z:-Math.sin(ry)},hl=car.T.L/2-car.T.W/2;
      for(const t of[-1,0,1]){const ox=p.x+d.x*t*hl,oz=p.z+d.z*t*hl,dx=c.x-ox,dz=c.z-oz,dd=Math.hypot(dx,dz),rr=rad+car.T.W/2;
        if(dd<rr&&dd>1e-4){if(car.m){carHit(dx/dd,dz/dd,rr-dd,c,car);}else{resolve(dx/dd,dz/dd,rr-dd,c,car);if(car.hold<=0)car.v*=0.3;}car.hold=Math.max(car.hold,1.2);aiAngry(car,1.1);}}}
  }
}

// clacson del giocatore: il veicolo davanti, nella stessa direzione, prova a farsi da parte
function hornPush(){if(!pl.P||!started)return;const fx=Math.cos(pl.h),fz=-Math.sin(pl.h);let best=null,bd=1e9;
  cars.forEach(c=>{if(!c.ln||!c.mesh.visible)return;const p=c.mesh.position,dx=p.x-pl.x,dz=p.z-pl.z,al=dx*fx+dz*fz,lat=-dx*fz+dz*fx;
    if(al<1||al>30||Math.abs(lat)>2.6)return;const ry=c.mesh.rotation.y;if(Math.cos(ry)*fx-Math.sin(ry)*fz<0.6)return;if(al<bd){bd=al;best=c;}});
  if(best)best.yieldPl=simT+4.5;}
