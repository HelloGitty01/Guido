// Guido · 07 audio — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ================= AUDIO =================
let AC=null,eng=null;
// parametri acustici di ogni motore: lunghezze dei tubi (in campioni), marmitta, durata dello scoppio (diesel = più secco)
function engineParams(k,P){const base={cylinders:P.cyl||4,intakeWaveguideLength:90,exhaustWaveguideLength:100,extractorWaveguideLength:100,intakeOpenReflectionFactor:0.01,intakeClosedReflectionFactor:0.95,
  exhaustOpenReflectionFactor:0.01,exhaustClosedReflectionFactor:0.95,ignitionTime:P.diesel?0.009:0.016,straightPipeWaveguideLength:128,straightPipeReflectionFactor:0.01,mufflerElementsLength:[10,15,20,25],action:0.1,outletWaveguideLength:5,outletReflectionFactor:0.01};
  const T={utilitaria:{exhaustWaveguideLength:70,extractorWaveguideLength:80,straightPipeWaveguideLength:100,mufflerElementsLength:[8,12,16,20],action:0.12,ignitionTime:0.018},
    volvo:{exhaustWaveguideLength:110,straightPipeWaveguideLength:160,mufflerElementsLength:[12,18,24,30],action:0.15},
    wagoneer:{exhaustWaveguideLength:140,extractorWaveguideLength:120,straightPipeWaveguideLength:200,mufflerElementsLength:[14,20,28,36],action:0.08,ignitionTime:0.02,offsets:[0,0,0.03,-0.03,0,0,0.03,-0.03]},
    hellcat:{exhaustWaveguideLength:100,extractorWaveguideLength:90,straightPipeWaveguideLength:150,mufflerElementsLength:[10,15,20,25],action:0.05,ignitionTime:0.013,offsets:[0,0,0.035,-0.035,0,0,0.035,-0.035]},
    zil:{exhaustWaveguideLength:180,extractorWaveguideLength:150,straightPipeWaveguideLength:260,mufflerElementsLength:[20,28,36,44],action:0.2},
    taxi:{exhaustWaveguideLength:130,straightPipeWaveguideLength:190,mufflerElementsLength:[14,22,30,38],action:0.14,offsets:[0,0,0.02,-0.02,0,0,0.02,-0.02]},
    daily:{exhaustWaveguideLength:100,straightPipeWaveguideLength:150,mufflerElementsLength:[12,18,24,30],action:0.15}};
  return Object.assign(base,T[k]||{});}
function initAudio(){
  if(!AC){AC=new (window.AudioContext||window.webkitAudioContext)();}
  if(eng){eng.stopAll();}
  const P=PHYS[selKey],nodes=[];
  const buf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),dd=buf.getChannelData(0);{let b=0;for(let i=0;i<dd.length;i++){const w=Math.random()*2-1;b=0.97*b+0.03*w;dd[i]=w*0.6+b*3;}}
  const nz=AC.createBufferSource();nz.buffer=buf;nz.loop=true;nodes.push(nz);
  const master=AC.createGain();master.gain.value=0;master.connect(ACOUT());
  // filtro "abitacolo": i suoni del motore arrivano smorzati, con il corpo sui bassi
  const cab=AC.createBiquadFilter();cab.type='lowpass';cab.frequency.value=900;cab.Q.value=0.5;
  const body=AC.createBiquadFilter();body.type='lowshelf';body.frequency.value=160;body.gain.value=6;
  cab.connect(body).connect(master);
  // ordini armonici del motore (rispetto alla frequenza di scoppio)
  const SN=P.snd||{};
  // V8 con albero a croce: scoppi irregolari fra le due bancate → mezzi ordini forti (il "borbottio"); 4 cilindri: secondo ordine ruvido
  const orders=P.cyl===3?[[0.5,0.55],[1,0.7],[1.5,0.35],[2,0.25],[3,0.1]]:P.cyl===8?(P.diesel?[[0.25,0.2],[0.5,0.5],[1,0.8],[2,0.3],[3,0.14]]:[[0.25,0.16*(SN.lope||1)],[0.5,0.55],[1,0.75],[1.5,0.2],[2,0.35],[3,0.1]]):(P.diesel?[[0.5,0.35],[1,0.8],[2,0.35],[3,0.18],[4,0.08]]:[[0.5,0.25],[1,0.75],[2,0.4],[3,0.15],[4,0.1]]);
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
  const tb=AC.createBiquadFilter();tb.type='bandpass';tb.frequency.value=500;tb.Q.value=1.5;const tg=AC.createGain();tg.gain.value=0;nz.connect(tb).connect(tg).connect(ACOUT());
  // stridio delle gomme: toni stretti su rumore, con un tremolio irregolare (come la gomma che vibra sull'asfalto)
  const sqg=AC.createGain();sqg.gain.value=0;const sqhs=AC.createBiquadFilter();sqhs.type='highshelf';sqhs.frequency.value=2500;sqhs.gain.value=-6;sqg.connect(sqhs).connect(ACOUT());
  const sq=AC.createOscillator();sq.type='triangle';sq.frequency.value=900;const sq2=AC.createOscillator();sq2.type='sine';sq2.frequency.value=1780;
  const v1=AC.createOscillator();v1.frequency.value=6.3;const v1g=AC.createGain();v1g.gain.value=26;v1.connect(v1g);v1g.connect(sq.frequency);
  const v2=AC.createOscillator();v2.frequency.value=13.7;const v2g=AC.createGain();v2g.gain.value=12;v2.connect(v2g);v2g.connect(sq.frequency);const v3g=AC.createGain();v3g.gain.value=44;v1.connect(v3g);v3g.connect(sq2.frequency);
  const sqf=AC.createBiquadFilter();sqf.type='bandpass';sqf.Q.value=5;sqf.frequency.value=900;const sqt=AC.createGain();sqt.gain.value=0.32;sq.connect(sqf).connect(sqt).connect(sqg);const sq2g=AC.createGain();sq2g.gain.value=0.1;sq2.connect(sq2g).connect(sqg);
  const sqb1=AC.createBiquadFilter();sqb1.type='bandpass';sqb1.Q.value=16;sqb1.frequency.value=900;const sqb1g=AC.createGain();sqb1g.gain.value=2.2;nz.connect(sqb1).connect(sqb1g).connect(sqg);
  const sqb2=AC.createBiquadFilter();sqb2.type='bandpass';sqb2.Q.value=12;sqb2.frequency.value=1850;const sqb2g=AC.createGain();sqb2g.gain.value=1.1;nz.connect(sqb2).connect(sqb2g).connect(sqg);
  sq.start();sq2.start();v1.start();v2.start();nodes.push(sq,sq2,v1,v2);
  const wf=AC.createBiquadFilter();wf.type='bandpass';wf.frequency.value=700;wf.Q.value=0.4;const wg=AC.createGain();wg.gain.value=0;nz.connect(wf).connect(wg).connect(ACOUT());
  const rf=AC.createBiquadFilter();rf.type='lowpass';rf.frequency.value=380;const rg=AC.createGain();rg.gain.value=0;nz.connect(rf).connect(rg).connect(ACOUT());
  // gomme al limite: prima dello stridio si sente lo "strisciare" sordo del battistrada
  const scf=AC.createBiquadFilter();scf.type='bandpass';scf.frequency.value=320;scf.Q.value=0.8;const scg=AC.createGain();scg.gain.value=0;nz.connect(scf).connect(scg).connect(ACOUT());
  // compressore volumetrico (Hellcat): fischio acuto che sale coi giri e col carico
  let bl=null;if(SN.blower){const o1=AC.createOscillator(),o2=AC.createOscillator();o1.type='sine';o2.type='triangle';const g=AC.createGain();g.gain.value=0;const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=500;
    const g2=AC.createGain();g2.gain.value=0.35;o1.connect(g);o2.connect(g2).connect(g);g.connect(hp).connect(ACOUT());o1.start();o2.start();nodes.push(o1,o2);bl={o1,o2,g};}
  // riverbero della galleria: risposta all'impulso sintetica (2 s), dosata da tunnelUpdate
  const cv=AC.createConvolver();{const n=AC.sampleRate*2,b=AC.createBuffer(2,n,AC.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3.2)*(i<200?i/200:1);}cv.buffer=b;}
  const rvg=AC.createGain();rvg.gain.value=0;master.connect(cv).connect(rvg).connect(ACOUT());
  // motore a guide d'onda (AudioWorklet): il suono nasce da cilindri, collettori e marmitta; gli oscillatori restano sotto come corpo
  if(AC.audioWorklet&&CFG.wg!==false){const KP=P,mk=()=>{if(!eng||eng.P!==KP)return;try{const n=new AudioWorkletNode(AC,'engine-sound-processor',{numberOfInputs:0,numberOfOutputs:3,processorOptions:engineParams(selKey,P)});
      const gI=AC.createGain(),gB=AC.createGain(),gO=AC.createGain();gI.gain.value=0.3;gB.gain.value=0.55;gO.gain.value=1;const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=30;
      const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2200;lp.Q.value=0.4;const g=AC.createGain();g.gain.value=0;n.connect(gI,0);n.connect(gB,1);n.connect(gO,2);[gI,gB,gO].forEach(x=>x.connect(hp));hp.connect(lp).connect(g).connect(master);
      eng.wk={n,g,lp,rpm:n.parameters.get('rpm'),thr:n.parameters.get('throttle')};nodes.push({stop(){try{n.disconnect();g.disconnect();}catch(e){}}});}catch(e){console.warn('motore a guide d\'onda',e);}};
    if(window.__wkReady)setTimeout(mk,0);else AC.audioWorklet.addModule('js/motore_worklet.js').then(()=>{window.__wkReady=1;mk();}).catch(e=>console.warn(e));}
  nz.start();
  eng={P,SN,bl,rvg,scf,scg,osc,cab,master,cbp,mod,cg,dmod,tg,sqg,sq,sq2,sqf,sqb1,sqb2,wg,wf,rg,rf,stopAll:()=>nodes.forEach(n=>{try{n.stop();}catch(e){}})};
  initTrafficVoices();initSirens();
}
function updateAudio(st){if(!eng||!AC)return;const P=eng.P,t=AC.currentTime;
  const f=Math.max(10,st.rpm/60*P.cyl/2),load=st.load,r=st.rpm/P.red;
  if(!isFinite(f)||!isFinite(load)||!isFinite(r))return;
  const wk=eng.wk,ok=wk?0.45:1;
  if(wk){wk.rpm.setTargetAtTime(Math.max(300,st.rpm),t,0.02);wk.thr.setTargetAtTime(Math.max(0.06,load),t,0.05);wk.g.gain.setTargetAtTime(0.62*Math.pow(4/(P.cyl||4),0.6)*(0.55+load*0.65+r*0.25),t,0.05);wk.lp.frequency.setTargetAtTime((view==='cockpit'?850:1500)+load*1600+r*1400,t,0.06);}
  eng.osc.forEach(x=>{x.os.frequency.setTargetAtTime(f*x.o,t,0.025);x.g.gain.setTargetAtTime(ok*x.a*(x.o<=1?0.55:0.25+load*0.55+r*0.3),t,0.05);});
  eng.mod.frequency.setTargetAtTime(f,t,0.025);eng.dmod.frequency.setTargetAtTime(f*0.5,t,0.03);
  eng.cbp.frequency.setTargetAtTime(150+f*2.5+load*300,t,0.05);eng.cg.gain.setTargetAtTime((P.diesel?0.45:0.22)*(0.4+load*0.9)*(wk?0.6:1),t,0.05);
  eng.cab.frequency.setTargetAtTime((P.diesel?420:520)+load*(P.diesel?500:900)+r*600,t,0.06);
  eng.master.gain.setTargetAtTime((0.10+load*0.10+r*0.07)*(eng.SN.exh||1)*(CFG.engVol??1),t,0.06);
  if(eng.bl){const bf=st.rpm/60*11.5;eng.bl.o1.frequency.setTargetAtTime(bf,t,0.03);eng.bl.o2.frequency.setTargetAtTime(bf*2.02,t,0.03);eng.bl.g.gain.setTargetAtTime(Math.min(0.06,(0.004+load*0.05)*r*r*1.6)*(CFG.engVol??1),t,0.05);}
  if(eng.SN.rough)eng.cg.gain.setTargetAtTime((P.diesel?0.45:0.22)*(0.4+load*0.9)*eng.SN.rough,t,0.05);
  {const sf0=pl.surfR||'asphalt',v=Math.abs(pl.vx),lat=v>6?Math.max(0,st.slip/(pl.alPk||0.2)-0.85)*0.9:0,brake=(pl.absOn&&v>8)?0.05*(0.6+0.4*Math.abs(Math.sin(t*2*Math.PI*13))):((pl.lockF||pl.lockR)&&v>3?0.22:0),spin=(pl.spinW>0.15&&v<(pl.surfR==='asphalt'?22:15))?(pl.surfR==='asphalt'?0.14:0.1):0;
   const amt=Math.min(0.3,lat+brake+spin);
   if(sf0==='asphalt'&&!pl.flip){eng.sqg.gain.setTargetAtTime(amt*(WX==='rain'?0.4:1),t,0.04);{const f0=760+v*4+lat*260+(pl.lockF||pl.lockR?120:0);eng.sq.frequency.setTargetAtTime(f0,t,0.05);eng.sq2.frequency.setTargetAtTime(f0*1.98,t,0.05);eng.sqf.frequency.setTargetAtTime(f0,t,0.05);eng.sqb1.frequency.setTargetAtTime(f0,t,0.05);eng.sqb2.frequency.setTargetAtTime(f0*2.05,t,0.05);}eng.tg.gain.setTargetAtTime(0,t,0.05);}
   else{eng.sqg.gain.setTargetAtTime(0,t,0.05);eng.tg.gain.setTargetAtTime(Math.min(0.25,(lat+spin+brake)*1.4)*(sf0==='asphalt'?0:1),t,0.05);}}
  const v=st.kmh/3.6,sf=pl.surfR||'asphalt';
  {const sc=(sf==='asphalt'&&!pl.air)?Math.max(0,Math.min(0.12,((pl.slip||0)/(pl.alPk||0.2)-0.65)*0.5))*Math.min(1,v/9):0;eng.scg.gain.setTargetAtTime(sc,t,0.06);eng.scf.frequency.setTargetAtTime(240+v*5,t,0.1);}
  eng.wg.gain.setTargetAtTime(Math.min(0.17,(v/36)**2*0.17)*(view==='cockpit'?0.8:1),t,0.15);eng.wf.frequency.setTargetAtTime(380+v*16,t,0.15);
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
function updateTrafficVoices(t){updateSirens(t);if(!tVoices.length)return;tvT-=1/60;
  if(tvT<=0){tvT=0.3;const near=cars.filter(c=>c.mesh.visible).map(c=>[c,Math.hypot(c.mesh.position.x-pl.x,c.mesh.position.z-pl.z)]).filter(a=>a[1]<70).sort((a,b)=>a[1]-b[1]).slice(0,3);
    tVoices.forEach((v,i)=>v.car=near[i]?near[i][0]:null);}
  tVoices.forEach(v=>{const c=v.car;if(!c){v.g.gain.setTargetAtTime(0,t,0.2);return;}
    const dx=c.mesh.position.x-pl.x,dz=c.mesh.position.z-pl.z,d=Math.hypot(dx,dz)||1,[pwx,pwz]=getWorldVel();
    const vr=((c.dx*c.v-pwx)*dx+(c.dz*c.v-pwz)*dz)/d;const dop=343/(343+vr);
    const rpm=900+(c.v||0)*95+Math.max(0,c.a||0)*400,fq=rpm/60*2*dop;if(!isFinite(fq)||!isFinite(d)){v.g.gain.setTargetAtTime(0,t,0.2);return;}v.o.frequency.setTargetAtTime(fq,t,0.08);
    v.lp.frequency.setTargetAtTime(300+c.v*25,t,0.1);v.g.gain.setTargetAtTime(Math.min(0.18,(0.05+c.v*0.008)*8/(8+d*d*0.15)),t,0.15);});}
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

