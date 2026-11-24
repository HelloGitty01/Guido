// Guido · 13b modelli HD — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ================= PACCHETTO "MODELLI DETTAGLIATI": autobus, mucche, gatto, persone, cantieri, fast food =================
// Tutto è facoltativo: se il pacchetto è spento (impostazioni) o un modello manca, il gioco usa i modelli di sempre.
const HDX=(()=>{if(!window.HDON||!THREE.SkeletonUtils)return null;const X={},V1=new THREE.Vector3(),V2=new THREE.Vector3();
  const find=(o,re)=>{let r=null;o.traverse(n=>{if(!r&&re.test(n.name))r=n;});return r;};
  // misura una copia di prova: rotazione per avere la testa verso +x, scala e spostamento per avere i piedi a terra
  const measure=(sc,{len,hgt,head,tail,rot=0,mirror=false,fix})=>{const w=new THREE.Group(),inner=THREE.SkeletonUtils.clone(sc);w.add(inner);w.updateMatrixWorld(true);
    let ang=rot;if(head){const h=find(inner,head),t=find(inner,tail);if(h&&t){h.getWorldPosition(V1);t.getWorldPosition(V2);ang=Math.atan2(V1.z-V2.z,V1.x-V2.x);}}
    inner.rotation.y=ang;w.updateMatrixWorld(true);
    // con le ossa (le mesh animate hanno le coordinate di riposo in un altro spazio): si misura lo scheletro e si allarga un po'
    let bb=new THREE.Box3(),sk=false;inner.traverse(o=>{if(o.isSkinnedMesh){sk=true;o.skeleton.bones.forEach(b=>bb.expandByPoint(b.getWorldPosition(V1)));}});
    if(!sk)bb=new THREE.Box3().setFromObject(inner);const sz=bb.getSize(new THREE.Vector3());if(sk){sz.x*=1.12;sz.y*=1.06;}
    const s=fix||(len?len/Math.max(1e-3,sz.x):hgt/Math.max(1e-3,sz.y));return{ang,s,cx:(bb.min.x+bb.max.x)/2,cz:(bb.min.z+bb.max.z)/2,y0:bb.min.y,mirror};};
  const place=(sc,M,skinned)=>{const g=new THREE.Group(),w=new THREE.Group(),inner=skinned?THREE.SkeletonUtils.clone(sc):sc.clone(true);inner.rotation.y=M.ang;w.add(inner);
    w.position.set(-M.cx*M.s,-M.y0*M.s,-M.cz*M.s*(M.mirror?-1:1));w.scale.set(M.s,M.s,M.s*(M.mirror?-1:1));g.add(w);
    inner.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.isSkinnedMesh)o.frustumCulled=false;if(o.material&&!o.material.userData.hdfix){gFixMat(o.material);o.material.userData.hdfix=1;}}});return{g,inner};};
  const clip=(G,re)=>G.animations.find(a=>re.test(a.name));

  // ---------- autobus urbano (Scania): specchiato perché le porte stiano a destra, come in Italia ----------
  if(MODELS.hd_bus)try{const G=MODELS.hd_bus,M=measure(G.scene,{len:TYPES.bus.L,mirror:true}),dc=clip(G,/door/i);
    G.scene.traverse(o=>{if(o.isMesh&&o.material){const m=o.material;if(m.transparent){m.depthWrite=true;m.alphaTest=Math.max(m.alphaTest||0,0.05);}m.roughness=Math.min(m.roughness,0.5);}});
    X.bus=()=>{const{g,inner}=place(G.scene,M,false),T=TYPES.bus,hl=T.L/2;g.rotation.order='YZX';
      const hM=new THREE.MeshStandardMaterial({color:0xf2f2ea,emissive:0xfff4d8,emissiveIntensity:0.15}),tM=new THREE.MeshStandardMaterial({color:0x6a0808,emissive:0xff0000,emissiveIntensity:0.15,toneMapped:false});
      const indL=new THREE.MeshStandardMaterial({color:0x6b3a00,emissive:0xff8a00,emissiveIntensity:0}),indR=indL.clone();
      [1,-1].forEach(sd=>{const im=sd>0?indR:indL;[[hl+0.02,0.95,0.2],[-hl-0.02,1.2,0.15]].forEach(([x,y,o])=>{const b=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.1,0.12),im);b.position.set(x,y,sd*(T.W/2-o));g.add(b);});
        const t=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.3,0.16),tM);t.position.set(-hl-0.03,1.0,sd*(T.W/2-0.25));g.add(t);});
      const ud=g.userData;ud.tailM=tM;ud.headM=hM;ud.indL=indL;ud.indR=indR;ud.body=inner;ud.paint=null;ud.wheels=[];
      if(dc){const mx=new THREE.AnimationMixer(inner),a=mx.clipAction(dc);a.setLoop(THREE.LoopOnce);a.clampWhenFinished=true;ud.doorMx=mx;ud.doorA=a;ud.doorOpen=false;
        // apre/chiude le porte (la clip va dall'apertura alla chiusura: si usa la prima metà)
        ud.doors=(open,dt)=>{if(open!==ud.doorOpen){ud.doorOpen=open;a.reset();a.play();a.paused=false;a.timeScale=open?1:-1;if(!open)a.time=dc.duration/2;}
          mx.update(dt);if(open&&a.time>=dc.duration/2){a.time=dc.duration/2;a.paused=true;}if(!open&&a.time<=0){a.time=0;a.paused=true;}};}
      return g;};}catch(e){console.warn('autobus HD',e);}

  // ---------- mucche: pezzata rossa che bruca e frisona ----------
  const cows=[];[[MODELS.hd_cow,/idle|eat/i,0.3],[MODELS.hd_cow2,/idd?le/i,0.7]].forEach(([G,re,fix])=>{if(!G)return;try{const cl=G.animations.filter(a=>re.test(a.name));
    const M=measure(G.scene,{fix,head:/head/i,tail:/tail|spine|hips|pelvis/i});cows.push({G,M,cl});}catch(e){console.warn('mucca HD',e);}});
  if(cows.length)X.cow=()=>{const C=cows[(Math.random()*cows.length)|0],{g,inner}=place(C.G.scene,C.M,true);g.scale.setScalar(0.92+Math.random()*0.16);
    g.userData={legs:[],head:new THREE.Group()};if(C.cl.length){const mx=new THREE.AnimationMixer(inner),c=C.cl[(Math.random()*C.cl.length)|0],a=mx.clipAction(c);a.play();mx.setTime(Math.random()*c.duration);g.userData.mixer=mx;}return g;};

  // ---------- il gatto di Guido ----------
  if(MODELS.hd_cat)try{const G=MODELS.hd_cat,M=measure(G.scene,{fix:0.3,head:/head|neck/i,tail:/tail/i}),c0=G.animations[0];
    X.cat=()=>{const{g,inner}=place(G.scene,M,true);const w=new THREE.Group();g.rotation.y=-Math.PI/2;w.add(g);// il gatto di casa guarda verso +z
      const mx=new THREE.AnimationMixer(inner),a=c0?mx.clipAction(c0):null;if(a)a.play();w.userData={hd:true,mx,a,ph:0};return w;};}catch(e){console.warn('gatto HD',e);}

  // ---------- Guido (modello con scheletro): cammina, saluta, si siede al volante ----------
  if(MODELS.guido)try{const G=MODELS.guido,M=measure(G.scene,{hgt:1.76}),c0=G.animations[0],WK=!!(c0&&/mixamo|walk/i.test(c0.name)),Q=new THREE.Quaternion(),Qa=new THREE.Quaternion(),Qp=new THREE.Quaternion(),Qr=new THREE.Quaternion(),AX=new THREE.Vector3(1,0,0),AZ=new THREE.Vector3(0,0,1),AY=new THREE.Vector3(0,1,0);
    X.guido=()=>{const{g,inner}=place(G.scene,M,true),B={};inner.traverse(o=>{if(o.isBone)B[o.name.replace(/_\d+$/,'').replace(/^mixamorig:?/,'')]=o;});const mx=new THREE.AnimationMixer(inner);let act=null;if(c0){act=mx.clipAction(c0);act.play();}
      // il modello nuovo ha una camminata vera (mixamo): si usa quella, e da fermo si blocca sul fotogramma con i piedi più vicini
      let n0=0;if(WK&&act&&B.LeftFoot&&B.RightFoot){let best=1e9;const a=new THREE.Vector3(),b=new THREE.Vector3();for(let t=0;t<c0.duration;t+=c0.duration/40){act.time=t;mx.update(0);inner.updateMatrixWorld(true);B.LeftFoot.getWorldPosition(a);B.RightFoot.getWorldPosition(b);const d=Math.hypot(a.x-b.x,a.z-b.z);if(d<best){best=d;n0=t;}}act.time=n0;mx.update(0);}
      g.userData={hd:true,mx,B,ph:0,root:inner,act,wk:WK&&!!act,n0};return g;};
    // rotazione "nel riferimento del personaggio" applicata a un osso: q_locale = P^-1 · D · P · q_locale
    const rotC=(u,b,D)=>{if(!b)return;b.parent.getWorldQuaternion(Qp);Qp.premultiply(Qr);Qa.copy(Qp).invert().multiply(D).multiply(Qp);b.quaternion.premultiply(Qa);b.updateMatrixWorld(true);};
    const R=(ax,an)=>new THREE.Quaternion().setFromAxisAngle(ax,an);
    X.poseGuido=(g,dt,sp,mode,t)=>{const u=g.userData,B=u.B;
      if(u.wk){const A=u.act;if(mode==='walk'&&sp>0.05){A.timeScale=Math.min(1.8,Math.max(0.35,sp/1.3));u.mx.update(dt);}else{A.time=u.n0;u.mx.update(0);}
        u.root.updateMatrixWorld(true);u.root.getWorldQuaternion(Qr);Qr.invert();
        if(mode==='sit'){rotC(u,B.LeftUpLeg,R(AX,-1.42));rotC(u,B.RightUpLeg,R(AX,-1.42));rotC(u,B.LeftLeg,R(AX,0.62));rotC(u,B.RightLeg,R(AX,0.62));rotC(u,B.LeftFoot,R(AX,-0.5));rotC(u,B.RightFoot,R(AX,-0.5));rotC(u,B.LeftArm,R(AX,-0.6));rotC(u,B.RightArm,R(AX,-0.6));rotC(u,B.LeftForeArm,R(AX,-0.5));rotC(u,B.RightForeArm,R(AX,-0.5));}
        else if(mode==='reach'){rotC(u,B.RightArm,R(AX,-1.15));rotC(u,B.RightForeArm,R(AX,-0.35));}
        else if(mode==='wave'){rotC(u,B.RightArm,R(AZ,-2.3));rotC(u,B.RightForeArm,R(AZ,-0.3-0.35*Math.sin(t*7)));}
        return;}if(!u.rest){u.rest=new Map();['LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','LeftFoot','RightFoot','LeftArm','RightArm','LeftForeArm','RightForeArm','Spine'].forEach(n=>B[n]&&u.rest.set(B[n],B[n].quaternion.clone()));}u.rest.forEach((q,b)=>b.quaternion.copy(q));u.mx.update(sp>0.05&&mode!=='sit'?0:dt);u.root.updateMatrixWorld(true);u.root.getWorldQuaternion(Qr);Qr.invert();
      if(mode==='sit'){rotC(u,B.LeftUpLeg,R(AX,-1.42));rotC(u,B.RightUpLeg,R(AX,-1.42));rotC(u,B.LeftLeg,R(AX,0.62));rotC(u,B.RightLeg,R(AX,0.62));rotC(u,B.LeftFoot,R(AX,-0.5));rotC(u,B.RightFoot,R(AX,-0.5));
        rotC(u,B.Spine,R(AX,-0.12));
        rotC(u,B.LeftArm,R(AX,-0.5));rotC(u,B.RightArm,R(AX,-0.5));return;}
      const k=Math.min(1,sp/1.2),run=sp>2.2;u.ph+=dt*(sp>0.05?Math.max(2.5,sp*4.9):0);/* passo legato alla distanza percorsa: i piedi non scivolano */const sn=Math.sin(u.ph),cs=Math.cos(u.ph);
      [[B.LeftUpLeg,B.LeftLeg,sn],[B.RightUpLeg,B.RightLeg,-sn]].forEach(([U,L,q],i)=>{rotC(u,U,R(AX,-q*0.38*k*(run?1.3:1)));rotC(u,L,R(AX,(0.08+Math.max(0,i?cs:-cs)*0.7)*k*(run?1.3:1)));});
      rotC(u,B.LeftArm,R(AX,sn*0.3*k));
      if(mode==='wave'){rotC(u,B.RightArm,R(AZ,-2.3));rotC(u,B.RightForeArm,R(AZ,-0.3-0.35*Math.sin(t*7)));}
      else if(mode==='reach'){rotC(u,B.RightArm,R(AX,-1.15));rotC(u,B.RightForeArm,R(AX,-0.35));rotC(u,B.Spine,R(AX,-0.12));}
      else{rotC(u,B.RightArm,R(AX,-sn*0.3*k));rotC(u,B.RightForeArm,R(AX,-0.18-Math.max(0,-sn)*0.3*k));}
      rotC(u,B.LeftForeArm,R(AX,-0.18-Math.max(0,sn)*0.3*k));
      u.root.parent.position.y+=0;};}catch(e){console.warn('Guido HD',e);}

  // ---------- persone ferme (alla fermata, davanti ai negozi): otto personaggi diversi ----------
  if(MODELS.hd_people)try{const G=MODELS.hd_people,sc=G.scene,c0=G.animations[0],roots=[];sc.traverse(o=>{if(/^rig_CharRoot\d*$/.test(o.name))roots.push(o);});
    const under=(n,r)=>{for(let p=n;p;p=p.parent)if(p===r)return true;return false;};
    const tpl=roots.map((r,k)=>{const c=THREE.SkeletonUtils.clone(sc),rr=find(c,new RegExp('^'+r.name+'$')),drop=[];
      c.traverse(o=>{if(!o.isSkinnedMesh)return;const si=o.geometry.attributes.skinIndex,sw=o.geometry.attributes.skinWeight,cnt={};
        for(let i=0;i<si.count;i+=7)for(let j=0;j<4;j++){const w=sw.getComponent?sw.getComponent(i,j):[sw.getX(i),sw.getY(i),sw.getZ(i),sw.getW(i)][j];if(w>0.3){const b=[si.getX(i),si.getY(i),si.getZ(i),si.getW(i)][j];cnt[b]=(cnt[b]||0)+1;}}
        const top=Object.entries(cnt).sort((x,y)=>y[1]-x[1])[0];const bone=top&&o.skeleton.bones[+top[0]];if(!bone||!under(bone,rr))drop.push(o);});drop.forEach(o=>o.parent&&o.parent.remove(o));
      const names=new Set();rr.traverse(o=>names.add(o.name));const cl=c0?new THREE.AnimationClip('idle'+k,c0.duration,c0.tracks.filter(t=>names.has(t.name.split('.')[0]))):null;
      let n=0;c.traverse(o=>{if(o.isSkinnedMesh)n++;});if(!n)return null;const M=measure(c,{fix:0.98+((k*37)%7)*0.012});return{c,M,cl};}).filter(Boolean);
    if(tpl.length)X.person=(k)=>{const P=tpl[(k==null?(Math.random()*tpl.length):k)%tpl.length|0],{g,inner}=place(P.c,P.M,true);
      if(P.cl){const mx=new THREE.AnimationMixer(inner),a=mx.clipAction(P.cl);a.play();mx.setTime(Math.random()*P.cl.duration);g.userData.mixer=mx;}return g;};
    X.nPeople=tpl.length;}catch(e){console.warn('persone HD',e);}

  // ---------- arredo dei cantieri: barriere in cemento, cartelli, coni e delineatori ----------
  if(MODELS.hd_road)try{const sc=MODELS.hd_road.scene;sc.updateMatrixWorld(true);const cls=m=>/BarrierA/.test(m)?'barrA':/BarrierB/.test(m)?'barrB':/RoadWorksSignNew/.test(m)?'works':/RoadClosedNew/.test(m)?'closed':/Cone/.test(m)?'cone':null;
    const items=[];sc.traverse(o=>{if(!o.isMesh)return;const k=cls(o.material.name);if(!k)return;const b=gBake(o,o.matrixWorld),bb=gBox([b]);
      if(items.some(it=>it.k===k&&it.bb.min.distanceTo(bb.min)<0.01&&it.bb.max.distanceTo(bb.max)<0.01))return;items.push({k,mat:o.material,b,bb});});
    // raggruppa i pezzi che si toccano (un cartello = palo + cavalletto + pannello)
    const groups=[];items.forEach(it=>{const e=it.bb.clone().expandByScalar(0.03);let G=groups.find(g=>g.k===it.k&&g.bb.intersectsBox(e));if(!G){G={k:it.k,bb:it.bb.clone(),parts:[]};groups.push(G);}else G.bb.union(it.bb);G.parts.push({mat:it.mat,b:it.b});});
    const H={barrA:0.82,barrB:1.0,works:1.3,closed:1.25,cone:null};X.road={};
    groups.forEach(G=>{const c=G.bb.getCenter(new THREE.Vector3()),h=G.bb.max.y-G.bb.min.y,s=H[G.k]?H[G.k]/h:1;gShift(G.parts.map(p=>p.b),-c.x,-G.bb.min.y,-c.z,s);
      const t=gTemplate(G.parts);t.meshes.forEach(p=>{p.mat.roughness=Math.max(0.6,p.mat.roughness);});(X.road[G.k]||(X.road[G.k]=[])).push(t);});
    X.roadProp=(k,i)=>{const L=X.road[k];if(!L||!L.length)return null;const t=L[(i==null?Math.random()*L.length:i)%L.length|0];return gInstance(t);};}catch(e){console.warn('cantieri HD',e);}

  // ---------- fast food di Ornavia ("Orna Burger"), con parcheggio e drive-in ----------
  if(MODELS.hd_food)try{const sc=MODELS.hd_food.scene;sc.updateMatrixWorld(true);const parts=[];sc.traverse(o=>{if(o.isMesh)parts.push({mat:o.material,b:gBake(o,o.matrixWorld)});});
    const bb=gBox(parts.map(p=>p.b)),c=bb.getCenter(new THREE.Vector3()),s=0.62;gShift(parts.map(p=>p.b),-c.x,-bb.min.y,-c.z,s);const t=gTemplate(parts);
    X.foodSize=[(bb.max.x-bb.min.x)*s,(bb.max.z-bb.min.z)*s];X.food=()=>gInstance(t);}catch(e){console.warn('fast food HD',e);}
  return Object.keys(X).length?X:null;})();

// ================= Guido e Gatto a bordo: salgono in auto all'inizio della corsa e si vedono dentro dalla vista esterna =================
const DRV=(()=>{if(!HDX||!HDX.guido)return null;const D={seat:null,cat:null,walk:null,wcat:null,inCar:true,catIn:true,skipBoard:false,par:null};
  const V=new THREE.Vector3();
  const mkSeat=()=>{D.seat=HDX.guido();D.seat.userData.seated=true;};
  const attach=()=>{if(!pl.mesh||!pl.ck)return false;if(!D.seat)mkSeat();if(D.par!==pl.mesh){D.par=pl.mesh;pl.mesh.add(D.seat);if(D.cat)pl.mesh.add(D.cat);
      const e=pl.ck.eye;D.seat.position.set(e.x+0.14,e.y-1.73,e.z);D.seat.rotation.y=Math.PI/2;
      if(D.cat){D.cat.position.set(e.x+0.05,e.y-0.62,-e.z*0.95);D.cat.rotation.y=-Math.PI/2;}
      HDX.poseGuido(D.seat,0.016,0,'sit',0);}return true;};
  // portiera apribile: si ritagliano dalla carrozzeria i triangoli della porta (lato, tra montante A e B) e si appendono a un cardine
  const MI=new THREE.Matrix4(),MW=new THREE.Matrix4(),VA=new THREE.Vector3(),DS=new Map();
  const door=(side)=>{const car=pl.mesh,ud=car&&car.userData,body=ud&&ud.body;if(!body||!ud.glb||!pl.ck)return null;const key='dr'+side;if(ud[key])return ud[key];
    car.updateMatrixWorld(true);const e=pl.ck.eye,T=pl.T,W=T.W/2,cp=/hellcat/.test(selKey),u1=e.x+0.72,u0=e.x-(cp?1.05:0.62),y0=0.25,y1=(T.Hm||T.H)-0.1,zIn=W-0.3;
    const gi=new THREE.Matrix4().copy(car.matrixWorld).invert(),piv=new THREE.Group();VA.set(u1,0,side*(W-0.08)).applyMatrix4(car.matrixWorld);body.add(piv);body.worldToLocal(VA);piv.position.copy(VA);piv.updateMatrixWorld(true);
    const pinv=new THREE.Matrix4().copy(piv.matrixWorld).invert(),L=[];body.traverse(o=>{if(o.isMesh&&o.userData.role!=='wheel'&&!Array.isArray(o.material)&&o.geometry&&o.geometry.attributes.position)L.push(o);});
    L.forEach(o=>{const geo=o.geometry,P=geo.attributes.position,idx=geo.index?geo.index.array:null,nT=(idx?idx.length:P.count)/3,keep=[],mv=[];MW.multiplyMatrices(gi,o.matrixWorld);
      for(let t=0;t<nT;t++){let cx=0,cy=0,cz=0,ok=true;for(let k=0;k<3;k++){const i=idx?idx[t*3+k]:t*3+k;VA.set(gRd(P,i,0),gRd(P,i,1),gRd(P,i,2)).applyMatrix4(MW);cx+=VA.x;cy+=VA.y;cz+=VA.z;if(VA.x<u0-0.12||VA.x>u1+0.12||VA.y<y0-0.1)ok=false;}cx/=3;cy/=3;cz/=3;
        (ok&&cx>u0&&cx<u1&&cy>y0&&cy<y1&&cz*side>zIn?mv:keep).push(t);}
      if(!mv.length)return;const sub=(list)=>{const g2=geo.clone();g2.userData=geo.userData;const ia=new Uint32Array(list.length*3);list.forEach((t,j)=>{for(let k=0;k<3;k++)ia[j*3+k]=idx?idx[t*3+k]:t*3+k;});g2.setIndex(new THREE.BufferAttribute(ia,1));g2.computeBoundingBox();g2.computeBoundingSphere();return g2;};
      let dmat=o.material;if(dmat.side!==THREE.DoubleSide){dmat=DS.get(o.material);if(!dmat){dmat=o.material.clone();dmat.side=THREE.DoubleSide;DS.set(o.material,dmat);}}const dm=new THREE.Mesh(sub(mv),dmat);dm.matrixAutoUpdate=false;dm.matrix.multiplyMatrices(pinv,o.matrixWorld);dm.castShadow=o.castShadow;dm.userData.role=o.userData.role;piv.add(dm);o.geometry=sub(keep);});
    const D2={piv,side,a:0,set(x){this.a=x;piv.rotation.y=side*x*1.15;}};ud[key]=D2;return D2;};
  const doorsShut=()=>{if(!pl.mesh)return;const ud=pl.mesh.userData;[1,-1].forEach(sd=>{if(ud['dr'+sd])ud['dr'+sd].set(0);});};
  // salita a bordo: dopo il volo del drone, Guido apre la portiera al gatto, lo fa salire, la chiude, gira dietro l'auto e sale lui
  D.board=()=>{if(D.skipBoard){D.skipBoard=false;D.inCar=D.catIn=true;return false;}if(!attach())return false;D.inCar=D.catIn=false;D.ph='wait';D.done=false;
    if(!D.walk){D.walk=HDX.guido();scene.add(D.walk);}
    const e=pl.ck.eye,sd=Math.sign(e.z)||-1,ps=-sd,W=pl.T.W/2,hl=pl.T.L/2;D.sd=sd;
    D.g={u:-hl-1.6,v:sd*(W+1.4),h:Math.PI/2,sp:0};D.c={u:0,v:0,h:0,sp:0};D.catIn=true;D.t=0;D.k=0;D.kt=0;
    D.walk.visible=true;D.place();return true;};
  D.go=()=>{if(D.ph!=='wait')return false;const e=pl.ck.eye,sd=D.sd,ps=-sd,W=pl.T.W/2,hl=pl.T.L/2,cp=/hellcat/.test(selKey),back=e.x-(cp?1.05:0.62)-0.35;
    const dD=door(sd),G=D.g,C=D.c;let jump=null;
    const walk=(o,pts,sp)=>dt=>{const q=pts[0];if(!q)return true;if(step(o,q[0],q[1],sp,dt)<0.1){pts.shift();}return !pts.length;};
    const anim=(dr,a,b,dur)=>{let t=0;return dt=>{t+=dt;const k=Math.min(1,t/dur),s2=k*k*(3-2*k);if(dr)dr.set(a+(b-a)*s2);return k>=1;};};
    const wait=d=>{let t=0;return dt=>(t+=dt)>=d;};
    const face=(o,h)=>dt=>{let dh=h-o.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));o.h+=dh*Math.min(1,dt*8);return Math.abs(dh)<0.05;};
    const both=(...f)=>{const dn=f.map(()=>false);return dt=>{f.forEach((g,i)=>{if(!dn[i])dn[i]=g(dt);});return dn.every(Boolean);};};
    // salto del gatto: si ferma davanti alla portiera guardando dentro, si acquatta, poi salta ad arco fino al sedile
    const catJump=()=>{let t=0,p0=null,p1=null;return dt=>{if(!p0){p0={u:C.u,v:C.v};const sp=D.cat?D.cat.position:null;p1=sp?{u:sp.x,v:sp.z,y:sp.y}:{u:e.x,v:ps*0.4,y:0.5};}
        t+=dt;const h=Math.atan2(p1.u-p0.u,p1.v-p0.v);
        if(t<0.35){let dh=h-C.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));C.h+=dh*Math.min(1,dt*10);C.sp=0;C.sq=1-0.12*Math.min(1,t/0.25);return false;}
        const k=Math.min(1,(t-0.35)/0.5),e2=k<0.5?2*k*k:1-2*(1-k)*(1-k);C.sq=1;C.h=h;C.u=p0.u+(p1.u-p0.u)*e2;C.v=p0.v+(p1.v-p0.v)*e2;C.y=p1.y*e2+Math.sin(k*Math.PI)*0.45;C.pitch=-0.5*Math.cos(k*Math.PI);C.sp=1.6;
        if(k>=1){C.y=0;C.pitch=0;D.catIn=true;if(D.wcat)D.wcat.visible=false;}return k>=1;};};
    // Guido si siede: entra di fianco e si abbassa sul sedile, poi compare la versione seduta
    const sitIn=()=>{let t=0,a=null,b=null;return dt=>{if(!a){a={u:G.u,v:G.v};b={u:e.x-0.05,v:sd*(W-0.35)};G.h=Math.atan2(b.u-a.u,b.v-a.v);}t+=dt;const k=Math.min(1,t/0.55);G.u=a.u+(b.u-a.u)*k;G.v=a.v+(b.v-a.v)*k;G.sit=0;G.dy=-0.35*k;G.sp=0.9*(1-k);
        if(k>=1){D.inCar=true;D.walk.visible=false;G.sit=0;}return k>=1;};};
    const reach=on=>dt=>{D.reach=on;return true;};
    D.seq=[
      walk(G,[[back,sd*(W+0.6)]],1.3),face(G,Math.PI/2),reach(true),anim(dD,0,1,0.9),reach(false),
      walk(G,[[e.x-0.25,sd*(W+0.5)]],0.9),sitIn(),wait(0.3),
      anim(dD,1,0,0.6),wait(0.6),dt=>{D.done=true;return true;}];
    D.ph='run';return true;};
  const toW=(u,v,y=0)=>{V.set(u,y,v);pl.mesh.localToWorld(V);return V;};
  const step=(o,tu,tv,sp,dt)=>{const du=tu-o.u,dv=tv-o.v,d=Math.hypot(du,dv);if(d<0.06){o.sp=0;return d;}const w=Math.min(sp,d*2.2+0.15);o.sp+=(w-o.sp)*Math.min(1,dt*5);const m=Math.min(d,o.sp*dt);o.u+=du/d*m;o.v+=dv/d*m;
    let dh=Math.atan2(du,dv)-o.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));o.h+=dh*Math.min(1,dt*9);return d;};
  D.place=()=>{if(D.walk&&D.walk.visible){const p=toW(D.g.u,D.g.v),gy=NW.H(p.x,p.z),st=D.g.sit||0;let y=gy+(D.g.dy||0);D.walk.position.set(p.x,y,p.z);D.walk.rotation.y=dirW(D.g);}
    if(D.wcat&&D.wcat.visible){const c=D.c,p=toW(c.u,c.v,c.y||0),gy=NW.H(p.x,p.z);D.wcat.position.set(p.x,c.y?Math.max(p.y,gy):gy,p.z);D.wcat.rotation.set(0,dirW(c),0);D.wcat.rotateX(c.pitch||0);D.wcat.scale.set(1,c.sq||1,1);}};
  D.tick=(dt)=>{if(!pl.mesh||!started)return;attach();
    if(D.walk&&(D.walk.visible||(D.wcat&&D.wcat.visible))){D.t+=dt;
      if(D.ph==='run'&&D.seq){while(D.seq.length&&D.seq[0](dt))D.seq.shift();}
      if(D.walk.visible)HDX.poseGuido(D.walk,dt,D.g.sp,D.g.sit>0.15?'sit':D.reach?'reach':'walk',simT);
      if(D.wcat&&D.wcat.visible){const u=D.wcat.userData,c=D.c;if(u.a)u.a.timeScale=c.sp>0.05?Math.min(2,0.4+c.sp/0.9):0;u.mx.update(dt);}
      D.place();if(D.inCar&&D.catIn&&D.done){D.walk.visible=false;if(D.wcat)D.wcat.visible=false;}}
    else if(D.ph==='run'&&D.seq&&D.seq.length){while(D.seq.length&&D.seq[0](dt))D.seq.shift();}
    const out=view!=='cockpit'||PHOTO.on;D.seat.visible=D.inCar&&out&&!HOME.mode;if(D.cat)D.cat.visible=D.catIn&&!HOME.mode;
    if(D.seat.visible)HDX.poseGuido(D.seat,dt,0,'sit',simT);};
  // direzione di marcia (coordinate auto -> angolo nel mondo: il modello guarda verso +z)
  const dirW=(o)=>{const a=toW(o.u,o.v).clone(),du=Math.sin(o.h),dv=Math.cos(o.h),b=toW(o.u+du,o.v+dv);return Math.atan2(b.x-a.x,b.z-a.z);};
  D.hideAll=()=>{if(D.walk)D.walk.visible=false;if(D.wcat)D.wcat.visible=false;D.inCar=D.catIn=true;D.ph=null;D.seq=null;D.done=true;D.wave=false;D.reach=false;if(D.g){D.g.sit=0;D.g.dy=0;}if(D.wcat)D.wcat.scale.set(1,1,1);doorsShut();};
  return D;})();

// ---- spruzzi quando un'auto finisce in acqua (si animano da soli a ogni fotogramma) ----
window.SPLASH=(x,y,z,k)=>{const n=90,P=new Float32Array(n*3),Vv=[];for(let i=0;i<n;i++){const a=Math.random()*6.283,r=Math.random();P.set([x+Math.cos(a)*r*1.2,y+0.1,z+Math.sin(a)*r*1.2],i*3);Vv.push([Math.cos(a)*(1+Math.random()*3)*k,(3+Math.random()*6)*k,Math.sin(a)*(1+Math.random()*3)*k]);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));const m=new THREE.PointsMaterial({color:0xeef6fa,size:0.35,transparent:true,opacity:0.9,depthWrite:false});
  const pts=new THREE.Points(g,m);pts.frustumCulled=false;scene.add(pts);let last=performance.now(),t=0;
  pts.onBeforeRender=()=>{const now=performance.now(),dt=Math.min(0.05,(now-last)/1000);last=now;t+=dt;const p=g.attributes.position.array;
    for(let i=0;i<n;i++){const v=Vv[i];v[1]-=9.8*dt;p[i*3]+=v[0]*dt;p[i*3+1]=Math.max(y-0.2,p[i*3+1]+v[1]*dt);p[i*3+2]+=v[2]*dt;}g.attributes.position.needsUpdate=true;m.opacity=Math.max(0,0.9-t*0.45);
    if(t>2.2){scene.remove(pts);g.dispose();m.dispose();}};};
