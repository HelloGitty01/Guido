// Guido · 02 citta — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ================= CITTÀ A GRIGLIA =================
const L = 230, ROAD_HALF = 5.6, LANE_OFF = 1.75, PARK_OFF = 4.4, SIDEWALK = 3, STOP_D = 9.5;
const RL=(()=>{const n=Math.random()<0.5?3:4;if(n===3)return[-Math.round(rr(95,150)),0,Math.round(rr(95,150))];const b=Math.round(rr(80,105));return[-Math.round(rr(95,150)),0,b,Math.min(L-60,b+Math.round(rr(80,100)))];})();
// una rotatoria al posto di un incrocio (mai sulla strada centrale z=0)
const RB=(()=>{const c=[];RL.forEach(x=>RL.forEach(z=>{if(z!==0)c.push({x,z});}));return c[(Math.random()*c.length)|0];})();
const isRB=(x,z)=>RB&&x===RB.x&&z===RB.z;
const obstaclesBox = [];                 // AABB {x0,x1,z0,z1}
const obstaclesCirc = [];                // {x,z,r}


function asphaltTex(){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
  g.fillStyle='#45474b';g.fillRect(0,0,512,512);
  for(let i=0;i<26000;i++){const v=50+Math.random()*55|0;g.fillStyle=`rgba(${v},${v},${v+3},.55)`;g.fillRect(Math.random()*512,Math.random()*512,1.6,1.6);}
  for(let i=0;i<500;i++){const v=110+Math.random()*60|0;g.fillStyle=`rgba(${v},${v},${v},.5)`;g.fillRect(Math.random()*512,Math.random()*512,1,1);}
  g.strokeStyle='rgba(25,25,27,.55)';g.lineWidth=1.2;for(let k=0;k<5;k++){let x=Math.random()*512,y=Math.random()*512;g.beginPath();g.moveTo(x,y);for(let j=0;j<12;j++){x+=(Math.random()-0.5)*30;y+=Math.random()*14;g.lineTo(x,y);}g.stroke();}
  for(let k=0;k<2;k++){g.fillStyle='rgba(30,31,34,.12)';const x=Math.random()*400,y=Math.random()*400;g.fillRect(x,y,60+Math.random()*80,40+Math.random()*60);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t;}
const aTex=asphaltTex();
// normal map dalla luminosità di una texture disegnata su canvas: le parti chiare sporgono, le scure rientrano
const _nmC=new Map();
function reliefOf(tex,str){if(!tex||!tex.image||!tex.image.getContext||QG.lo)return null;const key=tex.uuid+str;if(_nmC.has(key))return _nmC.get(key);
  const c=tex.image,W=c.width,H=c.height;let d;try{d=c.getContext('2d').getImageData(0,0,W,H).data;}catch(e){return null;}
  const L=new Float32Array(W*H);for(let i=0;i<W*H;i++)L[i]=(d[i*4]*0.3+d[i*4+1]*0.59+d[i*4+2]*0.11)/255;
  const o=document.createElement('canvas');o.width=W;o.height=H;const g=o.getContext('2d'),im=g.createImageData(W,H),q=im.data;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const l=L[y*W+(x-1+W)%W],r=L[y*W+(x+1)%W],u=L[((y-1+H)%H)*W+x],b=L[((y+1)%H)*W+x];let nx=(l-r)*str,ny=(b-u)*str,nz=1;const n=Math.hypot(nx,ny,nz);const j=(y*W+x)*4;
    q[j]=(nx/n*0.5+0.5)*255;q[j+1]=(ny/n*0.5+0.5)*255;q[j+2]=(nz/n*0.5+0.5)*255;q[j+3]=255;}
  g.putImageData(im,0,0);const t=new THREE.CanvasTexture(o);t.wrapS=tex.wrapS;t.wrapT=tex.wrapT;t.repeat.copy(tex.repeat);t.anisotropy=tex.anisotropy;_nmC.set(key,t);return t;}
function addRelief(m,str,ns){if(!m||!m.map||m.normalMap)return m;const t=reliefOf(m.map,str);if(t){m.normalMap=t;m.normalScale=new THREE.Vector2(ns||0.7,ns||0.7);m.needsUpdate=true;}return m;}
function canvasTex(size,draw){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
const grassTex=canvasTex(512,(g,n)=>{g.fillStyle='#6a8644';g.fillRect(0,0,n,n);
  for(let i=0;i<60;i++){const x=Math.random()*n,y=Math.random()*n,r=20+Math.random()*60,gr=g.createRadialGradient(x,y,0,x,y,r),c=Math.random()<0.5?'94,122,52':'120,140,66';gr.addColorStop(0,`rgba(${c},.45)`);gr.addColorStop(1,`rgba(${c},0)`);g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r);}
  for(let i=0;i<26000;i++){const v=Math.random(),x=Math.random()*n,y=Math.random()*n,l=2+Math.random()*5;g.strokeStyle=v<0.45?`rgba(${52+v*70|0},${88+v*80|0},${30+v*30|0},.7)`:v<0.9?`rgba(${120+v*50|0},${148+v*40|0},${72},.5)`:'rgba(170,160,100,.5)';
    g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+(Math.random()-0.5)*2.5,y-l);g.stroke();}
  for(let i=0;i<220;i++){g.fillStyle=Math.random()<0.6?'rgba(120,100,70,.35)':['rgba(250,250,240,.8)','rgba(250,220,70,.8)','rgba(200,120,200,.7)'][(Math.random()*3)|0];const x=Math.random()*n,y=Math.random()*n;g.fillRect(x,y,1.5+Math.random()*2,1.5+Math.random()*2);}});
// lastre di pietra a correre (giunti sfalsati), toni leggermente diversi, venature e qualche macchia d'usura
const paverTex=canvasTex(512,(g,n)=>{g.fillStyle='#8f8a82';g.fillRect(0,0,n,n);const H=32,W=64;for(let r=0;r*H<n;r++){const off=(r%2)*W/2;for(let x=-W;x<n+W;x+=W){const v=172+Math.random()*26|0,w=(Math.random()-0.5)*8|0;
    g.fillStyle=`rgb(${v+w},${v-2},${v-8-w})`;g.fillRect(x+off+1.5,r*H+1.5,W-3,H-3);for(let k=0;k<14;k++){const sx=x+off+2+Math.random()*(W-6),sy=r*H+2+Math.random()*(H-6);g.fillStyle=`rgba(${Math.random()<0.5?255:60},${Math.random()<0.5?250:60},${Math.random()<0.5?240:60},.07)`;g.fillRect(sx,sy,2+Math.random()*4,1+Math.random()*2);}
    g.fillStyle='rgba(255,255,255,.06)';g.fillRect(x+off+1.5,r*H+1.5,W-3,2);g.fillStyle='rgba(0,0,0,.08)';g.fillRect(x+off+1.5,r*H+H-3.5,W-3,2);}}
  for(let i=0;i<6;i++){const gr=g.createRadialGradient(Math.random()*n,Math.random()*n,0,0,0,0);const x=Math.random()*n,y=Math.random()*n,r=20+Math.random()*50,rg=g.createRadialGradient(x,y,0,x,y,r);rg.addColorStop(0,'rgba(70,60,50,.10)');rg.addColorStop(1,'rgba(70,60,50,0)');g.fillStyle=rg;g.fillRect(x-r,y-r,2*r,2*r);}});
const dirtTex=canvasTex(256,(g,n)=>{g.fillStyle='#8a7354';g.fillRect(0,0,n,n);for(let i=0;i<7000;i++){const v=Math.random();g.fillStyle=`rgba(${110+v*80|0},${90+v*60|0},${60+v*40|0},.55)`;g.fillRect(Math.random()*n,Math.random()*n,2,2);}
  [n*0.28,n*0.72].forEach(x=>{const gr=g.createLinearGradient(x-18,0,x+18,0);gr.addColorStop(0,'rgba(60,45,30,0)');gr.addColorStop(0.5,'rgba(60,45,30,.35)');gr.addColorStop(1,'rgba(60,45,30,0)');g.fillStyle=gr;g.fillRect(x-18,0,36,n);});
  for(let i=0;i<120;i++){g.fillStyle='rgba(200,190,170,.5)';g.beginPath();g.arc(Math.random()*n,Math.random()*n,1+Math.random()*2.5,0,7);g.fill();}});
const fieldTex=(a,b)=>canvasTex(128,(g,n)=>{g.fillStyle=a;g.fillRect(0,0,n,n);for(let y=0;y<n;y+=8){g.fillStyle=b;g.fillRect(0,y,n,3);}for(let i=0;i<1500;i++){g.fillStyle='rgba(0,0,0,.06)';g.fillRect(Math.random()*n,Math.random()*n,1.5,1.5);}});
function uvScale(geo,su,sv){const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*su,uv.getY(i)*sv);return geo;}
const roadMat=mat(0xffffff,{map:aTex,roughness:0.95});
const groundM=mat(0xffffff,{map:grassTex,roughness:1});
(WORLD_IT?[]:[[-4500,L+3,-4500,4500],[2700,5000,-4500,4500],[L+3,2700,-4500,-1300],[L+3,2700,1300,4500]]).forEach(([x0,x1,z0,z1])=>{const w=x1-x0,d=z1-z0;
  const gm=new THREE.Mesh(uvScale(new THREE.PlaneGeometry(w,d,Math.ceil(w/150),Math.ceil(d/150)),w/9,d/9),groundM);gm.rotation.x=-Math.PI/2;gm.position.set((x0+x1)/2,-0.03,(z0+z1)/2);gm.receiveShadow=true;scene.add(gm);});
const CITY_C0=scene.children.length;
const cityBase=new THREE.Mesh(new THREE.PlaneGeometry(2*L+6,2*L+6),mat(0x9b978f));cityBase.rotation.x=-Math.PI/2;cityBase.position.y=0.008;cityBase.receiveShadow=true;scene.add(cityBase);
function roadPlane(w,l,x,z,rot){const g=new THREE.PlaneGeometry(w,l),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/6,uv.getY(i)*l/6);
  const m=new THREE.Mesh(g,roadMat);
  m.rotation.x=-Math.PI/2;m.rotation.z=rot||0;m.position.set(x,0.02,z);m.receiveShadow=true;scene.add(m);}
RL.forEach(p=>{roadPlane(ROAD_HALF*2,L*2,p,0,0);roadPlane(ROAD_HALF*2,L*2,0,p,Math.PI/2);});

const white=new THREE.MeshBasicMaterial({color:0xeeeeee});
function stripe(w,l,x,z){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l),white);m.rotation.x=-Math.PI/2;m.position.set(x,0.03,z);scene.add(m);}
const nearInt = s => RL.some(p=>Math.abs(s-p)<13);
const blueM=new THREE.MeshBasicMaterial({color:0x2459c9});
function bstripe(w,l,x,z){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l),blueM);m.rotation.x=-Math.PI/2;m.position.set(x,0.03,z);scene.add(m);}
RL.forEach(p=>{
  for(let s=-L;s<L;s+=9){ if(nearInt(s+2.25)) continue; stripe(0.15,4.5,p,s+2.25); stripe(4.5,0.15,s+2.25,p); }
  [-1,1].forEach(k=>{ for(let s=-L;s<L;s+=6){ if(nearInt(s+3)) continue; bstripe(0.14,6,p+k*(PARK_OFF-1.2),s+3); bstripe(6,0.14,s+3,p+k*(PARK_OFF-1.2));
    bstripe(2.3,0.12,p+k*PARK_OFF,s); bstripe(0.12,2.3,s,p+k*PARK_OFF); }});
});
RL.forEach(ix=>RL.forEach(iz=>{if(isRB(ix,iz))return;
  for(let i=-4;i<=4;i++){const o=i*1.2;[7.2,-7.2].forEach(q=>{stripe(0.6,3,ix+o,iz+q);stripe(3,0.6,ix+q,iz+o);});}
  stripe(0.4,ROAD_HALF-0.3,ix-STOP_D,iz+ROAD_HALF/2); stripe(0.4,ROAD_HALF-0.3,ix+STOP_D,iz-ROAD_HALF/2);
  stripe(ROAD_HALF-0.3,0.4,ix-ROAD_HALF/2,iz-STOP_D); stripe(ROAD_HALF-0.3,0.4,ix+ROAD_HALF/2,iz+STOP_D);
}));

// marciapiedi rialzati (con cordolo): il dislivello si sente nella guida
const CURB=0.14,swMat=mat(0xffffff,{map:paverTex}),curbM=mat(0xd2cec6);
function sidewalkBox(x0,x1,z0,z1){if(x1-x0<0.2||z1-z0<0.2)return;const bg=new THREE.BoxGeometry(x1-x0,CURB,z1-z0);{const uv=bg.attributes.uv;for(let i=8;i<16;i++)uv.setXY(i,uv.getX(i)*(x1-x0)/2,uv.getY(i)*(z1-z0)/2);}const m=new THREE.Mesh(bg,[curbM,curbM,swMat,swMat,curbM,curbM]);
  m.position.set((x0+x1)/2,CURB/2,(z0+z1)/2);m.receiveShadow=true;scene.add(m);}
{const E=[-L,...RL,L];
 RL.forEach(p=>{[1,-1].forEach(k=>{
   const a=p+k*ROAD_HALF,b=p+k*(ROAD_HALF+SIDEWALK),lo=Math.min(a,b),hi=Math.max(a,b);
   for(let i=0;i<E.length-1;i++){
     const x0=E[i]+(i===0?0:isRB(E[i],p)?12.8:ROAD_HALF),x1=E[i+1]-(i===E.length-2?0:isRB(E[i+1],p)?12.8:ROAD_HALF);sidewalkBox(x0,x1,lo,hi);            // lungo le strade X (angoli compresi)
     const z0=E[i]+(i===0?0:isRB(p,E[i])?12.8:ROAD_HALF+SIDEWALK),z1=E[i+1]-(i===E.length-2?0:isRB(p,E[i+1])?12.8:ROAD_HALF+SIDEWALK);sidewalkBox(lo,hi,z0,z1); // lungo le strade Z
   }});});}
function heightAt(x,z){
  if(RB&&Math.hypot(x-RB.x,z-RB.z)<13)return 0;
  if(!(Math.abs(x)<=L+3&&Math.abs(z)<=L+3)){const sf=surfaceAt(x,z);return bumps(x,z,SURF[sf].amp);}
  let near=false;
  for(const p of RL){const dx=Math.abs(x-p),dz=Math.abs(z-p);if(dx<ROAD_HALF||dz<ROAD_HALF)return 0;if(dx<ROAD_HALF+SIDEWALK||dz<ROAD_HALF+SIDEWALK)near=true;}
  return near?CURB:0.015;}

// edifici
// finestra realistica: riflesso del cielo, tende o tapparella abbassata a varie altezze, vetro diviso; i rettangoli restano annotati per le luci notturne
function glassWin(g,x,y,w,h){const T=g.getTransform();(g.canvas.__w=g.canvas.__w||[]).push([x*T.a+T.e,y*T.d+T.f,w*T.a,h*T.d]);
  const gr=g.createLinearGradient(x,y,x+w*0.3,y+h);gr.addColorStop(0,'#9fb4c4');gr.addColorStop(0.45,'#5f7484');gr.addColorStop(1,'#3a4752');g.fillStyle=gr;g.fillRect(x,y,w,h);
  const r=Math.random();
  if(r<0.45){const c=['#efe9dc','#e6dcc6','#f4f1ea','#d9cdb5'][(Math.random()*4)|0];g.fillStyle=c;g.globalAlpha=0.85;g.fillRect(x,y,w*0.28,h);g.fillRect(x+w*0.72,y,w*0.28,h);g.globalAlpha=0.35;g.fillRect(x,y,w,h*0.12);g.globalAlpha=1;
    g.fillStyle='rgba(0,0,0,.08)';for(let k=2;k<w*0.28;k+=4){g.fillRect(x+k,y,1,h);g.fillRect(x+w*0.72+k,y,1,h);}}
  if(r>0.3){const d=Math.random()<0.25?0.92:Math.random()*0.6,c=['#d8d2c4','#cfc9bd','#a9a49a','#e2dccd'][(Math.random()*4)|0];g.fillStyle=c;g.fillRect(x,y,w,h*d);g.fillStyle='rgba(0,0,0,.18)';for(let k=3;k<h*d;k+=3.5)g.fillRect(x,y+k,w,0.8);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x,y+h*d-1.5,w,1.5);}
  g.fillStyle='rgba(255,255,255,.22)';g.beginPath();g.moveTo(x+w*0.15,y+h);g.lineTo(x+w*0.45,y);g.lineTo(x+w*0.6,y);g.lineTo(x+w*0.3,y+h);g.fill();
  g.fillStyle='rgba(240,238,232,.95)';g.fillRect(x+w/2-1,y,2,h);g.strokeStyle='rgba(240,238,232,.95)';g.lineWidth=2;g.strokeRect(x+1,y+1,w-2,h-2);}
function facadeTex(){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.scale(2,2);
  g.fillStyle='#f4efe6';g.fillRect(0,0,256,256);
  for(let i=0;i<6000;i++){const v=Math.random();g.fillStyle=`rgba(${120+v*80|0},${110+v*70|0},${90+v*60|0},.07)`;g.fillRect(Math.random()*256,Math.random()*256,2,2);}
  g.fillStyle='rgba(90,80,70,.18)';for(let r=0;r<4;r++)g.fillRect(0,r*64+60,256,2);
  for(let r=0;r<4;r++)for(let k=0;k<4;k++){const x=k*64+20,y=r*64+12;
    g.fillStyle='#c9c1b2';g.fillRect(x-3,y-3,30,44);glassWin(g,x,y,24,38);
    g.fillStyle='#5c7351';g.fillRect(x-11,y,9,38);g.fillRect(x+26,y,9,38);g.fillStyle='#d8d0c1';g.fillRect(x-6,y+40,36,5);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;return t;}
const fTex=facadeTex();
function facadeTex2(kind){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.scale(2,2);g.fillStyle='#f2ede4';g.fillRect(0,0,256,256);
  for(let i=0;i<6000;i++){const v=Math.random();g.fillStyle=`rgba(${120+v*80|0},${110+v*70|0},${90+v*60|0},.07)`;g.fillRect(Math.random()*256,Math.random()*256,2,2);}
  for(let r=0;r<4;r++)for(let k=0;k<4;k++){const x=k*64+16,y=r*64+10;
    if(kind===1){g.fillStyle='#d9d2c4';g.fillRect(x-4,y-4,40,50);glassWin(g,x,y,32,40);
      if(r%2===0){g.fillStyle='#6b5a4a';g.fillRect(x-8,y+40,48,5);for(let b=0;b<6;b++)g.fillRect(x-6+b*8,y+28,2,12);}}
    else{g.fillStyle='#c9c1b2';g.fillRect(x+1,y-3,30,46);glassWin(g,x+4,y,24,40);g.fillStyle='#7a5236';g.fillRect(x-7,y,10,40);g.fillRect(x+29,y,10,40);
      g.fillStyle='rgba(0,0,0,.15)';for(let s2=0;s2<40;s2+=4){g.fillRect(x-7,y+s2,10,1);g.fillRect(x+29,y+s2,10,1);}}}
  g.fillStyle='rgba(90,80,70,.18)';for(let r=0;r<4;r++)g.fillRect(0,r*64+60,256,2);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;return t;}
const fTexB=facadeTex2(1),fTexC=facadeTex2(2);
const tileTex=canvasTex(128,(g,n)=>{g.fillStyle='#9e4f35';g.fillRect(0,0,n,n);for(let y=0;y<n;y+=10){for(let x=(y/10)%2*8;x<n;x+=16){g.fillStyle=`rgb(${150+Math.random()*30|0},${70+Math.random()*20|0},${45+Math.random()*15|0})`;g.fillRect(x,y,14,8);}g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,y+8,n,2);}});
const roofTileM=mat(0xffffff,{map:tileTex});
// negozi al piano terra: atlante di 8 vetrine in un'unica texture e un'unica mesh
// insegne: attività inventate divise per zona (c centro, s semicentro, p periferia, t località turistiche, * ovunque), con stili e caratteri diversi; alcune al neon
// [nome, categoria, zone, stile, neon]  stile: 0 bastoni, 1 serif elegante, 2 corsivo, 3 condensato, 4 retrò, 5 neon
const SHOPS=(()=>{const C={bar:['#7a1e1e','#f3d6a0'],food:['#8a3b16','#ffe0a0'],pub:['#141414','#e8c36a'],shop:['#2d5a2d','#ffffff'],moda:['#111111','#efe6d4'],bank:['#3a4a5a','#ffffff'],farm:['#1c7a3c','#ffffff'],tab:['#1f3d8a','#ffffff'],serv:['#5a3a6a','#ffffff'],sweet:['#b0567a','#fff2f6'],blue:['#1d4f7a','#ffffff'],disc:['#ffd400','#c8102e'],car:['#2a2a2a','#ffcc00'],souv:['#0f6e8c','#ffffff'],gel:['#f4a6c0','#5a2340'],lux:['#f2efe8','#1a1a1a']};
  const L=[
   ['Maison Valdonia','lux','c',1],['Atelier Rossella','moda','c',1],['Boutique Elena','moda','c',2],['Gioielleria Aurea','lux','c',1],['Profumeria Iris','sweet','c',2],['Calzature Passo','moda','cs',3],['Sartoria Dante','moda','c',1],['Orologeria Tempo','lux','c',1],['Concept Store NOVE','moda','c',3],['Pelletteria Fiorenza','moda','c',1],
   ['Ristorante La Pergola','food','c',1],['Osteria del Ponte','food','cs',4],['Sushi Hana','food','c',3],['Bistrot Le Cave','food','c',2],['Caffè Valdonia','bar','c',1],['Caffè Roma','bar','cs',4],['Cocktail Bar Luna','pub','c',5,1],['Lounge Velvet','pub','c',5,1],['Enoteca Il Calice','pub','cs',2],['Banca di Valdonia','bank','c',1],
   ['Assicurazioni Orna','bank','cs',0],['Libreria Il Segnalibro','serv','cs',1],['Galleria d\'Arte Ocra','lux','c',2],['Cinema Odeon','pub','c',5,1],['Teatro Lirico','lux','c',1],
   ['Alimentari Bruni','shop','s',4],['Macelleria Bianchi','shop','s',0],['Frutta e Verdura Sole','shop','s',4],['Panificio Rossi','sweet','s',2],['Pasticceria Dolce Vita','sweet','sc',2],['Trattoria Nonna Rina','food','s',4],['Trattoria Il Mulino','food','s',2],['Pizzeria Vesuvio','food','s',3],['Pizzeria da Totò','food','sp',2],['Black Cat Pub','pub','s',5,1],
   ['Irish Pub Dublino','pub','s',4,1],['Birreria Luppolo','pub','s',3],['Bar Sport','bar','sp',0],['Bar Centrale','bar','s',0],['Ferramenta Ghidini','serv','sp',3],['Farmacia Comunale','farm','*',0],['Farmacia San Marco','farm','*',0],['Tabacchi n. 12','tab','*',0],['Edicola Stazione','tab','sp',0],['Parrucchiere Stile','sweet','s',2],
   ['Barbiere Tonino','moda','sp',4],['Lavanderia Bolle','blue','sp',0],['Drogheria Conti','shop','s',4],['Pescheria Il Gabbiano','blue','s',4],['Erboristeria Salvia','farm','s',2],['Cartoleria Matita','serv','s',0],['Ottica Ferri','blue','cs',3],['Fiori di Lucia','farm','s',2],['Giocattoli Trottola','sweet','s',4],['Animali Fido','farm','sp',0],
   ['Telefonia Pronto','blue','sp',3],['Elettronica Volt','blue','sp',3],['Videogiochi Pixel','pub','sp',5,1],['Palestra Forza','pub','sp',3],['Immobiliare Casa Mia','serv','sp',0],['Viaggi Altrove','blue','cs',2],['Ciclo Sport Guido','serv','sp',3],['Foto Ottica Lampo','blue','s',3],['Dentista Dr. Sorriso','bank','sp',0],['Gelateria Polare','gel','s',2],
   ['Ipermercato Orna','disc','p',3],['Discount Risparmio','disc','p',3],['Supermercato Valfresco','shop','p',3],['Kebab Istanbul','food','p',3,1],['Kebab Anatolia','food','p',0,1],['Pizza al Taglio','food','p',4],['Ricambi Auto Turbo','car','p',3],['Carrozzeria Fratelli Neri','car','p',0],['Officina Pistone','car','p',4],['Gommista Rapido','car','p',3],
   ['Autolavaggio Splash','blue','p',3],['Mobili Rovere','serv','p',1],['Bricolage Fai da Te','disc','p',3],['Compro Oro','lux','p',5,1],['Sala Slot Fortuna','pub','p',5,1],['Money Transfer','tab','p',0],['Lavasecco 24h','blue','p',0],['Mini Market 24/7','shop','p',3,1],['Phone Center','blue','p',0],['Abbigliamento Low Cost','moda','p',3],
   ['Souvenir Valdonia','souv','t',2],['Ricordi del Lago','souv','t',2],['Bazar del Porto','souv','t',4],['Gelateria Riva','gel','t',2],['Gelateria Spiaggia d\'Oro','gel','t',2],['Gelateria La Coppa','gel','t',4],['Ristorante Il Pescatore','food','t',1],['Bar Bagni Aurora','bar','t',2],['Lido Bar Sirena','bar','t',4],['Trattoria al Lago','food','t',4],
   ['Pizzeria Belvedere','food','t',2],['Bar Funivia','bar','t',3],['Noleggio Bici e Sci','serv','t',3],['Prodotti Tipici','shop','t',1],['Cartoline & Co','souv','t',0],['Hotel Panorama','lux','t',1],['Crêperie Marina','sweet','t',2],['Chiringuito Onda','bar','t',5,1],
   ['','door','*',0],['','door','*',0]];
  return L.map(([n,c,z,st,ne])=>{const k=c==='door'?['#4a3a2a','#000']:C[c];return[n,k[0],k[1],c==='door'?'':c,z,st||0,!!ne];});})();
const SHOP_COLS=11,SHOP_ROWS=11,shopUV=k=>{const u0=(k%SHOP_COLS)/SHOP_COLS,v1=1-((k/SHOP_COLS)|0)/SHOP_ROWS;return[u0,v1-1/SHOP_ROWS,u0+1/SHOP_COLS,v1];};
// scelta dell'insegna per zona: k = numero casuale 0..1
const SHOPZ={};SHOPS.forEach((S,i)=>{const z=S[4];for(const q of ['c','s','p','t'])if(z==='*'||z.includes(q))(SHOPZ[q]=SHOPZ[q]||[]).push(i);});
const shopPick=(zone,r)=>{const L=SHOPZ[zone]||SHOPZ.s;return L[Math.min(L.length-1,(r*L.length)|0)];};
const SHOPFONTS=["bold {s}px 'Oswald',Arial Narrow,Arial","{s}px 'Playfair Display',Georgia,serif","{s}px 'Pacifico','Brush Script MT',cursive","{s}px 'Bebas Neue',Impact,Arial Narrow","{s}px 'Righteous','Arial Rounded MT Bold',Arial","{s}px 'Monoton','Righteous',Impact"];
const shopTex=(()=>{const c=document.createElement('canvas');c.width=256*SHOP_COLS;c.height=256*SHOP_ROWS;const g=c.getContext('2d');
  const draw=()=>{g.clearRect(0,0,c.width,c.height);SHOPS.forEach(([name,bg,fg,cat,zone,st,neon],k)=>{const x0=(k%SHOP_COLS)*256,y0=((k/SHOP_COLS)|0)*256;g.fillStyle='#8f8676';g.fillRect(x0,y0,256,256);
    if(!name&&k===SHOPS.length-1){g.fillStyle='#6f6a60';g.fillRect(x0,y0,256,256);g.fillStyle='#d8d0c0';g.beginPath();g.moveTo(x0+18,y0+256);g.lineTo(x0+18,y0+96);g.arc(x0+128,y0+96,110,Math.PI,0);g.lineTo(x0+238,y0+256);g.fill();
      g.fillStyle='#4a2f1c';g.beginPath();g.moveTo(x0+30,y0+256);g.lineTo(x0+30,y0+100);g.arc(x0+128,y0+100,98,Math.PI,0);g.lineTo(x0+226,y0+256);g.fill();g.strokeStyle='#2e1d10';g.lineWidth=3;for(let xx=x0+44;xx<x0+226;xx+=14){g.beginPath();g.moveTo(xx,y0+256);g.lineTo(xx,y0+60);g.stroke();}
      g.fillStyle='#2e1d10';g.fillRect(x0+126,y0+20,4,236);g.fillStyle='#b89a5a';g.fillRect(x0+112,y0+170,6,10);g.fillRect(x0+138,y0+170,6,10);return;}
    if(!name){g.fillStyle='#5a3e28';g.fillRect(x0+80,y0+70,96,186);g.fillStyle='#3a2818';g.fillRect(x0+127,y0+70,2,186);g.fillStyle='#b89a5a';g.fillRect(x0+112,y0+160,6,6);g.fillRect(x0+138,y0+160,6,6);g.fillStyle='#d8d0c0';g.fillRect(x0+70,y0+60,116,10);return;}
    // fascia dell'insegna: piena, con cornice, o lettere su fondo scuro per il neon
    const nb=st===5;g.fillStyle=nb?'#101014':bg;g.fillRect(x0+8,y0+22,240,58);if(st===1||st===4){g.strokeStyle=fg;g.globalAlpha=0.6;g.lineWidth=2;g.strokeRect(x0+13,y0+27,230,48);g.globalAlpha=1;}
    if(cat==='disc'){g.fillStyle='#c8102e';g.fillRect(x0+8,y0+72,240,8);}
    const col=nb?['#ff3df2','#33e6ff','#ffe14d','#ff5a3d','#7dff6a'][k%5]:fg;g.fillStyle=col;g.textAlign='center';g.textBaseline='middle';
    const up=st===2||st===1?name:name.toUpperCase(),F=SHOPFONTS[st],w=226,fit=(t,max)=>{let sz=max;g.font=F.replace('{s}',sz);while(g.measureText(t).width>w&&sz>10){sz--;g.font=F.replace('{s}',sz);}return sz;};
    if(nb){g.shadowColor=col;g.shadowBlur=14;}
    const mx=st===2?34:st===3?40:30;
    if(fit(up,mx)>=19||up.indexOf(' ')<0){fit(up,mx);g.fillText(up,x0+128,y0+52);}
    else{const ws=up.split(' ');let best=1,bd=1e9;for(let i=1;i<ws.length;i++){const a=ws.slice(0,i).join(' ').length,b=ws.slice(i).join(' ').length;if(Math.abs(a-b)<bd){bd=Math.abs(a-b);best=i;}}
      const l1=ws.slice(0,best).join(' '),l2=ws.slice(best).join(' '),fs=Math.min(fit(l1,26),fit(l2,26));g.font=F.replace('{s}',fs);g.fillText(l1,x0+128,y0+39);g.fillText(l2,x0+128,y0+66);}
    g.shadowBlur=0;
    if(cat==='farm'&&/FARMACIA/i.test(up)){g.fillStyle='#2bd35a';g.fillRect(x0+226,y0+34,8,26);g.fillRect(x0+217,y0+43,26,8);}
    // vetrine
    const gr=g.createLinearGradient(x0,y0+90,x0+256,y0+256);gr.addColorStop(0,'#28323c');gr.addColorStop(0.5,'#4f6070');gr.addColorStop(1,'#1d252d');g.fillStyle=gr;g.fillRect(x0+14,y0+90,150,160);g.fillRect(x0+178,y0+90,64,166);
    g.fillStyle='rgba(255,255,255,.08)';g.beginPath();g.moveTo(x0+14,y0+250);g.lineTo(x0+90,y0+90);g.lineTo(x0+120,y0+90);g.lineTo(x0+44,y0+250);g.fill();
    // merce in vetrina (frutta in cassette davanti al fruttivendolo, pane, abiti, gelato, souvenir)
    if(/Frutta/.test(name)){for(let i=0;i<3;i++){g.fillStyle='#7a5a32';g.fillRect(x0+20+i*48,y0+214,44,32);for(let j=0;j<12;j++){g.fillStyle=['#e0301e','#f29a1f','#f2d22e','#5aa52a'][(i+j)%4];g.beginPath();g.arc(x0+26+i*48+(j%6)*7,y0+214-((j/6)|0)*6,4,0,7);g.fill();}}}
    else if(cat==='gel'){for(let i=0;i<6;i++){g.fillStyle=['#f7d6e0','#fff3c4','#c9e7b8','#6b3f26','#f2a3a3','#fff'][i];g.fillRect(x0+22+i*23,y0+214,20,14);}}
    else{const pal={food:['#e8c9a0','#c33','#fff'],bar:['#c9a','#9ac','#fff'],sweet:['#f6c','#fc9','#fff'],moda:['#a96','#69a','#ccc'],lux:['#d8c79a','#fff','#999'],shop:['#9c6','#cc6','#c96'],souv:['#3cf','#fc3','#f66'],disc:['#fd0','#c11','#fff'],car:['#333','#fc0','#888']}[cat]||['#c9a','#9ac','#ca9'];
      for(let i=0;i<6;i++){g.fillStyle=pal[i%3];g.fillRect(x0+24+i*22,y0+200+((k*7+i*13)%20),14,30);}}
    g.strokeStyle=cat==='lux'||cat==='moda'?'#2a2a2a':'#cfc6b4';g.lineWidth=6;g.strokeRect(x0+14,y0+90,150,160);g.strokeRect(x0+178,y0+90,64,166);});};
  draw();const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;
  // quando i caratteri web sono pronti, l'atlante viene ridisegnato con i font veri
  try{Promise.all(['Oswald','Playfair Display','Pacifico','Bebas Neue','Righteous','Monoton'].map(f=>document.fonts.load("32px '"+f+"'"))).then(()=>{draw();t.needsUpdate=true;}).catch(()=>{});}catch(e){}
  return t;})();
const shopQ={pos:[],uv:[],idx:[]},awnQ={pos:[],col:[],idx:[]};
function addQuad(Q,ax,az,bx,bz,y0,y1,u0,v0,u1,v1,nx,nz){const k=Q.pos.length/3;Q.pos.push(ax,y0,az,bx,y0,bz,ax,y1,az,bx,y1,bz);if(Q.uv)Q.uv.push(u0,v0,u1,v0,u0,v1,u1,v1);Q.idx.push(k,k+1,k+2,k+1,k+3,k+2);}
function shopFront(cx,cz,fw,nx,nz){const tx=-nz,tz=nx,n=Math.max(1,Math.round(fw/6.2)),seg=fw/n;
  for(let i=0;i<n;i++){const k=(Math.random()*(SHOPS.length-2))|0,[u0,v0,u1x,v1]=shopUV(k);
    const a=-fw/2+i*seg+0.15,b=a+seg-0.3,ox=cx+nx*0.03,oz=cz+nz*0.03;
    // il verso dei vertici dipende dalla normale: si ordinano in modo che la faccia guardi fuori
    addQuad(shopQ,ox+tx*b,oz+tz*b,ox+tx*a,oz+tz*a,CURB,CURB+3.6,u0,v0,u1x,v1);
    if(SHOPS[k][0]&&['bar','food','sweet','moda','shop'].includes(SHOPS[k][3])&&Math.random()<0.8){const c=new THREE.Color(['#b8312f','#2e6e3e','#c9a227','#1f4f8a','#7a3b6b'][(Math.random()*5)|0]);
      const k2=awnQ.pos.length/3,y=CURB+3.2,ax=ox+tx*a,az=oz+tz*a,bx=ox+tx*b,bz=oz+tz*b,ex=nx*1.3,ez=nz*1.3;
      awnQ.pos.push(ax,y+0.6,az,bx,y+0.6,bz,ax+ex,y,az+ez,bx+ex,y,bz+ez);for(let q=0;q<4;q++)awnQ.col.push(c.r,c.g,c.b);awnQ.idx.push(k2,k2+2,k2+1,k2+1,k2+2,k2+3);}}}

const palette=[0xe3c58f,0xd9a77a,0xe8d9b5,0xc98a6a,0xe6c7b8,0xd7cfbf,0xbfa98a,0xead5a3];
const roofMat=mat(0x8a6e5c), corMat=mat(0x8f8378);
const facadeMats=[...palette.map(c=>mat(c,{map:fTex})),...palette.map(c=>mat(c,{map:fTexB})),...palette.slice(0,5).map(c=>mat(c,{map:fTexC}))];   // texture condivisa: niente copie in memoria
function building(x,z,w,d,h,face){
  const geo=new THREE.BoxGeometry(w,h,d),uv=geo.attributes.uv;
  // ripetizione della facciata tramite UV (facce 0,1 = lati lungo Z; 4,5 = lati lungo X)
  const ru=sp=>Math.max(1,Math.round(sp/12*4))/4,rv=Math.max(1,Math.round(h/3))/4;
  [[0,ru(d)],[1,ru(d)],[4,ru(w)],[5,ru(w)]].forEach(([f,r])=>{for(let k=0;k<4;k++){const i=f*4+k;uv.setXY(i,uv.getX(i)*r,uv.getY(i)*rv);}});
  const fm=facadeMats[(Math.random()*facadeMats.length)|0];
  const b=new THREE.Mesh(geo,[fm,fm,roofMat,roofMat,fm,fm]);
  b.position.set(x,h/2,z);b.castShadow=b.receiveShadow=true;scene.add(b);
  if(Math.random()<0.38){const sh=new THREE.Shape(),hw=Math.min(w,d)/2+0.5,rh=Math.min(5,hw*0.6);sh.moveTo(-hw,0);sh.lineTo(0,rh);sh.lineTo(hw,0);sh.lineTo(-hw,0);
    const L2=Math.max(w,d)+1,rg=new THREE.ExtrudeGeometry(sh,{depth:L2,bevelEnabled:false});rg.translate(0,0,-L2/2);const rf=new THREE.Mesh(rg,roofTileM);if(w>d)rf.rotation.y=Math.PI/2;rf.position.set(x,h,z);rf.castShadow=true;scene.add(rf);}
  else{const cor=new THREE.Mesh(new THREE.BoxGeometry(w+0.6,0.5,d+0.6),corMat);cor.position.set(x,h+0.25,z);scene.add(cor);}
  if(face){const fw=face.ax==='z'?w:d,cxF=face.ax==='z'?x:x+face.n*d/2,czF=face.ax==='z'?z+face.n*d/2:z;shopFront(cxF,czF,fw,face.ax==='x'?face.n:0,face.ax==='z'?face.n:0);}
  obstaclesBox.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});
}
// ================= PALAZZI MONUMENTALI, CASA DI CAMPAGNA, ARREDO URBANO (Sketchfab) =================
// separa un modello in parti con vertici propri (niente copie dell'intera mesh)
function gCompact(src,tris){const map=new Map(),pos=[],nor=[],uv=[],idx=[];
  tris.forEach(v=>{let k=map.get(v);if(k===undefined){k=pos.length/3;map.set(v,k);pos.push(src.pos[v*3],src.pos[v*3+1],src.pos[v*3+2]);nor.push(src.nor[v*3],src.nor[v*3+1],src.nor[v*3+2]);uv.push(src.uv[v*2],src.uv[v*2+1]);}idx.push(k);});
  return{pos:Float32Array.from(pos),nor:Float32Array.from(nor),uv:Float32Array.from(uv),idx:Uint32Array.from(idx),n:pos.length/3,hasN:src.hasN};}
function gTemplate(parts){// parts: [{mat,b}] già in coordinate locali -> {meshes,box}
  const by=new Map();parts.forEach(p=>{if(!by.has(p.mat))by.set(p.mat,[]);by.get(p.mat).push(p.b);});
  const meshes=[...by.entries()].map(([m,l])=>({geo:gMerge(l),mat:gFixMat(m)}));return{meshes,box:gBox(parts.map(p=>p.b))};}
function gInstance(t,s){const g=new THREE.Group();t.meshes.forEach(p=>{const m=new THREE.Mesh(p.geo,p.mat);m.castShadow=true;m.receiveShadow=true;g.add(m);});if(s)g.scale.setScalar(s);return g;}
const MONU=(()=>{if(!MODELS.buildings)return null;try{const sc=MODELS.buildings.scene;sc.updateMatrixWorld(true);const bakes=[];
  sc.traverse(m=>{if(m.isMesh)bakes.push({mat:m.material,b:gBake(m,m.matrixWorld)});});
  const all=gBox(bakes.map(x=>x.b)),sx=(all.max.x-all.min.x)/3,sz=(all.max.z-all.min.z)/3,cells=[...Array(9)].map(()=>new Map());
  bakes.forEach(({mat,b},bi)=>{for(let t=0;t<b.idx.length;t+=3){const i0=b.idx[t],i1=b.idx[t+1],i2=b.idx[t+2];
    const cx=(b.pos[i0*3]+b.pos[i1*3]+b.pos[i2*3])/3,cz=(b.pos[i0*3+2]+b.pos[i1*3+2]+b.pos[i2*3+2])/3;
    const ci=Math.min(2,Math.max(0,Math.floor((cx-all.min.x)/sx))),cj=Math.min(2,Math.max(0,Math.floor((cz-all.min.z)/sz))),cell=cells[ci*3+cj];
    if(!cell.has(bi))cell.set(bi,[]);cell.get(bi).push(i0,i1,i2);}});
  const out=[];cells.forEach(cell=>{const parts=[];cell.forEach((tris,bi)=>{parts.push({mat:bakes[bi].mat,b:gCompact(bakes[bi].b,tris)});});if(!parts.length)return;
    const bb=gBox(parts.map(p=>p.b)),c=bb.getCenter(new THREE.Vector3());gShift(parts.map(p=>p.b),-c.x,-bb.min.y,-c.z);
    const t=gTemplate(parts),h=t.box.max.y,foot=new THREE.Box3();
    parts.forEach(p=>{for(let i=0;i<p.b.n;i++)if(p.b.pos[i*3+1]>h*0.18)foot.expandByPoint(_gv.set(p.b.pos[i*3],0,p.b.pos[i*3+2]));});t.foot=foot;out.push(t);});
  return out.length?out:null;}catch(e){console.warn('palazzi non preparati',e);return null;}})();
// mette un palazzo monumentale al centro di un isolato, con la piazza lastricata
function placeMonument(x0,x1,z0,z1){const t=MONU[(Math.random()*MONU.length)|0],rot=((Math.random()*4)|0)*Math.PI/2,sw=Math.abs(Math.sin(rot))>0.5;
  const bw=t.box.max.x-t.box.min.x,bd=t.box.max.z-t.box.min.z,W=x1-x0,D=z1-z0,fw=sw?bd:bw,fd=sw?bw:bd;
  const s=Math.min((W-2)/fw,(D-2)/fd,24/t.box.max.y),cx=(x0+x1)/2,cz=(z0+z1)/2;
  const pz=new THREE.Mesh(new THREE.PlaneGeometry(W,D),mat(0xb3ab9c,{map:paverTex}));pz.rotation.x=-Math.PI/2;pz.position.set(cx,0.018,cz);pz.receiveShadow=true;scene.add(pz);
  const g=gInstance(t,s);g.rotation.y=rot;g.position.set(cx,0.02,cz);scene.add(g);(window.__monu=window.__monu||[]).push([cx,cz]);
  const f=t.foot.clone().applyMatrix4(new THREE.Matrix4().makeRotationY(rot));obstaclesBox.push({x0:cx+f.min.x*s,x1:cx+f.max.x*s,z0:cz+f.min.z*s,z1:cz+f.max.z*s});}
const HOUSE=(()=>{if(!MODELS.house)return null;try{const sc=MODELS.house.scene;sc.updateMatrixWorld(true);const parts=[];sc.traverse(m=>{if(m.isMesh)parts.push({mat:m.material,b:gBake(m,m.matrixWorld)});});
  const bb=gBox(parts.map(p=>p.b)),c=bb.getCenter(new THREE.Vector3());gShift(parts.map(p=>p.b),-c.x,-bb.min.y,-c.z);return gTemplate(parts);}catch(e){console.warn('casa non preparata',e);return null;}})();
// arredo urbano: ogni oggetto portato all'altezza reale
const PROPS=(()=>{if(!MODELS.props)return null;try{const sc=MODELS.props.scene;sc.updateMatrixWorld(true);const want={bench:[/^Bench1/,0.9],bin:[/^Bin-[1-4]/,1.0],bigbin:[/^BigBin/,1.05],lamp:[/^ParkLight-[1-3]/,3.8],bus:[/^Bus[ _]station/,2.7],gazebo:[/^Gazebo/,4.0],block:[/^RoadBlock/,1.0]};
  const out={};Object.keys(want).forEach(k=>out[k]=[]);
  sc.traverse(n=>{const k=Object.keys(want).find(k=>want[k][0].test(n.name));if(!k||n.parent&&want[k][0].test(n.parent.name))return;
    const parts=[];n.traverse(m=>{if(m.isMesh)parts.push({mat:m.material,b:gBake(m,m.matrixWorld)});});if(!parts.length)return;
    const bb=gBox(parts.map(p=>p.b)),c=bb.getCenter(new THREE.Vector3()),s=want[k][1]/(bb.max.y-bb.min.y);gShift(parts.map(p=>p.b),-c.x,-bb.min.y,-c.z,s);out[k].push(gTemplate(parts));});
  return out;}catch(e){console.warn('arredo non preparato',e);return null;}})();
function placeProp(k,x,y,z,rot){if(!PROPS||!PROPS[k]||!PROPS[k].length)return null;const t=PROPS[k][(Math.random()*PROPS[k].length)|0],g=gInstance(t);g.position.set(x,y,z);g.rotation.y=rot||0;scene.add(g);
  const r=Math.max(t.box.max.x-t.box.min.x,t.box.max.z-t.box.min.z)/2;return{g,r,t};}
const edges=[-L,...RL,L];
const M = ROAD_HALF+SIDEWALK+0.4;
const parkTrees=[];const PARK=[1+((Math.random()*(edges.length-3))|0),1+((Math.random()*(edges.length-3))|0)];
const PIAZZE=[];if(MONU){const cand=[];for(let i=0;i<edges.length-1;i++)for(let j=0;j<edges.length-1;j++)if(!(i===PARK[0]&&j===PARK[1]))cand.push([i,j]);cand.sort(()=>Math.random()-0.5);PIAZZE.push(...cand.slice(0,edges.length>4?2:1));}
for(let i=0;i<edges.length-1;i++)for(let j=0;j<edges.length-1;j++){
  const x0=edges[i]+(i===0?2:M), x1=edges[i+1]-(i===edges.length-2?2:M);
  const z0=edges[j]+(j===0?2:M), z1=edges[j+1]-(j===edges.length-2?2:M);
  const g=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),mat(0x7f8f5a));g.rotation.x=-Math.PI/2;g.position.set((x0+x1)/2,0.015,(z0+z1)/2);g.receiveShadow=true;scene.add(g);
  if(PIAZZE.some(([a,b])=>a===i&&b===j)){placeMonument(x0,x1,z0,z1);continue;}
  if(i===PARK[0]&&j===PARK[1]&&edges.length>3){const cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0;
    const pg=new THREE.Mesh(uvScale(new THREE.PlaneGeometry(w,d),w/8,d/8),mat(0xffffff,{map:grassTex}));pg.rotation.x=-Math.PI/2;pg.position.set(cx,0.02,cz);pg.receiveShadow=true;scene.add(pg);
    const pathM=mat(0xcbbd9c);[[w,3,cx,cz],[3,d,cx,cz]].forEach(([a,b,x,z])=>{const pm=new THREE.Mesh(new THREE.PlaneGeometry(a,b),pathM);pm.rotation.x=-Math.PI/2;pm.position.set(x,0.03,z);scene.add(pm);});
    const fb=new THREE.Mesh(new THREE.CylinderGeometry(4,4.2,0.6,28),mat(0xd8d0c0));fb.position.set(cx,0.3,cz);scene.add(fb);
    const fw=new THREE.Mesh(new THREE.CylinderGeometry(3.6,3.6,0.05,28),new THREE.MeshStandardMaterial({color:0x4a7c9a,roughness:0.1,metalness:0.3}));fw.position.set(cx,0.58,cz);scene.add(fw);obstaclesCirc.push({x:cx,z:cz,r:4.2});
    for(let k=0;k<26;k++){const x=x0+3+Math.random()*(w-6),z=z0+3+Math.random()*(d-6);if(Math.abs(x-cx)<4||Math.abs(z-cz)<4)continue;parkTrees.push([x,z]);}
    for(let k=0;k<8;k++){const bx=cx+(k%2?3.2:-3.2),bz=cz-d/2+8+k*(d-16)/8;if(Math.abs(bz-cz)<6)continue;
      if(placeProp('bench',bx,0.02,bz,k%2?Math.PI/2:-Math.PI/2)){if(k%3===0)placeProp('bin',bx,0.02,bz+1.6);continue;}
      const bn=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.45,1.8),mat(0x6b4a2e));bn.position.set(bx,0.25,bz);scene.add(bn);}
    if(PROPS){for(let k=0;k<6;k++){const lx=cx+(k%2?2:-2),lz=cz-d/2+6+k*(d-12)/5;placeProp('lamp',lx,0.02,lz);}
      const gz=placeProp('gazebo',x0+12,0.02,z0+12);if(gz)obstaclesCirc.push({x:x0+12,z:z0+12,r:gz.r*0.8});}
    continue;}
  const dep=()=>12+Math.random()*4, hgt=()=>7+Math.floor(Math.random()*(Math.hypot((x0+x1)/2,(z0+z1)/2)<150?7:4))*3.1;
  // file lungo i lati Z0 e Z1
  [[z0,1],[z1,-1]].forEach(([zz,sg])=>{for(let a=x0;a<x1-6;){const w=Math.min(10+Math.random()*9,x1-a),d=dep();building(a+w/2,zz+sg*d/2,w,d,hgt(),{ax:'z',n:-sg});a+=w+0.2;}});
  [[x0,1],[x1,-1]].forEach(([xx,sg])=>{for(let a=z0+17;a<z1-23;){const w=Math.min(10+Math.random()*9,z1-17-a),d=dep();if(w<6)break;building(xx+sg*d/2,a+w/2,d,w,hgt(),{ax:'x',n:-sg});a+=w+0.2;}});
}
// mesh uniche per vetrine e tende
{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(shopQ.pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(shopQ.uv,2));g.setIndex(shopQ.idx);g.computeVertexNormals();
 scene.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:shopTex,roughness:0.6,side:THREE.DoubleSide})));
 const a=new THREE.BufferGeometry();a.setAttribute('position',new THREE.Float32BufferAttribute(awnQ.pos,3));a.setAttribute('color',new THREE.Float32BufferAttribute(awnQ.col,3));a.setIndex(awnQ.idx);a.computeVertexNormals();
 const am=new THREE.Mesh(a,new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.85,side:THREE.DoubleSide}));am.castShadow=true;scene.add(am);}
// muri di confine
(WORLD_IT?[[-L-3,-L,-L-3,-ROAD_HALF+SIDEWALK],[-L-3,-L,ROAD_HALF+SIDEWALK,L+3],[L,L+3,-L-3,-ROAD_HALF+SIDEWALK],[L,L+3,ROAD_HALF+SIDEWALK,L+3],[-L-3,-ROAD_HALF+SIDEWALK,-L-3,-L],[ROAD_HALF+SIDEWALK,L+3,-L-3,-L],[-L-3,-ROAD_HALF+SIDEWALK,L,L+3],[ROAD_HALF+SIDEWALK,L+3,L,L+3]]:[[-L-3,-L,-L-3,L+3],[L,L+3,-L-3,-ROAD_HALF-SIDEWALK],[L,L+3,ROAD_HALF+SIDEWALK,L+3],[-L-3,L+3,-L-3,-L],[-L-3,L+3,L,L+3]]).forEach(([x0,x1,z0,z1])=>{
  obstaclesBox.push({x0,x1,z0,z1});const m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,1.2,z1-z0),mat(0xb0aca4));m.position.set((x0+x1)/2,0.6,(z0+z1)/2);scene.add(m);});

// ================= ACERI DA SKETCHFAB: vicini dettagliati, lontani come sagome =================
const MAPLE_TEX=new Map();
const MAPLE=(()=>{if(!MODELS.trees)return null;try{
  const sc=MODELS.trees.scene;sc.updateMatrixWorld(true);const vars=[];
  sc.traverse(o=>{if(!/^Acer_(medium|small)_\d$/.test(o.name))return;
    const near=o.children.find(c=>/_LOD2$/.test(c.name)),far=o.children.find(c=>/Billboard_LOD3$/.test(c.name));if(!near||!far)return;
    const bake=grp=>{const by=new Map();grp.traverse(m=>{if(!m.isMesh)return;if(!by.has(m.material))by.set(m.material,[]);by.get(m.material).push(gBake(m,m.matrixWorld));});return by;};
    const nb=bake(near),fb=bake(far),nAll=[...nb.values()].flat(),fAll=[...fb.values()].flat();
    const bN=gBox(nAll),bF=gBox(fAll),hN=bN.max.y-bN.min.y,hF=bF.max.y-bF.min.y;
    // tronco al centro: si usa la base della corteccia
    const bark=[...nb.entries()].find(([m])=>/bark/i.test(m.name));const bb=bark?gBox(bark[1]):bN;const low=new THREE.Box3();
    bark&&bark[1].forEach(x=>{for(let i=0;i<x.n;i++)if(x.pos[i*3+1]<bb.min.y+0.15*(bb.max.y-bb.min.y))low.expandByPoint(_gv.set(x.pos[i*3],x.pos[i*3+1],x.pos[i*3+2]));});
    const c=low.isEmpty()?bN.getCenter(new THREE.Vector3()):low.getCenter(new THREE.Vector3());
    gShift(nAll,-c.x,-bN.min.y,-c.z,1/hN);const cf=bF.getCenter(new THREE.Vector3());gShift(fAll,-cf.x,-bF.min.y,-cf.z,1/hF);
    const mk=by=>[...by.entries()].map(([m,l])=>{l.forEach(b=>{if(!(b.idx instanceof Uint32Array))b.idx=Uint32Array.from(b.idx);});const mm=m.clone();mm.aoMap=null;if(mm.vertexTangents){mm.vertexTangents=false;if(mm.normalScale)mm.normalScale.y*=-1;}if(mm.map)mm.map.anisotropy=4;
      if(mm.transparent||mm.alphaTest>0||/cluster|billboard/i.test(m.name)){mm.transparent=false;mm.alphaTest=0.4;mm.alphaToCoverage=true;if(mm.map){const cm=MAPLE_TEX.get(m.map)||coverageMips(m.map,0.4);MAPLE_TEX.set(m.map,cm);mm.map=cm;}mm.side=THREE.DoubleSide;mm.color.setRGB(1.9,1.85,1.5);mm.emissive=new THREE.Color(0x2a3214);mm.emissiveMap=mm.map;if(/billboard/i.test(m.name)){mm.normalMap=null;mm.emissive=new THREE.Color(0x4a5626);}}else mm.color.setRGB(1.3,1.25,1.2);mm.roughness=0.95;mm.metalness=0;return{geo:gMerge(l),mat:mm};});
    vars.push({name:o.name,near:mk(nb),far:mk(fb),items:[]});});
  return vars.length?{vars,items:0,built:false}:null;}catch(e){console.warn('aceri non preparati',e);return null;}})();
// mipmap che conservano la copertura delle foglie: da lontano la chioma non si svuota
function coverageMips(tex,th){try{const img=tex.image;if(!img||!img.width)return tex;let w=img.width,h=img.height;const lv=[];let c=document.createElement('canvas');c.width=w;c.height=h;let g=c.getContext('2d');g.drawImage(img,0,0);
  const cov=(d,s)=>{let n=0;for(let i=3;i<d.length;i+=4)if(d[i]*s>th*255)n++;return n/(d.length/4);};const c0=cov(g.getImageData(0,0,w,h).data,1);lv.push(c);
  while(w>1||h>1){const nw=Math.max(1,w>>1),nh=Math.max(1,h>>1),c2=document.createElement('canvas');c2.width=nw;c2.height=nh;const g2=c2.getContext('2d');g2.imageSmoothingQuality='high';g2.drawImage(lv[lv.length-1],0,0,nw,nh);
    const id=g2.getImageData(0,0,nw,nh),d=id.data;let lo=1,hi=8;for(let k=0;k<10;k++){const m=(lo+hi)/2;if(cov(d,m)<c0)lo=m;else hi=m;}const sc=(lo+hi)/2;for(let i=3;i<d.length;i+=4)d[i]=Math.min(255,d[i]*sc);g2.putImageData(id,0,0);lv.push(c2);w=nw;h=nh;}
  const t=new THREE.Texture(lv[0]);t.mipmaps=lv;t.generateMipmaps=false;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.flipY=tex.flipY;t.encoding=tex.encoding;t.wrapS=tex.wrapS;t.wrapT=tex.wrapT;
  t.offset.copy(tex.offset);t.repeat.copy(tex.repeat);t.rotation=tex.rotation;t.center.copy(tex.center);t.anisotropy=4;t.needsUpdate=true;return t;}catch(e){console.warn('mipmap foglie',e);return tex;}}
// aggiunge un acero (h = altezza in metri)
function addMaple(x,y,z,h,small){if(!MAPLE)return false;const vs=MAPLE.vars.filter(v=>small?/small/.test(v.name):true),v=vs[(Math.random()*vs.length)|0];
  const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.random()*6.28),new THREE.Vector3(h*(0.85+Math.random()*0.3),h,h*(0.85+Math.random()*0.3)));
  const col=new THREE.Color(0.86+Math.random()*0.2,0.9+Math.random()*0.14,0.8+Math.random()*0.14);
  v.items.push({x,z,m,col});MAPLE.items++;return true;}
function buildMaples(){if(!MAPLE||MAPLE.built)return;MAPLE.built=true;
  MAPLE.vars.forEach(v=>{const n=v.items.length;if(!n)return;
    v.nm=v.near.map(p=>{const im=new THREE.InstancedMesh(p.geo,p.mat,n);im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;scene.add(im);return im;});
    v.fm=v.far.map(p=>{const im=new THREE.InstancedMesh(p.geo,p.mat,n);im.frustumCulled=false;scene.add(im);return im;});
    [...v.nm,...v.fm].forEach(im=>{for(let i=0;i<n;i++)im.setColorAt(i,v.items[i].col);im.count=0;});});
  updateMaples(true);}
let mapleT=0,mapleX=1e9,mapleZ=1e9;
function updateMaples(force){if(!MAPLE||!MAPLE.built)return;const cx=camera.position.x,cz=camera.position.z;
  if(!force&&Math.abs(cx-mapleX)+Math.abs(cz-mapleZ)<6)return;mapleX=cx;mapleZ=cz;const R2=(MOBILE?70:110)**2,F2=1300**2;
  MAPLE.vars.forEach(v=>{if(!v.nm)return;let a=0,b=0;
    for(let i=0;i<v.items.length;i++){const it=v.items[i],d2=(it.x-cx)**2+(it.z-cz)**2;
      if(d2<R2){v.nm.forEach(im=>{im.instanceMatrix.array.set(it.m.elements,a*16);im.instanceColor.setXYZ(a,it.col.r,it.col.g,it.col.b);});a++;}
      else if(d2<F2){v.fm.forEach(im=>{im.instanceMatrix.array.set(it.m.elements,b*16);im.instanceColor.setXYZ(b,it.col.r,it.col.g,it.col.b);});b++;}}
    v.nm.forEach(im=>{im.count=a;im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;});
    v.fm.forEach(im=>{im.count=b;im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;});});}
// alberi e lampioni
const trunkM=mat(0x5a4330),leafM=mat(0x4d6b35),poleM=mat(0x3a3d42,{metalness:0.4,roughness:0.5});
const trunkG=new THREE.CylinderGeometry(0.15,0.2,3,6),leafG=(()=>{const g=new THREE.SphereGeometry(1.8,16,12),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+0.1*Math.sin(x*3.3+y*2.1)*Math.sin(z*2.7+x);p.setXYZ(i,x*n,y*n,z*n);}g.computeVertexNormals();return g;})();
const poleG=new THREE.CylinderGeometry(0.08,0.1,6.5,6),headG=new THREE.BoxGeometry(0.9,0.18,0.35),headM=mat(0xdddddd);
const cityLeafMs=[0x4d6b35,0x5d7a38,0x3f5e2f,0x6b8a3c].map(c=>mat(c));
function tree(x,z){if(addMaple(x,CURB,z,6+Math.random()*3)){obstaclesCirc.push({x,z,r:0.3});return;}const t=new THREE.Mesh(trunkG,trunkM);t.position.set(x,1.65+CURB,z);t.castShadow=true;scene.add(t);
  const l=new THREE.Mesh(leafG,cityLeafMs[(Math.random()*4)|0]);l.rotation.y=Math.random()*6;l.scale.y=0.85+Math.random()*0.3;l.position.set(x,4+CURB,z);l.scale.setScalar(0.85+Math.random()*0.4);l.castShadow=true;scene.add(l);obstaclesCirc.push({x,z,r:0.3});}
const lampPos=[];
function lamp(x,z){lampPos.push([x,z]);const p=new THREE.Mesh(poleG,poleM);p.position.set(x,3.25+CURB,z);p.castShadow=true;scene.add(p);
  const h=new THREE.Mesh(headG,headM);h.position.set(x,6.5+CURB,z);scene.add(h);obstaclesCirc.push({x,z,r:0.15});}
parkTrees.forEach(([x,z])=>tree(x,z));
const SWX=ROAD_HALF+1.2;
RL.forEach(p=>{for(let s=-L+8;s<L-8;s+=11){if(RL.some(q=>Math.abs(s-q)<(RB&&(q===RB.x||q===RB.z)?19:15)))continue;const k2=((s+L)/11|0)%2;
  [1,-1].forEach(k=>{ if(k2){tree(s,p+k*(SWX+0.6));tree(p+k*(SWX+0.6),s);} else {lamp(s,p+k*SWX);lamp(p+k*SWX,s);} });}});
// fermate dell'autobus e cestini sui marciapiedi
if(PROPS){const BUSR=0;const segs=[-L,...RL,L];let nb=0;
  RL.forEach((p,pi)=>{for(let q=0;q<segs.length-1;q++){if(Math.random()<0.55||nb>=8)continue;const a=segs[q],b=segs[q+1];if(b-a<60)continue;
    const s0=Math.round(((a+b)/2+L-5.5)/11)*11-L+5.5,k=Math.random()<0.5?1:-1,ax=Math.random()<0.5;const off=ROAD_HALF+SIDEWALK-0.95;
    const x=ax?s0:p+k*off,z=ax?p+k*off:s0,rot=ax?(k>0?Math.PI:0):(k>0?-Math.PI/2:Math.PI/2);
    const o=placeProp('bus',x,CURB,z,rot+BUSR);if(o){nb++;obstaclesCirc.push({x,z,r:0.8});}}});
  let li=0;lampPos.forEach(([x,z])=>{if((li++)%4)return;const onX=RL.some(p=>Math.abs(Math.abs(z-p)-SWX)<0.3);placeProp(Math.random()<0.85?'bin':'bigbin',onX?x+2.2:x+(x>0?0.5:-0.5)*0,CURB,onX?z:z+2.2,onX?0:Math.PI/2);});}
// unione delle mesh fisse della città: da migliaia di oggetti a poche decine (meno lavoro per il telefono)
(function mergeCity(){const list=scene.children.slice(CITY_C0).filter(o=>o.isMesh&&!o.isInstancedMesh&&!o.isSkinnedMesh&&o.geometry&&o.geometry.attributes.position&&o.geometry.attributes.normal&&o.geometry.attributes.uv);
  const by=new Map();list.forEach(o=>{o.updateMatrixWorld(true);const b=gBake(o,o.matrixWorld),mats=Array.isArray(o.material)?o.material:[o.material],gr=o.geometry.groups.length?o.geometry.groups:[{start:0,count:b.idx.length,materialIndex:0}];
    const cx=Math.floor(o.position.x/120),cz=Math.floor(o.position.z/120);
    gr.forEach(G=>{const m=mats[G.materialIndex||0];if(!m)return;const key=m.uuid+'|'+cx+','+cz+'|'+o.castShadow+o.receiveShadow;if(!by.has(key))by.set(key,{m,cs:o.castShadow,rs:o.receiveShadow,list:[]});
      by.get(key).list.push({pos:b.pos,nor:b.nor,uv:b.uv,n:b.n,hasN:true,idx:b.idx.subarray(G.start,G.start+Math.min(G.count,b.idx.length-G.start))});});
    scene.remove(o);});
  by.forEach(G=>{const me=new THREE.Mesh(gMerge(G.list),G.m);me.castShadow=G.cs;me.receiveShadow=G.rs;scene.add(me);});})();


// ================= CAMPAGNA: STRADA VELOCE AD ANELLO, STERRATO, CAMPI =================
// griglia spaziale per ostacoli numerosi (alberi, guardrail)
const GRID=20,grid=new Map();
const gk=(i,j)=>i*100003+j;
function gridAdd(it,x0,z0,x1,z1){const m=4;for(let i=Math.floor((x0-m)/GRID);i<=Math.floor((x1+m)/GRID);i++)for(let j=Math.floor((z0-m)/GRID);j<=Math.floor((z1+m)/GRID);j++){const k=gk(i,j);let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(it);}}
const gridQ=(x,z)=>grid.get(gk(Math.floor(x/GRID),Math.floor(z/GRID)))||[];
// percorsi (polilinee) con lunghezza, punto/direzione a distanza s e proiezione
function makePath(pts,closed){
  const n=pts.length,segs=closed?n:n-1,cum=[0];
  for(let i=0;i<segs;i++){const a=pts[i],b=pts[(i+1)%n];cum.push(cum[i]+Math.hypot(b[0]-a[0],b[1]-a[1]));}
  const P={pts,closed,cum,len:cum[segs]};
  P.raw=(s)=>{s=closed?((s%P.len)+P.len)%P.len:Math.max(0,Math.min(P.len-1e-6,s));let lo=0,hi=segs-1;while(lo<hi){const m=(lo+hi+1)>>1;if(cum[m]<=s)lo=m;else hi=m-1;}
    const a=pts[lo],b=pts[(lo+1)%n],l=cum[lo+1]-cum[lo],t=(s-cum[lo])/l;return{x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t};};
  P.at=(s)=>{const p=P.raw(s),a=P.raw(s-2),b=P.raw(s+2);let dx=b.x-a.x,dz=b.z-a.z;const l=Math.hypot(dx,dz)||1;return{x:p.x,z:p.z,dx:dx/l,dz:dz/l};};
  P.proj=(x,z)=>{let best=1e18,bs=0;for(let i=0;i<segs;i++){const a=pts[i],b=pts[(i+1)%n],l=cum[i+1]-cum[i],dx=(b[0]-a[0])/l,dz=(b[1]-a[1])/l;
      let t=(x-a[0])*dx+(z-a[1])*dz;t=Math.max(0,Math.min(l,t));const px=a[0]+dx*t,pz=a[1]+dz*t,d2=(x-px)**2+(z-pz)**2;if(d2<best){best=d2;bs=cum[i]+t;}}
    const q=P.at(bs);return{s:bs,lat:(x-q.x)*(-q.dz)+(z-q.z)*q.dx,dx:q.dx,dz:q.dz,dist:Math.sqrt(best)};};
  return P;}
function ribbon(path,o0,o1,y,m,uW,vStep,step,skip){
  const N=Math.ceil(path.len/step),pos=[],uv=[],idx=[];
  for(let i=0;i<=N;i++){const sv=Math.min(i*step,path.len),q=path.at(sv),rx=-q.dz,rz=q.dx;
    const x0=q.x+rx*o0,z0=q.z+rz*o0,x1=q.x+rx*o1,z1=q.z+rz*o1;pos.push(x0,y+(path.hy?path.hy(sv):TH(x0,z0)),z0,x1,y+(path.hy?path.hy(sv):TH(x1,z1)),z1);uv.push(0,sv/vStep,uW,sv/vStep);}
  for(let i=0;i<N;i++){if(skip){const q=path.at(i*step+step/2),o=(o0+o1)/2;if(skip(q.x-q.dz*o,q.z+q.dx*o))continue;}const a=2*i,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const me=new THREE.Mesh(g,m);me.receiveShadow=true;scene.add(me);return me;}
function wall(path,o,y0,y1,m,step,skip,collR){
  const N=Math.ceil(path.len/step),pos=[],idx=[];
  for(let i=0;i<=N;i++){const sv=Math.min(i*step,path.len),q=path.at(sv),x=q.x-q.dz*o,z=q.z+q.dx*o,hb=path.hy?path.hy(sv):TH(x,z);pos.push(x,hb+y0,z,x,hb+y1,z);}
  for(let i=0;i<N;i++){const q=path.at(i*step+step/2),x=q.x-q.dz*o,z=q.z+q.dx*o;if(skip&&skip(x,z))continue;const a=2*i;idx.push(a,a+1,a+2,a+1,a+3,a+2);
    if(collR){const x1=pos[a*3],z1=pos[a*3+2],x2=pos[(a+2)*3],z2=pos[(a+2)*3+2];gridAdd({seg:1,x1,z1,x2,z2,r:collR},Math.min(x1,x2),Math.min(z1,z2),Math.max(x1,x2),Math.max(z1,z2));}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  const me=new THREE.Mesh(g,m);me.castShadow=true;me.receiveShadow=true;scene.add(me);return me;}
function dashes(path,o,w,dash,gap,y,m,skip){const pos=[],idx=[];let k=0;
  for(let sv=0;sv+dash<path.len;sv+=dash+gap){const a=path.at(sv),b=path.at(sv+dash);if(skip&&skip(a.x,a.z))continue;
    [[a,o-w/2,sv],[a,o+w/2,sv],[b,o-w/2,sv+dash],[b,o+w/2,sv+dash]].forEach(([q,oo,ss])=>{const x=q.x-q.dz*oo,z=q.z+q.dx*oo;pos.push(x,y+(path.hy?path.hy(ss):TH(x,z)),z);});idx.push(k,k+1,k+2,k+1,k+3,k+2);k+=4;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);scene.add(new THREE.Mesh(g,m));}


// --- anello veloce (strada extraurbana a carreggiate separate, 110 km/h) ---
const RC={x:900,z:0},RH=450,RR=170,RX0=RC.x-RH-9.6;
function ringSDF(x,z){const qx=Math.abs(x-RC.x)-(RH-RR),qz=Math.abs(z-RC.z)-(RH-RR);return Math.hypot(Math.max(qx,0),Math.max(qz,0))+Math.min(Math.max(qx,qz),0)-RR;}
const ringPts=[];[[RC.x+RH-RR,RC.z+RH-RR,0],[RC.x-RH+RR,RC.z+RH-RR,Math.PI/2],[RC.x-RH+RR,RC.z-RH+RR,Math.PI],[RC.x+RH-RR,RC.z-RH+RR,1.5*Math.PI]].forEach(([cx,cz,a0])=>{
  const n=Math.ceil(RR*Math.PI/2/4);for(let i=0;i<=n;i++){const a=a0+i/n*Math.PI/2;ringPts.push([cx+Math.cos(a)*RR,cz+Math.sin(a)*RR]);}});
const ringPath=makePath(ringPts,true),ringPathR=makePath(ringPts.slice().reverse(),true);

// ================= RILIEVI: colline nella campagna, versante montano con strada a tornanti =================
const sstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const softp=(x,k)=>k*Math.log(1+Math.exp(x/k));
const MT_LEGS=6+((Math.random()*3)|0),MT={x0:Math.round(rr(1450,1510)),zc:-20,k:rr(0.4,0.5)};MT.x1=MT.x0+MT_LEGS*64-14;const MT_ZA=Math.round(rr(180,220)),MT_ZB=-Math.round(rr(200,260));
function hillsH(x,z){const w=sstep(470,650,x)*(1-sstep(2450,2650,x))*(1-sstep(1050,1250,Math.abs(z)));if(w<=0)return 0;
  return w*(6.5+3.5*Math.sin(x/97+HP[0])*Math.sin(z/123+HP[1])+2.5*Math.sin(x/61+z/83+HP[2])+0.6*Math.sin(x/23-z/31));}
const HP=[rr(0,6),rr(0,6),rr(0,6)];
function mountH(x,z){if(x<MT.x0-150)return 0;const prof=MT.k*(softp(x-MT.x0,30)-softp(x-MT.x1,30));
  const zf=1-sstep(330,520,Math.abs(z-MT.zc)),back=1-sstep(2250,2550,x);
  return Math.max(0,prof*zf*back+ (prof>5?(3*Math.sin(x/41)*Math.sin(z/37)+1.5*Math.sin(z/17+x/29)):0)*zf);}
const Hbase=(x,z)=>hillsH(x,z)+mountH(x,z);
// tracciato della strada di montagna: rettilineo d'accesso, 7 tornanti, belvedere in cima
const mPts=[];{for(let x=RC.x+RH+10;x<MT.x0-12;x+=8)mPts.push([x,200+(x-RC.x-RH-10)/(MT.x0-RC.x-RH-22)*(MT_ZA-200)]);
  let x=MT.x0-10,dir=-1;const zA=MT_ZA,zB=MT_ZB,r=12;
  for(let i=0;i<MT_LEGS;i++){const zs=dir<0?zA:zB,ze=dir<0?zB:zA;const n=Math.ceil(Math.abs(ze-zs)/8);
    for(let j=0;j<=n;j++){const t=j/n;mPts.push([x+40*t,zs+(ze-zs)*t]);}
    if(i<MT_LEGS-1){const cx=x+40+r,cz=ze;for(let j=1;j<12;j++){const an=Math.PI-dir*(j/12)*Math.PI;mPts.push([cx+Math.cos(an)*r,cz+Math.sin(an)*r]);}
      x+=40+2*r;dir=-dir;}
    else{x+=40;for(let k=1;k<=12;k++)mPts.push([x+k*8+ (k===1?0:0),ze]);}}}
const mPath=makePath(mPts,false);
const mGap=(x,z)=>Math.hypot(x-(RC.x+RH+10),z-200)<12,lGap=(x,z)=>Math.hypot(x-900,z-(RC.z+RH+10))<12;
// quota della strada: terreno lungo l'asse, poi media mobile (pendenza costante, niente gradini nei tornanti)
{const N=Math.ceil(mPath.len/4)+1,raw=[];for(let i=0;i<N;i++){const q=mPath.raw(i*4);raw.push(Hbase(q.x,q.z));}
 let sm=raw.slice();for(let it=0;it<3;it++){const o=sm.slice();for(let i=0;i<N;i++){let a=0,c=0;for(let j=-12;j<=12;j++){const k=Math.max(0,Math.min(N-1,i+j));a+=o[k];c++;}sm[i]=a/c;}}
 sm[0]=raw[0];mPath.hArr=sm;mPath.hy=(sv)=>{const f=Math.max(0,Math.min(N-1.001,sv/4)),i=Math.floor(f),t=f-i;return sm[i]*(1-t)+sm[Math.min(N-1,i+1)]*t;};}
const MB={x0:RC.x+RH-5,x1:MT.x1+130,z0:Math.min(-290,MT_ZB-40),z1:Math.max(250,MT_ZA+40)};
function mRoad(x,z){if(x<MB.x0||x>MB.x1||z<MB.z0||z>MB.z1)return null;const q=mPath.proj(x,z);return q;}
const LK={x:Math.round(rr(900,1120)),z:Math.round(rr(1050,1110)),rx:Math.round(rr(260,340)),rz:Math.round(rr(140,185))};
function lakeE(x,z){return Math.hypot((x-LK.x)/LK.rx,(z-LK.z)/LK.rz);}
function dirtRelief(x,z){const dx=x-RC.x,dz=z-RC.z,th=Math.atan2(dz,dx),d=Math.abs(Math.hypot(dx,dz)-dirtR(th));if(d>45)return 0;
  return (DRL[0]*Math.sin(DRL[3]*th+0.5)+DRL[1]*Math.sin(15*th+DRL[4])+1.5*Math.sin(29*th))*(1-sstep(6,45,d));}
const DRL=[rr(5,8),rr(2.5,4.5),0,5+((Math.random()*3)|0),rr(0,6)];
function TH(x,z){if(NW&&x>6000&&NW.inside(x,z))return NW.H(x,z);return TH0(x,z);}
function TH0(x,z){if(x<L+3||window.__flat)return 0;let h=Hbase(x,z);
  if(ringSDF(x,z)<-14)h+=dirtRelief(x,z);
  {const e=lakeE(x,z);if(e<1.35){const k=1-sstep(0.92,1.2,e);h=h*(1-k)+(-3.2)*k;}}const q=mRoad(x,z);if(q&&q.dist<24){const hr=mPath.hy(q.s);h=hr+(h-hr)*sstep(8,22,q.dist);}
  if(Math.abs(ringSDF(x,z))<16){/* ok: l'anello segue le colline */}return h;}


const westGap=(x,z)=>Math.hypot(x-(RC.x-RH-5),z-RC.z)<13, eastGap=(x,z)=>Math.hypot(x-(RC.x+RH-10),z-RC.z)<8;
const lineM=new THREE.MeshBasicMaterial({color:0xf0f0f0}),railM=mat(0xb8bcc2,{metalness:0.7,roughness:0.35,side:THREE.DoubleSide}),njM=mat(0xc9c5bd,{side:THREE.DoubleSide});
uvScale(ribbon(ringPath,-9.6,9.6,0.02,roadMat,3.2,6,4).geometry,1,1);
ribbon(ringPath,7.75,7.9,0.03,lineM,1,1,4);ribbon(ringPath,-7.9,-7.75,0.03,lineM,1,1,4);
ribbon(ringPath,0.95,1.1,0.03,lineM,1,1,4,westGap);ribbon(ringPath,-1.1,-0.95,0.03,lineM,1,1,4,westGap);
dashes(ringPath,4.4,0.15,4.5,7.5,0.03,lineM);dashes(ringPath,-4.4,0.15,4.5,7.5,0.03,lineM);
// spartitraffico in cemento (new jersey) e guardrail con paletti
wall(ringPath,0.28,0,0.85,njM,4,westGap,0.45);wall(ringPath,-0.28,0,0.85,njM,4,westGap,0);
ribbon(ringPath,-0.28,0.28,0.85,njM,1,1,4,westGap);
wall(ringPath,9.9,0.45,0.8,railM,4,(x,z)=>westGap(x,z)||eastGap(x,z)||mGap(x,z)||lGap(x,z),0.25);wall(ringPath,-9.9,0.45,0.8,railM,4,(x,z)=>westGap(x,z)||eastGap(x,z)||mGap(x,z)||lGap(x,z),0.25);
{const postG=new THREE.BoxGeometry(0.12,0.8,0.12),list=[];for(let sv=0;sv<ringPath.len;sv+=4){const q=ringPath.at(sv);[9.95,-9.95].forEach(o=>{const x=q.x-q.dz*o,z=q.z+q.dx*o;if(!westGap(x,z)&&!eastGap(x,z)&&!mGap(x,z)&&!lGap(x,z))list.push([x,z]);});}
 const im=new THREE.InstancedMesh(postG,mat(0x8d9096,{metalness:0.6}),list.length),o=new THREE.Object3D();list.forEach(([x,z],i)=>{o.position.set(x,TH(x,z)+0.4,z);o.updateMatrix();im.setMatrixAt(i,o.matrix);});scene.add(im);}

// paletti delineatori bianchi con catarifrangente, ogni 25 m
{const list=[];for(let sv=0;sv<ringPath.len;sv+=25){const q=ringPath.at(sv);[10.6,-10.6].forEach(o=>{const x=q.x-q.dz*o,z=q.z+q.dx*o;if(!westGap(x,z)&&!eastGap(x,z))list.push([x,z]);});}
 for(let x=L+15;x<RX0-10;x+=25)[ROAD_HALF+0.7,-(ROAD_HALF+0.7)].forEach(z=>list.push([x,z]));
 const pg=new THREE.BoxGeometry(0.12,1.0,0.12),im=new THREE.InstancedMesh(pg,mat(0xf2f2f0),list.length),o=new THREE.Object3D();
 const rf=new THREE.InstancedMesh(new THREE.BoxGeometry(0.13,0.18,0.13),new THREE.MeshStandardMaterial({color:0x111111,emissive:0xff7a00,emissiveIntensity:0.25}),list.length);
 list.forEach(([x,z],i)=>{const hh=TH(x,z);o.position.set(x,hh+0.5,z);o.updateMatrix();im.setMatrixAt(i,o.matrix);o.position.y=hh+0.85;o.updateMatrix();rf.setMatrixAt(i,o.matrix);});scene.add(im);scene.add(rf);}
// --- raccordo città → anello (70 km/h) ---
{const len=RX0-L+0.5,xm=(L+RX0)/2;roadPlane(ROAD_HALF*2,len,xm,0,Math.PI/2);
 for(let x=L+6;x<RX0-6;x+=12)stripe(4.5,0.15,x,0);stripe(len,0.14,xm,ROAD_HALF-0.4);stripe(len,0.14,xm,-(ROAD_HALF-0.4));}

// --- sterrato: anello ondulato dentro la tangenziale + accesso dalla carreggiata est ---
const DR=[rr(35,60),rr(0,6),rr(15,30),rr(0,6),(Math.random()<0.5?3:4)],dirtR=th=>250+DR[0]*Math.sin(DR[4]*th+DR[1])+DR[2]*Math.sin(5*th+DR[3]);
const dirtPts=[];for(let i=0;i<240;i++){const th=i/240*Math.PI*2;dirtPts.push([RC.x+Math.cos(th)*dirtR(th),RC.z+Math.sin(th)*dirtR(th)]);}
const dirtPath=makePath(dirtPts,true),accessPath=makePath([[RC.x+RH-9,0],[RC.x+RH-60,7],[RC.x+RH-110,-5],[RC.x+dirtR(0)+2,0]],false);
const dirtMat=mat(0xffffff,{map:dirtTex,roughness:1});
ribbon(dirtPath,-3.4,3.4,0.018,dirtMat,1,7,3);ribbon(accessPath,-3,3,0.019,dirtMat,1,7,3);
function dirtDist(x,z){const dx=x-RC.x,dz=z-RC.z,th=Math.atan2(dz,dx);let d=Math.abs(Math.hypot(dx,dz)-dirtR(th));
  if(x>RC.x+150&&Math.abs(z)<20)d=Math.min(d,accessPath.proj(x,z).dist);return d;}

// --- superfici e quote del terreno ---
function surfaceAt(x,z){if(window.__surf)return window.__surf;if(NW&&x>6000&&NW.inside(x,z))return NW.surf(x,z);return surfaceAt0(x,z);}
function surfaceAt0(x,z){
  if(Math.abs(x)<=L+3&&Math.abs(z)<=L+3)return 'asphalt';
  if(x>L&&x<RX0+2&&Math.abs(z)<ROAD_HALF+0.4)return 'asphalt';
  if(Math.abs(ringSDF(x,z))<9.7)return 'asphalt';
  {const q2=lRoad(x,z);if(q2&&q2.dist<4.2)return 'asphalt';}
  if(lakeE(x,z)<1.0)return 'water';
  {const q=mRoad(x,z);if(q&&q.dist<4.4)return 'asphalt';if(mPath.endDisc&&Math.hypot(x-mPath.endDisc.x,z-mPath.endDisc.z)<16)return 'asphalt';}
  if(dirtDist(x,z)<3.3)return 'dirt';
  return 'grass';}
const SURF={water:{mu:0.3,rr:0.35,amp:0.02},asphalt:{mu:1,rr:0.012,amp:0.003},dirt:{mu:0.66,rr:0.03,amp:0.045},grass:{mu:0.55,rr:0.055,amp:0.06}};
