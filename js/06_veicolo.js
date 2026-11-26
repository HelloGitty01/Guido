// Guido · 06 veicolo — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ================= VEICOLO GUIDATO =================
const PHYS={
 // ogni mezzo ha carattere proprio: trazione, peso e baricentro, gomme, sospensioni (fq Hz, smorzamento, rollio), sterzo
 // ogni mezzo ha il suo carattere; i modelli sono inventati (Daniel Zhabotinsky, CC-BY 4.0), i dati sono plausibili per tipo ed epoca
 utilitaria:{label:"Lasley '67",desc:'1.3 benzina · 60 CV · 680 kg · trazione anteriore · 4 marce · piccola e nervosa',m:680,Pkw:44,Tmax:96,rpk:3000,pl:700,rspan:3400,idle:850,red:6200,gears:[3.2,1.92,1.36,1.0],fd:3.44,rw:0.24,CdA:0.62,h:0.5,wf:0.62,ratio:15,brake:0.8,mu:0.82,cyl:4,diesel:false,dash:0x2a2a2c,vmax:150,fq:1.55,zeta:0.3,rollK:1.0,steerRate:1.0,tank:25,snd:{exh:0.9,small:1}},
 volvo:{label:"Carter '98",desc:'2.0 benzina 16V · 130 CV · 185 Nm · 1350 kg · trazione anteriore · 5 marce',m:1350,Pkw:96,Tmax:185,rpk:4200,pl:900,rspan:3000,idle:750,red:6500,gears:[3.55,1.95,1.32,1.03,0.82],fd:3.94,rw:0.31,CdA:0.66,h:0.55,wf:0.6,ratio:16,brake:0.95,mu:0.85,cyl:4,diesel:false,dash:0x232325,vmax:205,fq:1.3,zeta:0.3,rollK:1.3,steerRate:0.9,tank:60,snd:{exh:0.85},price:5000},
 wagoneer:{rwd:true,label:"Fairheaven SW '80",desc:'5.0 V8 · 150 CV · 330 Nm · 1700 kg · trazione posteriore · 4 marce · morbida e capiente',m:1700,Pkw:110,Tmax:330,rpk:2400,pl:600,rspan:2200,idle:620,red:4600,gears:[2.46,1.46,1.0,0.75],fd:2.73,rw:0.3,CdA:0.95,h:0.6,wf:0.56,ratio:20,brake:0.72,mu:0.74,cyl:8,diesel:false,dash:0x3a2a20,vmax:175,fq:1.0,zeta:0.2,rollK:2.0,steerRate:0.6,tank:70,shiftT:0.5,snd:{exh:1.0,lope:1.1},price:6000},
 hellcat:{rwd:true,tcDef:true,lsdDef:0.3,label:"Phoenix 455 '71",desc:'7.5 V8 · 300 CV · 680 Nm · 1650 kg · trazione posteriore · autobloccante · 4 marce',m:1650,Pkw:220,Tmax:678,rpk:3200,pl:1000,rspan:2400,idle:700,red:5400,gears:[2.52,1.88,1.46,1.0],fd:3.42,rw:0.32,CdA:0.82,h:0.5,wf:0.57,ratio:17,brake:0.8,mu:0.82,cyl:8,diesel:false,dash:0x1e1e20,vmax:215,fq:1.25,zeta:0.24,rollK:1.5,steerRate:0.75,tank:80,shiftT:0.45,snd:{exh:1.3,lope:1.0},price:15000},
 daily:{rwd:true,label:"LCT 3000 '95",desc:'2.5 turbodiesel · 102 CV · 240 Nm · 1950 kg · trazione posteriore · 5 marce · alto e lungo',m:1950,Pkw:75,Tmax:240,rpk:2200,pl:500,rspan:2300,idle:780,red:4400,gears:[4.6,2.6,1.6,1.0,0.8],fd:3.9,rw:0.36,CdA:2.0,h:0.85,wf:0.55,ratio:19,brake:0.78,mu:0.76,cyl:4,diesel:true,dash:0x2a2a2c,vmax:150,fq:1.4,zeta:0.3,rollK:2.2,steerRate:0.6,tank:75,snd:{exh:0.9,rough:1.2},price:7000},
 // mezzi delle missioni: non si scelgono dal garage, si guidano solo nel loro lavoro
 zil:{rwd:true,mission:'merci',label:"LCT 3000 '07 consegne",desc:'2.2 turbodiesel · 130 CV · 300 Nm · 2300 kg col carico · trazione posteriore · 6 marce',m:2300,Pkw:96,Tmax:300,rpk:2000,pl:500,rspan:2400,idle:760,red:4500,gears:[5.0,2.8,1.75,1.25,1.0,0.8],fd:3.7,rw:0.36,CdA:2.1,h:0.9,wf:0.5,ratio:19,brake:0.78,mu:0.76,cyl:4,diesel:true,dash:0x2a2a2c,vmax:155,fq:1.35,zeta:0.32,rollK:2.3,steerRate:0.6,tank:80,snd:{exh:0.95,rough:1.1}},
 taxi:{rwd:true,mission:'taxi',label:"Canyon '75 taxi",desc:'5.7 V8 · 170 CV · 400 Nm · 1850 kg · trazione posteriore · automatico a 3 marce · molleggiata',m:1850,Pkw:125,Tmax:400,rpk:2400,pl:600,rspan:2000,idle:600,red:4400,gears:[2.52,1.52,1.0],fd:2.73,rw:0.36,CdA:1.0,h:0.62,wf:0.56,ratio:22,brake:0.7,mu:0.74,cyl:8,diesel:false,dash:0x232325,vmax:175,fq:0.95,zeta:0.18,rollK:2.2,steerRate:0.55,tank:80,shiftT:0.6,snd:{exh:1.0,lope:0.8}}
};
let selKey=(PREF&&PREF.veh&&PHYS[PREF.veh]&&!PHYS[PREF.veh].mission)?PREF.veh:'utilitaria';
const vl=document.getElementById('vehList');
Object.entries(PHYS).forEach(([k,P])=>{if(P.mission)return;const b=document.createElement('button');b.innerHTML=`<b>${P.label}</b><span>${P.desc}</span>`;
  b.onclick=()=>{selKey=k;[...vl.children].forEach(x=>x.classList.remove('sel'));b.classList.add('sel');tuneUI();};if(k===selKey)b.classList.add('sel');vl.appendChild(b);});

// ---- assetto personalizzabile: ogni auto ha le sue regolazioni, salvate nel browser ----
const PHYS0=JSON.parse(JSON.stringify(PHYS));
const TUNEDEF=[['pow','Potenza motore',0.6,1.6,['Tmax','Pkw']],['m','Peso',0.8,1.3,['m']],['brake','Forza dei freni',0.5,1.6,['brake']],['bb','Frenata sull\'anteriore',0.5,0.85,null],
  ['mu','Aderenza gomme',0.75,1.3,['mu']],['fq','Rigidezza molle',0.7,1.7,['fq']],['zeta','Ammortizzatori',0.5,2.0,['zeta']],['roll','Rollio in curva',0.4,1.6,['rollK']],
  ['h','Altezza baricentro',0.8,1.25,['h']],['steer','Prontezza sterzo',0.6,1.6,['steerRate']],['fd','Rapporto finale (scatto)',0.8,1.25,['fd']],['lsd','Autobloccante',0,0.8,null],['abs','ABS',null],['tc','Controllo trazione',null]];
let TUNES={};try{TUNES=JSON.parse(localStorage.getItem('sim_tune')||'{}')||{};}catch(e){}
function applyTune(k){const P=PHYS[k],B=PHYS0[k],t=TUNES[k]||{};if(!P)return;
  TUNEDEF.forEach(([id,,a,b,keys])=>{if(keys)keys.forEach(q=>{if(B[q]!=null)P[q]=B[q]*(t[id]??1);});});
  P.bb=t.bb??0.7;P.lsd=t.lsd??(P.lsdDef??(P.rwd?0.35:P.awd?0.25:0));P.abs=t.abs??(P.absDef??true);P.tc=t.tc??(P.tcDef||!P.rwd);}
Object.keys(PHYS).forEach(applyTune);
function tuneUI(){const box=document.getElementById('tuneBox');if(!box)return;box.innerHTML='';document.getElementById('tuneCar').textContent=PHYS[selKey].label;const t=TUNES[selKey]||{};
  TUNEDEF.forEach(([id,lab,a,b,keys])=>{const L=document.createElement('label');L.append(lab);const sp=document.createElement('b');
    if(a==null){const c=document.createElement('input');c.type='checkbox';c.checked=id==='abs'?(t.abs??(PHYS[selKey].absDef??true)):(t.tc??(PHYS[selKey].tcDef||!PHYS[selKey].rwd));c.onchange=()=>{(TUNES[selKey]=TUNES[selKey]||{})[id]=c.checked;applyTune(selKey);tuneDirty();};L.append(c);}
    else{const r=document.createElement('input');r.type='range';r.min=a;r.max=b;r.step=0.01;const def=id==='bb'?0.7:id==='lsd'?(PHYS[selKey].lsdDef??(PHYS[selKey].rwd?0.35:PHYS[selKey].awd?0.25:0)):1;r.value=t[id]??def;const show=()=>sp.textContent=(id==='bb'||id==='lsd')?Math.round(r.value*100)+'%':(r.value>=1?'+':'')+Math.round((r.value-1)*100)+'%';show();
      r.oninput=()=>{(TUNES[selKey]=TUNES[selKey]||{})[id]=+r.value;applyTune(selKey);show();tuneDirty();};L.append(r,sp);}
    box.appendChild(L);});}
function tuneDirty(){document.getElementById('tuneNote').textContent='Modifiche attive, non ancora salvate';}
const pl={}; // stato del giocatore
function torque(P,rpm){const d=Math.max(0,Math.abs(rpm-P.rpk)-P.pl);let t=P.Tmax*Math.max(0.35,1-(d/P.rspan)**2);
  const w=Math.max(rpm,500)*Math.PI/30;return Math.min(t,P.Pkw*1000/w);}

// ---- specchietti: una telecamera posteriore grandangolare renderizza su texture, ripartita fra i 3 specchi ----
const MIRROR_RT=new THREE.WebGLRenderTarget(MOBILE?320:640,MOBILE?96:192);
const rearCam=new THREE.PerspectiveCamera(30,(MOBILE?320:640)/(MOBILE?96:192),0.3,200);rearCam.rotation.y=Math.PI/2;
function mirrorGeo(w,h,u0,u1,v0,v1){const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i);uv.setXY(i,u1-(u1-u0)*u,v0+(v1-v0)*v);}return g;}
const mirrorM=new THREE.MeshBasicMaterial({map:MIRROR_RT.texture});
const fabricTex=canvasTex(128,(g,n)=>{g.fillStyle='#2a2b2e';g.fillRect(0,0,n,n);for(let i=0;i<3000;i++){const v=30+Math.random()*25|0;g.fillStyle=`rgb(${v},${v},${v+2})`;g.fillRect(Math.random()*n,Math.random()*n,1,1);}});
const dashTexC=canvasTex(128,(g,n)=>{g.fillStyle='#1e1f21';g.fillRect(0,0,n,n);for(let i=0;i<5000;i++){const v=22+Math.random()*16|0;g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(Math.random()*n,Math.random()*n,1,1);}});
const ventTex=canvasTex(64,(g,n)=>{g.fillStyle='#0c0c0d';g.fillRect(0,0,n,n);g.fillStyle='#3a3c40';for(let y=3;y<n;y+=8)g.fillRect(2,y,n-4,3);g.strokeStyle='#8a8d92';g.lineWidth=3;g.strokeRect(1,1,n-2,n-2);});
function buildCockpit(T,P){
  const g=new THREE.Group(),van=!!T.van,O=T.ck||{},W=O.W??T.W;   // O: misure prese dall'abitacolo del modello 3D
  const wsx=O.wsx??T.gh[3][0],dashTop=O.dashTop??((van?1.2:T.hb)+0.04),eyeX=O.eyeX??(wsx-(van?0.92:1.0)),eyeY=O.eyeY??(dashTop+(van?0.36:0.27)),drvZ=O.drvZ??-(W/2-0.48);
  const dm=new THREE.MeshStandardMaterial({color:P.dash,map:dashTexC,roughness:0.85});
  const trim=new THREE.MeshStandardMaterial({color:0x8d9096,metalness:0.8,roughness:0.3});
  // plancia sagomata
  const fx=eyeX+0.6,sh=new THREE.Shape();sh.moveTo(fx,dashTop-0.5);sh.lineTo(fx,dashTop-0.14);sh.quadraticCurveTo(fx+0.02,dashTop,fx+0.2,dashTop);sh.lineTo(wsx-0.02,dashTop-0.01);sh.lineTo(wsx-0.02,dashTop-0.5);
  const dg=new THREE.ExtrudeGeometry(sh,{depth:W-0.16,bevelEnabled:true,bevelThickness:0.02,bevelSize:0.02,bevelSegments:2,curveSegments:8});dg.translate(0,0,-(W-0.16)/2);
  g.add(new THREE.Mesh(dg,dm));
  // volante: corona in pelle, tre razze, airbag
  const wt=O.wt??(van?0.95:0.45),R=O.R??(van?0.21:0.185),wy=O.wy??(eyeY-(van?0.5:0.47)),wx=O.wx??(eyeX+0.42);
  const pivot=new THREE.Group();pivot.position.set(wx,wy,drvZ);pivot.rotation.z=-wt;g.add(pivot);
  const spin=new THREE.Group();pivot.add(spin);
  const lthTex=canvasTex(128,(g,n)=>{g.fillStyle='#141416';g.fillRect(0,0,n,n);for(let i=0;i<4000;i++){const v=14+Math.random()*14|0;g.fillStyle=`rgb(${v},${v},${v+1})`;g.fillRect(Math.random()*n,Math.random()*n,1,1);}g.fillStyle='#5a4a3a';for(let x=0;x<n;x+=6)g.fillRect(x,62,3,2);});
  const lth=new THREE.MeshStandardMaterial({color:0xffffff,map:lthTex,roughness:0.7,envMapIntensity:0.3});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(R,0.024,12,48),lth);ring.rotation.y=Math.PI/2;spin.add(ring);
  [[0,1],[0,-1]].forEach(([a,sd])=>{const sp=new THREE.Mesh(new THREE.BoxGeometry(0.025,0.045,R-0.06),lth);sp.position.set(-0.01,-0.015,sd*(R/2+0.03));spin.add(sp);
    const ac=new THREE.Mesh(new THREE.BoxGeometry(0.027,0.008,0.05),trim);ac.position.set(-0.024,0.0,sd*(R/2+0.02));spin.add(ac);});
  const sp3=new THREE.Mesh(new THREE.BoxGeometry(0.025,R-0.07,0.05),lth);sp3.position.set(-0.01,-(R/2+0.03),0);spin.add(sp3);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.066,0.072,0.06,24),new THREE.MeshStandardMaterial({color:0x101012,map:lthTex,roughness:1,metalness:0,envMapIntensity:0}));hub.rotation.z=Math.PI/2;hub.position.x=-0.015;spin.add(hub);
  const col=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.06,0.42,12),dm);col.rotation.z=Math.PI/2;col.position.x=0.24;pivot.add(col);
  // quadro strumenti in una palpebra, posizionato in modo da essere visibile SOPRA la corona del volante
  const rtx=wx+R*Math.sin(wt),rty=wy+R*Math.cos(wt)+0.03,cx=O.cx??(eyeX+0.6);
  const cBottom=eyeY+(rty-eyeY)*(cx-eyeX)/(rtx-eyeX),cH=0.12,cW=0.32,cy=cBottom+cH/2+0.005;
  const cv=document.createElement('canvas');cv.width=1024;cv.height=384;const tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;
  // abitacoli dei modelli 3D: il quadro sta nella "finestra" fra il mozzo e la parte alta della corona, vista dagli occhi del guidatore
  let clY=O.clY??cy,clS=O.clS;
  let clX=cx+0.01;
  if(O.model&&!O.clFixed){clX=wx+0.24;const proj=(px,py)=>eyeY+(py-eyeY)*(clX-eyeX)/(px-eyeX),yT=proj(wx+(R+0.03)*Math.sin(wt),wy+(R+0.03)*Math.cos(wt));
    if(O.ownWheel){const yH=proj(wx,wy+0.05);clS=Math.min(0.82,Math.max(0.5,(yT-yH)*0.85/cH));clY=(yT+yH)/2+0.01;}else{clS=0.82;clY=yT+cH*clS/2+0.006;}}
  const cl=new THREE.Mesh(new THREE.PlaneGeometry(cW,cH),new THREE.MeshBasicMaterial({map:tex,toneMapped:false,depthTest:!O.model||!!O.clFixed}));cl.renderOrder=O.model&&!O.clFixed?5:0;cl.position.set(clX,clY,drvZ);if(clS)cl.scale.setScalar(clS);cl.rotation.y=-Math.PI/2;cl.rotateX(-0.12);g.add(cl);
  let pod=null;if(O.model&&!O.clFixed&&!O.ownWheel){pod=new THREE.Mesh(rbox(0.07,cH*clS+0.03,cW*clS+0.035,0.014),new THREE.MeshStandardMaterial({color:0x111213,roughness:0.85,metalness:0,envMapIntensity:0.15}));pod.position.set(clX+0.04,clY,drvZ);g.add(pod);}
  const hood=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.16,20,1,true,0,Math.PI),dm);hood.material=dm.clone();hood.material.side=THREE.DoubleSide;
  hood.rotation.set(0,0,Math.PI/2);hood.rotation.y=Math.PI/2;hood.scale.set(1,1,0.45);hood.position.set(cx+0.06,cy+0.02,drvZ);
  const bTop=cy+cH/2+0.02,bBot=Math.min(dashTop-0.05,cy-cH/2-0.01);const binn=new THREE.Mesh(rbox(0.16,bTop-bBot,cW+0.06,0.03),dm);binn.position.set(cx+0.115,(bTop+bBot)/2,drvZ);g.add(binn);
  const visor=new THREE.Mesh(rbox(0.16,0.024,cW+0.08,0.011),dm);visor.position.set(cx+0.07,bTop+0.008,drvZ);visor.rotation.z=-0.1;g.add(visor);
  // bocchette e schermo centrale
  [[drvZ-0.3],[-0.12],[0.12],[W/2-0.25]].forEach(([z])=>{const v=new THREE.Mesh(new THREE.PlaneGeometry(0.16,0.06),new THREE.MeshStandardMaterial({map:ventTex,roughness:0.6}));v.position.set(fx-0.001,dashTop-0.1,z);v.rotation.y=-Math.PI/2;g.add(v);});
  const scv=document.createElement('canvas');scv.width=512;scv.height=256;const stex=new THREE.CanvasTexture(scv);stex.encoding=THREE.sRGBEncoding;
  const scr=new THREE.Mesh(new THREE.ShapeGeometry(rrect(0.24,0.13,0.012),4),new THREE.MeshBasicMaterial({map:stex,toneMapped:false}));{const pp=scr.geometry.attributes.position,uu=scr.geometry.attributes.uv;for(let i=0;i<pp.count;i++)uu.setXY(i,(pp.getX(i)+0.12)/0.24,(pp.getY(i)+0.065)/0.13);}
  scr.position.set(...(O.scr||[fx+0.16,dashTop+0.085,0.06]));scr.rotation.y=-Math.PI/2-0.3;scr.rotateX(-0.12);g.add(scr);
  const scrF=new THREE.Mesh(rbox(0.018,0.145,0.255,0.008),new THREE.MeshStandardMaterial({color:0x101112,roughness:0.35,metalness:0.4}));scrF.rotation.y=-0.3;scrF.position.copy(scr.position);scrF.position.x+=Math.cos(0.3)*0.011;scrF.position.z+=Math.sin(0.3)*0.011;g.add(scrF);
  const scrS=new THREE.Mesh(rbox(0.05,0.07,0.06,0.015),dm);scrS.position.set(fx+0.19,dashTop+0.02,0.06);g.add(scrS);
  // listello decorativo in alluminio spazzolato lungo la plancia e cuciture
  const alu=new THREE.MeshStandardMaterial({color:0xa9adb3,metalness:0.85,roughness:0.35});
  const strip=new THREE.Mesh(rbox(0.012,0.022,W-0.5,0.006),alu);strip.position.set(fx-0.004,dashTop-0.2,0.15);g.add(strip);
  const stitch=new THREE.Mesh(new THREE.BoxGeometry(0.004,0.003,W-0.3),new THREE.MeshBasicMaterial({color:0x6b5a48}));stitch.position.set(fx+0.06,dashTop+0.003,0);g.add(stitch);
  const glove=new THREE.Mesh(new THREE.BoxGeometry(0.004,0.004,0.42),new THREE.MeshBasicMaterial({color:0x0a0a0a}));glove.position.set(fx-0.002,dashTop-0.3,-drvZ);g.add(glove);
  // tunnel centrale con selettore del cambio
  const tun=new THREE.Mesh(rbox(1.1,0.25,0.26,0.05),dm);tun.position.set(eyeX+0.1,dashTop-0.62,0.02);g.add(tun);
  const gcv=document.createElement('canvas');gcv.width=128;gcv.height=128;const gtex=new THREE.CanvasTexture(gcv);
  const gsel=new THREE.Mesh(new THREE.PlaneGeometry(0.1,0.1),new THREE.MeshBasicMaterial({map:gtex,toneMapped:false}));gsel.position.set(eyeX+0.15,dashTop-0.49,0.02);gsel.rotation.x=-Math.PI/2;gsel.rotation.z=Math.PI/2;g.add(gsel);
  const knob=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.03,0.12,12),trim);knob.position.set(eyeX+0.12,dashTop-0.43,0.06);g.add(knob);
  // pannelli porta, davanzali, montanti, cielo, alette parasole
  const doorM=new THREE.MeshStandardMaterial({color:0x2d2e31,map:fabricTex,roughness:0.9});
  [1,-1].forEach(sd=>{const dp=new THREE.Mesh(rbox(wsx-eyeX+0.7,dashTop-0.25,0.07,0.03),doorM);dp.position.set((wsx+eyeX-0.7)/2,(dashTop+0.25)/2,sd*(W/2-0.09));g.add(dp);
    const sill=new THREE.Mesh(rbox(wsx-eyeX+0.7,0.045,0.1,0.02),dm);sill.position.set((wsx+eyeX-0.7)/2,dashTop+0.02,sd*(W/2-0.1));g.add(sill);
    const arm=new THREE.Mesh(rbox(0.4,0.06,0.1,0.025),dm);arm.position.set(eyeX-0.05,dashTop-0.2,sd*(W/2-0.14));g.add(arm);});
  const pm=new THREE.MeshStandardMaterial({color:0x29292b,roughness:0.9,envMapIntensity:0.3});
  // niente cielo, plafoniera, alette e montanti: la vista resta libera
  // sedile del passeggero (riferimento di scala)
  const seatM=new THREE.MeshStandardMaterial({color:0x26272a,map:fabricTex,roughness:0.95});
  const cush=new THREE.Mesh(rbox(0.5,0.13,0.5,0.05),seatM);cush.position.set(eyeX+0.05,dashTop-0.55,-drvZ);g.add(cush);
  const back=new THREE.Mesh(rbox(0.13,0.62,0.5,0.05),seatM);back.position.set(eyeX-0.25,dashTop-0.2,-drvZ);back.rotation.z=0.18;g.add(back);
  const hr=new THREE.Mesh(rbox(0.1,0.18,0.26,0.04),seatM);hr.position.set(eyeX-0.32,dashTop+0.25,-drvZ);g.add(hr);
  // specchi: retrovisore centrale e specchietti esterni (vetro = immagine posteriore)
  const rmx=O.rm?O.rm[0]:van?1.3:T.gh[2][0]-0.08,rmy=O.rm?O.rm[1]:(van?2.0:T.gh[2][1])-0.13;
  const rm=new THREE.Mesh(rrGlass(0.235,0.058,0.022,0.32,0.68,0.12,0.92),mirrorM);rm.position.set(rmx-0.003,rmy,O.rmz??-0.04);rm.rotation.y=-Math.PI/2-0.12;g.add(rm);
  // cornici degli specchi disegnate attorno al vetro, così l'immagine cade sempre al centro
  const frM=new THREE.MeshStandardMaterial({color:0x141416,roughness:0.6});
  {const f=new THREE.Mesh(rbox(0.03,0.078,0.255,0.02),frM);f.position.set(rmx+0.014,rmy,-0.04);f.rotation.y=-0.12;g.add(f);const st=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.01,0.09,8),frM);st.position.set(rmx+0.03,rmy+0.07,-0.04);g.add(st);}
  const smx=O.sm?O.sm[0]+0.102:van?1.3:wsx-0.12,smy=T.hb+0.12,sms=[];
  [[-1,0.66,1.0,0.22],[1,0.0,0.34,-0.22]].forEach(([sd,u0,u1,yaw])=>{const gw=O.sm?0.15:0.2,gh2=O.sm?0.09:0.1,sy=O.sm?O.sm[1]:T.hb+0.13,sz2=sd*(O.sm?O.sm[2]:W/2+0.1);const sm=new THREE.Mesh(rrGlass(gw,gh2,0.025,u0,u1,0.08,0.92),mirrorM);sm.position.set(smx-0.102,sy,sz2);sm.rotation.y=-Math.PI/2+yaw;g.add(sm);sms.push(sm);
  const hs=new THREE.Mesh(rbox(0.07,gh2+0.03,gw+0.03,0.025),frM);hs.position.set(smx-0.102+Math.cos(yaw)*0.04,sy,sz2+Math.sin(yaw)*0.04*-1);hs.rotation.y=yaw;g.add(hs);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.03,Math.abs(sz2)-W/2+0.02),frM);arm.position.set(smx-0.07,sy-0.03,sd*(W/2+(Math.abs(sz2)-W/2)/2-0.01));g.add(arm);
});
  rearCam.position.set(eyeX+0.2,eyeY+0.02,0);
  // tergicristalli
  const wipers=[];if(!van){const base=T.gh[3],top=T.gh[2],ux=top[0]-base[0],uy=top[1]-base[1],ul=Math.hypot(ux,uy);
    [-0.38,0.18].forEach(z0=>{const piv=new THREE.Vector3(base[0]+0.03,base[1]+0.03,z0),bl=new THREE.Mesh(new THREE.BoxGeometry(0.58,0.012,0.012),new THREE.MeshStandardMaterial({color:0x0d0d0d,roughness:0.6}));g.add(bl);
      wipers.push({piv,bl,u:new THREE.Vector3(ux/ul,uy/ul,0)});});}
  // abitacolo del modello: della plancia disegnata restano solo volante, strumenti, schermo e immagini degli specchi
  if(T.glb){wipers.forEach(w=>w.bl.visible=false);wipers.length=0;}
  // Panda: abitacolo vero del modello e, al centro della plancia, solo un piccolo tachimetro digitale
  let spd=null;if(O.speedOnly){const c2=document.createElement('canvas');c2.width=256;c2.height=112;const t2=new THREE.CanvasTexture(c2);t2.encoding=THREE.sRGBEncoding;
    spd=new THREE.Mesh(new THREE.PlaneGeometry(0.13,0.057),new THREE.MeshBasicMaterial({map:t2,toneMapped:false}));spd.position.set(...O.spd);spd.rotation.y=-Math.PI/2;spd.rotateX(-0.35);spd.userData={cv:c2,tex:t2};g.add(spd);
    const bz=new THREE.Mesh(rbox(0.03,0.072,0.15,0.012),new THREE.MeshStandardMaterial({color:0x151517,roughness:0.6}));bz.position.set(O.spd[0]+0.016,O.spd[1],O.spd[2]);bz.rotation.z=-0.35;g.add(bz);spd.userData.bz=bz;}
  if(O.model){const keep=O.speedOnly?[O.ownWheel?null:pivot,rm,...sms,spd,spd&&spd.userData.bz]:[O.ownWheel?null:pivot,cl,scr,scrF,rm,...sms,pod];g.children.forEach(c=>{if(!keep.includes(c))c.visible=false;});wipers.length=0;}
  // occhi più in alto rispetto all'abitacolo (come alzare il sedile): plancia e volante scendono nell'inquadratura, più strada davanti
  const lift=(O.model||CKIMG[selKey])?0:(O.lift??(T.big||van?0.26:0.22));
  [rm,...sms].forEach(o=>o.position.y+=lift*0.8);g.children.forEach(o=>{if(o.material===frM)o.position.y+=lift*0.8;});
  g.visible=false;
  return {g,spd,spin,tex,cv,stex,scv,gtex,gcv,wipers,eye:new THREE.Vector3(eyeX,eyeY+lift,drvZ),wsx,model:!!O.model,mirrors:[rm,...sms]};
}

function drawScreen(ck,st){
  const g=ck.scv.getContext('2d');const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#0d1622');gr.addColorStop(1,'#05080c');g.fillStyle=gr;g.fillRect(0,0,512,256);
  const d=new Date();g.fillStyle='#e6eef7';g.font='bold 64px system-ui';g.textAlign='left';g.fillText(String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'),28,90);
  g.font='26px system-ui';g.fillStyle='#8fb6e0';g.fillText(window.RADIO_LBL||'Radio spenta',30,150);g.fillStyle='#7a8794';g.font='22px system-ui';g.fillText('Limite '+st.limit+' km/h · '+st.km.toFixed(1)+' km',30,200);
  g.strokeStyle='#2f4a66';g.lineWidth=2;g.strokeRect(330,30,150,190);g.fillStyle='#16324f';g.fillRect(332,32,146,186);g.fillStyle='#3b82f6';g.beginPath();g.moveTo(405,140);g.lineTo(395,165);g.lineTo(405,158);g.lineTo(415,165);g.fill();
  ck.stex.needsUpdate=true;
  const q=ck.gcv.getContext('2d');q.fillStyle='#111';q.fillRect(0,0,128,128);q.font='bold 26px system-ui';q.textAlign='center';
  ['P','R','N','D'].forEach((c,i)=>{q.fillStyle=(pl.sel===c)?'#ffffff':'#555';q.fillText(c,24+i*27,74);});ck.gtex.needsUpdate=true;}
function drawCluster(ck,P,st){
  if(CKO.on){document.getElementById('ckSpd').textContent=Math.round(st.kmh);document.getElementById('ckGear').textContent=pl.sel==='R'?'R':pl.sel==='N'?'N':(CKO.cfg.man?String(pl.gear):'D'+pl.gear);const bl=(pl.blink||pl.hazard)&&pl.blinkOn;
    document.getElementById('ckTL').style.opacity=bl&&(pl.blink===-1||pl.hazard)?1:0;document.getElementById('ckTR').style.opacity=bl&&(pl.blink===1||pl.hazard)?1:0;document.getElementById('ckBeam').style.opacity=pl.lights?1:0;
    if(CKO.cfg.meter){const X=JOB.pax,on=!!(X&&X.on&&JOB.cur&&JOB.cur.k==='taxi'),e=document.getElementById('ckMeter'),txt=on?(10+Math.max(0,pl.km-(X.km0??pl.km))*14).toFixed(2).replace('.',',')+' €':'LIBERO',k=txt+(on?1:0);if(e.dataset.k!==k){e.dataset.k=k;e.children[0].textContent=txt;e.children[1].textContent=on?'TARIFFA 1':'- - -';}}}
  if(ck.spd){const c=ck.spd.userData.cv,g=c.getContext('2d');g.fillStyle='#07090b';g.fillRect(0,0,256,112);g.fillStyle='#ffb347';g.font='bold 72px system-ui';g.textAlign='right';g.fillText(String(Math.round(st.kmh)),178,82);
    g.font='bold 22px system-ui';g.fillStyle='#c98a3a';g.textAlign='left';g.fillText('km/h',184,82);g.fillText(pl.sel==='D'?'D'+pl.gear:pl.sel,190,40);ck.spd.userData.tex.needsUpdate=true;return;}
  const g=ck.cv.getContext('2d'),W=1024,H=384;g.textBaseline='middle';
  const bg=g.createRadialGradient(512,190,40,512,190,560);bg.addColorStop(0,'#14181e');bg.addColorStop(1,'#030405');g.fillStyle=bg;g.fillRect(0,0,W,H);
  g.strokeStyle='rgba(80,160,255,.35)';g.lineWidth=2;g.beginPath();g.moveTo(330,372);g.lineTo(694,372);g.stroke();
  // quadranti ad arco con riempimento luminoso
  function dial(cx,cy,r,val,max,step,label,redFrom,fmt,c1,c2){
    const a0=0.75*Math.PI,a1=2.25*Math.PI,av=a0+(a1-a0)*Math.max(0,Math.min(1,val/max));
    g.lineCap='round';g.lineWidth=16;g.strokeStyle='#1b1f26';g.beginPath();g.arc(cx,cy,r,a0,a1);g.stroke();
    if(redFrom){g.strokeStyle='rgba(200,40,30,.55)';g.beginPath();g.arc(cx,cy,r,a0+(a1-a0)*redFrom/max,a1);g.stroke();}
    const gr=g.createLinearGradient(cx-r,cy,cx+r,cy);gr.addColorStop(0,c1);gr.addColorStop(1,c2);g.strokeStyle=gr;g.shadowColor=c2;g.shadowBlur=14;g.beginPath();g.arc(cx,cy,r,a0,av);g.stroke();g.shadowBlur=0;g.lineCap='butt';
    g.fillStyle='#d8dde4';g.font='600 22px system-ui';g.textAlign='center';
    for(let v=0;v<=max+1e-6;v+=step){const a=a0+(a1-a0)*v/max;g.strokeStyle=redFrom&&v>=redFrom?'#ff5b4a':'#9aa3ad';g.lineWidth=3;g.beginPath();g.moveTo(cx+Math.cos(a)*(r-26),cy+Math.sin(a)*(r-26));g.lineTo(cx+Math.cos(a)*(r-12),cy+Math.sin(a)*(r-12));g.stroke();
      g.fillText(fmt(v),cx+Math.cos(a)*(r-50),cy+Math.sin(a)*(r-50));}
    g.strokeStyle='#ff6a2a';g.lineWidth=5;g.shadowColor='#ff6a2a';g.shadowBlur=10;g.beginPath();g.moveTo(cx+Math.cos(av)*18,cy+Math.sin(av)*18);g.lineTo(cx+Math.cos(av)*(r-8),cy+Math.sin(av)*(r-8));g.stroke();g.shadowBlur=0;
    g.fillStyle='#0c0e11';g.beginPath();g.arc(cx,cy,20,0,7);g.fill();g.strokeStyle='#444a52';g.lineWidth=3;g.stroke();
    g.fillStyle='#7f8994';g.font='17px system-ui';g.fillText(label,cx,cy+r*0.62);}
  const redK=Math.ceil(P.red/1000+1);
  dial(180,200,158,st.rpm/1000,redK,1,'giri x1000',P.red/1000,v=>v,'#2f8cff','#7fd4ff');
  dial(844,200,158,st.kmh,P.vmax,20,'km/h',0,v=>v,'#2f8cff','#9ff0ff');
  // velocità grande e marcia
  g.textAlign='center';g.fillStyle='#ffffff';g.shadowColor='rgba(120,200,255,.6)';g.shadowBlur=16;g.font='bold 120px system-ui';g.fillText(Math.round(st.kmh),512,170);g.shadowBlur=0;
  g.fillStyle='#8fa0b2';g.font='22px system-ui';g.fillText('km/h',512,240);
  g.fillStyle='#1a2a3a';g.strokeStyle='#4aa8ff';g.lineWidth=3;g.beginPath();g.roundRect?g.roundRect(462,262,100,52,12):g.rect(462,262,100,52);g.fill();g.stroke();g.fillStyle='#bfe3ff';g.font='bold 36px system-ui';g.fillText(st.gearTxt,512,289);
  g.fillStyle='#7f8994';g.font='19px system-ui';g.fillText(st.km.toFixed(1)+' km',512,340);
  // limite di velocità
  g.lineWidth=9;g.strokeStyle='#d0261c';g.fillStyle='#fff';g.beginPath();g.arc(400,64,32,0,7);g.fill();g.stroke();g.fillStyle='#111';g.font='bold 28px system-ui';g.fillText(st.limit,400,66);
  if(st.over){g.fillStyle=(performance.now()/350|0)%2?'#ffb000':'#7a5300';g.beginPath();g.arc(624,64,28,0,7);g.fill();g.fillStyle='#111';g.font='bold 32px system-ui';g.fillText('!',624,66);}
  // frecce
  if((pl.blink||pl.hazard)&&pl.blinkOn){g.fillStyle='#34d058';const ar=(x,d)=>{g.beginPath();g.moveTo(x,46);g.lineTo(x-d*28,66);g.lineTo(x,86);g.lineTo(x,76);g.lineTo(x+d*26,76);g.lineTo(x+d*26,56);g.lineTo(x,56);g.closePath();g.fill();};
    if(pl.blink<0||pl.hazard)ar(470,1);if(pl.blink>0||pl.hazard)ar(554,-1);}
  // spie in basso
  const lamps=[[pl.flash,'#3a8bff','≡D'],[pl.lights&&!pl.flash,'#3ad16a','◐'],[pl.absOn||(P.abs===false),'#ffb000','ABS'],[pl.spinW>0.05&&P.tc!==false||P.tc===false,'#ffb000','TC'],[pl.hb,'#ff4a3a','(P)'],[pl.hazard,'#ff4a3a','▲']];
  lamps.forEach(([on,c,t],k)=>{const x=362+k*60;g.fillStyle=on?c:'#262b31';g.font='bold 20px system-ui';g.fillText(t,x,372-16);});
  const dm=st.dmg;if(dm>0.02){g.fillStyle=dm>0.5?'#ff4a2a':'#ffb000';g.font='bold 20px system-ui';g.fillText('danni '+Math.round(dm*100)+'%',844,330);}
  if(st.over){g.fillStyle='#ffb000';g.font='bold 18px system-ui';g.fillText('LIMITE SUPERATO',512,22);}
  const gl=g.createLinearGradient(0,0,W,H);gl.addColorStop(0,'rgba(255,255,255,0.08)');gl.addColorStop(0.3,'rgba(255,255,255,0.0)');g.fillStyle=gl;g.fillRect(0,0,W,H);
  ck.tex.needsUpdate=true;
}

