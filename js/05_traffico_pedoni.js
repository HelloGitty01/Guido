// Guido · 05 traffico pedoni — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ================= ROTATORIA =================
if(RB){const disc=new THREE.Mesh(new THREE.CircleGeometry(11.6,40),roadMat);disc.rotation.x=-Math.PI/2;disc.position.set(RB.x,0.022,RB.z);disc.receiveShadow=true;scene.add(disc);
 const ring=new THREE.Mesh(new THREE.RingGeometry(4.6,4.8,40),white);ring.rotation.x=-Math.PI/2;ring.position.set(RB.x,0.03,RB.z);scene.add(ring);
 const isl=new THREE.Mesh(new THREE.CylinderGeometry(4.2,4.3,0.3,32),curbM);isl.position.set(RB.x,0.15,RB.z);scene.add(isl);
 const gr=new THREE.Mesh(new THREE.CylinderGeometry(3.95,3.95,0.32,32),mat(0x5d7d3a));gr.position.set(RB.x,0.17,RB.z);scene.add(gr);
 const ped=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.6,1.4),mat(0xcfc6b4));ped.position.set(RB.x,1.1,RB.z);ped.castShadow=true;scene.add(ped);
 const col=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.45,4.5,12),mat(0xd8d0c0));col.position.set(RB.x,4.1,RB.z);col.castShadow=true;scene.add(col);
 const top=new THREE.Mesh(new THREE.SphereGeometry(0.6,14,10),mat(0x7a6a4a,{metalness:0.6,roughness:0.4}));top.position.set(RB.x,6.7,RB.z);scene.add(top);
 for(let i=0;i<14;i++){const a=i/14*6.283,f=new THREE.Mesh(new THREE.SphereGeometry(0.35,8,6),mat([0xc8102e,0xf2c12e,0xe8e8e8,0xb04a9a][i%4]));f.position.set(RB.x+Math.cos(a)*3,0.4,RB.z+Math.sin(a)*3);scene.add(f);}
 obstaclesCirc.push({x:RB.x,z:RB.z,r:4.25});}
// ================= SEMAFORI =================
const ints=[]; // incroci
const CYCLE=[{X:'G',Z:'R',t:12},{X:'Y',Z:'R',t:3},{X:'R',Z:'R',t:2},{X:'R',Z:'G',t:12},{X:'R',Z:'Y',t:3},{X:'R',Z:'R',t:2}];
const CYT=CYCLE.reduce((a,c)=>a+c.t,0);
const offM=c=>{const m=new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(0.12),toneMapped:false});m.userData.on=new THREE.Color(c).multiplyScalar(1.6);m.userData.off=m.color.clone();return m;};
const haloTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(0.25,'rgba(255,255,255,0.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
const visorM=mat(0x16181b),lampG=new THREE.SphereGeometry(0.16,14,10),visorG=new THREE.CylinderGeometry(0.2,0.2,0.22,14,1,true,-Math.PI/2,Math.PI);visorG.rotateX(Math.PI/2);
RL.forEach(ix=>RL.forEach(iz=>{
  const I={x:ix,z:iz,off:Math.random()*CYT,lamps:{X:[],Z:[]},state:{X:'G',Z:'R'},round:isRB(ix,iz),inside:[]};
  if(I.round){I.state={X:'G',Z:'G'};ints.push(I);return;}
  [[1,0,'X'],[-1,0,'X'],[0,1,'Z'],[0,-1,'Z']].forEach(([dx,dz,ax])=>{
    const rx=-dz,rz=dx,x=ix-dx*8.5+rx*(ROAD_HALF+0.8),z=iz-dz*8.5+rz*(ROAD_HALF+0.8);
    const g=new THREE.Group();g.position.set(x,CURB,z);
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,3.4,6),poleM);p.position.y=1.7;g.add(p);
    const box=new THREE.Mesh(new THREE.BoxGeometry(0.5,1.4,0.32),mat(0x1d2024));box.position.y=3.65;g.add(box);
    const plate=new THREE.Mesh(new THREE.BoxGeometry(0.75,1.6,0.03),mat(0x0e0f11));plate.position.set(0,3.65,-0.17);g.add(plate);
    const ls=[];[0xff2a1a,0xffb000,0x22dd55].forEach((c,i)=>{const m=offM(c);const y=4.1-i*0.44;const s=new THREE.Mesh(lampG,m);s.scale.z=0.5;s.position.set(0,y,0.16);g.add(s);
      const vz=new THREE.Mesh(visorG,visorM);vz.position.set(0,y+0.05,0.27);g.add(vz);
      if(!m.userData.halo){m.userData.halo=new THREE.SpriteMaterial({map:haloTex,color:c,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});}
      const hs=new THREE.Sprite(m.userData.halo);hs.scale.set(1.5,1.5,1);hs.position.set(0,y,0.3);g.add(hs);
      const r=new THREE.Mesh(lampG,m);r.scale.set(0.55,0.55,0.3);r.position.set(0.14,2.35-i*0.2,0.12);g.add(r);ls.push(m);});
    const rb=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.7,0.14),mat(0x1d2024));rb.position.set(0.14,2.15,0.02);g.add(rb);
    g.rotation.y=Math.atan2(-dx,-dz);scene.add(g);I.lamps[ax].push(ls);obstaclesCirc.push({x,z,r:0.15});
  });
  ints.push(I);
}));
function updateLights(t){ints.forEach(I=>{if(I.round)return;let tt=(t+I.off)%CYT,i=0;while(tt>CYCLE[i].t){tt-=CYCLE[i].t;i++;}
  I.state=CYCLE[i];['X','Z'].forEach(ax=>{const st=I.state[ax];I.lamps[ax].forEach(l=>{l.forEach((q,k)=>{q.userData.halo.opacity=(k===0&&st==='R')||(k===1&&st==='Y')||(k===2&&st==='G')?0.85:0;});l[0].color.copy(st==='R'?l[0].userData.on:l[0].userData.off);l[1].color.copy(st==='Y'?l[1].userData.on:l[1].userData.off);l[2].color.copy(st==='G'?l[2].userData.on:l[2].userData.off);});});});}
const intAt=(x,z)=>ints.find(I=>I.x===x&&I.z===z);

// ================= CORSIE / TRAFFICO =================
const lanes=[];
RL.forEach(p=>{
  [[1,0],[-1,0]].forEach(([dx,dz])=>lanes.push({base:{x:0,z:p},d:{x:dx,z:dz},axis:'X',road:p}));
  [[0,1],[0,-1]].forEach(([dx,dz])=>lanes.push({base:{x:p,z:0},d:{x:dx,z:dz},axis:'Z',road:p}));
});
lanes.forEach(ln=>{ln.right={x:-ln.d.z,z:ln.d.x};ln.heading=Math.atan2(-ln.d.z,ln.d.x);ln.cars=[];
  ln.stops=RL.map(q=>{const s=ln.axis==='X'?q*ln.d.x:q*ln.d.z;const I=ln.axis==='X'?intAt(q,ln.road):intAt(ln.road,q);return{s,I};}).sort((a,b)=>a.s-b.s);
  ln.pos=(s,off)=>({x:ln.base.x+ln.d.x*s+ln.right.x*off,z:ln.base.z+ln.d.z*s+ln.right.z*off});
  ln.off=LANE_OFF;ln.loop=false;ln.smin=-L;ln.smax=L;
  if(ln.axis==='X'&&ln.road===0){if(ln.d.x>0)ln.smax=RX0-2;else ln.smin=-(RX0-2);}   // la strada centrale prosegue fino all'anello
  ln.at=(s)=>({x:ln.base.x+ln.d.x*s,z:ln.base.z+ln.d.z*s,dx:ln.d.x,dz:ln.d.z});
  ln.proj=(x,z)=>{const rx=x-ln.base.x,rz=z-ln.base.z;return{s:rx*ln.d.x+rz*ln.d.z,lat:rx*ln.right.x+rz*ln.right.z,dx:ln.d.x,dz:ln.d.z};};
  ln.near=(x,z)=>{const q=ln.proj(x,z);return q.s>ln.smin-10&&q.s<ln.smax+10;};
});
function lanePos(ln,s,off){const q=ln.at(s);return{x:q.x-q.dz*off,z:q.z+q.dx*off,dx:q.dx,dz:q.dz};}
// corsie dell'anello: 2 per senso di marcia
[[ringPath,2.7,'fast'],[ringPath,6.1,'slow'],[ringPathR,2.7,'fast'],[ringPathR,6.1,'slow']].forEach(([P,off,kind])=>{
  lanes.push({ring:true,kind,off,loop:true,len:P.len,stops:[],cars:[],at:P.at,proj:P.proj,near:(x,z)=>Math.abs(ringSDF(x,z))<14,smin:0,smax:P.len});});
// parcheggiate
const parked=[];
lanes.forEach(ln=>{if(ln.ring)return;for(let s=-L+10;s<L-10;s+=6.5+Math.random()*10){
  if(RL.some(q=>Math.abs(s-q*(ln.axis==='X'?ln.d.x:ln.d.z))<16)) continue; if(Math.random()<0.45) continue;
  const k=Math.random()<0.1?'furgone':randType();const T=TYPES[k];const c=makeCar(k,randColor(),false);const p=ln.pos(s,PARK_OFF);
  c.position.set(p.x,0,p.z);c.rotation.y=ln.heading;scene.add(c);parked.push(c);
  const hx=Math.abs(ln.d.x)*T.L/2+Math.abs(ln.d.z)*T.W/2,hz=Math.abs(ln.d.z)*T.L/2+Math.abs(ln.d.x)*T.W/2;
  obstaclesBox.push({x0:p.x-hx,x1:p.x+hx,z0:p.z-hz,z1:p.z+hz,car:true});s+=T.L;}});
const cars=[];
function spawn(ln,s,forceK){const k=forceK||randTrafType(),T=TYPES[k],mesh=makeCar(k,randColor());scene.add(mesh);
  const v0=12+Math.random()*2.2-(k==='furgone'?1.5:0);
  const c={ln,s,v:v0*0.8,v0,T,mesh,honkCd:0,flashT:0,waitT:0,lo:0,loT:0,horn:{f:(k==='furgone'?260:300)+Math.random()*340,ratio:[1.12,1.19,1.26,1.33,1.5][(Math.random()*5)|0],wave:['square','sawtooth','square','triangle'][(Math.random()*4)|0],cut:900+Math.random()*2600,single:Math.random()<0.25,det:(Math.random()-0.5)*30},a:0,amax:1.2+Math.random()*0.6,b:2.2,Th:1.3+Math.random()*0.5,s0:2.2,hold:0};
  ln.cars.push(c);cars.push(c);}
lanes.forEach(ln=>{if(ln.ring)return;for(let s=-L+5;s<L-20;s+=30+Math.random()*40)spawn(ln,s);});
// mezzi di soccorso: polizia, ambulanza, vigili del fuoco (in città, sirene accese)
const EMS=[];
function emergencyKit(c,kind){const g=c.mesh,T=c.T,top=T.glb?T.roofY:T.truck?3.0:T.van?T.H:T.gh[1][1],bx=T.glb?T.roofX:T.truck?TYPES.camion.L/2-1.1:T.van?0.6:(T.gh[1][0]+T.gh[2][0])/2+0.2;
  const bM=new THREE.MeshStandardMaterial({color:0x10204a,emissive:0x2a5cff,emissiveIntensity:0}),bM2=bM.clone();
  [-1,1].forEach((sd,i)=>{const l=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.1,0.42),i?bM2:bM);l.position.set(bx,top+0.06,sd*0.24);g.add(l);});
  const base=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.04,1.0),trimM);base.position.set(bx,top+0.01,0);g.add(base);
  const stripeC={police:0x1e3f9a,amb:0xff6a00,fire:0xf2f2f2}[kind];
  [-1,1].forEach(sd=>{const st=new THREE.Mesh(new THREE.BoxGeometry(T.L*0.8,0.12,0.01),new THREE.MeshStandardMaterial({color:stripeC,roughness:0.4}));st.position.set(T.glb?(T.truck?-0.4:0):0,T.glb?(T.truck?1.5:T.beltY):T.truck?1.5:T.hb-0.18,sd*(T.W/2+(T.glb?0.01:0.015)));g.add(st);});
  c.em={kind,bM,bM2,ph:Math.random()*6};c.v0=c.v0b=kind==='fire'?14:16;c.amax=2;EMS.push(c);}
{const pick=(ax,road,dx)=>lanes.find(l=>!l.ring&&l.axis===ax&&l.road===road&&(l.d.x||l.d.z)===dx);
 [['police','berlina',0xf4f4f4,pick('X',0,-1),-150],['police','berlina',0x14203f,pick('Z',RL[0],1),-60],['amb','furgone',0xf7f7f2,pick('Z',0,1),-200],['fire','camion',0xc41616,pick('X',RL[RL.length-1],1),-180]].forEach(([kind,k,col,ln,s0])=>{
   if(!ln)return;const T=TYPES[k],mesh=makeCar(k,col,true,false,{plain:kind==='amb'});scene.add(mesh);
   const c={ln,s:s0,v:8,v0:16,T,mesh,honkCd:0,flashT:0,waitT:0,lo:0,loT:0,horn:{f:380,ratio:1.26,wave:'square',cut:2200,single:false,det:0},a:0,amax:2,b:3,Th:1.1,s0:2.2,hold:0};
   ln.cars.push(c);cars.push(c);emergencyKit(c,kind);});}
lanes.filter(l=>l.ring).forEach(ln=>{const n=12;for(let i=0;i<n;i++){spawn(ln,i*ln.len/n+Math.random()*30,ln.kind==='slow'&&Math.random()<0.3?'camion':null);const c=ln.cars[ln.cars.length-1];
  c.v0=ln.kind==='fast'?29+Math.random()*4:(c.T.truck?21+Math.random()*1.5:c.T===TYPES.furgone?22:24+Math.random()*3);c.v0b=c.v0;c.v=c.v0*0.9;c.amax=1.4;c.b=2.5;c.Th=1.4+Math.random()*0.4;}});
function aiHonk(c,dur){if(!AC||c.honkCd>0)return;c.honkCd=3+Math.random()*2;
  const p=c.mesh.position,dist=Math.hypot(p.x-pl.x,p.z-pl.z);if(dist>70)return;
  const H=c.horn,t=AC.currentTime,g=AC.createGain(),f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=H.cut;f.Q.value=2;
  const vol=0.32/(1+dist/9);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+0.02);g.gain.setValueAtTime(vol,t+dur);g.gain.linearRampToValueAtTime(0,t+dur+0.05);
  f.connect(g).connect(ACOUT());
  (H.single?[H.f]:[H.f,H.f*H.ratio]).forEach(fr=>{const o=AC.createOscillator();o.type=H.wave;o.frequency.value=fr;o.detune.value=H.det;o.connect(f);o.start(t);o.stop(t+dur+0.1);});
  if(dur<0.4&&Math.random()<0.6){c.honkCd=0;setTimeout(()=>{aiHonk(c,0.25);c.honkCd=4;},380);}}
function aiFlash(c){if(c.flashT<=0)c.flashT=1.3;}
function aiAngry(c,dur){aiHonk(c,dur);aiFlash(c);}
function idm(c,gap,dv){const ss=c.s0+Math.max(0,c.v*c.Th+c.v*dv/(2*Math.sqrt(c.amax*c.b)));return c.amax*(1-Math.pow(c.v/c.v0,4)-Math.pow(ss/Math.max(gap,0.1),2));}


// ================= PEDONI =================
const PC=ROAD_HALF+1.6;   // distanza degli angoli di marciapiede dal centro incrocio (= posizione strisce)
const pNodes=[],pIdx=new Map();
ints.forEach(I=>{if(I.round)return;[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([a,b])=>{const n={x:I.x+a*PC,z:I.z+b*PC,I,a,b,edges:[]};pIdx.set(I.x+','+I.z+','+a+','+b,n);pNodes.push(n);});});
pNodes.forEach(n=>{const I=n.I;
  if(!n)return;
  // strisce: attraversa la strada X (cambia lato z) o la strada Z (cambia lato x)
  n.edges.push({to:pIdx.get(I.x+','+I.z+','+n.a+','+(-n.b)),cross:'X',I});n.edges.push({to:pIdx.get(I.x+','+I.z+','+(-n.a)+','+n.b),cross:'Z',I});
  // marciapiede verso l'incrocio vicino
  const nx=RL[RL.indexOf(I.x)+n.a],nz=RL[RL.indexOf(I.z)+n.b];
  if(nx!==undefined)n.edges.push({to:pIdx.get(nx+','+I.z+','+(-n.a)+','+n.b)});
  if(nz!==undefined)n.edges.push({to:pIdx.get(I.x+','+nz+','+n.a+','+(-n.b))});});
const skinC=[0xf1c9a5,0xe0ac80,0xc68a5a,0x8d5a3a,0xf5d6bd],clothC=[0x2b3a55,0x6b2a2a,0x3d5a3d,0x7a6a55,0x222222,0xb0b4ba,0x4a3b6b,0xc9a227,0x1f6f8b,0x8b4513];
const peds=[];
const PEDX=(()=>{if(!MODELS.ped||!THREE.SkeletonUtils||!MODELS.ped.animations.length)return null;const g=MODELS.ped;
  const tints=[[1,1,1],[0.82,0.86,0.95],[1,0.9,0.8],[0.75,0.75,0.75],[0.92,1,0.9],[1,0.85,0.88],[0.68,0.72,0.8]];const mats=[];
  g.scene.traverse(o=>{if(o.isMesh&&!mats.length)tints.forEach(t=>{const m=o.material.clone();m.color.setRGB(t[0],t[1],t[2]);m.roughness=0.85;mats.push(m);});});
  return{sc:g.scene,clip:g.animations[0],mats,H:190};})();
function makePedHi(g,h){const hi=THREE.SkeletonUtils.clone(PEDX.sc),w=new THREE.Group(),mt=PEDX.mats[(Math.random()*PEDX.mats.length)|0];
  hi.traverse(o=>{if(o.isMesh){o.material=mt;o.castShadow=true;o.frustumCulled=false;}});w.add(hi);w.scale.setScalar(h/PEDX.H);w.rotation.y=Math.PI/2;
  const mx=new THREE.AnimationMixer(hi),a=mx.clipAction(PEDX.clip);a.play();mx.setTime(Math.random()*PEDX.clip.duration);
  const lo=new THREE.Group();[...g.children].forEach(c=>lo.add(c));g.add(lo);g.add(w);g.userData.hi=w;g.userData.lo=lo;g.userData.mixer=mx;w.visible=false;}
// ---- pedoni più realistici: personaggi Quaternius (CC0), animati via codice muovendo le ossa ----
const PPL=(()=>{const G=MODELS.people;if(!G||!THREE.SkeletonUtils||!G.scenes||G.scenes.length<2)return null;const men=[0,1,2,3,4],women=[5,6,7,8,9];
  const LC=c=>new THREE.Color(c).convertSRGBToLinear(),SKIN=[0xf1c9a5,0xe0ac80,0xc68a5a,0x8d5a3a,0xf5d6bd,0xd9a67c],
    CLOTH=[0x2b3a55,0x6b2a2a,0x3d5a3d,0x7a6a55,0x222222,0xb0b4ba,0x4a3b6b,0xc9a227,0x1f6f8b,0x8b4513,0xd9d4c7,0x7d1f3a,0x41624f,0x2d2d3a,0xa45a2a,0x5a6f8a];
  const S=G.scenes.map(sc=>{sc.updateMatrixWorld(true);let hy=1.6;sc.traverse(o=>{if(o.isBone&&/^Head(_\d+)?$/.test(o.name))hy=o.getWorldPosition(new THREE.Vector3()).y;});return{sc,hy};});
  const rp=a=>a[(Math.random()*a.length)|0];
  function make(kind){const old=kind==='oldm'||kind==='oldw',child=kind==='child',fem=kind==='woman'||kind==='oldw'||(child&&Math.random()<0.5);
    const idx=old?(fem?rp([6,7,5]):rp([0,1,2])):rp(fem?women:men),src=S[idx],c=THREE.SkeletonUtils.clone(src.sc),mm=new Map(),skin=LC(rp(SKIN));
    c.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.frustumCulled=false;const arr=Array.isArray(o.material)?o.material:[o.material];
      const nm=arr.map(m=>{if(mm.has(m))return mm.get(m);const n=m.clone(),name=m.name||'';n.roughness=0.8;n.metalness=0;
        if(/skin/i.test(name))n.color.copy(skin);else if(/hair/i.test(name)){if(old)n.color.setRGB(0.42,0.42,0.42);else if(Math.random()<0.4)n.color.copy(LC(rp([0x1a1410,0x3a2618,0x6b4a2a,0xb08a4a,0x7a2a10])));}
        else if(!/eye|brow|mouth|teeth/i.test(name)&&Math.random()<0.65)n.color.copy(LC(rp(CLOTH)));mm.set(m,n);return n;});o.material=Array.isArray(o.material)?nm:nm[0];});
    c.updateMatrixWorld(true);const R={};c.traverse(o=>{if(o.isBone){const n=o.name.replace(/_\d+$/,'');R[n]={b:o,r:o.quaternion.clone(),pq:o.parent.getWorldQuaternion(new THREE.Quaternion()).invert()};}});
    const H=child?1.12+Math.random()*0.2:(fem?1.6:1.72)+Math.random()*0.14-(old?0.06:0),k=H/(src.hy*1.1),w=new THREE.Group();w.add(c);w.scale.setScalar(k);w.rotation.y=Math.PI/2;
    return{w,R,old,child,H};}
  const _v=new THREE.Vector3(),_q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1);
  function set(R,n,list){const e=R[n];if(!e)return;_q2.identity();for(const[ax,an]of list){_v.copy(ax).applyQuaternion(e.pq);_q.setFromAxisAngle(_v,an);_q2.premultiply(_q);}e.b.quaternion.copy(_q2).multiply(e.r);}
  // posa: passo (fase ph, mv 0..1), anziani curvi, rabbia col pugno alzato
  function pose(P,ph,mv,angry,t){const R=P.R,A=(P.child?0.55:P.old?0.32:0.45)*mv,s=Math.sin(ph),c=Math.cos(ph);
    set(R,'UpperLegL',[[X,-A*s]]);set(R,'UpperLegR',[[X,A*s]]);set(R,'LowerLegL',[[X,Math.max(0,-c)*0.75*mv]]);set(R,'LowerLegR',[[X,Math.max(0,c)*0.75*mv]]);
    const aa=(P.old?0.18:0.35)*mv;set(R,'UpperArmL',[[Z,-1.22],[X,aa*s]]);set(R,'LowerArmL',[[X,-0.25-0.15*mv]]);
    if(angry){set(R,'UpperArmR',[[Z,1.1],[X,-2.3+Math.sin(t*16)*0.25]]);set(R,'LowerArmR',[[X,-0.9]]);}else{set(R,'UpperArmR',[[Z,1.22],[X,-aa*s]]);set(R,'LowerArmR',[[X,-0.25-0.15*mv]]);}
    set(R,'Torso',[[X,P.old?0.28:0.03*mv]]);set(R,'Neck',[[X,P.old?-0.18:0]]);P.w.position.y=Math.abs(c)*0.025*mv;}
  function wave(P,t){pose(P,0,0,false,t);set(P.R,'UpperArmR',[[Z,1.0],[X,-2.6+Math.sin(t*5)*0.3]]);set(P.R,'LowerArmR',[[X,-0.35]]);}
  // al telefono: mano all'orecchio; chiacchiere: le mani accompagnano le parole
  function phone(P,t){set(P.R,'UpperArmR',[[Z,0.55],[X,-1.25]]);set(P.R,'LowerArmR',[[X,-2.25]]);}
  function talk(P,t){set(P.R,'UpperArmR',[[Z,1.05],[X,-0.55+Math.sin(t*2.3)*0.22]]);set(P.R,'LowerArmR',[[X,-1.25+Math.sin(t*3.1)*0.4]]);
    set(P.R,'UpperArmL',[[Z,-1.1],[X,-0.35+Math.sin(t*1.7+1)*0.18]]);set(P.R,'LowerArmL',[[X,-0.9+Math.sin(t*2.6)*0.3]]);}
  return{make,pose,wave,phone,talk};})();
function attachHi(m,kind){if(!PPL||m.userData.hiP||kind==='dog')return;const P=PPL.make(kind),lo=new THREE.Group();[...m.children].forEach(c=>lo.add(c));m.add(lo);m.add(P.w);P.w.visible=false;
  m.userData.hiP=P;m.userData.loP=lo;m.userData.loHand=m.userData.hand;if(m.userData.hi){m.userData.hi.visible=false;}m.userData.mixer=null;}
function makePed(){const g=new THREE.Group(),h=1.6+Math.random()*0.25,sk=mat(skinC[(Math.random()*5)|0]),top=mat(clothC[(Math.random()*10)|0]),bot=mat(clothC[(Math.random()*10)|0]);
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(0.19,0.15,h*0.36,10),top);torso.position.y=h*0.66;torso.castShadow=true;g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.11,12,10),sk);head.position.y=h*0.9;g.add(head);
  const legG=new THREE.BoxGeometry(0.12,h*0.47,0.13);legG.translate(0,-h*0.235,0);const legs=[-1,1].map(sd=>{const l=new THREE.Mesh(legG,bot);l.position.set(0,h*0.48,sd*0.09);g.add(l);return l;});
  const armG=new THREE.BoxGeometry(0.08,h*0.34,0.08);armG.translate(0,-h*0.17,0);const arms=[-1,1].map(sd=>{const a=new THREE.Mesh(armG,top);a.position.set(0,h*0.82,sd*0.24);g.add(a);return a;});
  g.userData={legs,arms};if(PEDX)makePedHi(g,h);return g;}
for(let i=0;i<80;i++){const n=pNodes.slice().sort(()=>Math.random()-0.5).sort((a,b)=>(Math.hypot(a.x,a.z)+Math.random()*160)-(Math.hypot(b.x,b.z)+Math.random()*160))[0];
  const e=n.edges.filter(e=>e.to&&!e.cross);if(!e.length)continue;const ed=e[(Math.random()*e.length)|0],m=makePed();scene.add(m);
  const t=Math.random();peds.push({m,from:n,edge:ed,t,len:Math.hypot(ed.to.x-n.x,ed.to.z-n.z),v:1.1+Math.random()*0.5,ph:Math.random()*6,wait:0,off:0,offT:0,down:false,
    side:(Math.random()<0.5?-1:1)*(0.4+Math.random()*0.9)});}
// ---- pedoni di ogni tipo: donne, anziani, bambini (figure con articolazioni e camminata) e cani ----
const PMAT=new Map();const pm=(c,o)=>{const k=c+'|'+(o?JSON.stringify(o):'');let m=PMAT.get(k);if(!m){m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:0.85},o||{}));PMAT.set(k,m);}return m;};
const PG={cyl:new THREE.CylinderGeometry(1,1,1,8).translate(0,-0.5,0),sph:new THREE.SphereGeometry(1,12,9),box:new THREE.BoxGeometry(1,1,1),cone:new THREE.CylinderGeometry(0.5,1,1,12,1,true).translate(0,-0.5,0)};
const rp=a=>a[(Math.random()*a.length)|0];
function makeHuman(kind){// kind: 'woman','oldw','oldm','child'
  const old=kind==='oldw'||kind==='oldm',fem=kind==='woman'||kind==='oldw',child=kind==='child',H=child?1.0+Math.random()*0.35:old?1.58+Math.random()*0.12:fem?1.6+Math.random()*0.14:1.72;
  const skin=pm(rp(skinC)),hairC=old?rp([0xd8d8d8,0xbdbdbd,0xeeeeee,0x9a9a9a]):rp([0x2a1a10,0x4a2e1a,0x7a5230,0xc9a066,0x111111,0x8a3a1a]),hair=pm(hairC,{roughness:0.95});
  const top=pm(fem?rp([0xc0392b,0x8e44ad,0x2e86c1,0xf5b7b1,0xf7dc6f,0x1abc9c,0xffffff,0x34495e,0xd35400]):child?rp([0xe74c3c,0x3498db,0xf1c40f,0x2ecc71,0xff7fbf]):old?rp([0x6b5b4b,0x4b5563,0x7a6a55,0x5d4037,0x8d99ae]):rp(clothC));
  const bot=pm(fem&&!old?rp([0x1f2a44,0x222222,0x6b4f3a,0x9e9e9e,0x2c3e50]):old?rp([0x4a4a4a,0x5d4037,0x37474f]):rp([0x1f3a60,0x333333,0x4e6b3a]));
  const shoe=pm(rp([0x111111,0x3e2723,0xffffff,0x8d6e63]));
  const g=new THREE.Group(),body=new THREE.Group();g.add(body);const s=H/1.72;
  const legL=0.86*s,thL=legL*0.5,shL=legL*0.47,hipY=legL;
  const M=(geo,mat,sx,sy,sz,par,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.scale.set(sx,sy,sz);m.position.set(x||0,y||0,z||0);m.castShadow=true;(par||body).add(m);return m;};
  // tronco
  const torso=new THREE.Group();torso.position.y=hipY;body.add(torso);
  M(PG.cyl,top,(child?0.13:fem?0.15:0.17)*s,0.54*s,(child?0.1:0.11)*s,torso,0,0.56*s,0).geometry=PG.cyl;
  const tm=torso.children[0];tm.scale.set((fem?0.16:0.18)*s,0.56*s,(fem?0.11:0.12)*s);tm.position.y=0.58*s;
  if(fem&&!old&&Math.random()<0.55){M(PG.cone,bot,0.2*s,0.42*s,0.17*s,torso,0,0.05*s,0);}
  else if(kind==='oldw'){M(PG.cone,bot,0.21*s,0.5*s,0.18*s,torso,0,0.05*s,0);}
  M(PG.cyl,skin,0.045*s,0.08*s,0.045*s,torso,0,0.66*s,0);
  const head=M(PG.sph,skin,(child?0.12:0.1)*s,(child?0.13:0.115)*s,(child?0.11:0.095)*s,torso,0,(child?0.74:0.72)*s,0);
  M(PG.sph,hair,(child?0.125:0.105)*s,(child?0.08:0.07)*s,(child?0.115:0.1)*s,torso,0.01*s,(child?0.79:0.76)*s,0);
  if(fem&&!old&&Math.random()<0.6)M(PG.box,hair,0.05*s,0.22*s,0.17*s,torso,-0.07*s,0.62*s,0);
  if(kind==='oldw'&&Math.random()<0.6)M(PG.sph,hair,0.05*s,0.05*s,0.05*s,torso,-0.09*s,0.77*s,0);
  if(kind==='oldm'&&Math.random()<0.5){M(PG.cyl,pm(0x3b3b3b),0.11*s,0.05*s,0.11*s,torso,0,0.85*s,0);M(PG.cyl,pm(0x3b3b3b),0.14*s,0.012*s,0.14*s,torso,0,0.8*s,0);}
  if(fem&&!child&&Math.random()<0.5)M(PG.box,pm(rp([0x5d4037,0x111111,0xc0392b,0xd7b98e])),0.06*s,0.2*s,0.24*s,torso,0,0.25*s,0.21*s);
  // braccia e gambe con gomiti e ginocchia
  const limb=(side,isArm)=>{const p=new THREE.Group();if(isArm){p.position.set(0,0.66*s,side*(fem?0.17:0.2)*s);torso.add(p);}else{p.position.set(0,hipY,side*0.085*s);body.add(p);}
    const l1=isArm?0.28*s:thL,l2=isArm?0.26*s:shL,r1=isArm?0.04*s:0.065*s,r2=isArm?0.035*s:0.05*s;M(PG.cyl,isArm?top:bot,r1,l1,r1,p);
    const j=new THREE.Group();j.position.y=-l1;p.add(j);M(PG.cyl,isArm?(Math.random()<0.4?skin:top):bot,r2,l2,r2,j);
    if(isArm)M(PG.sph,skin,0.04*s,0.05*s,0.04*s,j,0,-l2-0.02*s,0);else M(PG.box,shoe,0.22*s,0.06*s,0.09*s,j,0.05*s,-l2-0.02*s,0);
    return {p,j};};
  const aL=limb(-1,true),aR=limb(1,true),lL=limb(-1,false),lR=limb(1,false);
  let cane=null;if(old&&Math.random()<0.45){cane=new THREE.Mesh(PG.cyl,pm(0x5d4037));cane.scale.set(0.015,0.85*s,0.015);cane.position.set(0,-0.26*s,0);aR.j.add(cane);}
  const lean=old?0.12:0,amp=child?0.55:old?0.28:fem?0.4:0.45;
  g.userData={human:true,H,speed:child?1.15:old?0.7:1.0,anim(ph){const sw=Math.sin(ph)*amp;torso.rotation.z=-lean;lL.p.rotation.z=sw;lR.p.rotation.z=-sw;
      lL.j.rotation.z=-Math.max(0,Math.sin(ph+1.4))*amp*1.3;lR.j.rotation.z=-Math.max(0,Math.sin(ph+1.4+Math.PI))*amp*1.3;
      aL.p.rotation.z=-sw*0.8;aR.p.rotation.z=cane?sw*0.25-0.25:sw*0.8;aL.j.rotation.z=0.25+Math.max(0,-sw)*0.4;aR.j.rotation.z=cane?0.5:0.25+Math.max(0,sw)*0.4;
      body.position.y=Math.abs(Math.cos(ph))*0.03*s-0.015*s;},hand:aR.j};
  g.rotation.order='YXZ';return g;}
function makeDog(){const sz=rp([0.85,1.0,1.15,1.35]),col=rp([0x8d5524,0x2b2b2b,0xf2e8d5,0xc68642,0x6d4c41,0xd2a679]),c2=Math.random()<0.4?rp([0xffffff,0x2b2b2b]):col,fur=pm(col,{roughness:1}),fur2=pm(c2,{roughness:1});
  const g=new THREE.Group(),b=new THREE.Group();g.add(b);const s=sz*0.5;
  const M=(geo,mat,sx,sy,sz2,par,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.scale.set(sx,sy,sz2);m.position.set(x,y,z);m.castShadow=true;par.add(m);return m;};
  M(PG.sph,fur,0.34*s,0.16*s,0.14*s,b,0,0.42*s,0);M(PG.sph,fur2,0.2*s,0.12*s,0.12*s,b,0.16*s,0.4*s,0);
  const hd=new THREE.Group();hd.position.set(0.32*s,0.56*s,0);b.add(hd);M(PG.sph,fur,0.11*s,0.1*s,0.09*s,hd,0,0,0);M(PG.box,fur2,0.12*s,0.07*s,0.07*s,hd,0.1*s,-0.03*s,0);M(PG.sph,pm(0x111111),0.022*s,0.02*s,0.022*s,hd,0.16*s,-0.01*s,0);
  [-1,1].forEach(sd=>{const e=M(PG.box,fur,0.04*s,0.1*s,0.05*s,hd,-0.02*s,0.08*s,sd*0.06*s);e.rotation.x=sd*0.3;});
  const legs=[[0.22,-0.08],[0.22,0.08],[-0.22,-0.08],[-0.22,0.08]].map(([x,z])=>{const p=new THREE.Group();p.position.set(x*s,0.36*s,z*s);b.add(p);M(PG.cyl,fur,0.035*s,0.36*s,0.035*s,p,0,0,0);return p;});
  const tail=new THREE.Group();tail.position.set(-0.32*s,0.5*s,0);b.add(tail);const tm=M(PG.cyl,fur,0.025*s,0.22*s,0.025*s,tail,0,0,0);tail.rotation.z=-2.3;
  g.userData={dog:true,anim(ph,t){const k=0.5;legs[0].rotation.z=Math.sin(ph)*k;legs[3].rotation.z=Math.sin(ph)*k;legs[1].rotation.z=-Math.sin(ph)*k;legs[2].rotation.z=-Math.sin(ph)*k;tail.rotation.x=Math.sin(t*9)*0.5;b.position.y=Math.abs(Math.sin(ph))*0.02;},collar:hd};
  return g;}
function pedPos(p){const a=p.from,b=p.edge.to,t=Math.min(1,p.t),dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1;const ox=-dz/l,oz=dx/l,o=p.edge.cross?0:p.side+p.off;
  return{x:a.x+dx*t+ox*o,z:a.z+dz*t+oz*o,dx:dx/l,dz:dz/l};}
function updatePeds(dt){const cam=camera.position;
  peds.forEach(p=>{if(p.down){return;}
    const q=pedPos(p),dp=Math.hypot(q.x-pl.x,q.z-pl.z);
    // si scansa se l'auto sale sul marciapiede verso di lui
    p.offT=(!p.edge.cross&&dp<8&&Math.abs(pl.vx)>1)?Math.sign(p.side||1)*1.2:0;p.off+=(p.offT-p.off)*Math.min(1,dt*3);
    if(p.wait>0){p.wait-=dt;}
    else if(p.t>=1){const n=p.edge.to,opts=n.edges.filter(e=>e.to);let e=opts[(Math.random()*opts.length)|0];
      if(e.cross&&Math.random()<0.5)e=opts.find(x=>!x.cross)||e;
      p.from=n;p.edge=e;p.t=0;p.len=Math.hypot(e.to.x-n.x,e.to.z-n.z);p.waitCross=!!e.cross;}
    else{
      if(p.edge.cross&&p.t===0&&p.waitCross){const st=p.edge.I.state[p.edge.cross];if(st!=='R'){p.wait=0.5;return animPed(p,q,0,dt);}p.waitCross=false;}
      const sp=p.edge.cross?p.v*1.15:p.v;p.t+=sp*dt/p.len;}
    const moving=p.wait<=0&&!(p.edge.cross&&p.waitCross);animPed(p,pedPos(p),moving?p.v:0,dt);});}
function animPed(p,q,v,dt){const m=p.m,vis=Math.abs(q.x-camera.position.x)+Math.abs(q.z-camera.position.z)<260;m.visible=vis;if(!vis)return;
  m.position.set(q.x,p.edge.cross?0.02:CURB,q.z);m.rotation.y=Math.atan2(-q.dz,q.dx);p.ph+=v*dt*5.5;if(m.userData.mixer){const near=Math.abs(q.x-camera.position.x)+Math.abs(q.z-camera.position.z)<(MOBILE?34:55);m.userData.hi.visible=near;m.userData.lo.visible=!near;if(near){if(v>0)m.userData.mixer.update(dt*v/1.25);return;}}const sw=v>0?Math.sin(p.ph)*0.5:0;
  m.userData.legs[0].rotation.z=sw;m.userData.legs[1].rotation.z=-sw;m.userData.arms[0].rotation.z=-sw*0.7;m.userData.arms[1].rotation.z=sw*0.7;}
// ---- patente a punti: le infrazioni tolgono punti (e nelle sfide punti o secondi); a zero la patente viene ritirata ----
function licTxt(){return pl.lic==null?'':' · 🪪 '+pl.lic+'/20';}
function penalty(kind){if(!started||pl.ended)return;const T={pedone:[10,250,'Pedone investito'],rosso:[6,170,'Passato col rosso'],contromano:[4,0,'Contromano'],velocita:[3,170,'Eccesso di velocità']}[kind];if(!T)return;
  if(pl.lic==null)pl.lic=20;pl.lic=Math.max(0,pl.lic-T[0]);pl.fines=(pl.fines||0)+T[1];pl.cleanKm=pl.km||0;
  let ch='';if(MODE==='deliv'&&CH.dl){const sec=kind==='pedone'?15:5,pts=kind==='pedone'?60:20;CH.left=Math.max(0.5,CH.left-sec);CH.score=Math.max(0,CH.score-pts);ch=` · −${pts} punti, −${sec} s`;}
  else if(MODE==='ring'&&CH.t0!=null){const sec=kind==='pedone'?10:3;CH.t0-=sec;ch=` · +${sec} s sul giro`;}
  pl.infrMsg=`${T[2]}! −${T[0]} punti patente (${pl.lic}/20)`+(T[1]?` · multa ${T[1]} €`:'')+ch;pl.infrT=4;
  if(T[1])CAR.add(-T[1],'Multa: '+T[2].toLowerCase());DJ.say(kind);POL.onInfr(kind);
  if(pl.lic<=0&&!pl.licGone){pl.licGone=true;say('Patente ritirata');setTimeout(()=>{pl.licGone=false;if(!pl.ended&&window.endRun)window.endRun('patente');},1500);}}
// pedone urtato: cade, resta giù un attimo, si rialza, si spolvera e ti agita il pugno; niente fine corsa, ma punti patente e multa
function pedHit(p,v){if(p.down)return;p.down=true;p.dT=0;const[wx,wz]=getWorldVel(),sp=Math.hypot(wx,wz)||1;p.push={x:wx/sp,z:wz/sp,s:Math.min(3.5,0.6+v*0.22)};p.base={x:p.m.position.x,y:p.m.position.y,z:p.m.position.z};p.ry=p.m.rotation.y;
  pl.pedHits=(pl.pedHits||0)+1;crashSound(2.2);whistle();penalty('pedone');}
function pedDown(p,dt){const m=p.m,t=(p.dT+=dt),u=m.userData;if(!p.base)p.base={x:m.position.x,y:m.position.y,z:m.position.z};
  const slide=p.push?p.push.s*(1-Math.pow(1-Math.min(1,t/0.5),2)):0;m.position.set(p.base.x+(p.push?p.push.x:0)*slide,p.base.y,p.base.z+(p.push?p.push.z:0)*slide);
  const fall=t<0.45?t/0.45:t<2.4?1:t<3.1?1-(t-2.4)/0.7:0;m.rotation.set(0,p.ry,-1.45*Math.sin(fall*Math.PI/2));m.rotation.order='YXZ';
  if(u.hiP){u.hiP.w.visible=true;u.loP.visible=false;PPL.pose(u.hiP,0,0,t>3.1,simT);}else if(u.human)u.anim(0);
  p.angry=t>3.1&&t<5.4;if(p.angry){m.rotation.y=Math.atan2(-(pl.z-m.position.z),pl.x-m.position.x);}
  if(t>5.4){p.down=false;p.angry=false;p.ox=(p.ox||0)+(p.push?p.push.x*slide:0);p.oz=(p.oz||0)+(p.push?p.push.z*slide:0);p.base=null;p.push=null;m.rotation.set(0,m.rotation.y,0);}}
// schivata: se l'auto punta dritta sul pedone, all'ultimo salta di lato
function pedDodge(p,q,dt){const[wx,wz]=getWorldVel(),sp=Math.hypot(wx,wz);
  if(p.dodgeT>0){p.dodgeT-=dt;const k=(p.kind==='oldm'||p.kind==='oldw'?2.6:p.kind==='child'?3.6:4.6)*dt;p.ox=(p.ox||0)+p.dx*k;p.oz=(p.oz||0)+p.dz*k;return;}
  if(p.ox||p.oz){const l=Math.hypot(p.ox,p.oz),r=Math.max(0,l-0.8*dt);if(r<0.01){p.ox=0;p.oz=0;}else{p.ox*=r/l;p.oz*=r/l;}}
  if(sp<3||HOME.mode)return;const rx=q.x+(p.ox||0)-pl.x,rz=q.z+(p.oz||0)-pl.z,al=(rx*wx+rz*wz)/sp;if(al<0||al>sp*1.0)return;const cr=(rx*wz-rz*wx)/sp;if(Math.abs(cr)>1.9)return;
  if(p.noDodge===undefined)p.noDodge=Math.random()<0.15;if(p.noDodge)return;const sg=cr>=0?1:-1;p.dx=wz/sp*sg;p.dz=-wx/sp*sg;p.dodgeT=0.5;}
function whistle(){if(!AC)return;const t=AC.currentTime;[0,0.22].forEach((d,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(2900,t+d);o.frequency.linearRampToValueAtTime(i?2500:3100,t+d+0.18);
  const lf=AC.createOscillator(),lg=AC.createGain();lf.frequency.value=38;lg.gain.value=90;lf.connect(lg).connect(o.frequency);g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(0.09,t+d+0.02);g.gain.linearRampToValueAtTime(0,t+d+0.2);
  o.connect(g).connect(ACOUT());o.start(t+d);lf.start(t+d);o.stop(t+d+0.22);lf.stop(t+d+0.22);});}


// ================= MONTAGNA: BAITE, RECINTI, MUCCHE E PECORE =================
const plankTex=canvasTex(128,(g,n)=>{g.fillStyle='#6b4a2e';g.fillRect(0,0,n,n);for(let y=0;y<n;y+=16){g.fillStyle=`rgb(${90+Math.random()*30|0},${60+Math.random()*20|0},${35+Math.random()*12|0})`;g.fillRect(0,y,n,14);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,y+14,n,2);}});
const stoneTex=canvasTex(128,(g,n)=>{g.fillStyle='#8a8a86';g.fillRect(0,0,n,n);for(let i=0;i<70;i++){const v=110+Math.random()*60|0;g.fillStyle=`rgb(${v},${v},${v-6})`;g.beginPath();g.ellipse(Math.random()*n,Math.random()*n,6+Math.random()*10,4+Math.random()*6,0,0,7);g.fill();}});
const woodM=mat(0xffffff,{map:plankTex}),stoneM=mat(0xffffff,{map:stoneTex}),slateM=mat(0x3d3f44,{roughness:0.8});
function chalet(x,z,rot){const w=7+Math.random()*3,d=6+Math.random()*2,h0=Math.min(TH(x-w/2,z-d/2),TH(x+w/2,z+d/2),TH(x+w/2,z-d/2),TH(x-w/2,z+d/2))-0.3,g=new THREE.Group();g.position.set(x,h0,z);g.rotation.y=rot;
  const base=new THREE.Mesh(new THREE.BoxGeometry(w,1.8,d),stoneM);base.position.y=0.9;g.add(base);
  const up=new THREE.Mesh(new THREE.BoxGeometry(w,2.6,d),woodM);up.position.y=3.1;g.add(up);
  const sh=new THREE.Shape();sh.moveTo(-d/2-0.8,0);sh.lineTo(0,2.6);sh.lineTo(d/2+0.8,0);sh.lineTo(-d/2-0.8,0);const rg=new THREE.ExtrudeGeometry(sh,{depth:w+1.2,bevelEnabled:false});rg.translate(0,0,-(w+1.2)/2);
  const rf=new THREE.Mesh(rg,slateM);rf.rotation.y=Math.PI/2;rf.position.y=4.4;g.add(rf);
  const winM=mat(0x1f2a33);[-1,1].forEach(k=>{const wn=new THREE.Mesh(new THREE.PlaneGeometry(0.9,0.9),winM);wn.position.set(k*w/4,3.2,d/2+0.01);g.add(wn);});
  const dr=new THREE.Mesh(new THREE.PlaneGeometry(1,2),mat(0x4a3220));dr.position.set(0,1.0,d/2+0.01);g.add(dr);
  const chim=new THREE.Mesh(new THREE.BoxGeometry(0.6,1.6,0.6),stoneM);chim.position.set(w/3,6.3,0);g.add(chim);
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);
  const hw=Math.abs(Math.cos(rot))*w/2+Math.abs(Math.sin(rot))*d/2,hd=Math.abs(Math.sin(rot))*w/2+Math.abs(Math.cos(rot))*d/2;obstaclesBox.push({x0:x-hw,x1:x+hw,z0:z-hd,z1:z+hd});}
const mtnSpot=(x,z,m)=>{const q=mRoad(x,z);return q&&q.dist>12+m&&q.dist<70&&freeSpot(x,z,m);};
{let n=0;for(let i=0;i<400&&n<12;i++){const x=MT.x0-60+Math.random()*(MT.x1-MT.x0+180),z=MT.zc-420+Math.random()*840;if(!mtnSpot(x,z,6))continue;chalet(x,z,Math.random()<0.5?0:Math.PI/2);n++;}
 const e=mPath.endDisc;for(let k=0;k<2;k++){const a=Math.random()*6.28,x=e.x+Math.cos(a)*34,z=e.z+Math.sin(a)*34;if(freeSpot(x,z,4))chalet(x,z,0);}}
// pascoli: centro, raggio, tipo di animale
const herds=[];
function findPasture(region,tries){for(let i=0;i<tries;i++){const [x0,x1,z0,z1]=region,x=x0+Math.random()*(x1-x0),z=z0+Math.random()*(z1-z0);
  let ok=true;for(let k=0;k<8&&ok;k++){const a=k/8*6.28;if(!freeSpot(x+Math.cos(a)*30,z+Math.sin(a)*30,0))ok=false;}if(ok&&freeSpot(x,z,0))return{x,z};}return null;}
[['cow',[MT.x0-200,MT.x1,MT.zc-420,MT.zc+420]],['cow',[MT.x0-200,MT.x1,MT.zc-420,MT.zc+420]],['cow',[L+150,RC.x+RH,-900,900]],['sheep',[MT.x0-200,MT.x1+100,MT.zc-450,MT.zc+450]],['sheep',[RC.x-RH+150,RC.x+RH-150,-250,250]]].forEach(([kind,reg])=>{
  const p=findPasture(reg,300);if(p)herds.push({kind,x:p.x,z:p.z,r:kind==='cow'?32:26});});
// recinti attorno ai pascoli
{const posts=[];herds.forEach(h=>{const R2=h.r+8;for(let a=0;a<6.28;a+=3.2/R2){const x=h.x+Math.cos(a)*R2,z=h.z+Math.sin(a)*R2;if(freeSpot(x,z,0))posts.push([x,TH(x,z),z,a]);}});
 const pm=new THREE.InstancedMesh(new THREE.BoxGeometry(0.12,1.1,0.12),woodM,posts.length),rm=new THREE.InstancedMesh(new THREE.BoxGeometry(0.06,0.08,3.3),woodM,posts.length*2),o=new THREE.Object3D();
 posts.forEach(([x,h,z,a],i)=>{o.rotation.set(0,0,0);o.position.set(x,h+0.55,z);o.updateMatrix();pm.setMatrixAt(i,o.matrix);o.rotation.y=-a;[0.45,0.9].forEach((y,k)=>{o.position.set(x,h+y,z);o.updateMatrix();rm.setMatrixAt(i*2+k,o.matrix);});});scene.add(pm);scene.add(rm);}
const cowTex=canvasTex(128,(g,n)=>{g.fillStyle='#f1eee6';g.fillRect(0,0,n,n);g.fillStyle='#1c1a18';for(let i=0;i<7;i++){g.beginPath();g.ellipse(Math.random()*n,Math.random()*n,10+Math.random()*16,8+Math.random()*12,Math.random()*3,0,7);g.fill();}});
const cowMs=[mat(0xffffff,{map:cowTex}),mat(0x8a5a3a),mat(0x5a3a26),mat(0xc9a27a)],woolM=mat(0xece6da,{roughness:1}),darkM=mat(0x2a2522);
const COWX=(()=>{if(!MODELS.cow||!THREE.SkeletonUtils)return null;const g=MODELS.cow;const cl=g.animations.filter(a=>/idle/i.test(a.name));if(!cl.length)return null;return{sc:g.scene,clips:cl};})();
function makeAnimal(kind){if(kind==='cow'){try{if(HDX&&HDX.cow)return HDX.cow();}catch(e){}}if(kind==='cow'&&COWX){const g=new THREE.Group(),hi=THREE.SkeletonUtils.clone(COWX.sc),w=new THREE.Group();
    hi.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;}});w.add(hi);w.scale.setScalar(2.35+Math.random()*0.3);w.rotation.y=Math.PI/2;g.add(w);
    const mx=new THREE.AnimationMixer(hi),c=COWX.clips[(Math.random()*COWX.clips.length)|0],a=mx.clipAction(c);a.play();mx.setTime(Math.random()*c.duration);
    g.userData={legs:[],head:new THREE.Group(),mixer:mx};return g;}
  const g=new THREE.Group(),legs=[];
  if(kind==='cow'){const bm=cowMs[(Math.random()*cowMs.length)|0];const b=new THREE.Mesh(rbox(1.9,0.95,0.8,0.25),bm);b.position.y=1.15;g.add(b);
    const hd=new THREE.Group();hd.position.set(1.05,1.35,0);const h=new THREE.Mesh(rbox(0.5,0.42,0.38,0.1),bm);h.position.set(0.2,0,0);hd.add(h);const mz=new THREE.Mesh(rbox(0.18,0.24,0.32,0.06),mat(0xd8a89a));mz.position.set(0.48,-0.08,0);hd.add(mz);
    [-1,1].forEach(sd=>{const hn=new THREE.Mesh(new THREE.ConeGeometry(0.04,0.18,6),mat(0xe8e0c8));hn.position.set(0.12,0.24,sd*0.16);hd.add(hn);});
    const bell=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.09,0.14,8),mat(0xb8962e,{metalness:0.7,roughness:0.3}));bell.position.set(0.05,-0.35,0);hd.add(bell);g.add(hd);g.userData.head=hd;
    [[0.65,0.25],[0.65,-0.25],[-0.65,0.25],[-0.65,-0.25]].forEach(([x,z])=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.07,0.75,6).translate(0,-0.37,0),bm);l.position.set(x,0.75,z);g.add(l);legs.push(l);});}
  else{const b=new THREE.Mesh(lumpy2(0.55),woolM);b.scale.set(1.3,0.85,0.9);b.position.y=0.72;g.add(b);
    const hd=new THREE.Group();hd.position.set(0.68,0.85,0);const h=new THREE.Mesh(rbox(0.34,0.26,0.22,0.08),darkM);h.position.set(0.1,0,0);hd.add(h);g.add(hd);g.userData.head=hd;
    [[0.35,0.18],[0.35,-0.18],[-0.35,0.18],[-0.35,-0.18]].forEach(([x,z])=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.04,0.45,5).translate(0,-0.22,0),darkM);l.position.set(x,0.45,z);g.add(l);legs.push(l);});}
  g.userData.legs=legs;g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}
function lumpy2(r){const g=new THREE.SphereGeometry(r,12,9),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+0.08*Math.sin(x*14)*Math.sin(y*13+z*11);p.setXYZ(i,x*n,y*n,z*n);}g.computeVertexNormals();return g;}
const animals=[];
herds.forEach(h=>{const n=h.kind==='cow'?6+((Math.random()*4)|0):10+((Math.random()*6)|0);for(let i=0;i<n;i++){const a=Math.random()*6.28,r=Math.random()*h.r*0.7,m=makeAnimal(h.kind);scene.add(m);
  animals.push({m,h,kind:h.kind,x:h.x+Math.cos(a)*r,z:h.z+Math.sin(a)*r,hd:Math.random()*6.28,st:'graze',t:Math.random()*6,ph:Math.random()*6,bellT:1+Math.random()*4,v:0});}});
function updateAnimals(dt){const cam=camera.position;
  animals.forEach(A=>{const dxp=A.x-pl.x,dzp=A.z-pl.z,dp=Math.hypot(dxp,dzp),sp=Math.abs(pl.vx||0);
    A.t-=dt;let tv=0;
    if(dp<16&&sp>1){A.st='flee';A.t=3;A.hd=Math.atan2(dzp,dxp);}
    if(A.st==='flee'){tv=A.kind==='cow'?2.2:2.8;if(A.t<=0)A.st='graze';}
    else if(A.st==='walk'){tv=A.kind==='cow'?0.45:0.6;if(A.t<=0){A.st='graze';A.t=3+Math.random()*8;}}
    else{if(A.t<=0){A.st='walk';A.t=2+Math.random()*5;A.hd+=(Math.random()-0.5)*2;}}
    const dh=Math.hypot(A.x-A.h.x,A.z-A.h.z);if(dh>A.h.r&&A.st!=='flee')A.hd=Math.atan2(A.h.z-A.z,A.h.x-A.x);
    A.v+=(tv-A.v)*Math.min(1,dt*2);let nx=A.x+Math.cos(A.hd)*A.v*dt,nz=A.z+Math.sin(A.hd)*A.v*dt;if(dh>A.h.r+6){nx=A.x;nz=A.z;}
    if(freeSpot(nx,nz,-4)||A.st!=='flee'){A.x=nx;A.z=nz;}
    const vis=Math.abs(A.x-cam.x)+Math.abs(A.z-cam.z)<320;A.m.visible=vis;
    if(vis){A.m.position.set(A.x,TH(A.x,A.z),A.z);A.m.rotation.y=-A.hd;A.ph+=A.v*dt*(A.kind==='cow'?4:6);const sw=Math.sin(A.ph)*Math.min(0.5,A.v*0.5);
      if(A.m.userData.mixer&&dp<150)A.m.userData.mixer.update(dt*(1+A.v*0.8));const L4=A.m.userData.legs;if(L4.length){L4[0].rotation.z=sw;L4[3].rotation.z=sw;L4[1].rotation.z=-sw;L4[2].rotation.z=-sw;}
      const hd=A.m.userData.head;hd.rotation.z=A.st==='graze'?-0.6+0.08*Math.sin(simT*2+A.ph):0;}
    // campanacci
    if(A.kind==='cow'&&AC&&dp<70){A.bellT-=dt*(A.v>0.1?2.5:1);if(A.bellT<=0){A.bellT=1.2+Math.random()*3.5;cowBell(dp,A.f||(A.f=700+Math.random()*500));}}});}
function cowBell(d,f){const t=AC.currentTime,g=AC.createGain(),v=0.18/(1+(d/10)**2);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0005,t+0.7);g.connect(ACOUT());
  [1,2.76,5.4].forEach((k,i)=>{const o=AC.createOscillator();o.frequency.value=f*k;const og=AC.createGain();og.gain.value=[1,0.45,0.2][i];o.connect(og).connect(g);o.start(t);o.stop(t+0.75);});}

