// Guido · 07 audio — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ================= AUDIO =================
let AC=null,eng=null;
// parametri acustici di ogni motore: lunghezze dei tubi (in campioni), marmitta, durata dello scoppio (diesel = più secco)
function engineParams(k,P){const base={cylinders:P.cyl||4,intakeWaveguideLength:90,exhaustWaveguideLength:100,extractorWaveguideLength:100,intakeOpenReflectionFactor:0.01,intakeClosedReflectionFactor:0.95,
  exhaustOpenReflectionFactor:0.01,exhaustClosedReflectionFactor:0.95,ignitionTime:P.diesel?0.009:0.016,straightPipeWaveguideLength:128,straightPipeReflectionFactor:0.01,mufflerElementsLength:[10,15,20,25],action:0.1,outletWaveguideLength:5,outletReflectionFactor:0.01};
  const T={utilitaria:{intakeWaveguideLength:55,exhaustWaveguideLength:42,extractorWaveguideLength:48,straightPipeWaveguideLength:58,mufflerElementsLength:[5,7,9,12],action:0.16,ignitionTime:0.011,outletWaveguideLength:3},
    volvo:{exhaustWaveguideLength:110,straightPipeWaveguideLength:160,mufflerElementsLength:[12,18,24,30],action:0.15},
    wagoneer:{exhaustWaveguideLength:140,extractorWaveguideLength:120,straightPipeWaveguideLength:200,mufflerElementsLength:[14,20,28,36],action:0.08,ignitionTime:0.02,offsets:[0,0,0.03,-0.03,0,0,0.03,-0.03]},
    hellcat:{exhaustWaveguideLength:100,extractorWaveguideLength:90,straightPipeWaveguideLength:150,mufflerElementsLength:[10,15,20,25],action:0.05,ignitionTime:0.013,offsets:[0,0,0.035,-0.035,0,0,0.035,-0.035]},
    zil:{exhaustWaveguideLength:150,extractorWaveguideLength:125,straightPipeWaveguideLength:210,mufflerElementsLength:[14,20,28,36],action:0.07,ignitionTime:0.02,offsets:[0,0,0.025,-0.025,0,0,0.025,-0.025]},
    taxi:{exhaustWaveguideLength:125,extractorWaveguideLength:110,straightPipeWaveguideLength:180,mufflerElementsLength:[12,18,26,34],action:0.06,offsets:[0,0,0.02,-0.02,0,0,0.02,-0.02]},
    daily:{exhaustWaveguideLength:100,straightPipeWaveguideLength:150,mufflerElementsLength:[12,18,24,30],action:0.15}};
  return Object.assign(base,T[k]||{});}
// livello di ogni motore a guide d'onda, misurato perché al massimo dei giri il picco resti sotto 0,7 (prima i V8 e la Volvo saturavano e gracchiavano)
const WKN={utilitaria:0.8,volvo:0.38,wagoneer:0.5,hellcat:0.42,zil:0.37,daily:1.05,taxi:0.85};
function initAudio(){
  if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)({latencyHint:0.06});}catch(e){AC=new (window.AudioContext||window.webkitAudioContext)();}}
  if(eng){eng.stopAll();}
  // bus del motore: tutto il motore passa da qui, così se un filtro impazzisce si stacca solo questo e si ricostruisce
  const EB=AC.createGain();EB.connect(ACOUT());const EAN=AC.createAnalyser();EAN.fftSize=512;EB.connect(EAN);
  const P=PHYS[selKey],nodes=[];
  const buf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),dd=buf.getChannelData(0);{let b=0;for(let i=0;i<dd.length;i++){const w=Math.random()*2-1;b=0.97*b+0.03*w;dd[i]=w*0.6+b*3;}}
  const nz=AC.createBufferSource();nz.buffer=buf;nz.loop=true;nodes.push(nz);
  const master=AC.createGain();master.gain.value=0;master.connect(EB);
  // filtro "abitacolo": i suoni del motore arrivano smorzati, con il corpo sui bassi
  const cab=AC.createBiquadFilter();cab.type='lowpass';cab.frequency.value=900;cab.Q.value=0.5;
  const body=AC.createBiquadFilter();body.type='lowshelf';body.frequency.value=160;body.gain.value=(P.snd&&P.snd.small)?-3:6;
  cab.connect(body).connect(master);
  // ordini armonici del motore (rispetto alla frequenza di scoppio)
  const SN=P.snd||{};
  // V8 con albero a croce: scoppi irregolari fra le due bancate → mezzi ordini forti (il "borbottio"); 4 cilindri: secondo ordine ruvido
  const orders=P.cyl===3?[[0.5,0.55],[1,0.7],[1.5,0.35],[2,0.25],[3,0.1]]:P.cyl===8?(P.diesel?[[0.25,0.2],[0.5,0.5],[1,0.8],[2,0.3],[3,0.14]]:[[0.25,0.16*(SN.lope||1)],[0.5,0.55],[1,0.75],[1.5,0.2],[2,0.35],[3,0.1]]):(P.diesel?[[0.5,0.35],[1,0.8],[2,0.35],[3,0.18],[4,0.08]]:[[0.5,0.25],[1,0.75],[2,0.4],[3,0.15],[4,0.1]]);
  // motore piccolo (Panda 1000 a carburatore): niente borbottio, armoniche alte, timbro ronzante
  if(SN.small)orders.splice(0,orders.length,[1,0.6],[2,0.6],[3,0.3],[4,0.22],[6,0.08]);
  const osc=orders.map(([o,a])=>{const os=AC.createOscillator();os.type=o===1?'triangle':'sine';const g=AC.createGain();g.gain.value=a*0.5;os.connect(g).connect(cab);os.start();nodes.push(os);return{os,o,g,a};});
  // combustione: rumore filtrato modulato in ampiezza alla frequenza di scoppio (dà la "grana" reale)
  const cbp=AC.createBiquadFilter();cbp.type='bandpass';cbp.Q.value=0.9;const am=AC.createGain();am.gain.value=0;const cg=AC.createGain();cg.gain.value=P.diesel?0.5:0.3;
  nz.connect(cbp).connect(am).connect(cg).connect(cab);
  const mod=AC.createOscillator();mod.type='sine';const modG=AC.createGain();modG.gain.value=0.5;mod.connect(modG).connect(am.gain);mod.start();nodes.push(mod);
  const amBase=AC.createConstantSource?AC.createConstantSource():null;if(amBase){amBase.offset.value=0.5;amBase.connect(am.gain);amBase.start();nodes.push(amBase);}
  // ticchettio diesel (iniettori)
  const dbp=AC.createBiquadFilter();dbp.type='bandpass';dbp.frequency.value=2100;dbp.Q.value=2.5;const dam=AC.createGain();dam.gain.value=0;const dg=AC.createGain();dg.gain.value=P.diesel?0.10:0;
  nz.connect(dbp).connect(dam).connect(dg).connect(master);const dmod=AC.createOscillator();dmod.type='square';const dmg=AC.createGain();dmg.gain.value=0.5;dmod.connect(dmg).connect(dam.gain);dmod.start();nodes.push(dmod);
  // irregolarità di giri (nessun motore è perfettamente regolare)
  const lfo=AC.createOscillator();lfo.frequency.value=P.cyl===8?2.1:3.3;const lfoG=AC.createGain();lfoG.gain.value=6+(SN.lope||0)*14+(SN.rough?(SN.rough-1)*20:0);lfo.connect(lfoG);osc.forEach(x=>lfoG.connect(x.os.detune));lfo.start();nodes.push(lfo);
  // gomme che stridono, vento, rotolamento
  const tb=AC.createBiquadFilter();tb.type='bandpass';tb.frequency.value=500;tb.Q.value=1.5;const tg=AC.createGain();tg.gain.value=0;nz.connect(tb).connect(tg).connect(EB);
  // stridio delle gomme: toni stretti su rumore, con un tremolio irregolare (come la gomma che vibra sull'asfalto)
  const sqg=AC.createGain();sqg.gain.value=0;const sqhs=AC.createBiquadFilter();sqhs.type='highshelf';sqhs.frequency.value=2500;sqhs.gain.value=-6;sqg.connect(sqhs).connect(EB);
  const sq=AC.createOscillator();sq.type='triangle';sq.frequency.value=900;const sq2=AC.createOscillator();sq2.type='sine';sq2.frequency.value=1780;
  const v1=AC.createOscillator();v1.frequency.value=6.3;const v1g=AC.createGain();v1g.gain.value=26;v1.connect(v1g);v1g.connect(sq.frequency);
  const v2=AC.createOscillator();v2.frequency.value=13.7;const v2g=AC.createGain();v2g.gain.value=12;v2.connect(v2g);v2g.connect(sq.frequency);const v3g=AC.createGain();v3g.gain.value=44;v1.connect(v3g);v3g.connect(sq2.frequency);
  const sqf=AC.createBiquadFilter();sqf.type='bandpass';sqf.Q.value=5;sqf.frequency.value=900;const sqt=AC.createGain();sqt.gain.value=0.07;sq.connect(sqf).connect(sqt).connect(sqg);const sq2g=AC.createGain();sq2g.gain.value=0.025;sq2.connect(sq2g).connect(sqg);
  const sqb1=AC.createBiquadFilter();sqb1.type='bandpass';sqb1.Q.value=9;sqb1.frequency.value=900;const sqb1g=AC.createGain();sqb1g.gain.value=2.6;nz.connect(sqb1).connect(sqb1g).connect(sqg);
  const sqb2=AC.createBiquadFilter();sqb2.type='bandpass';sqb2.Q.value=7;sqb2.frequency.value=1850;const sqb2g=AC.createGain();sqb2g.gain.value=1.0;nz.connect(sqb2).connect(sqb2g).connect(sqg);
  // corpo largo dello stridio: rumore filtrato, meno "fischio" e più gomma che graffia
  {const b3=AC.createBiquadFilter();b3.type='bandpass';b3.Q.value=2.2;b3.frequency.value=1300;const g3=AC.createGain();g3.gain.value=0.9;nz.connect(b3).connect(g3).connect(sqg);}
  sq.start();sq2.start();v1.start();v2.start();nodes.push(sq,sq2,v1,v2);
  const wf=AC.createBiquadFilter();wf.type='bandpass';wf.frequency.value=700;wf.Q.value=0.4;const wg=AC.createGain();wg.gain.value=0;nz.connect(wf).connect(wg).connect(EB);
  const rf=AC.createBiquadFilter();rf.type='lowpass';rf.frequency.value=380;const rg=AC.createGain();rg.gain.value=0;nz.connect(rf).connect(rg).connect(EB);
  // fruscio d'aria quando si incrocia o si sorpassa un'auto (o si sfiora un muro)
  const pbf=AC.createBiquadFilter();pbf.type='bandpass';pbf.frequency.value=900;pbf.Q.value=0.8;const pbg=AC.createGain();pbg.gain.value=0;const pbp=AC.createStereoPanner?AC.createStereoPanner():null;nz.connect(pbf).connect(pbg);if(pbp)pbg.connect(pbp).connect(EB);else pbg.connect(EB);
  // fischio dell'aria sui montanti ad alta velocità
  const whf=AC.createBiquadFilter();whf.type='bandpass';whf.frequency.value=2200;whf.Q.value=3;const whg=AC.createGain();whg.gain.value=0;nz.connect(whf).connect(whg).connect(EB);
  // gomme al limite: prima dello stridio si sente lo "strisciare" sordo del battistrada
  const scf=AC.createBiquadFilter();scf.type='bandpass';scf.frequency.value=320;scf.Q.value=0.8;const scg=AC.createGain();scg.gain.value=0;nz.connect(scf).connect(scg).connect(EB);
  // compressore volumetrico (Hellcat): fischio acuto che sale coi giri e col carico
  let bl=null;if(SN.blower){const o1=AC.createOscillator(),o2=AC.createOscillator();o1.type='sine';o2.type='triangle';const g=AC.createGain();g.gain.value=0;const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=500;
    const g2=AC.createGain();g2.gain.value=0.35;o1.connect(g);o2.connect(g2).connect(g);g.connect(hp).connect(EB);o1.start();o2.start();nodes.push(o1,o2);bl={o1,o2,g};}
  // riverbero della galleria: risposta all'impulso sintetica (2 s), dosata da tunnelUpdate
  const cv=AC.createConvolver();{const n=AC.sampleRate*2,b=AC.createBuffer(2,n,AC.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3.2)*(i<200?i/200:1);}cv.buffer=b;}
  const rvg=AC.createGain();rvg.gain.value=0;master.connect(cv).connect(rvg).connect(EB);
  // motore a guide d'onda (AudioWorklet): il suono nasce da cilindri, collettori e marmitta; gli oscillatori restano sotto come corpo
  if(AC.audioWorklet&&CFG.wg!==false&&!window.__wgOff){const KP=P,mk=()=>{if(!eng||eng.P!==KP)return;try{const n=new AudioWorkletNode(AC,'engine-sound-processor',{numberOfInputs:0,numberOfOutputs:3,processorOptions:engineParams(selKey,P)});
      const gI=AC.createGain(),gB=AC.createGain(),gO=AC.createGain();gI.gain.value=0.3;gB.gain.value=0.55;gO.gain.value=1;const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=30;
      const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2200;lp.Q.value=0.4;const g=AC.createGain();g.gain.value=0;n.connect(gI,0);n.connect(gB,1);n.connect(gO,2);[gI,gB,gO].forEach(x=>x.connect(hp));hp.connect(lp).connect(g).connect(master);
      eng.wk={n,g,lp,rpm:n.parameters.get('rpm'),thr:n.parameters.get('throttle')};n.port.onmessage=()=>{console.warn('motore a guide d\'onda instabile: si riavvia');setTimeout(()=>{if(eng&&eng.wk&&eng.wk.n===n)initAudio();},250);};nodes.push({stop(){try{n.disconnect();g.disconnect();}catch(e){}}});}catch(e){console.warn('motore a guide d\'onda',e);}};
    if(window.__wkReady)setTimeout(mk,0);else AC.audioWorklet.addModule('js/motore_worklet.js').then(()=>{window.__wkReady=1;mk();}).catch(e=>console.warn(e));}
  nz.start();
  eng={P,SN,bl,rvg,scf,scg,osc,cab,master,cbp,mod,cg,dmod,tg,sqg,sq,sq2,sqf,sqb1,sqb2,wg,wf,rg,rf,pbf,pbg,pbp,whf,whg,bus:EB,an:EAN,stopAll:()=>{nodes.forEach(n=>{try{n.stop();}catch(e){}});try{EB.disconnect();}catch(e){}}};
  initTrafficVoices();initSirens();
}
function updateAudio(st){if(!eng||!AC)return;const P=eng.P,t=AC.currentTime;
  const f=Math.max(10,st.rpm/60*P.cyl/2),load=st.load,r=st.rpm/P.red;
  if(!isFinite(f)||!isFinite(load)||!isFinite(r))return;
  const wk=eng.wk,ok=wk?0.45:1;
  if(wk){wk.rpm.setTargetAtTime(Math.max(300,st.rpm),t,0.02);wk.thr.setTargetAtTime(Math.max(0.06,load),t,0.05);wk.g.gain.setTargetAtTime(0.62*Math.pow(4/(P.cyl||4),0.6)*(WKN[selKey]??0.6)*(0.55+load*0.65+r*0.25),t,0.05);wk.lp.frequency.setTargetAtTime((view==='cockpit'?850:1500)+load*1600+r*1400,t,0.06);}
  eng.osc.forEach(x=>{x.os.frequency.setTargetAtTime(f*x.o,t,0.025);x.g.gain.setTargetAtTime(ok*x.a*(x.o<=1?0.55:0.25+load*0.55+r*0.3),t,0.05);});
  eng.mod.frequency.setTargetAtTime(f,t,0.025);eng.dmod.frequency.setTargetAtTime(f*0.5,t,0.03);
  eng.cbp.frequency.setTargetAtTime(150+f*2.5+load*300,t,0.05);eng.cg.gain.setTargetAtTime((P.diesel?0.45:0.22)*(0.4+load*0.9)*(wk?0.6:1),t,0.05);
  eng.cab.frequency.setTargetAtTime((P.diesel?420:eng.SN.small?900:520)+load*(P.diesel?500:900)+r*600,t,0.06);
  eng.master.gain.setTargetAtTime((0.10+load*0.10+r*0.07)*(eng.SN.exh||1)*(CFG.engVol??1),t,0.06);
  if(eng.bl){const bf=st.rpm/60*11.5;eng.bl.o1.frequency.setTargetAtTime(bf,t,0.03);eng.bl.o2.frequency.setTargetAtTime(bf*2.02,t,0.03);eng.bl.g.gain.setTargetAtTime(Math.min(0.06,(0.004+load*0.05)*r*r*1.6)*(CFG.engVol??1),t,0.05);}
  if(eng.SN.rough)eng.cg.gain.setTargetAtTime((P.diesel?0.45:0.22)*(0.4+load*0.9)*eng.SN.rough,t,0.05);
  {const sf0=pl.surfR||'asphalt',v=Math.abs(pl.vx),lat=v>6?Math.max(0,st.slip/(pl.alPk||0.2)-0.95)*0.8:0,brake=(pl.absOn&&v>8)?0.05*(0.6+0.4*Math.abs(Math.sin(t*2*Math.PI*13))):((pl.lockF||pl.lockR)&&v>3?0.22:0),spin=(pl.spinW>0.15&&v<(pl.surfR==='asphalt'?22:15))?(pl.surfR==='asphalt'?Math.min(0.14,Math.max(0,pl.spinW-0.5)*0.35)*(v<12?1:Math.max(0,1-(v-12)/10)):0.1):0;
   const amt=Math.min(0.3,lat+brake+spin);
   if(sf0==='asphalt'&&!pl.flip){{const up=amt>(eng.sqA||0);eng.sqA=amt;eng.sqg.gain.setTargetAtTime(amt*(WX==='rain'?0.4:1),t,up?0.09:0.16);}eng.sqW=Math.max(-1,Math.min(1,(eng.sqW||0)+(Math.random()-0.5)*0.25));{const f0=(720+v*3.2+lat*220+(pl.lockF||pl.lockR?100:0))*(1+eng.sqW*0.035);eng.sq.frequency.setTargetAtTime(f0,t,0.12);eng.sq2.frequency.setTargetAtTime(f0*1.98,t,0.12);eng.sqf.frequency.setTargetAtTime(f0,t,0.12);eng.sqb1.frequency.setTargetAtTime(f0,t,0.12);eng.sqb2.frequency.setTargetAtTime(f0*2.05,t,0.12);}eng.tg.gain.setTargetAtTime(0,t,0.05);}
   else{eng.sqg.gain.setTargetAtTime(0,t,0.05);eng.tg.gain.setTargetAtTime(Math.min(0.25,(lat+spin+brake)*1.4)*(sf0==='asphalt'?0:1),t,0.05);}}
  const v=st.kmh/3.6,sf=pl.surfR||'asphalt';
  {const sc=(sf==='asphalt'&&!pl.air)?Math.max(0,Math.min(0.12,((pl.slip||0)/(pl.alPk||0.2)-0.65)*0.5))*Math.min(1,v/9):0;eng.scg.gain.setTargetAtTime(sc,t,0.06);eng.scf.frequency.setTargetAtTime(240+v*5,t,0.1);}
  eng.wg.gain.setTargetAtTime(0,t,0.15);/* fruscio d'aria crescente con la velocità: tolto */eng.wf.frequency.setTargetAtTime(380+v*18,t,0.15);
  eng.whg.gain.setTargetAtTime(0,t,0.3);eng.whf.frequency.setTargetAtTime(1600+v*22,t,0.3);
  passBy(t,v);
  eng.rg.gain.setTargetAtTime(sf==='asphalt'?Math.min(0.055,v*0.0017):Math.min(0.3,v*0.014),t,0.08);eng.rf.frequency.setTargetAtTime(sf==='asphalt'?170+v*4:900,t,0.1);
  updateTrafficVoices(t);}
// ---- voci dei veicoli vicini: motore + rotolamento, con distanza ed effetto Doppler ----
let tVoices=[],tvT=0;
function initTrafficVoices(){tVoices.forEach(v=>{try{v.o.stop();v.n.stop();}catch(e){}});tVoices=[];
  for(let i=0;i<3;i++){const g=AC.createGain();g.gain.value=0;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=700;lp.connect(g);g.connect(ACOUT());
    const o=AC.createOscillator();o.type='triangle';const og=AC.createGain();og.gain.value=0.5;o.connect(og).connect(lp);o.start();
    const n=AC.createBufferSource();n.buffer=eng?null:null;const b=AC.createBuffer(1,AC.sampleRate,AC.sampleRate),d=b.getChannelData(0);let q=0;for(let k=0;k<d.length;k++){q=0.95*q+0.05*(Math.random()*2-1);d[k]=q*4;}
    n.buffer=b;n.loop=true;const ng=AC.createGain();ng.gain.value=0.6;n.connect(ng).connect(lp);n.start();tVoices.push({g,lp,o,n,car:null});}}
let sirens=[];
function initSirens(){sirens.forEach(sv=>{try{sv.o.stop();}catch(e){}});sirens=EMS.map(c=>{const o=AC.createOscillator();o.type=c.em.kind==='fire'?'sawtooth':'square';const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=2200;
  const g=AC.createGain();g.gain.value=0;const pn=AC.createStereoPanner?AC.createStereoPanner():null;o.connect(f).connect(g);if(pn){g.connect(pn).connect(ACOUT());}else g.connect(ACOUT());o.start();return{c,o,g,pn};});}
function updateSirens(t){if(NWT){sirens.forEach(sv=>sv.g.gain.setTargetAtTime(0,t,0.1));return;}sirens.forEach(sv=>{const c=sv.c,p=c.mesh.position,dx=p.x-pl.x,dz=p.z-pl.z,d=Math.hypot(dx,dz)||1;
  const [pwx,pwz]=getWorldVel(),vr=((c.dx*c.v-pwx)*dx+(c.dz*c.v-pwz)*dz)/d,dop=343/(343+vr);
  const pat={police:[650,870,0.33],amb:[590,790,0.5],fire:[440,590,0.62]}[c.em.kind],hi=((simT/pat[2])|0)%2;
  sv.o.frequency.setTargetAtTime((hi?pat[1]:pat[0])*dop,t,0.01);sv.g.gain.setTargetAtTime(d>500?0:0.22/(1+(d/14)**2),t,0.08);
  if(sv.pn){const ch=Math.cos(pl.h),sh=Math.sin(pl.h);sv.pn.pan.setTargetAtTime(Math.max(-1,Math.min(1,(dx*sh+dz*ch)/d)),t,0.1);}});}
// fruscio al passaggio: cerca l'auto più vicina e ne pesa velocità relativa e distanza laterale
let pbCar=null,pbT=0;function passBy(t,v){if(!eng.pbg)return;pbT-=1/60;
  if(pbT<=0){pbT=0.12;let best=null,bd=40;for(const c of cars){if(!c.mesh.visible)continue;const d=Math.hypot(c.mesh.position.x-pl.x,c.mesh.position.z-pl.z);if(d<bd){bd=d;best=c;}}pbCar=best;}
  let g=0,pan=0;if(pbCar){const c=pbCar,dx=c.mesh.position.x-pl.x,dz=c.mesh.position.z-pl.z,d=Math.hypot(dx,dz)||1,[pwx,pwz]=getWorldVel();
    const rvx=(c.dx||0)*(c.v||0)-pwx,rvz=(c.dz||0)*(c.v||0)-pwz,rel=Math.hypot(rvx,rvz);
    g=Math.min(0.32,Math.pow(Math.min(1,rel/35),2)*0.42/(1+d*d/10));
    pan=Math.max(-0.9,Math.min(0.9,(dx*Math.sin(pl.h)+dz*Math.cos(pl.h))/d));
    if(!isFinite(g))g=0;}
  eng.pbg.gain.setTargetAtTime(g*(view==='cockpit'?0.8:1),t,0.05);eng.pbf.frequency.setTargetAtTime(700+Math.min(900,v*12),t,0.1);if(eng.pbp)eng.pbp.pan.setTargetAtTime(pan,t,0.05);}
function updateTrafficVoices(t){updateSirens(t);if(!tVoices.length)return;tvT-=1/60;
  if(tvT<=0){tvT=0.3;const near=cars.filter(c=>c.mesh.visible).map(c=>[c,Math.hypot(c.mesh.position.x-pl.x,c.mesh.position.z-pl.z)]).filter(a=>a[1]<70).sort((a,b)=>a[1]-b[1]).slice(0,3);
    tVoices.forEach((v,i)=>v.car=near[i]?near[i][0]:null);}
  tVoices.forEach(v=>{const c=v.car;if(!c){v.g.gain.setTargetAtTime(0,t,0.2);return;}
    const dx=c.mesh.position.x-pl.x,dz=c.mesh.position.z-pl.z,d=Math.hypot(dx,dz)||1,[pwx,pwz]=getWorldVel();
    const vr=((c.dx*c.v-pwx)*dx+(c.dz*c.v-pwz)*dz)/d;const dop=343/(343+vr);
    const rpm=900+(c.v||0)*95+Math.max(0,c.a||0)*400,fq=rpm/60*2*dop;if(!isFinite(fq)||!isFinite(d)){v.g.gain.setTargetAtTime(0,t,0.2);return;}v.o.frequency.setTargetAtTime(fq,t,0.08);
    v.lp.frequency.setTargetAtTime(300+c.v*25,t,0.1);v.g.gain.setTargetAtTime(Math.min(0.18,(0.05+c.v*0.008)*8/(8+d*d*0.15)),t,0.15);});}
// avviso morbido "dong" (superamento del limite): due note calde e basse che sfumano, a volume contenuto
function dong(){if(!AC)return;const t0=AC.currentTime,out=ACOUT();[[587,0],[440,0.36]].forEach(([f,dt])=>{const t=t0+dt;
  [[1,0.085],[2.01,0.02],[2.98,0.008]].forEach(([k,a])=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f*k;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+0.012);g.gain.exponentialRampToValueAtTime(0.0008,t+(k===1?1.3:0.6));o.connect(g).connect(out);o.start(t);o.stop(t+1.4);});});}
function ding(n=3){if(!AC)return;for(let i=0;i<n;i++){const t=AC.currentTime+i*0.32;const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=1480;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.25,t+0.01);g.gain.exponentialRampToValueAtTime(0.001,t+0.28);o.connect(g).connect(ACOUT());o.start(t);o.stop(t+0.3);}}
let horn=null;
// clacson a due trombe: onde ricche, saturazione e risonanza della membrana; tono diverso per ogni auto
const HORNF={utilitaria:[440,554],berlina:[392,494],sw:[370,466],suv:[330,415],furgone:[294,370],volvo:[392,494],wagoneer:[330,415],hellcat:[370,466],zil:[196,247],daily:[294,370],taxi:[349,440]};
function setHorn(on){if(on&&!horn)hornPush();if(!AC)return;const t=AC.currentTime;
  if(on&&!horn){const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.16,t+0.018);
    const sh=AC.createWaveShaper(),cu=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;cu[i]=Math.tanh(3*x);}sh.curve=cu;
    const pk=AC.createBiquadFilter();pk.type='peaking';pk.frequency.value=1900;pk.Q.value=1.3;pk.gain.value=9;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=4200;
    const mix=AC.createGain();mix.gain.value=0.45;mix.connect(sh).connect(pk).connect(lp).connect(g).connect(ACOUT());
    const os=(HORNF[selKey]||[420,520]).map((f,k)=>{const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=k?4:-3;o.connect(mix);o.start();return o;});horn={os,g};}
  else if(!on&&horn){const h=horn;horn=null;h.g.gain.cancelScheduledValues(t);h.g.gain.setTargetAtTime(0,t,0.025);setTimeout(()=>h.os.forEach(o=>{try{o.stop();}catch(e){}}),200);}}

// ================= SIRENE dei mezzi di soccorso nel traffico (ambulanza, polizia, pompieri): bitonali, si sentono da lontano =================
const SIREN={L:[],add(c){if(!AC)return;try{const o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain(),pn=AC.createStereoPanner?AC.createStereoPanner():null;o.type=c.em.kind==='fire'?'sawtooth':'triangle';f.type='lowpass';f.frequency.value=2200;g.gain.value=0;
    o.connect(f).connect(g);if(pn){g.connect(pn).connect(ACOUT());}else g.connect(ACOUT());o.start();this.L.push({c,o,g,f,pn});}catch(e){}},
  rem(c){const i=this.L.findIndex(q=>q.c===c);if(i<0)return;const q=this.L[i];try{q.o.stop();}catch(e){}this.L.splice(i,1);},
  tick(){if(!AC||!this.L.length)return;const t=AC.currentTime,fx=Math.cos(pl.h),fz=-Math.sin(pl.h);for(const q of this.L){const c=q.c,p=c.mesh.position,dx=p.x-pl.x,dz=p.z-pl.z,d=Math.hypot(dx,dz);
    const pat={cop:[650,870,0.33],amb:[590,790,0.5],fire:[440,590,0.62]}[c.em.kind]||[600,800,0.5],hi=((simT/pat[2])|0)%2;q.o.frequency.setTargetAtTime(hi?pat[1]:pat[0],t,0.01);
    const v=(paused||pl.ended?0:1)*Math.min(0.09,6/(d+30))*(view==='cockpit'?0.6:1);q.g.gain.setTargetAtTime(v,t,0.1);q.f.frequency.setTargetAtTime(d>200?900:2200,t,0.3);if(q.pn){const side=(dx*fz-dz*fx)/(d||1);q.pn.pan.setTargetAtTime(Math.max(-1,Math.min(1,-side)),t,0.1);}}}};
window.SIREN=SIREN;
// ================= SUONI D'AMBIENTE =================
// città (brusio, clacson, motorini, sirene lontane), zone industriali (rombo, colpi metallici, sfiati, cicalini di retromarcia),
// campagna e montagna (uccelli di giorno, cicale col sole d'estate, grilli la notte), vento in quota, onde al mare e risacca al lago.
// Tutto sintetizzato, dosato secondo luogo e ora: di notte il mondo si abbassa. Si attenua con la velocità e in abitacolo.
const AMB={on:false,t:0,g:null,
  init(){if(!AC||this.g)return;const out=AC.createGain();out.gain.value=0;out.connect(ACOUT());this.g=out;
    const nb=AC.createBuffer(1,AC.sampleRate*4,AC.sampleRate),d=nb.getChannelData(0);let b=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;b=0.985*b+0.015*w;d[i]=w*0.35+b*4;}
    const wb=AC.createBuffer(1,AC.sampleRate*3,AC.sampleRate),wd=wb.getChannelData(0);for(let i=0;i<wd.length;i++)wd[i]=Math.random()*2-1;this.wb=wb;
    const src=(buf)=>{const s=AC.createBufferSource();s.buffer=buf||nb;s.loop=true;s.start(0,Math.random()*2.5);return s;};
    const layer=(type,f,q,buf)=>{const s=src(buf),fl=AC.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q||0.7;const g=AC.createGain();g.gain.value=0;s.connect(fl).connect(g).connect(out);return{g,fl};};
    const lfo=(f,depth,target,off)=>{const o=AC.createOscillator();o.frequency.value=f;const g=AC.createGain();g.gain.value=depth;o.connect(g).connect(target);o.start();if(off!=null)target.value=off;return o;};
    // brusio di città: traffico lontano (grave) + un velo più chiaro
    this.city=layer('lowpass',380);this.city2=layer('bandpass',1100,0.5,wb);
    // zona industriale: rombo cupo e ronzio di macchinari
    this.ind=layer('lowpass',140,1.2);{const o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';o.frequency.value=98;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=260;g.gain.value=0;o.connect(f).connect(g).connect(out);o.start();this.hum={g};}
    // acqua: onde lunghe al mare (risacca lenta), sciabordio corto al lago
    this.sea=layer('lowpass',700);this.seaM=AC.createGain();this.sea.g.disconnect();this.sea.g.connect(this.seaM).connect(out);lfo(0.085,0.9,this.seaM.gain,0.55);
    this.lake=layer('bandpass',900,0.8,wb);this.lakeM=AC.createGain();this.lake.g.disconnect();this.lake.g.connect(this.lakeM).connect(out);lfo(0.42,0.6,this.lakeM.gain,0.6);
    // vento: fruscio che cambia tono, più forte e a raffiche in quota
    this.wind=layer('bandpass',520,0.6);lfo(0.07,180,this.wind.fl.frequency);this.windM=AC.createGain();this.wind.g.disconnect();this.wind.g.connect(this.windM).connect(out);lfo(0.045,0.7,this.windM.gain,0.75);
    // cicale: rumore stretto sui 5 kHz, pulsato e con il crescendo tipico
    this.cic=layer('bandpass',5200,7,wb);this.cicM=AC.createGain();this.cic.g.disconnect();this.cic.g.connect(this.cicM).connect(out);{const o=AC.createOscillator();o.type='square';o.frequency.value=42;const g=AC.createGain();g.gain.value=0.45;o.connect(g).connect(this.cicM.gain);o.start();this.cicM.gain.value=0.55;}lfo(0.12,0.25,this.cic.fl.Q);
    this.lv={};this.nb=0;this.nc=0;this.ne=0;},
  chirp(v,kind){const t=AC.currentTime,mt=kind==='m',n=mt?1+(Math.random()*2|0):2+(Math.random()*5|0),f0=mt?1800+Math.random()*900:2400+Math.random()*2200,sp=0.05+Math.random()*0.08,dn=Math.random()<0.4;
    for(let i=0;i<n;i++){const o=AC.createOscillator(),g=AC.createGain(),t0=t+i*(sp+0.025+Math.random()*0.03);o.type='sine';o.frequency.setValueAtTime(f0*(1+Math.random()*0.12)*(dn?1.3:1),t0);o.frequency.exponentialRampToValueAtTime(f0*(dn?0.85:1.35+Math.random()*0.4),t0+sp*0.8);
      g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(v,t0+0.008);g.gain.exponentialRampToValueAtTime(0.0005,t0+sp);o.connect(g).connect(this.g);o.start(t0);o.stop(t0+sp+0.02);}
    if(mt&&Math.random()<0.25)this.call(v*1.2);},
  call(v){const t=AC.currentTime+0.3;[0,0.42].forEach((d2,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(i?1250:1560,t+d2);g.gain.setValueAtTime(0,t+d2);g.gain.linearRampToValueAtTime(v,t+d2+0.03);g.gain.exponentialRampToValueAtTime(0.0005,t+d2+0.35);o.connect(g).connect(this.g);o.start(t+d2);o.stop(t+d2+0.4);});},   /* il cuculo o la cincia lontana */
  cricket(v){const t=AC.currentTime,o=AC.createOscillator(),am=AC.createGain(),g=AC.createGain(),p=AC.createOscillator(),pg=AC.createGain();o.frequency.value=4200+Math.random()*600;p.type='square';p.frequency.value=28+Math.random()*8;pg.gain.value=0.5;am.gain.value=0.5;p.connect(pg).connect(am.gain);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+0.05);g.gain.setValueAtTime(v,t+0.35);g.gain.linearRampToValueAtTime(0,t+0.45);o.connect(am).connect(g).connect(this.g);o.start(t);p.start(t);o.stop(t+0.5);p.stop(t+0.5);},
  horn(v){const t=AC.currentTime,o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';o.frequency.value=330+Math.random()*120;f.type='lowpass';f.frequency.value=700;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+0.02);g.gain.setValueAtTime(v,t+0.25+Math.random()*0.3);g.gain.linearRampToValueAtTime(0,t+0.65);o.connect(f).connect(g).connect(this.g);o.start(t);o.stop(t+0.7);},
  noiseHit(v,f,q,dur,att){const t=AC.currentTime,s=AC.createBufferSource();s.buffer=this.wb;const fl=AC.createBiquadFilter();fl.type='bandpass';fl.frequency.value=f;fl.Q.value=q;const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+(att||0.004));g.gain.exponentialRampToValueAtTime(0.0003,t+dur);s.connect(fl).connect(g).connect(this.g);s.start(t,Math.random()*2);s.stop(t+dur+0.05);},
  clank(v){this.noiseHit(v,600+Math.random()*1800,9,0.5+Math.random()*0.6);const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=180+Math.random()*500;g.gain.setValueAtTime(v*0.6,t);g.gain.exponentialRampToValueAtTime(0.0003,t+0.9);o.connect(g).connect(this.g);o.start(t);o.stop(t+1);},
  beep(v){const t=AC.currentTime;for(let i=0;i<6;i++){const o=AC.createOscillator(),g=AC.createGain(),t0=t+i*0.9;o.type='square';o.frequency.value=1150;g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(v,t0+0.01);g.gain.setValueAtTime(v,t0+0.42);g.gain.linearRampToValueAtTime(0,t0+0.45);const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=1800;o.connect(f).connect(g).connect(this.g);o.start(t0);o.stop(t0+0.5);}},
  siren(v){const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();o.type='triangle';f.type='lowpass';f.frequency.value=1400;for(let i=0;i<8;i++){o.frequency.setValueAtTime(660,t+i*0.65);o.frequency.setValueAtTime(880,t+i*0.65+0.32);}
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+1.5);g.gain.linearRampToValueAtTime(v,t+3.5);g.gain.linearRampToValueAtTime(0,t+5.2);o.connect(f).connect(g).connect(this.g);o.start(t);o.stop(t+5.3);},
  scooter(v){const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();o.type='sawtooth';f.type='bandpass';f.frequency.value=900;f.Q.value=2;o.frequency.setValueAtTime(70,t);o.frequency.linearRampToValueAtTime(140,t+1.6);o.frequency.linearRampToValueAtTime(95,t+3);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+1);g.gain.linearRampToValueAtTime(0,t+3.2);o.connect(f).connect(g).connect(this.g);o.start(t);o.stop(t+3.3);},
  dog(v){const t=AC.currentTime,n=1+(Math.random()*3|0);for(let i=0;i<n;i++){const t0=t+i*(0.35+Math.random()*0.2),o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();o.type='sawtooth';o.frequency.setValueAtTime(420,t0);o.frequency.exponentialRampToValueAtTime(260,t0+0.14);f.type='bandpass';f.frequency.value=800;f.Q.value=1.5;
    g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(v,t0+0.01);g.gain.exponentialRampToValueAtTime(0.0003,t0+0.18);o.connect(f).connect(g).connect(this.g);o.start(t0);o.stop(t0+0.2);}},
  tick(dt){SIREN.tick();if(!AC||!started||!NW)return;const on=CFG.amb!==false&&!paused&&!pl.ended&&AC.state==='running';if(!this.g){if(!on)return;this.init();}
    const t=AC.currentTime;this.g.gain.setTargetAtTime(on?(view==='cockpit'?0.55:1)*Math.max(0.25,1-Math.abs(pl.vx)/38):0,t,0.4);if(!on)return;
    const day=Math.max(0,Math.min(1,DAYLV)),act=0.35+0.65*day,L=this.lv;   // di notte tutto più quieto
    this.t-=dt;if(this.t<=0){this.t=0.5;const x=pl.x,z=pl.z,C=NW.cityAt(x,z),ind=NWT&&NWT.indAt&&NWT.indAt(x,z),city=!!C&&!ind,h=pl.terrH||0,rain=WX==='rain';
      let sea=0,lake=0;for(const[a,b]of[[90,0],[-90,0],[0,90],[0,-90],[0,0],[60,60],[-60,-60]]){const w=waterLv(x+a,z+b);if(w){if(w.lv<1)sea++;else lake++;}}
      const big=C&&C.r1>800;L.city=city?(big?0.06:0.035)*act:0;L.city2=city?(big?0.018:0.01)*act*act:0;L.ind=ind?0.07*(0.55+0.45*day):0;L.hum=ind?0.012*(0.5+0.5*day):0;
      L.sea=sea?Math.min(0.09,0.025+sea*0.012):0;L.lake=lake?Math.min(0.03,0.008+lake*0.004):0;
      const mt=h>650;L.mt=mt;L.wind=!C&&h>260?Math.min(0.075,0.012+(h-260)/3600)*(rain?1.4:1):(rain?0.012:0.005);
      L.birds=(!C||!big)&&!rain&&day>0.25?(C?0.25:mt?0.6:1)*day:0;L.crick=!C&&day<0.2&&!rain&&h<1100?1:0;
      const warm=WX==='clear'&&day>0.7&&!C&&h<550&&!sea;L.cic=warm?0.016*(day-0.7)/0.3:0;
      this.city.g.gain.setTargetAtTime(L.city,t,1.5);this.city2.g.gain.setTargetAtTime(L.city2,t,1.5);this.ind.g.gain.setTargetAtTime(L.ind,t,1.5);this.hum.g.gain.setTargetAtTime(L.hum,t,2);
      this.sea.g.gain.setTargetAtTime(L.sea,t,2);this.lake.g.gain.setTargetAtTime(L.lake,t,2);this.wind.g.gain.setTargetAtTime(L.wind,t,2);this.cic.g.gain.setTargetAtTime(L.cic,t,3);this.ind_=ind;this.city_=city;this.big_=big;}
    this.nb-=dt;if(L.birds&&this.nb<=0){this.nb=0.6+Math.random()*3.2/L.birds;this.chirp((0.01+Math.random()*0.014)*(0.5+0.5*day),L.mt?'m':'');}
    this.nc-=dt;if(L.crick&&this.nc<=0){this.nc=0.35+Math.random()*1.0;this.cricket(0.006+Math.random()*0.006);}
    this.ne-=dt;if(this.ne<=0){this.ne=1+Math.random()*3;const r=Math.random();
      if(this.city_){if(r<0.3*act)this.horn(0.006+Math.random()*0.008);else if(r<0.45*act)this.scooter(0.006+Math.random()*0.005);else if(this.big_&&r<0.5)this.siren(0.004+Math.random()*0.004);else if(day<0.3&&r<0.6)this.dog(0.006);}
      else if(this.ind_){if(r<0.45*(0.4+0.6*day))this.clank(0.012+Math.random()*0.02);else if(r<0.6*(0.4+0.6*day))this.noiseHit(0.02,3000,0.8,1.6,0.3);else if(r<0.68*day)this.beep(0.006);}
      else if(day<0.3&&r<0.12)this.dog(0.004);}}};
