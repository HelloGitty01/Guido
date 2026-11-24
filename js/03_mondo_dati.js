// Guido · 03 mondo dati — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// =====================================================================================
// ================= NORD-OVEST REALE: dati OpenStreetMap + quote reali =================
// Centri di Milano, Como e Biella in scala 1:1; campagna compressa 2,5 volte; quote divise per 2.
// Il mondo originale resta attorno all'origine, lontano: qui si vive da x,z > 6800.
// =====================================================================================
NW=(()=>{const D=window.NWDATA;if(!D)return null;
  const J=D.j,M=J.meta,[GX0,GZ0,GS,GNX,GNZ]=M.grid,HM=D.hm,LM=D.lm;
  const GX1=GX0+(GNX-1)*GS,GZ1=GZ0+(GNZ-1)*GS;
  const inside=(x,z)=>x>GX0+1&&z>GZ0+1&&x<GX1-1&&z<GZ1-1;
  function Hg(x,z){let fx=(x-GX0)/GS,fz=(z-GZ0)/GS;fx=fx<0?0:fx>GNX-1.001?GNX-1.001:fx;fz=fz<0?0:fz>GNZ-1.001?GNZ-1.001:fz;
    const i=fx|0,j=fz|0,u=fx-i,v=fz-j,k=j*GNX+i;return (HM[k]*(1-u)+HM[k+1]*u)*(1-v)+(HM[k+GNX]*(1-u)+HM[k+GNX+1]*u)*v;}
  function lakeAt(x,z){const i=Math.round((x-GX0)/GS),j=Math.round((z-GZ0)/GS);if(i<0||j<0||i>=GNX||j>=GNZ)return 0;return LM[j*GNX+i];}
  const lakes=J.lakes.map(([n,lv,p,holes])=>({n,lv,p,holes}));
  const cities=M.cities;
  // ---------- strade ----------
  const roads=J.roads.map(([c,o,w,ms,n,ref,b,t,p])=>{const N=p.length/3,X=new Float64Array(N),Z=new Float64Array(N),Hh=new Float32Array(N),cum=new Float32Array(N);
    for(let i=0;i<N;i++){X[i]=p[i*3];Z[i]=p[i*3+1];Hh[i]=p[i*3+2];if(i)cum[i]=cum[i-1]+Math.hypot(X[i]-X[i-1],Z[i]-Z[i-1]);}
    return {c,o,w,ms,n,ref,b,t,X,Z,Hh,cum,N};});
  // indice spaziale (celle da 64 m) dei segmenti percorribili, con margine per lo spianamento del terreno
  const HC=64,hash=new Map(),hk=(i,j)=>i*1000003+j;
  roads.forEach((R,ri)=>{if(R.c>=10)return;const m=Math.min(60,R.w/2+40);for(let i=0;i<R.N-1;i++){
    const x0=Math.min(R.X[i],R.X[i+1])-m,x1=Math.max(R.X[i],R.X[i+1])+m,z0=Math.min(R.Z[i],R.Z[i+1])-m,z1=Math.max(R.Z[i],R.Z[i+1])+m;
    for(let a=Math.floor(x0/HC);a<=Math.floor(x1/HC);a++)for(let b=Math.floor(z0/HC);b<=Math.floor(z1/HC);b++){const k=hk(a,b);let l=hash.get(k);if(!l)hash.set(k,l=[]);l.push(ri,i);}}});
  function hCurve(R,i,t){const H=R.Hh,p1=H[i],p2=H[i+1],p0=i>0?H[i-1]:2*p1-p2,p3=i+2<R.N?H[i+2]:2*p2-p1,t2=t*t,t3=t2*t;
    // con dislivelli bruschi (rampe, ponti) resta lineare per non creare gobbe
    if(Math.abs(p0-p1)>3||Math.abs(p3-p2)>3)return p1+(p2-p1)*t;
    return 0.5*(2*p1+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);}
  // tutti i segmenti strada vicini a (x,z) entro "lim" oltre il bordo carreggiata
  const QR=[];
  function near(x,z,lim){QR.length=0;const l=hash.get(hk(Math.floor(x/HC),Math.floor(z/HC)));if(!l)return QR;
    for(let q=0;q<l.length;q+=2){const R=roads[l[q]],i=l[q+1],ax=R.X[i],az=R.Z[i],ex=R.X[i+1]-ax,ez=R.Z[i+1]-az,l2=ex*ex+ez*ez||1e-9;
      let t=((x-ax)*ex+(z-az)*ez)/l2;t=t<0?0:t>1?1:t;const d=Math.hypot(x-ax-t*ex,z-az-t*ez);if(d>R.w/2+lim)continue;
      QR.push({R,i,t,d,h:hCurve(R,i,t),side:(x-ax)*ez-(z-az)*ex});}return QR;}
  // terreno spianato attorno alle strade (trincee e rilevati raccordati)
  function Hground(x,z){let g=Hg(x,z);if(!inside(x,z))return g;const L=near(x,z,60);if(!L.length)return g;
    const W=[];for(const q of L){if(q.R.t||q.R.c>=9)continue;const hw=q.R.w/2+1,dh=g-q.h;let w=0;
      if(dh>=0)w=1-sstep(hw+3,hw+15+1.6*dh,q.d);else w=(1-sstep(hw,hw+2+2*(-dh),q.d))*(1-sstep(3,7.5,-dh));
      if(w>0)W.push([w,q.h-0.1]);}
    if(!W.length)return g;W.sort((a,b)=>a[0]-b[0]);for(const [w,t] of W)g=g*(1-w)+t*w;return g;}
  // superficie su cui poggia l'auto: tra terreno, strade, ponti e gallerie sceglie quella giusta in base alla quota attuale
  const api={yh:NaN};
  // incroci del grafo stradale (per interrompere i marciapiedi)
  const JNx=[],JNz=[],jh=new Map();{const nd=J.nodes||[];for(let i=0;i<nd.length;i+=2){const k=hk(Math.floor(nd[i]/50),Math.floor(nd[i+1]/50));let l=jh.get(k);if(!l)jh.set(k,l=[]);l.push(nd[i],nd[i+1]);}}
  function nearJ(x,z,r){const ci=Math.floor(x/50),cj=Math.floor(z/50);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const l=jh.get(hk(ci+a,cj+b));if(l)for(let q=0;q<l.length;q+=2)if(Math.abs(l[q]-x)<r&&Math.abs(l[q+1]-z)<r&&Math.hypot(l[q]-x,l[q+1]-z)<r)return true;}return false;}
  const SWW=4.0,SWH=0.16,swRoad=R=>R.c>=4&&R.c<=7&&!R.b&&!R.t;
  const BRX=1.35;   // banchina dei ponti: spazio fra la carreggiata e il parapetto
  function sidewalk(x,z){if(!cityAt(x,z))return null;const L=near(x,z,SWW+0.1);for(const q of L){if(!swRoad(q.R))continue;if(q.d<q.R.w/2)return null;}
    for(const q of L){if(swRoad(q.R)&&q.d>=q.R.w/2&&q.d<q.R.w/2+SWW&&!nearJ(x,z,11))return q.h+SWH;}return null;}
  function H(x,z){const g=Hground(x,z);if(!inside(x,z))return g;const L0=near(x,z,BRX+0.2),ct=L0.length?!!cityAt(x,z):false,L=L0.filter(q=>q.d<=q.R.w/2+(q.R.b?BRX+0.15:ct&&swRoad(q.R)?0.05:0.6));
    if(!L.length){const sw=sidewalk(x,z);return sw!=null?Math.max(g,sw):g;}
    const yh=api.yh;
    // la strada alla quota dell'auto più vicina al proprio asse (non la più alta): niente gradini agli incroci, niente terreno nascosto
    {let best=null,bs=1e9;for(const q of L){if(!isNaN(yh)&&Math.abs(q.h-yh)>1.6)continue;if(isNaN(yh)&&q.h>g+2.5)continue;const s=q.d/(q.R.w/2+0.6);if(s<bs){bs=s;best=q;}}if(best)return best.h+0.05;}
    // nessuna strada alla quota dell'auto: si passa sopra o sotto (ponti e gallerie)
    let tun=false;const C=[];for(const q of L){C.push(q.h+0.05);if(q.R.t)tun=true;}
    if(!(tun&&g>(isNaN(yh)?-1e9:yh)+2.5))C.push(g);
    if(isNaN(yh)){let best=-1e9;for(const s of C)if(s<g+2.5&&s>best)best=s;return best>-1e9?best:g;}
    let best=-1e9,low=1e9;for(const s of C){if(s<=yh+1.1&&s>best)best=s;if(s<low)low=s;}return best>-1e9?best:low;}
  function roadAt(x,z,lim){const L=near(x,z,lim||0.3);if(!L.length)return null;const yh=api.yh;let best=null,bs=1e9;
    for(const q of L){const s=isNaN(yh)?q.d:Math.abs(q.h-yh)*4+q.d;if(s<bs){bs=s;best=q;}}return best;}
  function cityAt(x,z){for(const c of cities){const d=Math.hypot(x-c.wx,z-c.wz);if(d<c.r1)return c;}return null;}
  // paesi generati (fuori dai centri reali)
  const places=J.places.map(([n,t,x,z,pop,inC])=>({n,t,x,z,pop,inC,R:t===0?Math.min(950,Math.max(500,Math.sqrt(pop||60000)*2.6)):t===1?Math.min(480,Math.max(170,Math.sqrt(pop||12000)*2.4)):Math.min(170,Math.max(70,Math.sqrt(pop||1500)*2.2))}));
  const BIG={Milano:3500,Como:2400,Biella:2300};places.forEach(p=>{if(p.inC&&p.t===0&&BIG[p.n])p.R=BIG[p.n];});
  const PC=500,phash=new Map();places.forEach((p,pi)=>{if(p.inC&&!(p.t===0&&BIG[p.n]))return;for(let a=Math.floor((p.x-p.R)/PC);a<=Math.floor((p.x+p.R)/PC);a++)for(let b=Math.floor((p.z-p.R)/PC);b<=Math.floor((p.z+p.R)/PC);b++){const k=hk(a,b);let l=phash.get(k);if(!l)phash.set(k,l=[]);l.push(pi);}});
  function placeAt(x,z){const l=phash.get(hk(Math.floor(x/PC),Math.floor(z/PC)));if(!l)return null;let best=null,bv=1e9;for(const pi of l){const p=places[pi],d=Math.hypot(x-p.x,z-p.z)/p.R;if(d<1&&d<bv){bv=d;best=p;}}return best?{p:best,f:bv}:null;}
  function surf(x,z){if(window.HOMEZ&&HOMEZ(x,z))return 'asphalt';const q=roadAt(x,z,0.6);if(q)return 'asphalt';
    const lk=lakeAt(x,z);if(lk&&Hg(x,z)<lakes[lk-1].lv-0.3)return 'water';
    if(cityAt(x,z))return 'asphalt';return 'grass';}
  function limit(x,z){const q=roadAt(x,z,2);const urb=!!cityAt(x,z)||!!placeAt(x,z);
    if(q){if(q.R.ms)return q.R.ms;const c=q.R.c;return c===0?130:c===1?80:c===2?(q.R.o?110:90):c===3?70:c<=5?(urb?50:90):c===6?(urb?50:70):c===7?50:30;}
    return urb?50:90;}
  return Object.assign(api,{BRX,nearJ,sidewalk,SWW,SWH,swRoad,inside,Hg,Hground,H,near,roadAt,surf,limit,lakeAt,lakes,roads,cities,places,placeAt,cityAt,J,M,GX0,GZ0,GX1,GZ1,HC,hk,hash});
})();


function bumps(x,z,amp){let h=amp*(Math.sin(x*0.9)*Math.sin(z*1.1)+0.5*Math.sin(x*2.3+z*1.7)+0.3*Math.sin(x*5.1-z*4.3));
  if(amp>0.03&&Math.abs(Math.sin(x*0.37)*Math.sin(z*0.41))>0.985)h-=0.07;return h;}

// --- terreno ---
const fieldsList=[];for(let i=0;i<46;i++){const w=70+Math.random()*130,d=60+Math.random()*120,x=L+60+Math.random()*1500,z=-900+Math.random()*1800;if(x>MT.x0-60&&Math.abs(z-MT.zc)<520)continue;fieldsList.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,c:[[0.86,0.77,0.42],[0.62,0.74,0.36],[0.6,0.47,0.33],[0.72,0.8,0.42]][i%4]});}
{const xs=[],zs=[];for(let x=L+3;x<2700;x+=(x>MB.x0-20&&x<MB.x1+40)?5:12)xs.push(x);xs.push(2700);
 for(let z=-1300;z<1300;z+=(z>MB.z0-40&&z<MB.z1+40)?5:12)zs.push(z);zs.push(1300);
 const nx=xs.length,nz=zs.length,pos=new Float32Array(nx*nz*3),col=new Float32Array(nx*nz*3),uv=new Float32Array(nx*nz*2),idx=[];
 const Hs=new Float32Array(nx*nz);
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const x=xs[i],z=zs[j],k=j*nx+i,h=TH(x,z);Hs[k]=h;pos.set([x,h-0.02,z],k*3);uv.set([x/9,z/9],k*2);}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*nx+i,x=xs[i],z=zs[j];
   const hx=(Hs[j*nx+Math.min(nx-1,i+1)]-Hs[j*nx+Math.max(0,i-1)])/Math.max(1,xs[Math.min(nx-1,i+1)]-xs[Math.max(0,i-1)]);
   const hz=(Hs[Math.min(nz-1,j+1)*nx+i]-Hs[Math.max(0,j-1)*nx+i])/Math.max(1,zs[Math.min(nz-1,j+1)]-zs[Math.max(0,j-1)]);
   const slope=Math.hypot(hx,hz),n=0.9+0.1*Math.sin(x*0.05)*Math.sin(z*0.07);
   let c=[n*0.8,n*0.82,n*0.78];const f=fieldsList.find(f=>x>f.x0&&x<f.x1&&z>f.z0&&z<f.z1);if(f)c=f.c.map(v=>v*1.05);
   const rock=sstep(0.55,0.9,slope),alt=sstep(60,170,Hs[k]);
   c=c.map((v,ii)=>v*(1-rock)+[0.62,0.6,0.56][ii]*1.3*rock);c=c.map((v,ii)=>v*(1-alt*0.35)+[0.45,0.55,0.4][ii]*alt*0.35);
   col.set(c,k*3);}
 for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,c=a+nx,d=c+1;idx.push(a,c,b,b,c,d);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 const tm=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:grassTex,vertexColors:true,roughness:1,envMapIntensity:0.4}));tm.receiveShadow=true;scene.add(tm);}

// --- strada di montagna: asfalto, linee, guardrail su entrambi i lati, belvedere ---
ribbon(mPath,-4.2,4.2,0.03,roadMat,1.4,6,3);ribbon(mPath,3.55,3.68,0.04,lineM,1,1,3);ribbon(mPath,-3.68,-3.55,0.04,lineM,1,1,3);
dashes(mPath,0,0.13,3,4.5,0.04,lineM);
wall(mPath,4.9,0.45,0.8,railM,3,(x,z)=>mGap(x,z)||x<RC.x+RH+30,0.25);wall(mPath,-4.9,0.45,0.8,railM,3,(x,z)=>mGap(x,z)||x<RC.x+RH+30,0.25);
{const postG=new THREE.BoxGeometry(0.12,0.8,0.12),list=[];for(let sv=40;sv<mPath.len;sv+=3.5){const q=mPath.at(sv),h=mPath.hy(sv);[4.95,-4.95].forEach(o=>list.push([q.x-q.dz*o,h,q.z+q.dx*o]));}
 const im=new THREE.InstancedMesh(postG,mat(0x8d9096,{metalness:0.6}),list.length),o=new THREE.Object3D();list.forEach(([x,h,z],i)=>{o.position.set(x,h+0.4,z);o.updateMatrix();im.setMatrixAt(i,o.matrix);});scene.add(im);}
{const e=mPath.at(mPath.len),he=mPath.hy(mPath.len),disc=new THREE.Mesh(new THREE.CircleGeometry(16,28),roadMat);disc.rotation.x=-Math.PI/2;disc.position.set(e.x+10,he+0.025,e.z);scene.add(disc);
 mPath.endDisc={x:e.x+10,z:e.z,h:he};}
// apertura nel guardrail esterno dell'anello verso la montagna
const eastGap2=mGap;

// --- lago con strada lungolago e borgo ---
const lPts=[];for(let z=RC.z+RH+10;z<860;z+=8)lPts.push([900,z]);
for(let i=0;i<=40;i++){const ph=(105-85*i/40)*Math.PI/180;lPts.push([LK.x+1.18*LK.rx*Math.cos(ph),LK.z-1.18*LK.rz*Math.sin(ph)]);}
const lPath=makePath(lPts,false);
ribbon(lPath,-4,4,0.03,roadMat,1.4,6,3);ribbon(lPath,3.4,3.53,0.04,lineM,1,1,3);ribbon(lPath,-3.53,-3.4,0.04,lineM,1,1,3);dashes(lPath,0,0.13,3,4.5,0.04,lineM);
function lRoad(x,z){if(x<860||x>1420||z<RC.z+RH||z>1040)return null;return lPath.proj(x,z);}
{const water=new THREE.Mesh(new THREE.CircleGeometry(1,64),new THREE.MeshStandardMaterial({color:0x2f5f7c,roughness:0.06,metalness:0.3,envMapIntensity:1.3,transparent:true,opacity:0.93}));
 water.scale.set(LK.rx*1.06,LK.rz*1.06,1);water.rotation.x=-Math.PI/2;water.position.set(LK.x,-0.6,LK.z);scene.add(water);
 // pontile in legno
 const woodM=mat(0x8a6a48);const pier=new THREE.Mesh(new THREE.BoxGeometry(3,0.25,40),woodM);pier.position.set(1150,0.1,LK.z-LK.rz*1.0+12);scene.add(pier);
 for(let k=0;k<8;k++){const p=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,2.4,6),woodM);p.position.set(1150+(k%2?1.3:-1.3),-0.9,pier.position.z-18+k*5);scene.add(p);}
 // borgo a fine strada
 const e=lPath.at(lPath.len),cols=[0xe8d3a6,0xd9a27c,0xf0e2c4,0xc98a6a,0xe6c7b8,0xd7b98a];
 for(let i=0;i<14;i++){const a=i/14*Math.PI*1.4-0.3,r=26+Math.random()*30,x=e.x+30+Math.cos(a)*r,z=e.z-10+Math.sin(a)*r*0.8;if(lakeE(x,z)<1.1)continue;
   const w=8+Math.random()*6,d=8+Math.random()*5,h=6+Math.random()*5,h0=TH(x,z)-0.4;const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(cols[i%cols.length],{map:fTex}));b.position.set(x,h0+h/2,z);b.castShadow=b.receiveShadow=true;scene.add(b);
   const rs=new THREE.Shape();rs.moveTo(-d/2-0.4,0);rs.lineTo(0,2.4);rs.lineTo(d/2+0.4,0);rs.lineTo(-d/2-0.4,0);const rg=new THREE.ExtrudeGeometry(rs,{depth:w+0.8,bevelEnabled:false});rg.translate(0,0,-(w+0.8)/2);
   const rf=new THREE.Mesh(rg,mat(0xa4553a));rf.rotation.y=Math.PI/2;rf.position.set(x,h0+h,z);rf.castShadow=true;scene.add(rf);obstaclesBox.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});}
 const tw=new THREE.Mesh(new THREE.BoxGeometry(5,24,5),mat(0xd8c7a4));const tx=e.x+70,tz=e.z-40,th0=TH(tx,tz);tw.position.set(tx,th0+12,tz);tw.castShadow=true;scene.add(tw);
 const sp=new THREE.Mesh(new THREE.ConeGeometry(3.8,7,4),mat(0x8a5a40));sp.position.set(tx,th0+27.5,tz);sp.rotation.y=Math.PI/4;scene.add(sp);obstaclesBox.push({x0:tx-2.5,x1:tx+2.5,z0:tz-2.5,z1:tz+2.5});
 lPath.endPt={x:e.x,z:e.z};}

// --- cartelli stradali ---
function signTex(kind,txt){return canvasTex(128,(g,n)=>{if(kind==='limit'){g.fillStyle='#fff';g.beginPath();g.arc(64,64,60,0,7);g.fill();g.lineWidth=14;g.strokeStyle='#c8102e';g.beginPath();g.arc(64,64,54,0,7);g.stroke();g.fillStyle='#111';g.font='bold 52px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,64,68);}
  else if(kind==='warn'){g.fillStyle='rgba(0,0,0,0)';g.fillRect(0,0,n,n);g.fillStyle='#fff';g.beginPath();g.moveTo(64,6);g.lineTo(124,116);g.lineTo(4,116);g.closePath();g.fill();g.lineWidth=10;g.strokeStyle='#c8102e';g.stroke();g.strokeStyle='#111';g.lineWidth=8;g.beginPath();g.moveTo(52,100);g.lineTo(52,62);g.quadraticCurveTo(52,44,66,44);g.quadraticCurveTo(80,44,80,62);g.lineTo(80,72);g.stroke();}
  else {g.fillStyle='#fff';g.fillRect(0,20,n,88);g.strokeStyle='#111';g.lineWidth=6;g.strokeRect(6,26,n-12,76);g.fillStyle='#111';g.font='bold 30px Arial';g.textAlign='center';g.fillText(txt,64,76);}});}
function dirTex(bg,lines,arrow){return canvasTex(256,(g,n)=>{g.canvas.height=160;g.fillStyle=bg;g.fillRect(0,0,256,160);g.strokeStyle='#fff';g.lineWidth=6;g.strokeRect(6,6,244,148);
  g.fillStyle='#fff';g.font='bold 27px Arial';g.textAlign='left';lines.forEach((l,i)=>g.fillText(l,60,48+i*36));
  if(arrow){g.save();g.translate(32,80);g.rotate(arrow==='up'?0:arrow==='right'?Math.PI/2:-Math.PI/2);g.beginPath();g.moveTo(0,-34);g.lineTo(18,-10);g.lineTo(7,-10);g.lineTo(7,34);g.lineTo(-7,34);g.lineTo(-7,-10);g.lineTo(-18,-10);g.closePath();g.fill();g.restore();}});}
function endCityTex(){return canvasTex(256,(g,n)=>{g.canvas.height=128;g.fillStyle='#fff';g.fillRect(0,0,256,128);g.strokeStyle='#111';g.lineWidth=7;g.strokeRect(5,5,246,118);g.fillStyle='#111';g.font='bold 42px Arial';g.textAlign='center';g.fillText('Milano',128,80);
  g.strokeStyle='#c8102e';g.lineWidth=12;g.beginPath();g.moveTo(20,112);g.lineTo(236,16);g.stroke();});}
function bigSign(x,z,face,tex,w,h){const hh=TH(x,z),gr=new THREE.Group();gr.position.set(x,hh,z);gr.rotation.y=face;
  [-w*0.35,w*0.35].forEach(o=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,2.2+h,8),poleM);p.position.set(o,(2.2+h)/2,-0.03);gr.add(p);});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,roughness:0.5}));m.position.set(0,2.2+h/2,0);gr.add(m);
  const back=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat(0x9a9da2));back.position.set(0,2.2+h/2,-0.02);back.rotation.y=Math.PI;gr.add(back);scene.add(gr);
  const c=Math.cos(face),sn=Math.sin(face);[-w*0.35,w*0.35].forEach(o=>{const px=x+c*o,pz=z-sn*o;gridAdd({x:px,z:pz,r:0.1},px,pz,px,pz);});}
function sign(x,z,face,kind,txt){const h=TH(x,z),g=new THREE.Group();g.position.set(x,h,z);g.rotation.y=face;
  const p=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,2.4,8),poleM);p.position.y=1.2;g.add(p);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(kind==='name'?1.6:0.75,kind==='name'?1.1:0.75),new THREE.MeshStandardMaterial({map:signTex(kind,txt),transparent:true,roughness:0.5,side:THREE.DoubleSide}));m.position.set(0,2.2,0.03);g.add(m);scene.add(g);gridAdd({x,z,r:0.08},x,z,x,z);}
// verso est (uscita dalla città): i cartelli stanno a destra (z>0) e guardano verso ovest
const EB=-Math.PI/2,WB=Math.PI/2;
bigSign(L-40,ROAD_HALF+SIDEWALK-0.6,EB,dirTex('#0a7a3d',['Tangenziale','Montagna · Lago'],'up'),2.6,1.6);
bigSign(L+8,ROAD_HALF+1.5,EB,endCityTex(),1.7,0.85);sign(L+26,ROAD_HALF+1.3,EB,'limit','70');
sign(L+30,-(ROAD_HALF+1.3),WB,'name','Milano');sign(L+14,-(ROAD_HALF+1.3),WB,'limit','50');
bigSign(RX0-70,ROAD_HALF+1.8,EB,dirTex('#0a7a3d',['→ Montagna','→ Lago · Sterrato','← Nord'],'right'),2.8,1.6);
sign(RX0-25,ROAD_HALF+1.3,EB,'limit','110');
// sull'anello: uscite (cartelli sul lato esterno o interno secondo la carreggiata)
bigSign(RC.x+RH+12.5,200+170,0,dirTex('#0a7a3d',['Uscita','Montagna  →'],'right'),2.6,1.3);
bigSign(RC.x+RH+12.5,200+40,0,dirTex('#1f4fa8',['Montagna','tornanti 3,5 km'],'right'),2.4,1.3);
bigSign(RC.x+RH-12.5,-170,Math.PI,dirTex('#7a4a1e',['Sterrato','uscita a destra'],'right'),2.4,1.3);
sign(RC.x+RH+45,200+5.6,EB,'limit','50');sign(RC.x+RH+60,200+5.6,EB,'warn','');
bigSign(750,RC.z+RH+12.5,EB,dirTex('#0a7a3d',['Uscita','Lago  →'],'right'),2.4,1.3);
sign(900+5.6,RC.z+RH+40,Math.PI,'limit','70');bigSign(900+6,RC.z+RH+70,Math.PI,dirTex('#1f4fa8',['Lago','Borgo · Pontile'],'up'),2.4,1.3);
bigSign(RC.x+RH+80,200+6.2,EB,dirTex('#7a4a1e',['Belvedere','Strada di montagna'],'up'),2.6,1.3);
// --- campi coltivati, alberi, pioppi, cascine ---
function freeSpot(x,z,m){if(lakeE(x,z)<1.12)return false;{const q2=lRoad(x,z);if(q2&&q2.dist<8+m)return false;}if(lPath.endPt&&Math.hypot(x-lPath.endPt.x-30,z-lPath.endPt.z)<70)return false;const q=mRoad(x,z);if(q&&q.dist<9+m)return false;if(mPath.endDisc&&Math.hypot(x-mPath.endDisc.x,z-mPath.endDisc.z)<22+m)return false;return !(Math.abs(x)<L+12&&Math.abs(z)<L+12)&&!(x<RX0+15&&Math.abs(z)<16)&&Math.abs(ringSDF(x,z))>12+m&&dirtDist(x,z)>5+m;}
{const trees=[],pops=[];
 for(let i=0;i<1400;i++){const x=L+20+Math.random()*1700,z=-1000+Math.random()*2000;if(freeSpot(x,z,0))trees.push([x,z,0.7+Math.random()*0.7]);}
 // filari di pioppi lungo i campi e il raccordo
 for(let x=L+20;x<RX0-15;x+=9)[-16,16].forEach(z=>pops.push([x,z+(Math.random()-0.5),0.9+Math.random()*0.3]));
 for(let k=0;k<10;k++){const z0=-700+Math.random()*1400,x0=L+80+Math.random()*1300,ang=Math.random()<0.5?0:Math.PI/2;for(let j=0;j<20;j++){const x=x0+Math.cos(ang)*j*9,z=z0+Math.sin(ang)*j*9;if(freeSpot(x,z,0))pops.push([x,z,0.9+Math.random()*0.3]);}}
 const firs=[];for(let i=0;i<1800;i++){const x=MT.x0-80+Math.random()*900,z=MT.zc-480+Math.random()*960;if(freeSpot(x,z,0))firs.push([x,z,0.75+Math.random()*0.5]);}
 const o=new THREE.Object3D(),col=new THREE.Color();
 function lumpy(r,det,amp){const g=new THREE.SphereGeometry(r,10+det*4,8+det*3),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+amp*(Math.sin(x*3.1+y*1.7)*Math.sin(z*2.3+x*0.9)+0.5*Math.sin(y*5.3+z*4.1));p.setXYZ(i,x*n,y*n*0.9,z*n);}g.computeVertexNormals();return g;}
 function mergeG(list){const gs=list.map(g=>g.index?g.toNonIndexed():g);let n=0;gs.forEach(g=>n+=g.attributes.position.count);const pos=new Float32Array(n*3),nor=new Float32Array(n*3);let k=0;gs.forEach(g=>{pos.set(g.attributes.position.array,k*3);nor.set(g.attributes.normal.array,k*3);k+=g.attributes.position.count;});
   const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(pos,3));m.setAttribute('normal',new THREE.BufferAttribute(nor,3));return m;}
 const firG=mergeG([new THREE.ConeGeometry(2.4,4,9).translate(0,2,0),new THREE.ConeGeometry(1.9,3.6,9).translate(0,4.2,0),new THREE.ConeGeometry(1.3,3.2,9).translate(0,6.3,0),new THREE.ConeGeometry(0.7,2.4,8).translate(0,8.1,0)]);
 const crownG=mergeG([lumpy(2.2,1,0.12),lumpy(1.5,1,0.15).translate(1.2,0.6,0.4),lumpy(1.4,1,0.15).translate(-1.0,0.4,-0.8)]);
 const leafW=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.95}),firW=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.95}),popW=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.95});
 if(MAPLE){trees.forEach(([x,z,k])=>{addMaple(x,TH(x,z)-0.1,z,6.5*k+1.5);gridAdd({x,z,r:0.35*k},x,z,x,z);});trees.length=0;}
 const tr=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18,0.25,3,6),trunkM,trees.length+pops.length+firs.length);
 const lf=new THREE.InstancedMesh(crownG,leafW,trees.length),pp=new THREE.InstancedMesh(lumpy(1,1,0.08).scale(0.95,6,0.95),popW,pops.length),fr=new THREE.InstancedMesh(firG,firW,firs.length);
 const leafCols=[0x4d6b35,0x5b7a32,0x3f5e2f,0x6c8a3a,0x7a8f3c,0x55683a,0x8a8a3a];
 trees.forEach(([x,z,k],i)=>{const hh=TH(x,z);o.position.set(x,hh+1.5*k,z);o.scale.set(k,k,k);o.rotation.set(0,0,0);o.updateMatrix();tr.setMatrixAt(i,o.matrix);
   o.position.set(x,hh+4.6*k,z);o.rotation.y=Math.random()*6;const sx=k*(0.85+Math.random()*0.3);o.scale.set(sx,k*(0.8+Math.random()*0.4),sx);o.updateMatrix();lf.setMatrixAt(i,o.matrix);
   col.set(leafCols[(Math.random()*leafCols.length)|0]).multiplyScalar(0.85+Math.random()*0.3);lf.setColorAt(i,col);gridAdd({x,z,r:0.35*k},x,z,x,z);});
 pops.forEach(([x,z,k],i)=>{const hh=TH(x,z);o.rotation.set(0,0,0);o.position.set(x,hh+1.5*k,z);o.scale.set(k,k,k);o.updateMatrix();tr.setMatrixAt(trees.length+i,o.matrix);
   o.position.set(x,hh+8*k,z);o.rotation.y=Math.random()*6;o.updateMatrix();pp.setMatrixAt(i,o.matrix);col.set(0x4a6332).multiplyScalar(0.8+Math.random()*0.35);pp.setColorAt(i,col);gridAdd({x,z,r:0.35},x,z,x,z);});
 firs.forEach(([x,z,k],i)=>{const hh=TH(x,z);o.rotation.set(0,0,0);o.position.set(x,hh+0.8*k,z);o.scale.set(k*0.7,k*0.6,k*0.7);o.updateMatrix();tr.setMatrixAt(trees.length+pops.length+i,o.matrix);
   o.position.set(x,hh+0.9*k,z);o.rotation.y=Math.random()*6;o.scale.set(k,k*(0.9+Math.random()*0.3),k);o.updateMatrix();fr.setMatrixAt(i,o.matrix);col.set([0x2f4a2b,0x355233,0x2a4428,0x3b5a36][(Math.random()*4)|0]).multiplyScalar(0.85+Math.random()*0.3);fr.setColorAt(i,col);gridAdd({x,z,r:0.4},x,z,x,z);});
 [tr,lf,pp,fr].forEach(m=>{m.castShadow=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;scene.add(m);});
 // cascine
 const wallM=mat(0xd9c49a),tileM=mat(0xa4553a);
 for(let i=0,n=0;i<60&&n<9;i++){const x=L+120+Math.random()*1400,z=-800+Math.random()*1600,w=22+Math.random()*18,d=10+Math.random()*4,h=6+Math.random()*3;
   if(!freeSpot(x,z,Math.max(w,d)))continue;n++;const hb0=Math.min(TH(x-w/2,z-d/2),TH(x+w/2,z+d/2),TH(x,z))-0.5;const b=new THREE.Mesh(new THREE.BoxGeometry(w,h+0.5,d),wallM);b.position.set(x,hb0+(h+0.5)/2,z);b.castShadow=b.receiveShadow=true;scene.add(b);
   const sh=new THREE.Shape();sh.moveTo(-d/2-0.6,0);sh.lineTo(0,3);sh.lineTo(d/2+0.6,0);sh.lineTo(-d/2-0.6,0);
   const rg=new THREE.ExtrudeGeometry(sh,{depth:w+1,bevelEnabled:false});rg.translate(0,0,-(w+1)/2);const r=new THREE.Mesh(rg,tileM);r.rotation.y=Math.PI/2;r.position.set(x,hb0+h+0.5,z);r.castShadow=true;scene.add(r);
   obstaclesBox.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});}
 // case di campagna in mattoni
 if(HOUSE)for(let i=0,n=0;i<140&&n<14;i++){const x=L+70+Math.random()*1450,z=-850+Math.random()*1700,s=1.6+Math.random()*0.3,r=6*s;
   if(!freeSpot(x,z,r))continue;const hs=[TH(x-r,z-r),TH(x+r,z+r),TH(x+r,z-r),TH(x-r,z+r),TH(x,z)];if(Math.max(...hs)-Math.min(...hs)>2.2)continue;n++;
   const g=gInstance(HOUSE,s);(window.__house=window.__house||[]).push([x,z]);g.rotation.y=Math.random()*6.28;g.position.set(x,Math.min(...hs)-0.25,z);scene.add(g);gridAdd({x,z,r:4.4*s},x,z,x,z);}
}

