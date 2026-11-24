// Guido · 13 casa ciclo — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ================= CASA DI GUIDO: villetta in collina sul lago, grande garage, Guido a piedi e Gatto =================
// limite di velocità della zona e livello del carburante, sempre visibili durante la guida
const DW={l:null,f:null,on:false};function dashW(limit){const show=started&&!pl.ended&&!HOME.mode;if(show!==DW.on){DW.on=show;document.getElementById('dashW').style.display=show?'flex':'none';}if(!show)return;
  const L=limit?Math.round(limit):null;if(L!==DW.l){DW.l=L;const e=document.getElementById('limSign');e.style.visibility=L?'visible':'hidden';e.firstChild.textContent=L||'';}
  const fo=(CFG.fuel??1)!==0&&pl.fuel!=null,f=fo?Math.round(pl.fuel/tankOf(pl.P)*100):null;if(f!==DW.f){DW.f=f;const w=document.getElementById('fuelW');w.style.display=fo?'flex':'none';if(fo){w.querySelector('#fuelBar i').style.width=f+'%';w.classList.toggle('low',f<12);}}}
function makeGuido(){try{if(HDX&&HDX.guido)return HDX.guido();}catch(e){}
  const M=(c,r=0.75)=>new THREE.MeshStandardMaterial({color:new THREE.Color(c).convertSRGBToLinear(),roughness:r,flatShading:true});
  const skin=M(0xe8b48c,0.7),hair=M(0x3a2618,0.85),jacket=M(0x24365a,0.7),tee=M(0xf6f4ef,0.8),jeans=M(0x3f5f8f,0.85),shoe=M(0x4a3020,0.6),eye=M(0x1a1410,0.3),white=M(0xffffff,0.4),lip=M(0xb5705a,0.7),belt=M(0x2a1c12,0.6);
  const G=new THREE.Group(),add=(geo,mat,x,y,z,p)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;(p||G).add(m);return m;};
  const S=(r,w=10,h=8)=>new THREE.SphereGeometry(r,w,h),B=(a,b,c)=>new THREE.BoxGeometry(a,b,c),C=(a,b,h,n=8)=>new THREE.CylinderGeometry(a,b,h,n);
  const legs=[];[-1,1].forEach(s=>{const L=new THREE.Group();L.position.set(s*0.1,0.88,0);G.add(L);
    add(C(0.088,0.075,0.42),jeans,0,-0.21,0,L);const K=new THREE.Group();K.position.y=-0.42;L.add(K);add(C(0.075,0.066,0.4),jeans,0,-0.2,0,K);
    add(B(0.11,0.08,0.26),shoe,0,-0.42,0.04,K);add(S(0.055,8,6),shoe,0,-0.41,0.15,K).scale.set(1,0.7,1);legs.push({L,K});});
  add(B(0.32,0.16,0.2),jeans,0,0.92,0);add(B(0.33,0.04,0.21),belt,0,0.995,0);
  const T=new THREE.Group();T.position.y=1.0;G.add(T);
  add(B(0.32,0.5,0.21),tee,0,0.25,0,T);
  [-1,1].forEach(s=>{add(B(0.12,0.52,0.235),jacket,s*0.125,0.26,0,T);const lap=add(B(0.06,0.24,0.02),jacket,s*0.075,0.36,0.115,T);lap.rotation.z=s*0.35;});
  add(B(0.38,0.52,0.08),jacket,0,0.26,-0.08,T);
  add(S(0.1,8,6),jacket,-0.2,0.47,0,T).scale.set(1,0.75,1);add(S(0.1,8,6),jacket,0.2,0.47,0,T).scale.set(1,0.75,1);
  [-1,1].forEach(s=>{const c=add(B(0.09,0.07,0.03),jacket,s*0.08,0.52,0.06,T);c.rotation.set(-0.5,0,s*0.5);});
  const arms=[];[-1,1].forEach(s=>{const A=new THREE.Group();A.position.set(s*0.235,0.46,0);T.add(A);
    add(C(0.068,0.06,0.3),jacket,0,-0.15,0,A);const E=new THREE.Group();E.position.y=-0.3;A.add(E);add(C(0.06,0.054,0.27),jacket,0,-0.13,0,E);
    add(C(0.05,0.05,0.03),tee,0,-0.27,0,E);add(S(0.05,8,6),skin,0,-0.32,0,E).scale.set(0.8,1.1,0.55);arms.push({A,E});});
  add(C(0.055,0.06,0.1),skin,0,0.58,0.01,T);
  const H=new THREE.Group();H.position.set(0,0.75,0.015);H.scale.setScalar(1.3);T.add(H);
  add(S(0.115,12,10),skin,0,0,0,H).scale.set(0.92,1.12,1);add(B(0.13,0.06,0.09),skin,0,-0.085,0.035,H);
  [-1,1].forEach(s=>{add(S(0.03,6,5),skin,s*0.105,0,0,H).scale.set(0.5,1,0.8);
    add(S(0.016,6,5),white,s*0.042,0.02,0.1,H).scale.set(1.2,0.8,0.6);add(S(0.009,6,5),eye,s*0.042,0.02,0.108,H);
    add(B(0.05,0.014,0.016),hair,s*0.043,0.055,0.105,H).rotation.z=s*-0.12;add(B(0.022,0.07,0.06),hair,s*0.1,0.03,0.01,H);
    const m=add(S(0.03,8,6),hair,s*0.026,-0.045,0.106,H);m.scale.set(1.15,0.55,0.55);m.rotation.z=s*0.25;});
  add(C(0.0,0.022,0.06,6),skin,0,-0.005,0.118,H).rotation.x=Math.PI/2.2;add(B(0.045,0.01,0.01),lip,0,-0.072,0.106,H);
  add(new THREE.SphereGeometry(0.122,12,8,0,Math.PI*2,0,Math.PI*0.34),hair,0,0.02,-0.006,H).scale.set(0.96,1.1,1.04);
  [[0,0.12,0.03,0.07],[0.045,0.115,0.05,0.055],[-0.045,0.118,0.045,0.06],[0.02,0.105,0.085,0.05],[-0.03,0.1,0.08,0.048],[0.06,0.09,0.0,0.055],[-0.06,0.09,-0.01,0.055],[0,0.1,-0.06,0.065]].forEach(([x,y,z,r])=>add(S(r,8,6),hair,x,y,z,H).scale.set(1,0.62,1));
  add(new THREE.SphereGeometry(0.124,12,8,Math.PI,Math.PI,0.2,Math.PI*0.62),hair,0,0,-0.004,H).scale.set(0.96,1.12,1.04);
  G.userData={legs,arms,T,H,ph:0};return G;}
// passo: ph avanza con la velocità, braccia opposte alle gambe, leggero dondolio; wave = saluto con la destra
function poseGuido(g,dt,sp,wave,t){if(g.userData.hd){HDX.poseGuido(g,dt,sp,wave?'wave':'walk',t);return;}const u=g.userData,k=Math.min(1,sp/1.4),run=sp>2.2;u.ph+=dt*(run?9:6.3)*Math.min(1.6,0.3+sp/1.4);const s=Math.sin(u.ph),c=Math.cos(u.ph);
  u.legs.forEach((L,i)=>{const q=i?-s:s;L.L.rotation.x=-q*0.55*k*(run?1.25:1);L.K.rotation.x=Math.max(0,(i?c:-c))*0.9*k*(run?1.3:1);});
  u.arms.forEach((A,i)=>{const q=i?s:-s;if(i===1&&wave){A.A.rotation.set(0,0,2.5);A.E.rotation.set(0,0,0.35+Math.sin(t*7)*0.35);return;}A.A.rotation.set(-q*0.45*k*(run?1.4:1),0,(i?1:-1)*0.07);A.E.rotation.set(-0.25*k-(run?0.7:0),0,0);});
  u.T.position.y=1.0+Math.abs(c)*0.025*k;u.T.rotation.x=run?0.12:0.02*k;u.H.rotation.set(-0.04,0,wave?0.08:0);}
// ---------- Gatto: rosso tigrato, con il petto bianco ----------
function makeCat(){try{if(HDX&&HDX.cat)return HDX.cat();}catch(e){}
  const M=(c,r=0.85)=>new THREE.MeshStandardMaterial({color:new THREE.Color(c).convertSRGBToLinear(),roughness:r,flatShading:true});
  const fur=M(0xd9873a),wh=M(0xf3ede2),st=M(0xa45a20),pink=M(0xe58f98),eyeM=M(0x9ad24a,0.3),pup=M(0x111111,0.3);
  const G=new THREE.Group(),add=(geo,mat,x,y,z,p)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;(p||G).add(m);return m;};
  const S=(r,w=10,h=8)=>new THREE.SphereGeometry(r,w,h),C=(a,b,h,n=6)=>new THREE.CylinderGeometry(a,b,h,n);
  const Bd=new THREE.Group();Bd.position.set(0,0.25,0);G.add(Bd);
  add(S(0.1),fur,0,0,0,Bd).scale.set(0.78,0.74,1.75);add(S(0.075),wh,0,-0.02,0.12,Bd).scale.set(0.9,1,0.9);
  for(let i=0;i<4;i++)add(new THREE.BoxGeometry(0.15,0.012,0.022),st,0,0.068,-0.1+i*0.06,Bd).rotation.z=0;
  const Hd=new THREE.Group();Hd.position.set(0,0.09,0.2);Bd.add(Hd);
  add(S(0.075,10,8),fur,0,0,0,Hd).scale.set(1.05,0.92,0.95);add(S(0.04,8,6),wh,0,-0.025,0.055,Hd).scale.set(1.2,0.7,0.8);add(S(0.011,6,4),pink,0,-0.008,0.08,Hd);
  [-1,1].forEach(s=>{const e=add(new THREE.ConeGeometry(0.032,0.06,4),fur,s*0.042,0.07,-0.005,Hd);e.rotation.z=-s*0.25;add(new THREE.ConeGeometry(0.018,0.035,4),pink,s*0.042,0.066,0.006,Hd).rotation.z=-s*0.25;
    add(S(0.016,6,5),eyeM,s*0.03,0.012,0.062,Hd);add(new THREE.BoxGeometry(0.005,0.02,0.005),pup,s*0.03,0.012,0.077,Hd);
    add(new THREE.BoxGeometry(0.035,0.008,0.01),st,s*0.03,0.05,0.05,Hd);});
  const legs=[];[[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([sx,sz])=>{const L=new THREE.Group();L.position.set(sx*0.045,0.2,sz*0.11);G.add(L);add(C(0.022,0.018,0.11),fur,0,-0.055,0,L);
    const K=new THREE.Group();K.position.y=-0.11;L.add(K);add(C(0.017,0.015,0.09),sz>0?wh:fur,0,-0.045,0,K);add(S(0.02,6,4),wh,0,-0.09,0.008,K).scale.set(1,0.6,1.3);legs.push({L,K,front:sz>0,s:sx});});
  const tail=[];let par=Bd;const T0=new THREE.Group();T0.position.set(0,0.03,-0.17);Bd.add(T0);par=T0;
  for(let i=0;i<7;i++){const g=new THREE.Group();if(i)g.position.y=0.045;par.add(g);add(C(0.017-i*0.0012,0.019-i*0.0012,0.05),i===6?st:(i%2?st:fur),0,0.022,0,g);tail.push(g);par=g;}
  G.userData={Bd,Hd,legs,tail,ph:0};return G;}
// sit: 0 in piedi, 1 seduto; tl: coda (0 bassa e rilassata, 1 dritta in su); lick: testa giù a lavarsi
function poseCat(g,dt,sp,sit,tl,lick,t){if(g.userData.hd){const u=g.userData;if(u.a){u.a.timeScale=sp>0.05?Math.min(2.2,0.35+sp/0.9):0;}u.mx.update(dt);return;}const u=g.userData,k=Math.min(1,sp/0.8),run=sp>1.6;u.ph+=dt*(run?13:8)*Math.min(2,0.25+sp/0.6);const s=Math.sin(u.ph),c=Math.cos(u.ph);
  u.legs.forEach(L=>{const diag=(L.front===(L.s>0))?0:Math.PI,q=Math.sin(u.ph+diag+(run&&!L.front?0.9:0));let a=-q*0.6*k*(run?1.3:1),b=Math.max(0,Math.cos(u.ph+diag))*0.7*k;
    if(!L.front){a=a*(1-sit)-1.25*sit;b=b*(1-sit)+2.0*sit;}else{a=a*(1-sit)+0.18*sit;}L.L.rotation.x=a;L.K.rotation.x=b;});
  u.Bd.rotation.x=-0.62*sit;u.Bd.position.y=0.25-0.035*sit+Math.abs(c)*0.012*k*(run?2:1);u.Bd.position.z=-0.03*sit;
  u.Hd.rotation.set(0.62*sit+(lick?0.75+Math.sin(t*9)*0.12:0)-0.1*k,lick?0.5:Math.sin(t*0.7)*0.25*(1-k),lick?0.35:0);
  u.tail.forEach((g,i)=>{if(i===0){g.rotation.x=-(0.25+1.0*tl)+(1-tl)*0.9*sit+(1-tl)*1.1;g.rotation.z=Math.sin(t*1.7)*0.25*(1-sit);}
    else{g.rotation.x=tl>0.5?(i>4?-0.5:0.02):0.22+sit*0.15;g.rotation.z=Math.sin(t*2.3+i*0.7)*0.12*(0.4+tl)+(sit?0.28:0);}});}
function meow(){if(!AC)return;const t=AC.currentTime,o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';f.type='bandpass';f.Q.value=3;
  o.frequency.setValueAtTime(520,t);o.frequency.linearRampToValueAtTime(820,t+0.22);o.frequency.linearRampToValueAtTime(480,t+0.62);f.frequency.setValueAtTime(900,t);f.frequency.linearRampToValueAtTime(1600,t+0.25);f.frequency.linearRampToValueAtTime(700,t+0.62);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.16,t+0.06);g.gain.setValueAtTime(0.16,t+0.4);g.gain.linearRampToValueAtTime(0,t+0.66);o.connect(f).connect(g).connect(ACOUT());o.start(t);o.stop(t+0.7);}
const HOME={ok:false,mode:null,cars:{},t:0,stillT:0,parkT:0};
// conversioni: coordinate del lotto (u verso l'interno, v di lato) <-> mondo
function hW(u,v){return[HOME.x+u*HOME.ca-v*HOME.sa,HOME.z+u*HOME.sa+v*HOME.ca];}
function hL(x,z){const dx=x-HOME.x,dz=z-HOME.z;return[dx*HOME.ca+dz*HOME.sa,-dx*HOME.sa+dz*HOME.ca];}
function inGarage(x,z){const[u,v]=hL(x,z);return u>-26&&u<-2&&v>-36&&v<-24.6;}
window.HOMEZ2=(x,z)=>{if(!HOME.ok||Math.abs(x-HOME.x)+Math.abs(z-HOME.z)>160)return false;const[u,v]=hL(x,z);return u>-68&&u<37&&Math.abs(v)<45;};window.HOMEZ=HOMEZ;function HOMEZ(x,z){if(!HOME.ok)return false;if(Math.abs(x-HOME.x)+Math.abs(z-HOME.z)>120)return false;const[u,v]=hL(x,z);return(u>-28.5&&u<0.5&&v>-24.8&&v<4.5)||(u>-26&&u<-2&&v>=-36&&v<=-24.8)||(u>-61&&u<-33&&v>4&&v<14);}
HOME.init=function(){const m=NW&&NW.J.meta.home;if(!m||!NWT)return;Object.assign(HOME,{ok:true,x:m.x,z:m.z,A:m.a,ca:Math.cos(m.a),sa:Math.sin(m.a),y:m.h});
  NW.roads.forEach(R=>{if(R.n==='Vialetto di Casa Guido')R.priv=1;});
  {const[x,z]=hW(-11,0);HOME.pi=NW.places.length;NW.places.push({n:'Casa di Guido',t:5,x,z,R:30,home:1});}
  HOME.y=NW.Hg(HOME.x,HOME.z);
  const G=new THREE.Group();G.position.set(HOME.x,HOME.y,HOME.z);G.rotation.y=-HOME.A;scene.add(G);HOME.G=G;
  const LC=c=>typeof c==='number'?new THREE.Color(c).convertSRGBToLinear():c,M=(c,r=0.85,o={})=>{if(o.emissive!=null)o.emissive=LC(o.emissive);return new THREE.MeshStandardMaterial(Object.assign({color:LC(c),roughness:r},o));};
  const nm=[];HOME.nm=nm;const segs=[];
  const box=(w,h,d,mat,x,y,z,col=true,ry=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.rotation.y=ry;m.castShadow=true;m.receiveShadow=true;G.add(m);
    if(col){const c=Math.cos(ry),s=Math.sin(ry),P=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([a,b])=>{const lu=x+a*c+b*s,lv=z-a*s+b*c;return hW(lu,lv);});for(let q=0;q<4;q++)segs.push([P[q][0],P[q][1],P[(q+1)%4][0],P[(q+1)%4][1]]);}return m;};
  const plane=(w,d,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d).rotateX(-Math.PI/2),mat);m.position.set(x,y,z);m.receiveShadow=true;G.add(m);return m;};
  // piazzale in asfalto e pavimento del garage
  const asph=M(0x45474b,0.95,{polygonOffset:true,polygonOffsetFactor:-2});plane(29,29.3,asph,-14,0.035,-10.15);
  const conc=M(0x9c988f,0.9,{polygonOffset:true,polygonOffsetFactor:-2});plane(24,11.4,conc,-14,0.04,-30.3);
  const wl=M(0xf2f0ea,0.6,{polygonOffset:true,polygonOffsetFactor:-3});const NB=Object.keys(PHYS).length,BW=24/NB;for(let i=0;i<=NB;i++)plane(0.12,9.5,wl,-26+i*BW,0.045,-30.8);
  // garage: muri, pilastri, tetto piano, fascia rossa come il logo
  const plast=M(0xe9dcc2,0.9),grey=M(0x6c6e70,0.8),red=M(0xc8202a,0.6),roofM=M(0x5d5f62,0.9);
  box(24.6,4.3,0.3,plast,-14,2.15,-36.15);box(0.3,4.3,11.9,plast,-26.15,2.15,-30.25);box(0.3,4.3,11.9,plast,-1.85,2.15,-30.25);
  box(25.2,0.4,12.6,roofM,-14,4.5,-30.2,false);box(25.2,0.7,0.35,plast,-14,3.95,-24.25,false);box(25.25,0.22,0.38,red,-14,3.7,-24.24,false);
  for(let i=1;i<NB;i++)box(0.32,3.6,0.32,grey,-26+i*BW,1.8,-24.45);
  const lampM=M(0xffffff,0.4,{emissive:0xfff1d6,emissiveIntensity:0});nm.push([lampM,1.6]);for(let i=0;i<NB;i++)box(1.6,0.08,0.25,lampM,-26+(i+0.5)*BW,4.27,-30,false);
  {const tx=canvasTex(512,(g,n)=>{g.fillStyle='#fff';g.fillRect(0,0,n,n/4);g.fillStyle='#c8202a';g.font='bold 58px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('GARAGE DI GUIDO',n/2,n/8+4);});
    tx.repeat.set(1,0.25);tx.offset.set(0,0.75);const sm=new THREE.MeshStandardMaterial({map:tx,emissiveMap:tx,emissive:0xffffff,emissiveIntensity:0,roughness:0.6});nm.push([sm,0.7]);
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(7,0.95),sm);sg.position.set(-14,3.98,-24.06);G.add(sg);}
  // villetta: due piani, tetto a padiglione in coppi, persiane verdi, portoncino in legno con pensilina
  const wall=M(0xf1e2c4,0.92),shut=M(0x3f6b3a,0.7),wood=M(0x6b3f22,0.6),stone=M(0xcfc6b5,0.9),tile=M(0xb4552f,0.8),glass=M(0x2d4352,0.2,{metalness:0.3,emissive:0xffd9a0,emissiveIntensity:0});nm.push([glass,0.9]);
  const hx0=6,hx1=18,hz0=-8,hz1=6,cx=(hx0+hx1)/2,cz=(hz0+hz1)/2,HW=hx1-hx0,HD=hz1-hz0;
  box(HW+0.3,0.35,HD+0.3,stone,cx,0.175,cz,false);box(HW,6.2,HD,wall,cx,3.1,cz);box(HW+0.15,0.18,HD+0.15,stone,cx,3.1,cz,false);
  {const r=new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(HW,HD)/2+0.9,2.6,4,1),tile);r.rotation.y=Math.PI/4;r.scale.set(HW/HD*1.0,1,1);r.position.set(cx,6.2+1.3,cz);r.castShadow=true;G.add(r);
    const ch=box(0.7,1.8,0.7,M(0xa55a3c,0.9),cx+3,7.2,cz-3,false);box(0.9,0.15,0.9,stone,cx+3,8.15,cz-3,false);}
  const win=(face,p,y,w=1.1,h=1.4,door=false)=>{// face: 0 = lato verso il piazzale (u=hx0), 1 = lato giardino (v=hz1), 2 = retro (u=hx1), 3 = lato garage (v=hz0)
    const o=0.06,put=(m,du,dy)=>{if(face===0)m.position.set(hx0-o-du,y+dy,p);if(face===2)m.position.set(hx1+o+du,y+dy,p);if(face===1)m.position.set(p,y+dy,hz1+o+du);if(face===3)m.position.set(p,y+dy,hz0-o-du);
      m.rotation.y=face===0?-Math.PI/2:face===2?Math.PI/2:face===1?0:Math.PI;G.add(m);return m;};
    put(new THREE.Mesh(new THREE.PlaneGeometry(w,h),door?wood:glass),0,0);put(new THREE.Mesh(new THREE.BoxGeometry(w+0.2,0.1,0.14),stone),0.02,-h/2-0.05);
    if(!door)[-1,1].forEach(s=>{const sh=new THREE.Mesh(new THREE.BoxGeometry(w*0.5,h+0.05,0.05),shut);put(sh,0.04,0);if(face===0||face===2)sh.position.z+=s*(w*0.75)*(face===0?-1:1)*-1;else sh.position.x+=s*w*0.75;});};
  [[-5.5],[3.5]].forEach(([v])=>{win(0,v,1.6);win(0,v,4.6);});win(0,-1,4.6,1.1,2.1,false);
  [8,12,16].forEach(u=>{win(1,u,1.6);win(1,u,4.6);win(3,u,1.6);win(3,u,4.6);});[-4,0.5,4].forEach(v=>{win(2,v,1.6);win(2,v,4.6);});
  // portoncino (si apre), pensilina, gradini, lampioncino
  const dp=new THREE.Group();dp.position.set(hx0-0.05,0.35,-1.55);G.add(dp);const dm=new THREE.Mesh(new THREE.BoxGeometry(0.08,2.15,1.1),wood);dm.position.set(0,1.075,0.55);dm.castShadow=true;dp.add(dm);
  const kn=new THREE.Mesh(new THREE.SphereGeometry(0.04,6,4),M(0xd8b04a,0.3,{metalness:0.8}));kn.position.set(-0.07,1.05,0.95);dp.add(kn);HOME.door=dp;HOME.doorA=0;
  box(2.4,0.12,2.0,tile,hx0-0.9,2.95,-1,false);[-1.9,0].forEach(z=>box(0.12,2.6,0.12,wood,hx0-1.8,1.65,-1+z*0+(z?-0.9:0.9),false));
  box(1.6,0.18,2.4,stone,hx0-0.8,0.09,-1,false);box(0.8,0.18,2.4,stone,hx0-1.9,0.04,-1,false);
  // balconcino al primo piano
  box(1.0,0.12,2.2,stone,hx0-0.5,3.6,-1,false);box(0.05,0.9,2.2,M(0x2c2c2c,0.5,{metalness:0.6}),hx0-1.0,4.1,-1,false);
  // vialetto in pietra dal piazzale al portoncino, ciotola del gatto
  for(let i=0;i<5;i++)plane(0.8,0.6,stone,0.8+i*1.05,0.05,-1+(i%2?0.15:-0.15));
  {const bw=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.09,0.06,10),M(0x2f7fc4,0.5));bw.position.set(hx0-1.2,0.21,0.4);G.add(bw);}
  // giardino: siepe e staccionata, alberi, aiuole, tavolo con ombrellone, cassetta della posta
  const hedge=M(0x3d6b2c,0.95),post=M(0xe9e4d6,0.7);
  const fence=(u0,v0,u1,v1)=>{const L=Math.hypot(u1-u0,v1-v0),n=Math.ceil(L/2.4);for(let i=0;i<=n;i++){const t=i/n;box(0.12,1.0,0.12,post,u0+(u1-u0)*t,0.5,v0+(v1-v0)*t,false);}
    const ry=-Math.atan2(v1-v0,u1-u0),mx=(u0+u1)/2,mv=(v0+v1)/2;box(L,0.08,0.06,post,mx,0.85,mv,false,ry);box(L,0.08,0.06,post,mx,0.45,mv,false,ry);
    const h=box(L,0.7,0.5,hedge,mx+(Math.abs(u1-u0)<0.1?(u0>0?0.45:-0.45):0),0.35,mv+(Math.abs(v1-v0)<0.1?(v0>0?0.45:-0.45):0),false,ry);
    const[a,b]=[hW(u0,v0),hW(u1,v1)];segs.push([a[0],a[1],b[0],b[1]]);};
  fence(-30,-38,30,-38);fence(30,-38,30,38);fence(30,38,-30,38);fence(-30,38,-30,3.4);fence(-30,-3.4,-30,-38);
  box(0.25,1.4,0.25,stone,-30,0.7,-3.6,false);box(0.25,1.4,0.25,stone,-30,0.7,3.6,false);
  {const mb=box(0.35,0.3,0.5,red,-30.4,1.05,4.4,false);box(0.06,1.0,0.06,M(0x333333,0.5),-30.4,0.5,4.4,false);
    const tx=canvasTex(128,(g,n)=>{g.fillStyle='#fff';g.fillRect(0,0,n,n/2);g.fillStyle='#c8202a';g.font='bold 40px sans-serif';g.textAlign='center';g.fillText('GUIDO',64,44);});tx.repeat.set(1,0.5);tx.offset.set(0,0.5);
    const p=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.17),new THREE.MeshStandardMaterial({map:tx}));p.position.set(-30.58,1.05,4.4);p.rotation.y=-Math.PI/2;G.add(p);}
  const leaf=[M(0x4f8a35,0.9,{flatShading:true}),M(0x67a040,0.9,{flatShading:true}),M(0x3e7a3a,0.9,{flatShading:true})],trunk=M(0x6e4a2e,0.9);
  [[24,-28,1.2],[25,22,1.4],[12,30,1.0],[-8,30,1.3],[-20,22,1.1],[22,-6,0.9],[-26,10,0.8]].forEach(([u,v,s],i)=>{const t=new THREE.Mesh(new THREE.CylinderGeometry(0.12*s,0.18*s,2.4*s,6),trunk);t.position.set(u,1.2*s,v);t.castShadow=true;G.add(t);
    for(let q=0;q<3;q++){const c=new THREE.Mesh(new THREE.IcosahedronGeometry((1.3-q*0.25)*s,0),leaf[(i+q)%3]);c.position.set(u+(q-1)*0.5*s,(2.6+q*0.8)*s,v+(q%2?0.4:-0.3)*s);c.castShadow=true;G.add(c);}
    const[x,z]=hW(u,v);segs.push([x-0.3,z,x+0.3,z],[x,z-0.3,x,z+0.3]);});
  const fl=[0xe0405a,0xf2c230,0xf4f4f4,0xb070e0,0xff8a3a].map(c=>M(c,0.7));for(let i=0;i<46;i++){const side=i%2,u=7+((i*7)%11),v=side?7.6+((i*3)%3)*0.3:-9.6-((i*5)%3)*0.3;const f=new THREE.Mesh(new THREE.SphereGeometry(0.11,5,4),fl[i%5]);f.position.set(u+((i*13)%7)*0.05,0.25,v);G.add(f);}
  box(1.6,0.08,1.0,M(0xf5f5f0,0.6),14,0.78,20,false);[[-0.6],[0.6]].forEach(([d])=>{box(0.06,0.75,0.06,M(0x777777,0.5),14+d,0.38,20,false);});
  {const um=new THREE.Mesh(new THREE.ConeGeometry(1.5,0.5,8,1,true),M(0xc8202a,0.7,{side:THREE.DoubleSide}));um.position.set(14,2.25,20);G.add(um);box(0.05,2.2,0.05,M(0x999999,0.5),14,1.1,20,false);
    [[-1],[1]].forEach(([d])=>{box(0.45,0.06,0.45,M(0x8b5a2b,0.7),14+d*1.2,0.45,20,false);box(0.45,0.5,0.06,M(0x8b5a2b,0.7),14+d*1.45,0.7,20,false,Math.PI/2);});}
  // panchina sul lato del lago con lampioncini
  box(1.8,0.08,0.45,M(0x8b5a2b,0.7),-24,0.48,30,false);box(1.8,0.45,0.06,M(0x8b5a2b,0.7),-24,0.75,30.25,false);
  const lpM=M(0xffffff,0.4,{emissive:0xffe2b0,emissiveIntensity:0});nm.push([lpM,2.0]);[[2,-3.2],[2,1.2],[-28,-5],[-28,5]].forEach(([u,v])=>{box(0.1,2.2,0.1,M(0x2c2c2c,0.5),u,1.1,v,false);box(0.28,0.32,0.28,lpM,u,2.35,v,false);});
  G.traverse(o=>{if(o.isMesh){o.castShadow=o.castShadow!==false;o.receiveShadow=true;}});
  HOME.segS=NWT.addDyn(segs);
  // le auto in garage, una per posto, col muso verso l'uscita
  HOME.carH=-(HOME.A+Math.PI/2);Object.keys(PHYS).forEach((k,i)=>{const u=-26+(i+0.5)*24/Object.keys(PHYS).length,v=-30.4,[x,z]=hW(u,v),m=makeCar(k,0x8a1f1f,true,true);m.position.set(x,HOME.y,z);m.rotation.set(0,HOME.carH,0);scene.add(m);
    const T=TYPES[k],c=Math.cos(HOME.carH),s=-Math.sin(HOME.carH),hl=T.L/2,hw=T.W/2,P=[[-hl,-hw],[hl,-hw],[hl,hw],[-hl,hw]].map(([a,b])=>[x+a*c-b*s,z+a*s+b*c]),sg=[];for(let q=0;q<4;q++)sg.push([P[q][0],P[q][1],P[(q+1)%4][0],P[(q+1)%4][1]]);
    HOME.cars[k]={m,x,z,u,v,segs:sg,dyn:NWT.addDyn(sg)};});
  // Guido e Gatto
  G.updateMatrixWorld(true);G.traverse(o=>{o.matrixAutoUpdate=false;});dp.traverse(o=>{o.matrixAutoUpdate=true;});
  Object.values(HOME.cars).forEach(c=>{[c.m,c.tr].forEach(o=>{if(!o)return;o.updateMatrixWorld(true);o.traverse(q=>{q.matrixAutoUpdate=false;});});});
  HOME.guido=makeGuido();HOME.guido.visible=false;scene.add(HOME.guido);HOME.cat=new THREE.Group();HOME.cat.visible=false;// niente gatto
  HOME.c={x:0,z:0,h:0,sp:0,sit:1,tl:0,lick:0,st:'porch',stT:0};HOME.catTo(4.6,1.6,true);
  HOME.gd={x:0,z:0,h:0,sp:0};
  // menu: partenza e destinazione
  const ss=document.getElementById('selStart');if(ss&&![...ss.options].some(o=>o.value==='Casa di Guido')){const o=document.createElement('option');o.value=o.textContent='Casa di Guido';ss.insertBefore(o,ss.firstChild);
    let first=false;try{first=!localStorage.getItem('sim_home1');localStorage.setItem('sim_home1','1');}catch(e){}if(first||!localStorage.getItem('sim_start'))ss.value='Casa di Guido';else{try{const v=localStorage.getItem('sim_start');if(v)ss.value=v;}catch(e){}}}
  const sd=document.getElementById('selDest');if(sd){const o=document.createElement('option');o.value='nwp_'+HOME.pi;o.textContent='🏠 Casa di Guido';sd.insertBefore(o,sd.firstChild);if(PREF.dest===o.value)sd.value=o.value;}
};
HOME.dbg=()=>({ing:inGarage(pl.x,pl.z),loc:hL(pl.x,pl.z),mode:HOME.mode,started,ended:pl.ended,MODE,dt:simT-runStart,vx:pl.vx});
HOME.catTo=function(u,v,now){const[x,z]=hW(u,v);if(now){HOME.c.x=x;HOME.c.z=z;HOME.c.h=HOME.A+Math.PI;}HOME.c.tx=x;HOME.c.tz=z;};
HOME.wants=function(){return HOME.ok&&document.getElementById('selStart').value==='Casa di Guido'&&['free','nav','deliv'].includes(MODE);};
HOME.reset=function(){if(!HOME.ok)return;HOME.mode=null;HOME.wasOut=true;HOME.parkT=0;HOME.guido.visible=false;document.getElementById('homeUI').style.display='none';
  Object.values(HOME.cars).forEach(c=>{c.m.userData._v=true;c.m.visible=HOME.vis!==false;if(c.tr){c.tr.userData._v=true;c.tr.visible=HOME.vis!==false;}if(!c.dyn)c.dyn=NWT.addDyn(c.segs);});HOME.c.st='porch';HOME.catTo(4.6,1.6,true);HOME.c.sit=1;};
function muteCar(on){if(eng&&AC){const t=AC.currentTime;eng.master.gain.setTargetAtTime(0,t,0.05);['tg','sqg','rg'].forEach(k=>eng[k]&&eng[k].gain.setTargetAtTime(0,t,0.05));}RADIO.pause(on);}
HOME.begin=function(){HOME.mode='walk';HOME.stillT=0;HOME.t=0;document.getElementById('homeSkip').textContent='Salta: parti con l\'auto del menu';const g=HOME.gd,[x,z]=hW(5.0,-1);g.x=x;g.z=z;g.h=Math.atan2(-HOME.ca,-HOME.sa);g.sp=0;HOME.doorA=1.6;
  HOME.guido.visible=true;pl.mesh.visible=false;pl.x=x;pl.z=z;pl.vx=pl.vy=0;muteCar(true);HOME.camInit=true;ckOverlay();
  const ui=document.getElementById('homeUI');ui.style.display='flex';document.getElementById('homeCard').style.display='none';
  pl.navMsg='Ciao Guido! Vai in garage e scegli il mezzo: avvicinati e premi Invio.';pl.navMsgT=6;
  if(CFG.intro===false)HOME.enter(selKey,true);};
function fade(cb){const f=document.getElementById('fadeOv');f.style.opacity=1;setTimeout(()=>{cb();setTimeout(()=>f.style.opacity=0,120);},380);}
HOME.enter=function(k,instant){if(HOME.mode!=='walk'||HOME.busy)return;if(CAR.on&&!CAR.s.own[k]){if(CAR.buy(k)){HOME.near=null;}return;}HOME.busy=true;const go=()=>{HOME.busy=false;const C=HOME.cars[k];selKey=k;[...vl.children].forEach((b,i)=>b.classList.toggle('sel',Object.keys(PHYS)[i]===k));
    resetPlayer();pl.x=C.x;pl.z=C.z;pl.h=C.pad?C.h:HOME.carH;pl.vx=pl.vy=pl.r=0;NW.yh=NaN;pl.terrH=NW.H(pl.x,pl.z);NW.yh=pl.terrH;C.m.visible=false;if(C.dyn){NWT.remDyn(C.dyn);C.dyn=null;}
    HOME.guido.visible=false;HOME.mode=null;HOME.doorA=0;document.getElementById('homeUI').style.display='none';applyView();pl.camInit=false;RADIO.pause(false);try{savePrefs();}catch(e){}
    HOME.wasOut=false;HOME.c.st='porch';HOME.catTo(4.6,1.6);pl.navMsg='Si parte con: '+PHYS[k].label;pl.navMsgT=3;if(DRV)DRV.skipBoard=true;startDrive();};
  if(instant)go();else fade(go);};
HOME.finish=function(){if(HOME.done)return;HOME.done=true;document.getElementById('homeUI').style.display='none';fade(()=>{HOME.guido.visible=false;HOME.doorA=0;setTimeout(()=>{HOME.cat.visible=true;HOME.mode=null;endRun('casa');},700);});};
HOME.arrive=function(){if(CAR.on){CAR.repair();CAR.save();}HOME.mode='return';HOME.t=0;muteCar(true);pl.vx=pl.vy=0;pl.hb=true;if(pl.lights)toggleLights();
  const ch=Math.cos(pl.h),sh=-Math.sin(pl.h),lx=sh,lz=-ch,d=pl.T.W/2+0.55,g=HOME.gd;g.x=pl.x+lx*d;g.z=pl.z+lz*d;g.h=Math.atan2(lx,lz);g.sp=0;
  fade(()=>{HOME.guido.visible=true;if(view==='cockpit'){view='chase';applyView();HOME.wasCk=true;}});
  {const ui=document.getElementById('homeUI');ui.style.display='flex';document.getElementById('homeCard').style.display='none';document.getElementById('homeSkip').textContent='Entra subito in casa';}
  const[u,vv]=hL(g.x,g.z);HOME.path=vv>3?[[-57.8,vv],[-57.8,2.5],[-29,0],[-3,-1],[4.6,-1],[7.2,-1]]:[[u,-22.5],[-3,-1],[4.6,-1],[7.2,-1]];HOME.c.st='greet';HOME.c.stT=0;
  pl.navMsg='Bentornato a casa, Guido!';pl.navMsgT=4;say('Bentornato a casa');};
// ---------- aggiornamento a ogni fotogramma ----------
function walkInput(){let f=(kd(KEYMAP.thr)||keys.ArrowUp||keys.KeyW?1:0)-(kd(KEYMAP.brk)||keys.ArrowDown||keys.KeyS?1:0),t=(kd(KEYMAP.right)||keys.ArrowRight?1:0)-(kd(KEYMAP.left)||keys.ArrowLeft?1:0);
  if(touch.on){f=Math.max(f,touch.thr>0.1?touch.thr:0)-(touch.brk>0.1?touch.brk:0);t=touch.steer;}
  const gps=navigator.getGamepads?navigator.getGamepads():[];for(const gp of gps){if(!gp)continue;const ax=gp.axes[0]||0,ay=gp.axes[1]||0;if(Math.abs(ax)>0.15)t=ax;if(Math.abs(ay)>0.15)f=-ay;break;}
  return{f,t,run:keys.ShiftLeft||keys.ShiftRight||Math.abs(f)>0.9&&touch.on};}
function pushOut(o,r){if(!NWT)return;for(let it=0;it<2;it++)for(const s of NWT.segQ(o.x,o.z)){const ax=s[0],az=s[1],bx=s[2],bz=s[3],dx=bx-ax,dz=bz-az,L2=dx*dx+dz*dz||1;let t=((o.x-ax)*dx+(o.z-az)*dz)/L2;t=t<0?0:t>1?1:t;const px=ax+dx*t,pz=az+dz*t,ex=o.x-px,ez=o.z-pz,d=Math.hypot(ex,ez);if(d<r&&d>1e-6){o.x=px+ex/d*r;o.z=pz+ez/d*r;}}}
function walkTo(g,tx,tz,sp,dt){const dx=tx-g.x,dz=tz-g.z,d=Math.hypot(dx,dz);if(d<0.08){g.sp+=(0-g.sp)*Math.min(1,dt*8);return d;}const th=Math.atan2(dx,dz);let dh=th-g.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));g.h+=Math.sign(dh)*Math.min(Math.abs(dh),dt*5);
  const want=Math.min(sp,d*2.2)*Math.max(0,Math.cos(dh));g.sp+=(want-g.sp)*Math.min(1,dt*6);g.x+=Math.sin(g.h)*g.sp*dt;g.z+=Math.cos(g.h)*g.sp*dt;return d;}
HOME.setVis=function(v){if(HOME.vis===v)return;HOME.vis=v;HOME.G.visible=v;Object.values(HOME.cars).forEach(c=>{if(!v){c.m.userData._v=c.m.visible;c.m.visible=false;if(c.tr){c.tr.userData._v=c.tr.visible;c.tr.visible=false;}}else{c.m.visible=c.m.userData._v!==false;if(c.tr)c.tr.visible=c.tr.userData._v!==false;}});};
HOME.tick=function(dt){if(!HOME.ok)return;const far=Math.abs(camera.position.x-HOME.x)+Math.abs(camera.position.z-HOME.z)>900&&!HOME.mode;HOME.setVis(!far);if(far)return;HOME.t+=dt;const t=simT;
  // luci di casa al buio, porta
  const n=NIGHT||DUSK;if(HOME.lit!==n){HOME.lit=n;HOME.nm.forEach(([m,i])=>m.emissiveIntensity=n?i:0);}
  HOME.door.rotation.y+=(-HOME.doorA-HOME.door.rotation.y)*Math.min(1,dt*4);
  const g=HOME.gd,c=HOME.c;
  if(HOME.mode==='walk'){const I=walkInput(),sp=I.run?3.4:1.5;g.h-=I.t*dt*2.8*(I.f<0?-1:1);const want=I.f*sp*(I.f<0?0.55:1);g.sp+=(want-g.sp)*Math.min(1,dt*7);
    g.x+=Math.sin(g.h)*g.sp*dt;g.z+=Math.cos(g.h)*g.sp*dt;pushOut(g,0.35);pl.x=g.x;pl.z=g.z;
    if(HOME.t>1.8)HOME.doorA=0;
    HOME.stillT=Math.abs(g.sp)<0.1?HOME.stillT+dt:0;
    // l'auto più vicina
    let best=null,bd=1e9;for(const[k,C]of Object.entries(HOME.cars)){if(!C.m.visible)continue;let d;if(C.pad){const c=Math.cos(C.h),sn=-Math.sin(C.h),ax=C.x+c*3.1,az=C.z+sn*3.1,bx=C.x-c*16,bz=C.z-sn*16,ex=bx-ax,ez=bz-az,t=Math.max(0,Math.min(1,((g.x-ax)*ex+(g.z-az)*ez)/(ex*ex+ez*ez)));d=Math.hypot(g.x-ax-ex*t,g.z-az-ez*t)-1.3;}else d=Math.hypot(g.x-C.x,g.z-C.z)-TYPES[k].L/2;if(d<bd){bd=d;best=k;}}
    const card=document.getElementById('homeCard');if(best&&bd<1.4){if(HOME.near!==best){HOME.near=best;const P=PHYS[best],lk=CAR.on&&!CAR.s.own[best];card.innerHTML=`<b>${P.label}</b><span>${P.desc}</span>`+(lk?`<span>In vendita: <b>${CAR.fmt(P.price)}</b> · hai ${CAR.fmt(CAR.s.money)}</span><button id="homeIn">💶 Compra (Invio)</button>`:`<button id="homeIn">🔑 Sali (Invio)</button>`);document.getElementById('homeIn').onclick=()=>HOME.enter(best);}card.style.display='flex';}
    else{HOME.near=null;card.style.display='none';}
    hud.textContent=MOB?'':'Casa di Guido · a piedi'+(isTouch?'':' · frecce o gas/freno/sterzo per camminare · Maiusc per correre · Invio per salire');}
  if(HOME.mode==='return'){HOME.parkT=0;if(HOME.t>0.6){if(c.st==='rub'){g.sp*=0.9;}
      else{const w=HOME.path[0];if(w){const[x,z]=hW(w[0],w[1]);if(walkTo(g,x,z,1.75,dt)<0.4)HOME.path.shift();if(HOME.path.length<=2)HOME.doorA=1.6;}
        if(!HOME.path.length&&!HOME.done)HOME.finish();}}
    hud.textContent='Casa di Guido';}
  if(HOME.guido.visible){poseGuido(HOME.guido,dt,Math.abs(g.sp),HOME.mode==='return'&&c.st==='rub'&&HOME.t>1,t);HOME.guido.position.set(g.x,NW.H(g.x,g.z),g.z);HOME.guido.rotation.y=g.h;}
  /* il gatto è stato tolto */
  // rientro: auto ferma dentro il garage
  if(!HOME.mode&&started&&!pl.ended&&['free','nav','deliv'].includes(MODE)&&simT-runStart>3){const ing=inGarage(pl.x,pl.z);if(!ing&&Math.hypot(pl.x-HOME.x,pl.z-HOME.z)>45)HOME.wasOut=true;if(ing&&HOME.wasOut&&Math.abs(pl.vx)<0.15){HOME.parkT+=dt;if(HOME.parkT>1.6){HOME.done=false;HOME.arrive();}}else HOME.parkT=0;}};
HOME.camera=function(dt){const g=HOME.gd,ret=HOME.mode==='return',back=ret?5.2:3.6,up=ret?2.6:2.0,side=ret?1.8:0,bx=g.x-Math.sin(g.h)*back+Math.cos(g.h)*side,bz=g.z-Math.cos(g.h)*back-Math.sin(g.h)*side,gy=NW.H(g.x,g.z);
  tmpV.set(bx,gy+up,bz);if(HOME.camInit){camera.position.copy(tmpV);HOME.camInit=false;}else camera.position.lerp(tmpV,1-Math.exp(-dt*(ret?2.5:5)));
  if(camera.fov!==60){camera.fov=60;camera.updateProjectionMatrix();}camLook.set(g.x+Math.sin(g.h)*1.5,gy+1.2,g.z+Math.cos(g.h)*1.5);camera.lookAt(camLook);
  sun.position.set(g.x+SUNOFF.x,gy+SUNOFF.y,g.z+SUNOFF.z);sun.target.position.set(g.x,gy,g.z);}
window.__x={pedHit,penalty,HOME,getRoute:()=>route,FUEL,CH,MAP,PHOTO,ORB,REC,mapToggle,photoToggle,photoShot,recToggle,chArrive,chStart,tankOf,setClock:h=>{CLOCK=h;},st:()=>({CLOCK,NIGHT,DUSK,MODE,TIME,paused,route:!!route,view,sunI:+sun.intensity.toFixed(2),exp:renderer.toneMappingExposure,fog:scene.fog.color.getHexString(),sun:[SUNOFF.x|0,SUNOFF.y|0,SUNOFF.z|0],lights:pl.lights})};
const hud=document.getElementById('hud'),navBox=document.getElementById('navBox'),endBtn=document.getElementById('endBtn');endBtn.onclick=()=>endRun('fine');
function loop(now){
  const dt=Math.min(0.05,(now-last)/1000);last=now;
  if(!paused&&started&&HOME.mode){simT+=dt;updateLights(simT);HOME.tick(dt);HOME.camera(dt);if(NWT)NWT.TRF.step(dt);drawMini(dt);if(pl.navMsgT>0)pl.navMsgT-=dt;
    if(HOME.mode==='return'&&eng&&AC)eng.master.gain.setTargetAtTime(0,AC.currentTime,0.05);
    navBox.style.display=(pl.navMsgT>0)?'block':'none';if(pl.navMsgT>0)navBox.textContent=pl.navMsg;document.getElementById('extSpd').textContent='0';document.getElementById('extGear').textContent='a piedi';}
  else if(!paused){
    simT+=dt;updateLights(simT);if(started)HOME.tick(dt);
    // passo di integrazione fisso a 240 Hz: guida uguale a qualsiasi frame rate
    physAcc+=dt;let ns=0;while(physAcc>=PH&&ns<16){readInput(PH);stepPhysics(PH);physAcc-=PH;ns++;}
    if(pl.P&&pl.P.truck){const v=Math.abs(pl.vx);if(v>2)hissArm=true;if(hissArm&&v<0.15&&(pl.brkIn||0)>0.2){hissArm=false;airHiss();}}
    updateDust(dt);updateSkids();updateRain(dt);
    if(raceT<0&&!CINE.intro){const before=Math.ceil(-raceT);raceT+=dt;const now=Math.ceil(-raceT);if(now!==before&&now>0){ding(1);pl.navMsg=String(now);pl.navMsgT=1;}if(raceT>=0){pl.navMsg='VIA!';pl.navMsgT=1.5;ding(1);}
      pl.vx=Math.min(pl.vx,0);}
    if(NWT)NWT.TRF.step(dt);else{updateTraffic(dt);updatePeds(dt);updateAnimals(dt);}looseUpdate(dt);updateNav(dt);updateOpp(dt);updateGhost();checkInfractions();pl.vmax=Math.max(pl.vmax||0,Math.abs(pl.vx));if(pl.navMsgT>0)pl.navMsgT-=dt;if(pl.infrT>0)pl.infrT-=dt;
    const kmh=Math.abs(pl.vx)*3.6,limit=limitAt(pl.x,pl.z),over=kmh>limit+0.5;if(limit!==pl.lastLimit){pl.lastLimit=limit;if(!over)pl.overArmed=true;}
    if(over&&pl.overArmed){ding(3);pl.overArmed=false;pl.overN=(pl.overN||0)+1;} if(kmh<limit-3)pl.overArmed=true;
    if(kmh>limit+25){pl.spT=(pl.spT||0)+dt;if(pl.spT>2&&pl.spArm!==false){pl.spArm=false;penalty('velocita');}}else{pl.spT=0;if(kmh<limit+5)pl.spArm=true;}
    if(pl.lic<20&&(pl.km||0)-(pl.cleanKm||0)>=3){pl.cleanKm=pl.km;pl.lic=Math.min(20,pl.lic+2);pl.navMsg='Guida corretta: +2 punti patente ('+pl.lic+'/20)';pl.navMsgT=3;}
    const gearTxt=pl.sel==='R'?'R':pl.sel==='N'?'N':(Math.abs(pl.vx)<0.3?'D':'D'+pl.gear);
    const dmgTot=Math.min(1,(pl.dmg.front+pl.dmg.rear+pl.dmg.left+pl.dmg.right)/2);
    const st={dmg:dmgTot,rpm:pl.rpm,kmh,limit,over,gearTxt,km:pl.km,load:pl.load,slip:pl.slip};
    clusterT-=dt;if(clusterT<=0&&view==='cockpit'){drawCluster(pl.ck,pl.P,st);clusterT=MOBILE?1/12:1/30;}
    screenT-=dt;if(screenT<=0&&view==='cockpit'){screenT=route?0.15:0.5;if(route)drawNavScreen(pl.ck);else drawScreen(pl.ck,st);}
    RESUME.tick(dt);AUTOQ.tick(dt);AMB.tick(dt);RAINW.tick(dt);PCARD.tick(dt);fuelTick(dt);updateBlinker(dt);updateAudio(st);tunnelUpdate(dt);updateCamera(dt);if(DRV)DRV.tick(dt);drawMini(dt);
    lodT-=dt;if(lodT<=0){lodT=0.5;parked.forEach(c=>c.visible=Math.abs(c.position.x-camera.position.x)+Math.abs(c.position.z-camera.position.z)<420);}
    dashW(limit);document.getElementById('tGear').textContent=pl.sel==='R'?'D':'R';document.getElementById('extSpd').textContent=Math.round(kmh);document.getElementById('extGear').textContent=gearTxt+(over?' · ⚠ limite '+limit:'')+fuelTxt();
    {pl.flipT=pl.flip?(pl.flipT||0)+dt:0;const fx=document.getElementById('tFix'),need=!!((pl.flip&&((pl.flip.done&&Math.hypot(pl.vx,pl.vy)<0.5)||pl.flipT>3))||(pl.wat&&pl.wat.sunk));fx.style.display=need?'inline-block':'none';if(need){fx.style.position='fixed';fx.style.left='50%';fx.style.top='45%';fx.style.transform='translate(-50%,-50%)';fx.style.fontSize='18px';fx.style.padding='12px 20px';fx.style.zIndex=4;fx.textContent=isTouch?'Rimetti in strada':'Rimetti in strada (Invio)';}}
    navBox.style.display=(pl.navMsgT>0)?'block':'none';if(pl.navMsgT>0)navBox.textContent=pl.navMsg+(route&&route.next&&view!=='cockpit'?'':'');
    if(route&&view!=='cockpit'&&route.next){navBox.style.display='block';navBox.textContent=Math.round(Math.max(0,route.next.s-route.ps))+' m · '+manText(route.next);}
    if(MOB)hud.textContent=pl.infrT>0?'⚠ '+pl.infrMsg:'';else hud.textContent=(pl.infrT>0?'⚠ '+pl.infrMsg+'  ':'')+`${pl.P.label} · ${pl.km.toFixed(2)} km · urti: ${pl.hits} · rossi: ${pl.infr.rosso} · contromano: ${pl.infr.contromano}`+licTxt()+fuelTxt()+(isTouch?'':' · C: vista · Tab: mappa · O: foto · J: clip · Esc: menu');
  } else if(!started){
    simT+=dt;updateLights(simT);if(!NWT){updateTraffic(dt);updatePeds(dt);updateAnimals(dt);}
    if(NW&&NWT)CINE.menu(dt);else{const a=simT*0.05;camera.position.set(Math.cos(a)*70,40,Math.sin(a)*70);camera.lookAt(0,0,0);sun.position.set(-60,90,40);sun.target.position.set(0,0,0);}
  } else if((menu.style.display!=='none'||document.getElementById('splash'))&&NWT)CINE.menu(dt);
  {const fe=document.getElementById('cineFade');if(fe){const on=menu.style.display!=='none'||!!document.getElementById('splash');if(fe.style.display!==(on?'block':'none'))fe.style.display=on?'block':'none';}}
  if(PHOTO.on)photoUpdate(dt);envTick(dt);chTick(dt);recTick();SMOKE.update(dt);CAR.tick(dt);JOB.tick(dt);POL.tick(dt);EVT.tick(dt);
  sky.position.copy(camera.position);skyMat.uniforms.uT.value=simT;clouds.forEach(c=>{c.position.x+=dt*3;if(NWT){const cx=camera.position.x,cz=camera.position.z;if(c.position.x-cx>2800)c.position.x-=5600;if(c.position.x-cx<-2800)c.position.x+=5600;if(c.position.z-cz>2800)c.position.z-=5600;if(c.position.z-cz<-2800)c.position.z+=5600;}else if(c.position.x>3400)c.position.x-=5600;});
  if(pl.ck&&pl.ck.mirrors)pl.ck.mirrors.forEach(m=>m.visible=CFG.mir!==false);
  if(started&&!paused&&view==='cockpit'&&pl.ck&&CFG.mir!==false&&(frameN%(QG.mir===1?2:QG.mir*2)===0)){pl.ck.g.visible=false;renderer.shadowMap.autoUpdate=false;sky.position.setFromMatrixPosition(rearCam.matrixWorld);
    scene.autoUpdate=false;renderer.setRenderTarget(MIRROR_RT);renderer.render(scene,rearCam);scene.autoUpdate=true;renderer.setRenderTarget(null);pl.ck.g.visible=!CKO.on;renderer.shadowMap.autoUpdate=true;sky.position.copy(camera.position);}
  frameN++;updateMaples();updateCarLOD();if(NWT)NWT.update(dt);
  renderer.render(scene,camera);if(PCARD.want)PCARD.snap();if(SHOT.want)SHOT.snap();
  if(CKO.on){renderer.autoClear=false;renderer.clearDepth();renderer.render(CKO.hud,CKO.cam);renderer.autoClear=true;}
  requestAnimationFrame(loop);
}
// ---- webapp installabile: icona sul telefono, schermo intero, funziona anche offline ----
{const ib=document.getElementById('instBtn');let dp=null;const standalone=matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;if(!standalone)ib.style.display='';});
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);if(ios&&!standalone)ib.style.display='';
  ib.onclick=async()=>{if(dp){dp.prompt();try{await dp.userChoice;}catch(e){}dp=null;ib.style.display='none';}else if(ios)alert('Per installare Guido: tocca il pulsante Condividi di Safari (il quadrato con la freccia) e scegli «Aggiungi alla schermata Home».');};
  addEventListener('appinstalled',()=>{ib.style.display='none';});}
document.getElementById('credBtn').onclick=()=>{const o=document.getElementById('credOv'),r=o.firstElementChild;o.style.display='flex';r.classList.remove('roll');void r.offsetWidth;r.classList.add('roll');};document.getElementById('credOv').addEventListener('click',e=>{if(e.target.id==='credOv')e.currentTarget.style.display='none';});document.getElementById('credClose').onclick=()=>{document.getElementById('credOv').style.display='none';};
buildMaples();
/* ESCI: salva, ferma audio e prova a chiudere l'app (PWA/finestra) */
(function(){const b=document.getElementById('exitBtn'),ov=document.getElementById('byeOv');if(!b)return;
b.onclick=()=>{try{RESUME.t=0;RESUME.tick(0.001);}catch(e){}
try{if(AC)AC.suspend();}catch(e){}document.querySelectorAll('audio,video').forEach(a=>{try{a.pause();}catch(e){}});
try{speechSynthesis.cancel();}catch(e){}
ov.style.display='flex';try{window.close();}catch(e){}};
document.getElementById('byeBack').onclick=()=>{ov.style.display='none';try{if(AC)AC.resume();}catch(e){}};})();
