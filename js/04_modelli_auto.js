// Guido · 04 modelli auto — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ================= MODELLI AUTO =================
const TYPES={
  utilitaria:{fleet:true,L:3.1,W:1.47,hb:0.95,H:1.52,gh:[[-1.75,0.95],[-1.6,1.5],[0.15,1.5],[0.75,0.95]]},
  berlina:{L:4.45,W:1.8,hb:0.9,H:1.45,gh:[[-1.9,0.9],[-1.55,1.43],[0.5,1.43],[1.15,0.9]]},
  sw:{L:4.75,W:1.82,hb:0.92,H:1.5,gh:[[-2.3,0.92],[-2.2,1.48],[0.55,1.48],[1.25,0.92]]},
  suv:{L:4.35,W:1.82,hb:1.05,H:1.65,gh:[[-2.1,1.05],[-1.95,1.63],[0.55,1.63],[1.05,1.05]]},
  camion:{L:9.5,W:2.45,hb:1.3,H:3.6,truck:true,gh:[[3.4,1.6],[3.4,2.6],[3.9,2.6],[4.35,1.6]]},
  // la flotta di Guido (modelli dettagliati con interni): misure riprese dai modelli al caricamento
  volvo:{L:4.79,W:1.71,hb:0.92,H:1.43,fleet:true,gh:[[-1.9,0.92],[-1.6,1.42],[0.5,1.42],[1.1,0.92]]},
  wagoneer:{L:4.76,W:1.9,hb:1.05,H:1.8,fleet:true,gh:[[-2.2,1.05],[-2.1,1.75],[0.55,1.75],[1.0,1.05]]},
  hellcat:{L:4.9,W:2.03,hb:0.85,H:1.37,fleet:true,gh:[[-1.7,0.9],[-1.0,1.33],[0.3,1.33],[1.0,0.9]]},
  zil:{L:5.86,W:2.2,hb:1.3,H:2.84,fleet:true,van:true,gh:[[-2.7,1.2],[-2.7,2.3],[1.5,2.3],[2.0,1.2]]},
  daily:{L:6.0,W:2.2,hb:1.15,H:2.85,fleet:true,van:true,gh:[[-2.7,1.2],[-2.7,2.3],[1.5,2.3],[2.0,1.2]]},
  taxi:{L:5.35,W:2.0,hb:0.95,H:1.5,fleet:true,gh:[[-1.9,0.95],[-1.55,1.45],[0.55,1.45],[1.1,0.95]]},
  // mezzi solo del traffico (modelli di Daniel Zhabotinsky, CC-BY 4.0): misure riprese dai modelli al caricamento
  illinois:{L:5.2,W:2.0,hb:0.95,H:1.5,fleet:true,gh:[[-1.9,0.95],[-1.55,1.45],[0.55,1.45],[1.1,0.95]]},
  miner:{L:3.5,W:1.5,hb:0.9,H:1.33,fleet:true,gh:[[-1.4,0.9],[-1.1,1.3],[0.3,1.3],[0.8,0.9]]},
  shvan:{L:4.9,W:2.0,hb:1.1,H:1.93,fleet:true,gh:[[-2.3,1.1],[-2.2,1.9],[1.0,1.9],[1.6,1.1]]},
  shvant:{L:5.2,W:2.0,hb:1.1,H:2.1,fleet:true,gh:[[-2.3,1.1],[-2.2,1.9],[1.0,1.9],[1.6,1.1]]},
  amb:{L:5.0,W:2.0,hb:1.1,H:2.26,fleet:true,gh:[[-2.3,1.1],[-2.2,1.9],[1.0,1.9],[1.6,1.1]]},
  cop:{L:5.07,W:1.83,hb:0.95,H:1.57,fleet:true,gh:[[-1.9,0.95],[-1.55,1.45],[0.55,1.45],[1.1,0.95]]},
  fire:{L:5.07,W:1.83,hb:0.95,H:1.5,fleet:true,gh:[[-2.3,0.92],[-2.2,1.48],[0.55,1.48],[1.25,0.92]]},
  bus:{L:11.2,W:2.5,hb:1.1,H:3.05,bus:true,gh:[[-5,1.2],[-5,2.7],[5,2.7],[5.4,1.2]]},
  furgone:{L:5.0,W:2.0,hb:1.05,H:2.25,gh:[[0.95,1.2],[0.95,2.0],[1.42,2.0],[1.91,1.2]],van:true}
};
const COLORS=[0xe9e9e6,0xbfc3c7,0x8e9399,0x2a2d31,0x1c2a44,0x6b1d22,0x3e4a3b,0x5d6f84,0xd9d4c7,0x7a2f22];
const glassM=new THREE.MeshStandardMaterial({color:0x0e141a,roughness:0.06,metalness:0.9,envMapIntensity:1.4});
const rimTex=canvasTex(128,(g,n)=>{g.fillStyle='#2a2c30';g.fillRect(0,0,n,n);const c=n/2;g.fillStyle='#c9ccd1';g.beginPath();g.arc(c,c,c-2,0,7);g.fill();
  g.fillStyle='#1d1f22';for(let k=0;k<5;k++){const a=k/5*Math.PI*2;g.beginPath();g.moveTo(c+Math.cos(a+0.33)*20,c+Math.sin(a+0.33)*20);g.lineTo(c+Math.cos(a+0.2)*58,c+Math.sin(a+0.2)*58);g.lineTo(c+Math.cos(a+1.05)*58,c+Math.sin(a+1.05)*58);g.lineTo(c+Math.cos(a+0.92)*20,c+Math.sin(a+0.92)*20);g.fill();}
  g.fillStyle='#9a9ea4';g.beginPath();g.arc(c,c,15,0,7);g.fill();g.fillStyle='#3a3c40';for(let k=0;k<5;k++){const a=k/5*6.283;g.beginPath();g.arc(c+Math.cos(a)*9,c+Math.sin(a)*9,2,0,7);g.fill();}
  g.strokeStyle='#e8eaee';g.lineWidth=3;g.beginPath();g.arc(c,c,c-4,0,7);g.stroke();});
const rimMat=new THREE.MeshStandardMaterial({map:rimTex,metalness:0.85,roughness:0.28});
const plateTexs=[];{const L='ABCDEFGHJKLMNPRSTVWXYZ',r=()=>L[(Math.random()*L.length)|0];for(let i=0;i<16;i++)plateTexs.push(canvasTex(256,(g)=>{g.canvas.height=56;g.fillStyle='#f4f4f0';g.fillRect(0,0,256,56);
  g.fillStyle='#1f45b5';g.fillRect(0,0,26,56);g.fillRect(230,0,26,56);g.fillStyle='#fff';g.font='bold 16px sans-serif';g.textAlign='center';g.fillText('I',13,48);
  g.fillStyle='#111';g.font='bold 38px monospace';g.fillText(r()+r()+' '+(100+Math.random()*899|0)+' '+r()+r(),128,42);g.strokeStyle='#222';g.lineWidth=2;g.strokeRect(1,1,254,54);}));}
const plateMats=plateTexs.map(t=>new THREE.MeshStandardMaterial({map:t,roughness:0.4,metalness:0.1}));
const grilleTex=canvasTex(128,(g,n)=>{g.fillStyle='#121314';g.fillRect(0,0,n,n);g.fillStyle='#2b2d30';for(let y=4;y<n;y+=16)g.fillRect(0,y,n,7);});
const grilleM=new THREE.MeshStandardMaterial({map:grilleTex,roughness:0.5,metalness:0.4});
const seamM=new THREE.MeshBasicMaterial({color:0x0b0b0b});
const blobTex=canvasTex(128,(g,n)=>{const gr=g.createRadialGradient(64,64,10,64,64,64);gr.addColorStop(0,'rgba(0,0,0,0.75)');gr.addColorStop(0.6,'rgba(0,0,0,0.45)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,n,n);});
const blobM=new THREE.MeshBasicMaterial({map:blobTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,toneMapped:false});
const tyreM=mat(0x1a1a1b,{roughness:0.92}),rimM=mat(0x9a9ea3,{metalness:0.6,roughness:0.4}),trimM=mat(0x1b1b1b);
const wheelG=new THREE.CylinderGeometry(0.31,0.31,0.22,14);wheelG.rotateX(Math.PI/2);
function extrude(pts,depth,m){const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false});g.translate(0,0,-depth/2);const me=new THREE.Mesh(g,m);me.castShadow=true;return me;}
function resample(pts,seg){const out=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/seg));
  for(let j=0;j<n;j++)out.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);}return out;}
function extrudeFine(pts,depth,m){const s=new THREE.Shape(),q=resample(pts,0.22);s.moveTo(q[0][0],q[0][1]);for(let i=1;i<q.length;i++)s.lineTo(q[i][0],q[i][1]);
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,steps:8});g.translate(0,0,-depth/2);
  g.userData.orig=g.attributes.position.array.slice();const me=new THREE.Mesh(g,m);me.castShadow=true;return me;}
// ---- sagome arrotondate: profilo laterale con curve e passaruota, spigoli smussati, fiancate rastremate ----
function carShape(T){
  const hl=T.L/2,s=new THREE.Shape(),wx=hl-(T.van?0.85:0.75),ar=0.4,by=0.27;
  if(T.van){
    s.moveTo(-hl,by+0.08);s.lineTo(-hl,T.H-0.14);s.quadraticCurveTo(-hl,T.H,-hl+0.14,T.H);
    s.lineTo(1.12,T.H);s.quadraticCurveTo(1.27,T.H,1.32,2.1);s.lineTo(1.95,1.12);s.quadraticCurveTo(hl,1.06,hl,0.82);
  } else {
    const ws=T.gh[3][0];
    s.moveTo(-hl,by+0.08);s.lineTo(-hl,T.hb-0.2);s.quadraticCurveTo(-hl+0.02,T.hb,-hl+0.24,T.hb);
    s.lineTo(ws,T.hb);s.quadraticCurveTo((ws+hl)/2,T.hb-0.01,hl-0.25,T.hb-0.13);s.quadraticCurveTo(hl,T.hb-0.16,hl,T.hb-0.34);
  }
  s.lineTo(hl,by+0.12);s.quadraticCurveTo(hl,by,hl-0.12,by);
  s.lineTo(wx+ar,by);s.absarc(wx,by,ar,0,Math.PI,false);
  s.lineTo(-wx+ar,by);s.absarc(-wx,by,ar,0,Math.PI,false);
  s.lineTo(-hl+0.1,by);s.quadraticCurveTo(-hl,by,-hl,by+0.08);
  return s;
}
function greenhouseShape(gh){
  const L=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],[b0,t0,t1,b1]=gh,s=new THREE.Shape();
  s.moveTo(...b0);s.lineTo(...L(b0,t0,0.82));s.quadraticCurveTo(t0[0],t0[1],...L(t0,t1,0.1));
  s.lineTo(...L(t0,t1,0.86));s.quadraticCurveTo(t1[0],t1[1],...L(t1,b1,0.22));s.lineTo(...b1);s.lineTo(...b0);return s;
}
function shapeToFine(shape,seg){const pts=shape.getPoints(8).map(v=>[v.x,v.y]);if(Math.hypot(pts[0][0]-pts[pts.length-1][0],pts[0][1]-pts[pts.length-1][1])<1e-3)pts.pop();
  const q=resample(pts,seg),s=new THREE.Shape();s.moveTo(q[0][0],q[0][1]);for(let i=1;i<q.length;i++)s.lineTo(q[i][0],q[i][1]);return s;}
function taper(geo,f){const p=geo.attributes.position;for(let i=0;i<p.count;i++){p.setZ(i,p.getZ(i)*f(p.getY(i)));}p.needsUpdate=true;}
const cl01=v=>Math.max(0,Math.min(1,v));
const rimG=new THREE.CylinderGeometry(0.2,0.2,0.02,16);rimG.rotateX(Math.PI/2);
const hubM=mat(0x55595e,{metalness:0.5,roughness:0.5});
// autobus urbano: cassa lunga, fascia vetrata continua, porte a destra, due assi
function makeBus(){const g=new THREE.Group();g.rotation.order='YZX';const T=TYPES.bus,hl=T.L/2,W=T.W;
  const col=[0xe07b1a,0x2f6fb0,0x3f8f4a,0xd8d8d2][(Math.random()*4)|0],paint=new THREE.MeshStandardMaterial({color:col,roughness:0.32,metalness:0.25});
  const lowM=new THREE.MeshStandardMaterial({color:0xe9e9e4,roughness:0.4,metalness:0.2});
  const body=new THREE.Mesh(rbox(T.L,2.75,W,0.18),paint);body.position.set(0,0.3+1.375,0);body.castShadow=true;g.add(body);
  const skirt=new THREE.Mesh(rbox(T.L+0.02,0.55,W+0.02,0.08),lowM);skirt.position.set(0,0.62,0);g.add(skirt);
  const band=new THREE.Mesh(new THREE.BoxGeometry(T.L-1.3,1.05,W+0.03),glassM);band.position.set(-0.45,2.15,0);g.add(band);
  const ws=new THREE.Mesh(new THREE.BoxGeometry(0.04,1.75,W-0.18),glassM);ws.position.set(hl+0.01,1.85,0);g.add(ws);
  const rw=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.9,W-0.4),glassM);rw.position.set(-hl-0.01,2.2,0);g.add(rw);
  const dsp=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.28,1.5),new THREE.MeshStandardMaterial({color:0x111,emissive:0xffa21a,emissiveIntensity:0.9}));dsp.position.set(hl+0.02,2.88,0);g.add(dsp);
  const doorM=new THREE.MeshStandardMaterial({color:0x1a1d20,roughness:0.15,metalness:0.6});
  [hl-1.3,0.2].forEach(x=>{const d=new THREE.Mesh(new THREE.BoxGeometry(1.2,2.4,0.04),doorM);d.position.set(x,1.55,W/2+0.02);g.add(d);});
  const roof=new THREE.Mesh(rbox(3.2,0.3,1.6,0.08),lowM);roof.position.set(-1.5,3.2,0);g.add(roof);
  g.userData.wheels=[];[hl-2.5,-hl+2.9].forEach(x=>[1,-1].forEach(sd=>{const w=new THREE.Mesh(wheelG,tyreM);w.scale.set(1.55,1.55,1.15);w.position.set(x,0.48,sd*(W/2-0.22));const r=new THREE.Mesh(rimG,rimMat);r.position.z=sd*0.1;w.add(r);g.add(w);g.userData.wheels.push(w);}));
  const hM=new THREE.MeshStandardMaterial({color:0xf2f2ea,emissive:0xfff4d8,emissiveIntensity:0.15}),tM=new THREE.MeshStandardMaterial({color:0x6a0808,emissive:0xff0000,emissiveIntensity:0.15,toneMapped:false});
  const indL=new THREE.MeshStandardMaterial({color:0x6b3a00,emissive:0xff8a00,emissiveIntensity:0}),indR=indL.clone();
  [1,-1].forEach(sd=>{const h=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.16,0.4),hM);h.position.set(hl+0.03,0.85,sd*(W/2-0.35));g.add(h);
    const t=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.4,0.22),tM);t.position.set(-hl-0.03,1.0,sd*(W/2-0.2));g.add(t);
    const im=sd>0?indR:indL;[[hl+0.03,0.85,0.66],[-hl-0.03,1.5,0.2]].forEach(([x,y,o])=>{const b=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.12,0.16),im);b.position.set(x,y,sd*(W/2-o));g.add(b);});});
  const blob=new THREE.Mesh(new THREE.PlaneGeometry(T.L+0.8,W+0.7),blobM);blob.rotation.x=-Math.PI/2;blob.position.y=0.035;g.add(blob);
  g.userData.tailM=tM;g.userData.headM=hM;g.userData.indL=indL;g.userData.indR=indR;g.userData.body=body;g.userData.paint=paint;return g;}
function makeTruck(color){const g=new THREE.Group();g.rotation.order='YZX';const T=TYPES.camion,hl=T.L/2;
  const cabM=new THREE.MeshStandardMaterial({color,roughness:0.35,metalness:0.3});
  const cab=new THREE.Mesh(rbox(2.2,2.5,T.W,0.15),cabM);cab.position.set(hl-1.1,1.25+0.55,0);cab.castShadow=true;g.add(cab);
  const ws=new THREE.Mesh(new THREE.PlaneGeometry(T.W-0.3,1.0),glassM);ws.position.set(hl+0.005,2.35,0);ws.rotation.y=Math.PI/2;g.add(ws);
  const boxM=new THREE.MeshStandardMaterial({color:[0xeeeeee,0xd8d8d0,0x2c4a7a,0x8a1f1f][(Math.random()*4)|0],roughness:0.6});
  const box=new THREE.Mesh(rbox(6.9,2.9,T.W,0.06),boxM);box.position.set(-hl+3.45,2.05,0);box.castShadow=true;g.add(box);
  const ch=new THREE.Mesh(new THREE.BoxGeometry(T.L-0.4,0.3,T.W-0.6),trimM);ch.position.set(0,0.62,0);g.add(ch);
  g.userData.wheels=[];[[hl-1.3],[-hl+2.2],[-hl+1.0]].forEach(([x])=>[1,-1].forEach(sd=>{const w=new THREE.Mesh(wheelG,tyreM);w.scale.set(1.6,1.6,1.2);w.position.set(x,0.5,sd*(T.W/2-0.2));const r=new THREE.Mesh(rimG,rimMat);r.position.z=sd*0.1;w.add(r);g.add(w);g.userData.wheels.push(w);}));
  const hM=new THREE.MeshStandardMaterial({color:0xf2f2ea,emissive:0xfff4d8,emissiveIntensity:0.15}),tM=new THREE.MeshStandardMaterial({color:0x6a0808,emissive:0xff0000,emissiveIntensity:0.15,toneMapped:false});
  [1,-1].forEach(sd=>{const h=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.18,0.35),hM);h.position.set(hl+0.02,0.95,sd*(T.W/2-0.35));g.add(h);
    const t=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.2,0.3),tM);t.position.set(-hl-0.02,0.9,sd*(T.W/2-0.3));g.add(t);});
  const blob=new THREE.Mesh(new THREE.PlaneGeometry(T.L+0.8,T.W+0.7),blobM);blob.rotation.x=-Math.PI/2;blob.position.y=0.035;g.add(blob);
  const indL=new THREE.MeshStandardMaterial({color:0x6b3a00,emissive:0xff8a00,emissiveIntensity:0}),indR=indL.clone();
  g.userData.tailM=tM;g.userData.headM=hM;g.userData.indL=indL;g.userData.indR=indR;g.userData.body=cab;g.userData.paint=cabM;return g;}
function rrect(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;r=Math.min(r,w/2,h/2);s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function rbox(w,h,d,r){const b=Math.min(r,d/2-0.001,w/2-0.001,h/2-0.001);const g=new THREE.ExtrudeGeometry(rrect(w-2*b,h-2*b,b),{depth:Math.max(0.001,d-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:6});g.translate(0,0,-(d-2*b)/2);return g;}
function rrGlass(w,h,r,u0,u1,v0,v1){const g=new THREE.ShapeGeometry(rrect(w,h,r),6),p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const u=(p.getX(i)+w/2)/w,v=(p.getY(i)+h/2)/h;uv.setXY(i,u1-(u1-u0)*u,v0+(v1-v0)*v);}return g;}
// ================= VEICOLI DA SKETCHFAB =================
// forma: ogni veicolo diventa un gruppo "piatto": pezzi uniti per materiale, ruote su perni sterzanti, luci separate
const GLB_CARS={};   // i vecchi modelli con i marchi veri non si usano più
// flotta: modelli già in metri e col muso verso +x; dove il modello non ha un volante separato se ne indica la posizione
// tutti i veicoli sono di Daniel Zhabotinsky (sketchfab.com/DanielZhabotinsky), licenza CC-BY 4.0, ridotti e ricompressi per Guido.
// src: scena del file; livery: si tiene la livrea del modello (taxi, polizia...); plain: livrea tolta, si vernicia a piacere
const GLB_FLEET={utilitaria:{src:'lasley'},volvo:{src:'carter'},wagoneer:{src:'fhsw',plain:true},hellcat:{src:'phoenix'},daily:{src:'lct95'},zil:{src:'lct07'},taxi:{src:'canyon',livery:true},
  illinois:{src:'illinois',livery:true},miner:{src:'miner'},shvan:{src:'shvan'},shvant:{src:'shvant'},amb:{src:'amb',livery:true},cop:{src:'cop',livery:true},fire:{src:'fhsw',livery:true}};
// colore di ciascuna auto guidabile (quello tipico del modello)
const CARCOL={utilitaria:0x2f7356,volvo:0x8c9299,wagoneer:0xd8ccaa,hellcat:0x141414,daily:0x3d6690,zil:0xf0f0ec,taxi:0xffffff},PCOL=k=>CARCOL[k]??0x8a1f1f;
const CAR_LABEL={utilitaria:"Lasley '67",volvo:"Carter '98",wagoneer:"Fairheaven SW '80",hellcat:"Phoenix 455 '71",daily:"LCT 3000 '95",zil:"LCT 3000 '07",taxi:"Canyon '75 taxi",illinois:"Illinois '90 taxi",miner:"Miner W4 '70",shvan:"Shvan '92",shvant:"Shvan '92 Traveller",amb:'Ambulanza',cop:'Polizia',fire:'Vigili del fuoco'};
const CARX={};
function prepCarLevel(sc,k,cfg,flatTo){
  const root=new THREE.Group(),inner=new THREE.Group();inner.add(sc);root.add(inner);
  inner.scale.setScalar(cfg.s);if(cfg.flip)inner.rotation.y=Math.PI;inner.position.set(cfg.ox,cfg.oy,cfg.oz);root.updateMatrixWorld(true);
  // ruote: il nodo più alto che si chiama "wheel"
  const wheels=[];sc.traverse(o=>{if(/wheel/i.test(o.name)&&!/steer/i.test(o.name)){let p=o.parent,inW=false;while(p){if(wheels.includes(p))inW=true;p=p.parent;}if(!inW)wheels.push(o);}});
  const groups=new Map(),out=new THREE.Group(),info={wheels:[],wsX:null,rearX:null,glass:new THREE.Box3(),paintMeshes:[]};
  const role=o=>{const n=o.name,mn=(o.material&&o.material.name)||'';
    if(cfg.plain&&/lightbar|bullbar/i.test(n))return'skip';if(/lightbar/i.test(n))return'beacon';if(/taxi_beacon/i.test(n))return'taxib';    if(/brakelight/i.test(n))return'tail';if(/headlight/i.test(n)&&!/headlights?_?glass/i.test(n))return'head';if(/reverse/i.test(n))return'rev';if(/blinker/i.test(n))return'blink';
    if(k==='utilitaria'&&mn==='LIGHTS1')return'plights';if(/bodymat/i.test(mn)||/_body$/i.test(mn)||(k==='furgone'&&mn==='body')||(k==='utilitaria'&&mn==='Top_chassis1'))return'paint';if(k==='furgone'&&/362/.test(mn))return'decal';if(/transperent|glass/i.test(mn))return'glass';if(/rollcage/i.test(n))return'cage';return'other';};
  const add=(key,mat,r,b)=>{if(!groups.has(key))groups.set(key,{mat,r,list:[]});groups.get(key).list.push(b);};
  const wheelOf=o=>{let p=o;while(p){const i=wheels.indexOf(p);if(i>=0)return i;p=p.parent;}return -1;};
  const wParts=wheels.map(()=>[]);
  sc.traverse(o=>{if(!o.isMesh)return;const r=role(o),b=gBake(o,o.matrixWorld);if(/steering_?wheel/i.test(o.name)){info.steer=gBox([b]);(info.sw=info.sw||[]).push({mat:o.material,b});return;}const wi=wheelOf(o);
    if(wi>=0){wParts[wi].push({mat:o.material,b});return;}
    if(r==='glass'){const bb=gBox([b]);info.glass.union(bb);if(/windshield/i.test(o.name))info.wsX=bb.max.x;if(/rear_window|glass_rear|sw80_glass_rear/i.test(o.name))info.rearX=bb.min.x;}
    if(r==='skip')return;
    if(r==='beacon'){// lampeggianti: metà sinistra e metà destra si alternano
      const L={pos:b.pos,nor:b.nor,uv:b.uv,n:b.n,hasN:b.hasN,idx:[]},R={pos:b.pos,nor:b.nor,uv:b.uv,n:b.n,hasN:b.hasN,idx:[]};
      for(let t=0;t<b.idx.length;t+=3){const z=(b.pos[b.idx[t]*3+2]+b.pos[b.idx[t+1]*3+2]+b.pos[b.idx[t+2]*3+2])/3;(z<0?L:R).idx.push(b.idx[t],b.idx[t+1],b.idx[t+2]);}
      if(L.idx.length)add('cL'+o.material.uuid,o.material,'beaconL',L);if(R.idx.length)add('cR'+o.material.uuid,o.material,'beaconR',R);return;}
    if(r==='blink'){// frecce: divise in sinistra (z<0) e destra (z>0) triangolo per triangolo
      const L={pos:b.pos,nor:b.nor,uv:b.uv,n:b.n,hasN:b.hasN,idx:[]},R={pos:b.pos,nor:b.nor,uv:b.uv,n:b.n,hasN:b.hasN,idx:[]};
      for(let t=0;t<b.idx.length;t+=3){const z=(b.pos[b.idx[t]*3+2]+b.pos[b.idx[t+1]*3+2]+b.pos[b.idx[t+2]*3+2])/3;(z<0?L:R).idx.push(b.idx[t],b.idx[t+1],b.idx[t+2]);}
      if(L.idx.length)add('bL'+o.material.uuid,o.material,'blinkL',L);if(R.idx.length)add('bR'+o.material.uuid,o.material,'blinkR',R);return;}
    if(/steering_?wheel/i.test(o.name)){info.steer=gBox([b]);return;}   // volante del modello: sostituito da quello che gira
    if(r==='plights'){// luci della Panda in un solo pezzo: davanti = fari, dietro = fanali
      const F={pos:b.pos,nor:b.nor,uv:b.uv,n:b.n,hasN:b.hasN,idx:[]},Rr={pos:b.pos,nor:b.nor,uv:b.uv,n:b.n,hasN:b.hasN,idx:[]};
      for(let t=0;t<b.idx.length;t+=3){const x=(b.pos[b.idx[t]*3]+b.pos[b.idx[t+1]*3]+b.pos[b.idx[t+2]*3])/3;(x>0?F:Rr).idx.push(b.idx[t],b.idx[t+1],b.idx[t+2]);}
      add('pH'+o.material.uuid,o.material,'head',F);add('pT'+o.material.uuid,o.material,'tail',Rr);return;}
    if(k==='utilitaria'&&/inside/i.test(o.name)){// si toglie il volante del modello: lo sostituisce quello che gira
      const keep=[];for(let t=0;t<b.idx.length;t+=3){let cx=0,cy=0,cz=0;for(let q=0;q<3;q++){const i=b.idx[t+q];cx+=b.pos[i*3];cy+=b.pos[i*3+1];cz+=b.pos[i*3+2];}cx/=3;cy/=3;cz/=3;
        let e=0;for(let q=0;q<3;q++){const i=b.idx[t+q]*3,j=b.idx[t+(q+1)%3]*3;e=Math.max(e,Math.hypot(b.pos[i]-b.pos[j],b.pos[i+1]-b.pos[j+1],b.pos[i+2]-b.pos[j+2]));}
        if(!(e<0.07&&cx>0.34&&cx<0.56&&cy>0.69&&cy<1.12&&cz>-0.59&&cz<-0.17))keep.push(b.idx[t],b.idx[t+1],b.idx[t+2]);}b.idx=Uint32Array.from(keep);}
    if(r==='paint')info.paintMeshes.push(b);
    add(r+o.material.uuid,o.material,r,b);});
  groups.forEach(G=>{G.list.forEach(b=>{if(Array.isArray(b.idx))b.idx=Uint32Array.from(b.idx);});const m=new THREE.Mesh(gMerge(G.list),gFixMat(G.mat));m.userData.role=G.r;m.userData.mname=G.mat.name;out.add(m);});
  // ruote: perno al centro, anteriori prima (x>0), poi sinistra prima
  const W=wheels.map((w,i)=>{const bb=gBox(wParts[i].map(p=>p.b)),c=bb.getCenter(new THREE.Vector3());return{i,c,r:(bb.max.y-bb.min.y)/2};}).sort((a,b)=>(b.c.x>0)-(a.c.x>0)||a.c.z-b.c.z);
  W.forEach((w,j)=>{const piv=new THREE.Group();piv.name='WPIV'+j;piv.position.copy(w.c);const spn=new THREE.Group();spn.name='WSPIN';piv.add(spn);const bym=new Map();
    wParts[w.i].forEach(p=>{gShift([p.b],-w.c.x,-w.c.y,-w.c.z);if(!bym.has(p.mat))bym.set(p.mat,[]);bym.get(p.mat).push(p.b);});
    bym.forEach((l,mt)=>{const m=new THREE.Mesh(gMerge(l),gFixMat(mt));m.userData.role='wheel';spn.add(m);});out.add(piv);info.wheels.push(w);});
  // volante del modello: perno al centro, asse lungo il piantone (direzione di minore estensione), così gira davvero
  if(info.sw&&info.sw.length){const bb=gBox(info.sw.map(p=>p.b)),c=bb.getCenter(new THREE.Vector3());let C=[[0,0,0],[0,0,0],[0,0,0]],n=0;
    info.sw.forEach(p=>{for(let i=0;i<p.b.n;i++){const v=[p.b.pos[i*3]-c.x,p.b.pos[i*3+1]-c.y,p.b.pos[i*3+2]-c.z];for(let a=0;a<3;a++)for(let q=0;q<3;q++)C[a][q]+=v[a]*v[q];n++;}});
    // asse: vettore che minimizza la varianza (iterazione inversa semplice)
    let ax=new THREE.Vector3(1,-0.4,0).normalize();const M=new THREE.Matrix3().set(C[0][0],C[0][1],C[0][2],C[1][0],C[1][1],C[1][2],C[2][0],C[2][1],C[2][2]),Mi=M.clone().invert();for(let it=0;it<20;it++)ax.applyMatrix3(Mi).normalize();if(ax.x<0)ax.negate();
    const piv=new THREE.Group();piv.name='STEERW';piv.position.copy(c);piv.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),ax);const spn=new THREE.Group();spn.name='STEERW_SPIN';piv.add(spn);
    const qi=piv.quaternion.clone().invert(),v=new THREE.Vector3(),byM=new Map();
    info.sw.forEach(p=>{for(let i=0;i<p.b.n;i++){v.set(p.b.pos[i*3]-c.x,p.b.pos[i*3+1]-c.y,p.b.pos[i*3+2]-c.z).applyQuaternion(qi);p.b.pos[i*3]=v.x;p.b.pos[i*3+1]=v.y;p.b.pos[i*3+2]=v.z;if(p.b.nor){v.set(p.b.nor[i*3],p.b.nor[i*3+1],p.b.nor[i*3+2]).applyQuaternion(qi);p.b.nor[i*3]=v.x;p.b.nor[i*3+1]=v.y;p.b.nor[i*3+2]=v.z;}}
      if(!byM.has(p.mat))byM.set(p.mat,[]);byM.get(p.mat).push(p.b);});
    byM.forEach((l,mt)=>{const m=new THREE.Mesh(gMerge(l),gFixMat(mt));m.userData.role='other';spn.add(m);});out.add(piv);info.swC=c;info.swAx=ax;}
  return{obj:out,info};}
[[MODELS.cars,GLB_CARS],[MODELS.fleet,GLB_FLEET]].forEach(([G,SET])=>{if(!G)return;
  Object.keys(SET).forEach(k=>{const C=SET[k],nm=C.src||k,sF0=G.scenes.find(s=>s.name==='car_'+nm),sL0=G.scenes.find(s=>s.name==='lod_'+nm);if(!sF0)return;const sF=sF0.clone(true),sL=sL0&&sL0.clone(true);
    try{
    // scala, verso e centratura calcolati sul modello completo
    const tmp=new THREE.Group(),inn=new THREE.Group();inn.add(sF);tmp.add(inn);if(C.flip)inn.rotation.y=Math.PI;tmp.updateMatrixWorld(true);
    let bb=new THREE.Box3().setFromObject(tmp);const s=C.len?C.len/(bb.max.x-bb.min.x):1;inn.scale.setScalar(s);tmp.updateMatrixWorld(true);bb=new THREE.Box3().setFromObject(tmp);
    const cfg={plain:!!C.plain,s,flip:!!C.flip,ox:-(bb.min.x+bb.max.x)/2,oy:-bb.min.y,oz:-(bb.min.z+bb.max.z)/2};inn.remove(sF);
    const F=prepCarLevel(sF,k,cfg),Lo=sL?prepCarLevel(sL,k,cfg):null;
    const T=TYPES[k],sz=bb.getSize(new THREE.Vector3()),I=F.info;
    if(C.steer&&!I.steer){const[a,b,c,r]=C.steer;I.steer=new THREE.Box3(new THREE.Vector3(a-0.06,b-r,c-r),new THREE.Vector3(a+0.06,b+r,c+r));}
    T.L=+sz.x.toFixed(2);T.W=+sz.z.toFixed(2);T.Hm=sz.y;T.glb=true;T.wr=I.wheels.length?I.wheels[0].r:0.31;
    T.wsX=C.ws??(I.wsX!=null?I.wsX:(I.glass.isEmpty()?T.L*0.2:I.glass.max.x));T.rearX=C.rear??(I.rearX!=null?I.rearX:(I.glass.isEmpty()?-T.L*0.4:I.glass.min.x));
    // tetto: punto più alto della carrozzeria sopra l'abitacolo
    const gx=I.glass.isEmpty()?0:(I.glass.min.x+I.glass.max.x)/2;let ry=0;I.paintMeshes.forEach(b=>{for(let i=0;i<b.n;i++){const x=b.pos[i*3];if(Math.abs(x-gx)<0.6&&b.pos[i*3+1]>ry)ry=b.pos[i*3+1];}});
    {let hy=0;I.paintMeshes.forEach(b=>{for(let i=0;i<b.n;i++){const x=b.pos[i*3];if(x>T.wsX+0.03&&x<T.wsX+0.45&&Math.abs(b.pos[i*3+2])<sz.z/2-0.25&&b.pos[i*3+1]>hy)hy=b.pos[i*3+1];}});T.hoodY=hy||null;}
    T.roofX=gx;T.roofY=ry||sz.y;T.beltY=I.glass.isEmpty()?sz.y*0.55:I.glass.min.y-0.12;
    // abitacolo del modello, misurato dal suo volante
    // abitacolo disegnato dal gioco (plancia, volante, strumenti), messo dove il modello ha il volante; dell'auto vera restano cofano e coda
    const Wb=I.glass.isEmpty()?T.W-0.2:Math.min(T.W-0.1,(I.glass.max.z-I.glass.min.z)+0.1);
    if(I.steer){const c=I.steer.getCenter(new THREE.Vector3()),z=I.steer.getSize(new THREE.Vector3()),R=Math.min(T.big?0.24:0.2,Math.max(0.17,Math.max(z.y,z.z)/2*0.95)),wt=Math.min(1.0,Math.max(0.3,Math.atan2(z.x,z.y)));
      const roof=T.roofY||sz.y,eyeX=c.x-0.55,eyeY=Math.min(c.y+0.36,roof-0.12);
      T.ck={model:false,W:Wb,wsx:T.wsX,dashTop:c.y+0.12,eyeX,eyeY,drvZ:c.z,wx:c.x-0.02,wy:c.y-0.04,R,wt,rm:[T.wsX-0.28,Math.min(roof-0.12,eyeY+0.17)],sm:[c.x+0.02,c.y+0.16,Wb/2+0.12]};}
    if(I.swC){const c=I.swC,z=I.steer.getSize(new THREE.Vector3()),R=Math.max(z.y,z.z)/2,roof=T.roofY||sz.y,eyeY=Math.min(c.y+(T.van?0.44:0.4),roof-0.08),eyeX=c.x-(T.van?0.44:0.48);
      // piano della plancia al centro: si cerca con un raggio dall'alto sul modello vero, per appoggiarci lo schermo dell'infotainment
      let dashY=c.y+0.14,dashX=c.x+0.25;{const RC=new THREE.Raycaster(),ms=[];F.obj.updateMatrixWorld(true);F.obj.traverse(o=>{if(o.isMesh&&o.userData.role!=='glass'&&o.userData.role!=='wheel')ms.push(o);});
        for(const dx of [0.18,0.26,0.34]){RC.set(new THREE.Vector3(c.x+dx,roof-0.05,0.02),new THREE.Vector3(0,-1,0));RC.far=roof-c.y+0.3;const h=RC.intersectObjects(ms,false).find(h=>h.point.y<c.y+0.45&&h.point.y>c.y-0.1);if(h){dashY=h.point.y;dashX=c.x+dx;break;}}}
      T.ck={model:true,ownWheel:true,wsx:T.wsX,dashTop:dashY,eyeX,eyeY,drvZ:c.z,wx:c.x,wy:c.y,R,wt:Math.atan2(-I.swAx.y,I.swAx.x),cx:c.x+0.1,scr:[dashX-0.02,dashY+0.075,0.04],rm:[T.wsX-0.22,Math.min(roof-0.1,eyeY+0.18)],rmz:0,sm:[c.x+0.05,c.y+0.12,Wb/2+0.1]};}
    const hasLights=F.obj.children.some(m=>m.userData.role==='tail');
    T.livery=!!C.livery;T.plain=!!C.plain;CARX[k]={full:F.obj,lod:Lo&&Lo.obj,hasLights,wheels:F.info.wheels};
    }catch(e){console.warn('veicolo '+k+' non preparato',e);}
  });});
// istanza: materiali propri (vernice e luci), livello di dettaglio per il traffico
function makeCarGLB(k,color,shadow,fine,opt={}){
  const X=CARX[k],T=TYPES[k],g=new THREE.Group();g.rotation.order='YZX';
  const paintCache=new Map(),litC={},allMats=[];
  const lit=(src,kind)=>{const key=kind+src.uuid;if(litC[key])return litC[key];const m=src.clone();m.emissive=new THREE.Color({tail:0xff1a0a,head:0xfff2d6,rev:0xffffff,blinkL:0xff8a00,blinkR:0xff8a00,beaconL:0x2050ff,beaconR:0x2050ff,taxib:0xffd060}[kind]).multiplyScalar(kind==='tail'?0.75:2);if(kind==='tail')m.toneMapped=false;
    // il colore del vetro segue la funzione, qualunque fosse nel modello: stop rossi, fari e retromarcia bianchi, frecce gialle
    m.color=new THREE.Color({tail:0xb01008,head:0xf4f4ee,rev:0xf4f4f4,blinkL:0xff9a10,blinkR:0xff9a10,beaconL:0x1a3cc8,beaconR:0x1a3cc8,taxib:0xf2e0a0}[kind]);if(kind==='tail'||kind==='blinkL'||kind==='blinkR'||kind==='beaconL'||kind==='beaconR'){m.map=null;}if(kind==='beaconL'||kind==='beaconR'||kind==='taxib'){m.toneMapped=false;m.transparent=false;m.opacity=1;}
    m.emissiveMap=null;m.emissiveIntensity=0;litC[key]=m;allMats.push(m);return m;};
  const anyC=new Map();const own=src=>{if(!fine)return src;if(!anyC.has(src)){const m=src.clone();anyC.set(src,m);allMats.push(m);}return anyC.get(src);};
  const paintOf=src=>{if(!paintCache.has(src)){let m=src.clone();if(fine&&!QG.lo&&m.isMeshStandardMaterial&&!m.isMeshPhysicalMaterial){const p=new THREE.MeshPhysicalMaterial();THREE.MeshStandardMaterial.prototype.copy.call(p,m);p.clearcoat=1;p.clearcoatRoughness=0.05;p.envMapIntensity=Math.max(1.3,m.envMapIntensity||1);m=p;}if(T.livery){paintCache.set(src,m);allMats.push(m);return m;}m.color=new THREE.Color(color).convertSRGBToLinear();if(opt.plain||T.plain){m.map=null;}if(!m.metalnessMap){m.metalness=0.35;m.roughness=0.24;}m.envMapIntensity=1.25;paintCache.set(src,m);allMats.push(m);}return paintCache.get(src);};
  const dress=obj=>{obj.traverse(o=>{if(!o.isMesh)return;const r=o.userData.role;
    if(r==='paint'){o.material=paintOf(o.material);o.castShadow=shadow;}
    else if(r==='tail'||r==='head'||r==='rev'||r==='blinkL'||r==='blinkR'||r==='beaconL'||r==='beaconR'||r==='taxib')o.material=lit(o.material,r);
    else o.material=own(o.material);
    if(r==='decal'&&opt.plain)o.visible=false;
    if(fine&&r==='glass'){o.material.userData.glass=o.material.userData.glass||{op:o.material.opacity,tr:o.material.transparent};}
    if(fine&&r==='cage')(g.userData.cage=g.userData.cage||[]).push(o);
    if(r==='wheel'||r==='other')o.castShadow=shadow&&fine;});};
  const full=X.full.clone(true);dress(full);const core=new THREE.Group();g.add(core);core.add(full);
  const ud=g.userData;ud.glb=true;ud.body=full;ud.allMats=allMats;ud.wheels=[0,1,2,3,4,5,6,7].map(j=>full.getObjectByName('WPIV'+j)).filter(Boolean);ud.steerW=full.getObjectByName('STEERW_SPIN');
  ud.paint=paintCache.size?[...paintCache.values()][0]:new THREE.MeshStandardMaterial({color});
  const find=r=>{let f=null;g.traverse(o=>{if(!f&&o.isMesh&&o.userData.role===r)f=o.material;});return f;};
  // luci di stop: sempre rosse, con un materiale tutto loro (in alcuni modelli il materiale era condiviso o bianco)
  {let tm=null;const L=[];g.updateMatrixWorld(true);const tn=new Set();g.traverse(o=>{if(o.isMesh&&o.userData.role==='tail'){L.push(o);tn.add(o.userData.mname);}});g.traverse(o=>{if(o.isMesh&&o.userData.role==='other'&&tn.has(o.userData.mname))L.push(o);});
    const gi=new THREE.Matrix4().copy(g.matrixWorld).invert(),M=new THREE.Matrix4(),v=new THREE.Vector3();
    L.forEach(o=>{if(!tm){tm=o.material.clone();tm.color.setHex(0x8a0c06);tm.emissive=new THREE.Color(0xff0000).multiplyScalar(0.75);tm.toneMapped=false;tm.transparent=false;tm.opacity=1;tm.depthWrite=true;tm.emissiveMap=null;tm.map=null;tm.emissiveIntensity=0.15;tm.needsUpdate=true;}
      // se il pezzo "luci di stop" comprende anche i fanali anteriori (Panda), si tengono rossi solo i triangoli dietro
      const thr=o.userData.role==='tail'?0:-(T.L/2-0.45),geo=o.geometry,P=geo.attributes.position;M.multiplyMatrices(gi,o.matrixWorld);const idx=geo.index?geo.index.array:null,nT=(idx?idx.length:P.count)/3,back=[],front=[];
      for(let t=0;t<nT;t++){let cx=0;for(let k=0;k<3;k++){const i=idx?idx[t*3+k]:t*3+k;v.set(gRd(P,i,0),gRd(P,i,1),gRd(P,i,2)).applyMatrix4(M);cx+=v.x;}(cx/3<thr?back:front).push(t);}
      if(!front.length){o.material=tm;return;}if(!back.length)return;
      const sub=(list)=>{const g2=geo.clone();const ia=new Uint32Array(list.length*3);list.forEach((t,j)=>{for(let k=0;k<3;k++)ia[j*3+k]=idx?idx[t*3+k]:t*3+k;});g2.setIndex(new THREE.BufferAttribute(ia,1));g2.computeBoundingBox();g2.computeBoundingSphere();return g2;};
      const r=new THREE.Mesh(sub(back),tm);r.position.copy(o.position);r.quaternion.copy(o.quaternion);r.scale.copy(o.scale);r.userData.role='tail';o.parent.add(r);o.geometry=sub(front);o.userData.role='head2';});}
  ud.beacL=find('beaconL');ud.beacR=find('beaconR');ud.taxiB=find('taxib');if(ud.taxiB)ud.taxiB.emissiveIntensity=1.2;ud.tailM=find('tail');ud.headM=find('head');ud.revM=find('rev');ud.indL=find('blinkL');ud.indR=find('blinkR');
  // il furgone non ha luci separate: si aggiungono piccole lampade
  const hl=T.L/2,hy=T.Hm*0.42;
  const gAdd=g.add.bind(g),gx=T.fleet?{add:()=>{}}:g;
  // flotta: le luci mancanti si appoggiano alla carrozzeria vera (raggio dal davanti o dal dietro), mai sospese fuori
  const RC=new THREE.Raycaster(),bodyMs=[];if(T.fleet){g.updateMatrixWorld(true);g.traverse(o=>{if(o.isMesh&&o.userData.role!=='wheel'&&o.userData.role!=='glass')bodyMs.push(o);});}
  const flush=(front,y,z,w,h,mat)=>{for(let zz=z;Math.abs(zz)>0.25;zz-=Math.sign(z)*0.05){RC.set(new THREE.Vector3(front?hl+1.5:-hl-1.5,y,zz),new THREE.Vector3(front?-1:1,0,0));RC.far=2.4;const hit=RC.intersectObjects(bodyMs,false)[0];
      if(hit&&Math.abs(hit.point.x)>hl-0.7){const m=new THREE.Mesh(new THREE.BoxGeometry(0.02,h,w),mat);m.position.copy(hit.point);m.position.x+=front?0.012:-0.02;g.add(m);return m;}}return null;};
  if(T.fleet){const dummy=()=>new THREE.MeshStandardMaterial({color:0,emissive:0});ud.headM=ud.headM||dummy();ud.tailM=ud.tailM||dummy();ud.revM=ud.revM||dummy();if(!ud.indL){ud.indL=dummy();ud.indR=dummy();}}
  if(!ud.headM){ud.headM=new THREE.MeshStandardMaterial({color:0xf2f2ea,emissive:0xfff4d8,emissiveIntensity:0.15});[1,-1].forEach(sd=>{const h=new THREE.Mesh(new THREE.CircleGeometry(0.09,12),ud.headM);h.rotation.y=Math.PI/2;h.position.set(hl+0.01,hy,sd*(T.W/2-0.3));gx.add(h);});}
  if(!ud.tailM){ud.tailM=new THREE.MeshStandardMaterial({color:0x6a0808,emissive:0xff0000,emissiveIntensity:0.15,toneMapped:false});[1,-1].forEach(sd=>{const t=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.16,0.1),ud.tailM);t.position.set(-hl-0.01,hy,sd*(T.W/2-0.12));gx.add(t);});}
  if(!ud.revM){ud.revM=new THREE.MeshStandardMaterial({color:0xcfcfcf,emissive:0xffffff,emissiveIntensity:0});[1,-1].forEach(sd=>{const t=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.06,0.08),ud.revM);t.position.set(-hl-0.01,hy-0.14,sd*(T.W/2-0.12));gx.add(t);});}
  if(!ud.indL){ud.indL=new THREE.MeshStandardMaterial({color:0x6b3a00,emissive:0xff8a00,emissiveIntensity:0});ud.indR=ud.indL.clone();
    [[ud.indL,-1],[ud.indR,1]].forEach(([mm,sd])=>{[hl-0.03,-hl+0.03].forEach(x=>{const f=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.05,0.07),mm);f.position.set(x,k==='utilitaria'?(x>0?0.66:0.78):hy+0.16,sd*(T.W/2-(k==='utilitaria'?0.12:0.16)));gx.add(f);});});}
  const blob=new THREE.Mesh(new THREE.PlaneGeometry(T.L+0.7,T.W+0.6),blobM);blob.rotation.x=-Math.PI/2;blob.position.y=0.035;g.add(blob);
  [...g.children].forEach(c=>{if(c!==core)core.add(c);});
  if(!fine&&X.lod)CARLOD.list.push({g,core,k,col:T.livery?new THREE.Color(1,1,1):new THREE.Color(color).convertSRGBToLinear(),stat:!shadow});
  return g;}
// auto disegnate in gruppo (poche chiamate grafiche):
//  'mid' = modello completo, per le auto ferme vicine e per il traffico a media distanza; 'lod' = modello semplificato da lontano.
//  Restano auto singole solo quelle molto vicine (e il traffico entro qualche decina di metri, che ha stop e frecce).
const CARLOD={list:[],inst:null,tiers:{}},CARLOD_TYRE=new THREE.MeshStandardMaterial({color:0x1c1c1e,roughness:0.9});
function carTierParts(k,which){const X=CARX[k],T=TYPES[k],o=which==='mid'?X.full:X.lod;if(!o)return null;o.updateMatrixWorld(true);const by=new Map();
  if(which==='lod'){const tg=new THREE.CylinderGeometry(1,1,0.2,10).rotateX(Math.PI/2),tm=new THREE.Mesh(tg),tl=[];X.wheels.forEach(w=>{const M=new THREE.Matrix4().compose(w.c,new THREE.Quaternion(),new THREE.Vector3(w.r,w.r,1));tl.push(gBake(tm,M));});if(tl.length)by.set('tyre',{mat:CARLOD_TYRE,r:'wheel',list:tl});}
  o.traverse(m=>{if(!m.isMesh||!m.visible)return;const r=m.userData.role;if(which==='lod'&&r==='wheel')return;if(r==='cage'||r==='beaconL'||r==='beaconR'||r==='taxib'&&which==='lod')return;const key=m.material.uuid+'|'+r;if(!by.has(key))by.set(key,{mat:m.material,r,list:[]});by.get(key).list.push(gBake(m,m.matrixWorld));});
  {const bg=new THREE.PlaneGeometry(T.L+0.7,T.W+0.6).rotateX(-Math.PI/2).translate(0,0.035,0);by.set('blob',{mat:blobM,r:'blob',list:[gBake(new THREE.Mesh(bg),new THREE.Matrix4())]});}
  return[...by.values()].map(G=>{const mt=G.r==='blob'||G.mat===CARLOD_TYRE?G.mat:G.mat.clone();
    if(G.r==='paint'){mt.color.set(0xffffff);if(T.plain)mt.map=null;if(!mt.metalnessMap){mt.metalness=0.35;mt.roughness=which==='mid'?0.24:0.32;}mt.envMapIntensity=1.25;}
    if(G.r==='tail'||G.r==='head'){mt.color=new THREE.Color(G.r==='tail'?0xb01008:0xf4f4ee);if(G.r==='tail')mt.map=null;mt.emissive=new THREE.Color(G.r==='tail'?0xff1a0a:0xfff2d6);mt.emissiveMap=null;mt.emissiveIntensity=0.1;}
    if(G.r==='blinkL'||G.r==='blinkR'){mt.color=new THREE.Color(0xff9a10);mt.map=null;}
    return{geo:gMerge(G.list),mat:mt,r:G.r};});}
function carTier(k,which,need){const key=k+'|'+which;let t=CARLOD.tiers[key];if(t===undefined){const parts=carTierParts(k,which);t=CARLOD.tiers[key]=parts?{parts,ims:null,cap:0}:null;}if(!t)return null;
  if(need>t.cap){const cap=Math.max(8,Math.ceil(need*1.5));if(t.ims)t.ims.forEach(im=>{scene.remove(im);im.dispose();});
    t.ims=t.parts.map(P=>{const im=new THREE.InstancedMesh(P.geo,P.mat,cap);im.frustumCulled=false;im.receiveShadow=P.r!=='blob';im.castShadow=false;im.userData.role=P.r;
      if(P.r==='paint'){im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(cap*3).fill(1),3);im.instanceColor.setUsage(THREE.DynamicDrawUsage);}im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);im.count=0;if(P.r==='blob')im.renderOrder=-1;scene.add(im);return im;});t.cap=cap;}
  return t;}
function buildCarLOD(){CARLOD.inst=true;}
// fari del traffico di notte: una macchia di luce sull'asfalto davanti a ogni auto in marcia, tutte in un'unica mesh
const CARBEAM=(()=>{const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');g.save();g.scale(1,0.55);const gr=g.createRadialGradient(0,116,4,0,116,250);
  gr.addColorStop(0,'rgba(255,240,210,0.0)');gr.addColorStop(0.08,'rgba(255,240,210,0.85)');gr.addColorStop(0.45,'rgba(255,232,190,0.35)');gr.addColorStop(1,'rgba(255,225,180,0)');g.fillStyle=gr;g.fillRect(0,0,256,240);g.restore();
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;const m=new THREE.MeshBasicMaterial({map:t,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-12,toneMapped:false});
  const geo=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2).translate(0.5,0,0),CAP=160,im=new THREE.InstancedMesh(geo,m,CAP);im.count=0;im.frustumCulled=false;im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);im.renderOrder=3;scene.add(im);
  const L=new THREE.Matrix4(),M=new THREE.Matrix4();
  return{m,im,update(list,night,cx,cz){m.opacity=night;im.visible=night>0.01;if(!im.visible){im.count=0;return;}let n=0;for(let i=0;i<list.length&&n<CAP;i++){const e=list[i],g=e.g;if(e.stat||!g.parent||!g.visible)continue;if((g.position.x-cx)**2+(g.position.z-cz)**2>160*160)continue;
      const T=TYPES[e.k]||{L:4.2};g.updateMatrix();L.makeScale(9,1,4.2).setPosition(T.L/2-0.2,0.07,0);M.multiplyMatrices(g.matrix,L);im.setMatrixAt(n++,M);}
    im.count=n;im.instanceMatrix.needsUpdate=true;}};})();CARLOD.tier=(k,w,n)=>carTier(k,w,n);
function updateCarLOD(){const cx=camera.position.x,cz=camera.position.z,R2=(MOBILE?40:QG.hi?130:90)**2,RS2=(MOBILE?10:14)**2,RT2=(MOBILE?25:45)**2,night=NIGHT||WX!=='clear',L=CARLOD.list;
  // via le auto non più in scena (zone smontate)
  if((CARLOD.prT=(CARLOD.prT||0)+1)>120){CARLOD.prT=0;CARLOD.list=L.filter(e=>e.g.parent);}
  const want={},pick=[];
  for(let i=0;i<L.length;i++){const e=L[i],g=e.g;if(!g.parent||!g.visible){continue;}const ud=g.userData;if(ud.nolod){e.core.visible=true;continue;}
    const d2=(g.position.x-cx)**2+(g.position.z-cz)**2,st=e.stat&&!ud.mov,tier=d2<(st?RS2:RT2)?null:d2<R2?'mid':'lod';
    if(!tier){e.core.visible=true;continue;}const key=e.k+'|'+tier;(want[key]||(want[key]=[])).push(e);}
  const used=new Set();
  for(const key in want){const[k,which]=key.split('|'),E=want[key],t=carTier(k,which,E.length);if(!t){E.forEach(e=>e.core.visible=true);continue;}used.add(t);
    for(let j=0;j<E.length;j++){const e=E[j],g=e.g;e.core.visible=false;g.updateMatrix();for(let q=0;q<t.ims.length;q++){const im=t.ims[q];im.instanceMatrix.array.set(g.matrix.elements,j*16);if(im.instanceColor)im.instanceColor.setXYZ(j,e.col.r,e.col.g,e.col.b);}}
    t.ims.forEach(im=>{im.count=E.length;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;
      if(im.userData.role==='tail')im.material.emissiveIntensity=night?0.9:0.1;else if(im.userData.role==='head')im.material.emissiveIntensity=night?2.4:0.1;});}
  for(const key in CARLOD.tiers){const t=CARLOD.tiers[key];if(t&&t.ims&&!used.has(t))t.ims.forEach(im=>{if(im.count){im.count=0;}});}
  CARBEAM.update(L,NIGHT?0.55:(WX!=='clear'?0.12:0),cx,cz);}

function makeCar(k,color,shadow=true,fine=false,opt={}){
  if(CARX[k])return makeCarGLB(k,color,shadow,fine,opt);
  if(TYPES[k].truck)return makeTruck(color);
  if(TYPES[k].bus){try{if(HDX&&HDX.bus)return HDX.bus();}catch(e){}return makeBus();}
  const T=TYPES[k],g=new THREE.Group(),hl=T.L/2,paint=new THREE.MeshStandardMaterial({color,roughness:0.28,metalness:0.3,envMapIntensity:0.9});
  g.rotation.order='YZX';
  // carrozzeria
  let shp=carShape(T);if(fine)shp=shapeToFine(shp,0.18);
  const bev=0.045,depth=T.W-2*bev;
  const bg=new THREE.ExtrudeGeometry(shp,{depth,bevelEnabled:true,bevelThickness:bev,bevelSize:0.03,bevelSegments:2,curveSegments:fine?4:7,steps:fine?7:1});
  bg.translate(0,0,-depth/2);
  const top=T.van?T.H:T.hb;
  taper(bg,y=>1-0.05*cl01((y-(top-0.22))/0.22)-0.035*cl01((0.45-y)/0.18));  // spalla e fondo rientranti
  if(!T.van){const ws=T.gh[3][0],pa=bg.attributes.position;for(let i=0;i<pa.count;i++){const x=pa.getX(i),y=pa.getY(i),z=pa.getZ(i);
      if(x>ws-0.05&&y>T.hb-0.2){const u=Math.min(1,(x-ws+0.05)/0.25)*Math.min(1,(hl-x)/0.3),cz=1-Math.min(1,(2*z/T.W)**2);pa.setY(i,y+0.045*cz*u*Math.min(1,(y-(T.hb-0.2))/0.2));}}pa.needsUpdate=true;bg.computeVertexNormals();}
  if(fine)bg.userData.orig=bg.attributes.position.array.slice();
  const b=new THREE.Mesh(bg,paint);b.castShadow=shadow;g.add(b);g.userData.body=b;g.userData.paint=paint;
  // abitacolo vetrato con rientranza (tumblehome)
  const gw=T.van?T.W+0.02:T.W-0.16,gb=0.02;
  const gg=new THREE.ExtrudeGeometry(greenhouseShape(T.gh),{depth:gw-2*gb,bevelEnabled:true,bevelThickness:gb,bevelSize:0.015,bevelSegments:1,curveSegments:6});
  gg.translate(0,0,-(gw-2*gb)/2);
  if(!T.van){const y0=T.gh[0][1],y1=T.gh[1][1];taper(gg,y=>1-0.15*cl01((y-y0)/(y1-y0)));}
  const gl=new THREE.Mesh(gg,glassM);g.add(gl);
  if(!T.van){const y1=T.gh[1][1],len=T.gh[2][0]-T.gh[1][0];
    const roof=new THREE.Mesh(new THREE.BoxGeometry(len*0.86,0.05,(T.W-0.16)*0.84),paint);roof.position.set((T.gh[1][0]+T.gh[2][0])/2,y1+0.012,0);g.add(roof);
    [1,-1].forEach(sd=>{const pil=new THREE.Mesh(new THREE.BoxGeometry(0.09,y1-T.hb,0.04),trimM);pil.position.set((T.gh[1][0]+T.gh[2][0])/2-0.15,(y1+T.hb)/2,sd*(T.W-0.16)/2*0.93);g.add(pil);});}
  // paraurti arrotondati (fascia scura bassa)
  const bumpG=new THREE.CylinderGeometry(0.11,0.11,T.W-0.12,10);bumpG.rotateX(Math.PI/2);
  const bf=new THREE.Mesh(bumpG,trimM);bf.position.set(hl-0.02,0.42,0);bf.scale.set(0.8,1,1);g.add(bf);
  const br=new THREE.Mesh(bumpG,trimM);br.position.set(-hl+0.02,0.42,0);br.scale.set(0.8,1,1);g.add(br);
  // ruote con cerchi
  const wx=hl-(T.van?0.85:0.75);g.userData.wheels=[];
  [[wx,1],[wx,-1],[-wx,1],[-wx,-1]].forEach(([x,s])=>{const w=new THREE.Mesh(wheelG,tyreM);w.position.set(x,0.31,s*(T.W/2-0.14));
    const r=new THREE.Mesh(rimG,rimMat);r.position.z=s*0.105;if(s<0)r.rotation.y=Math.PI;w.add(r);const hb=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.03,8).rotateX(Math.PI/2),hubM);hb.position.z=s*0.115;w.add(hb);
    g.add(w);g.userData.wheels.push(w);});
  // luci
  const hM=new THREE.MeshStandardMaterial({color:0xf2f2ea,emissive:0xfff4d8,emissiveIntensity:0.15,roughness:0.2});
  const tM=new THREE.MeshStandardMaterial({color:0x6a0808,emissive:0xff0000,emissiveIntensity:0.15,roughness:0.3});
  const hy=T.van?0.78:T.hb-0.27,ty=T.van?0.95:T.hb-0.24;
  [1,-1].forEach(s=>{
    const h=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.11,0.42),hM);h.position.set(hl-0.01,hy,s*(T.W/2-0.33));g.add(h);(g.userData.heads=g.userData.heads||[]).push(h);
    const t=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.17,0.36),tM);t.position.set(-hl-0.015,ty,s*(T.W/2-0.27));t.rotation.y=s*0.12;g.add(t);(g.userData.tails=g.userData.tails||[]).push(t);
    const mg=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),paint);mg.scale.set(0.095,0.075,0.135);mg.position.set(T.van?1.3:T.gh[3][0]-0.12,T.hb+0.13,s*(T.W/2+0.1));g.add(mg);(g.userData.mir=g.userData.mir||[]).push(mg);
    const st=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.03,0.08),trimM);st.position.set(mg.position.x+0.02,T.hb+0.06,s*(T.W/2+0.02));g.add(st);g.userData.mir.push(st);});
  // indicatori di direzione (arancio): anteriori, posteriori, ripetitori sugli specchi
  const indL=new THREE.MeshStandardMaterial({color:0x6b3a00,emissive:0xff8a00,emissiveIntensity:0}),indR=indL.clone();
  [[indL,-1],[indR,1]].forEach(([mm,sd])=>{
    const f=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.05,0.12),mm);f.position.set(hl-0.02,hy-0.02,sd*(T.W/2-0.1));g.add(f);
    const r=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,0.1),mm);r.position.set(-hl-0.02,ty+0.1,sd*(T.W/2-0.16));g.add(r);
    const rp=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.02,0.04),mm);rp.position.set((T.van?1.3:T.gh[3][0]-0.12)-0.05,T.hb+0.1,sd*(T.W/2+0.2));g.add(rp);(g.userData.mir=g.userData.mir||[]).push(rp);});
  g.userData.indL=indL;g.userData.indR=indR;
  const rvM=new THREE.MeshStandardMaterial({color:0xcfcfcf,emissive:0xffffff,emissiveIntensity:0});
  [1,-1].forEach(s=>{const r=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.08,0.12),rvM);r.position.set(-hl-0.02,ty-0.14,s*(T.W/2-0.5));g.add(r);});
  // linee di chiusura del cofano e griglia sotto il parabrezza
  if(!T.van){const ws=T.gh[3][0],hx0=ws+0.12,hx1=hl-0.28;
    [1,-1].forEach(sd=>{const l=new THREE.Mesh(new THREE.BoxGeometry(hx1-hx0,0.006,0.008),seamM);l.position.set((hx0+hx1)/2,T.hb+0.012,sd*(T.W/2-0.16));l.rotation.z=-0.06;g.add(l);});
    const fl=new THREE.Mesh(new THREE.BoxGeometry(0.008,0.006,T.W-0.34),seamM);fl.position.set(hx1,T.hb-0.1,0);g.add(fl);
    const cowl=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.012,T.W-0.22),new THREE.MeshStandardMaterial({color:0x121314,roughness:0.7}));cowl.position.set(ws+0.06,T.hb+0.01,0);g.add(cowl);}
  // targhe, griglia, linee delle porte e maniglie, ombra di contatto
  const pm=plateMats[(Math.random()*plateMats.length)|0],plG=new THREE.PlaneGeometry(0.52,0.11);
  const pf=new THREE.Mesh(plG,pm);pf.position.set(hl+0.075,0.42,0);pf.rotation.y=Math.PI/2;g.add(pf);
  const pr=new THREE.Mesh(plG,pm);pr.position.set(-hl-0.07,T.van?0.6:T.hb-0.42,0);pr.rotation.y=-Math.PI/2;g.add(pr);
  const gr=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.13,T.W*0.42),grilleM);gr.position.set(hl-0.01,hy-0.06,0);g.add(gr);
  if(!T.van){const xs=[T.gh[3][0]-0.02,(T.gh[1][0]+T.gh[2][0])/2-0.15];if(T.L>4.2)xs.push(T.gh[0][0]+0.3);
    [1,-1].forEach(sd=>{xs.forEach(x=>{const l=new THREE.Mesh(new THREE.BoxGeometry(0.012,T.hb-0.38,0.004),seamM);l.position.set(x,(T.hb+0.36)/2,sd*(T.W/2+0.012));g.add(l);});
      [xs[0]-0.35,xs[1]-0.35].forEach(x=>{const h=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.03,0.025),trimM);h.position.set(x,T.hb-0.12,sd*(T.W/2+0.01));g.add(h);});
      const sill=new THREE.Mesh(new THREE.BoxGeometry(T.L-1.9,0.07,0.03),trimM);sill.position.set(0,0.33,sd*(T.W/2-0.01));g.add(sill);});}
  const blob=new THREE.Mesh(new THREE.PlaneGeometry(T.L+0.7,T.W+0.6),blobM);blob.rotation.x=-Math.PI/2;blob.position.y=0.035;g.add(blob);
  g.userData.tailM=tM;g.userData.headM=hM;g.userData.revM=rvM;return g;
}
// auto del traffico: tutti modelli nuovi; taxi, ambulanze, polizia e pompieri hanno i loro giri
const typeKeys=['utilitaria','volvo','wagoneer','hellcat','miner','shvan','daily'],typeW=[0.22,0.24,0.14,0.08,0.14,0.1,0.08];
// auto della flotta del giocatore anche nel traffico (il camion più di rado)
const FLEET_TRAF=[['illinois',1.2],['shvant',0.5],['zil',0.6],['taxi',0.4]];
function randTrafType(){if(Math.random()<(window.__busP??0.08))return 'bus';if(Math.random()<(window.__fleetP??(MOBILE?0.1:0.15))){const ok=FLEET_TRAF.filter(([k])=>CARX[k]&&TYPES[k]);const tot=ok.reduce((a,[,w])=>a+w,0);let r=Math.random()*tot;for(const[k,w]of ok){if((r-=w)<=0)return k;}}return randType();}
function randType(){let r=Math.random(),a=0;for(let i=0;i<5;i++){a+=typeW[i];if(r<a)return typeKeys[i];}return 'utilitaria';}
const randColor=()=>COLORS[(Math.random()*COLORS.length)|0];

