// Guido · 01 base — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ---- mondo generato da un seme: stesso numero = stesso mondo ----
const WORLD_IT=false;let WORLD_NW=!!window.NWDATA;
let NW=null,NWT=null;
let SEED=null;try{const h=/^#w(\d+)$/.exec(location.hash);if(h)SEED=+h[1];else{const v=localStorage.getItem('sim_seed');if(v)SEED=+v;}}catch(e){}
if(!SEED){SEED=1+Math.floor(Math.random()*99999);try{localStorage.setItem('sim_seed',SEED);}catch(e){}}
const CFG={rap:1,prec:1,rit:1};try{Object.assign(CFG,JSON.parse(localStorage.getItem('sim_cfg')||'{}'));}catch(e){}
const PREF=(()=>{try{return JSON.parse(localStorage.getItem('sim_pref')||'{}');}catch(e){return{};}})();
const RNG=(a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;})(SEED);
const _rnd=Math.random;Math.random=RNG;
const rr=(a,b)=>a+Math.random()*(b-a);
// ================= RENDERER / SCENA =================
const renderer = new THREE.WebGLRenderer({antialias:true,logarithmicDepthBuffer:true});
// qualità grafica scelta nel menu (bassa/media/alta): risoluzione, ombre, distanza di visibilità, dettagli
const QG=(()=>{const mob=navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900,q=CFG.q||(mob?'media':'alta');return{q,lo:q==='bassa',mid:q==='media',hi:q==='alta',pr:q==='bassa'?Math.min(devicePixelRatio,1)*0.8:q==='media'?Math.min(devicePixelRatio,mob?1.1:1.2):Math.min(devicePixelRatio,mob?1.25:1.5),fog:q==='bassa'?0.6:q==='media'?0.82:1,mir:q==='bassa'?4:q==='media'?2:1};})();
renderer.setPixelRatio(QG.pr);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !QG.lo;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=0.88;renderer.localClippingEnabled=true;
document.body.appendChild(renderer.domElement);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();const d=document.createElement('div');d.style.cssText='position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.8);font-size:18px;z-index:9;text-align:center;padding:20px';d.textContent='La grafica si è interrotta (memoria del dispositivo esaurita). Ricarica la pagina.';document.body.appendChild(d);});
const scene = new THREE.Scene();
const HORIZON=0xc9dbe8;
scene.background = new THREE.Color(HORIZON);
scene.fog = new THREE.Fog(HORIZON, 260, 1500);
const camera = new THREE.PerspectiveCamera(62, innerWidth/innerHeight, 0.08, 6000);
// volta celeste a gradiente
const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false,
  uniforms:{top:{value:new THREE.Color(0x3f73c4)},mid:{value:new THREE.Color(0x8db6e3)},bot:{value:new THREE.Color(HORIZON)},uT:{value:0},uCov:{value:0.56},uDay:{value:1}},
  vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`uniform vec3 top,mid,bot;uniform float uT,uCov,uDay;varying vec3 vP;
    float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
    float fb(vec2 p){float s=0.0,a=0.5;for(int k=0;k<5;k++){s+=a*ns(p);p=p*2.03+vec2(1.7,9.2);a*=0.5;}return s;}
    void main(){float h=max(vP.y,0.0);vec3 c=mix(bot,mid,smoothstep(0.0,0.12,h));c=mix(c,top,smoothstep(0.12,0.65,h));
      if(vP.y>0.0){vec2 p=vP.xz/(vP.y+0.18)*1.4+vec2(uT*0.006,uT*0.0025);float n=fb(p),sh=fb(p*1.7+vec2(0.4,0.1));
        float cl=smoothstep(uCov,uCov+0.22,n)*smoothstep(0.0,0.14,vP.y);vec3 cc=mix(vec3(0.66,0.69,0.74),vec3(1.0,0.99,0.97),clamp(sh*1.6-0.35,0.0,1.0));
        cc=mix(top*1.35+vec3(0.03),cc,uDay);c=mix(c,cc,cl*0.92);
        float ci=smoothstep(0.62,0.9,fb(vec2(p.x*0.35,p.y*2.2)+3.0))*smoothstep(0.1,0.5,vP.y)*0.35*uDay;c=mix(c,vec3(1.0),ci*(1.0-cl));}
      gl_FragColor=vec4(c,1.0);}`});
const sky=new THREE.Mesh(new THREE.SphereGeometry(4000,32,16),skyMat);sky.renderOrder=-1;scene.add(sky);
// mappa d'ambiente per i riflessi (vernici, vetri, cromature): cubemap disegnata su canvas
{const face=(kind)=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
   if(kind==='up'){const gr=g.createRadialGradient(64,64,0,64,64,90);gr.addColorStop(0,'#4f80c8');gr.addColorStop(1,'#8db6e3');g.fillStyle=gr;g.fillRect(0,0,128,128);}
   else if(kind==='down'){g.fillStyle='#5d6152';g.fillRect(0,0,128,128);}
   else{const gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,'#6e9bd6');gr.addColorStop(0.45,'#c9dbe8');gr.addColorStop(0.5,'#8e9483');gr.addColorStop(1,'#565a4c');g.fillStyle=gr;g.fillRect(0,0,128,128);
     g.fillStyle='rgba(255,255,255,0.8)';for(let i=0;i<5;i++){g.beginPath();g.ellipse(Math.random()*128,15+Math.random()*35,14+Math.random()*16,5+Math.random()*4,0,0,7);g.fill();}
     if(kind==='sun'){const sg=g.createRadialGradient(80,30,0,80,30,26);sg.addColorStop(0,'rgba(255,250,235,1)');sg.addColorStop(1,'rgba(255,250,235,0)');g.fillStyle=sg;g.fillRect(40,0,80,70);}}
   return c;};
 const cube=new THREE.CubeTexture([face('side'),face('sun'),face('up'),face('down'),face('side'),face('side')]);cube.encoding=THREE.sRGBEncoding;cube.needsUpdate=true;scene.environment=cube;}
// nuvole: sprite morbidi disegnati su canvas
function cloudTex(seed){const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');
  for(let i=0;i<22;i++){const x=40+Math.random()*176,y=50+Math.random()*40-((x-128)/128)**2*-10,r=18+Math.random()*30;
    const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,0.95)');gr.addColorStop(0.6,'rgba(250,251,253,0.55)');gr.addColorStop(1,'rgba(240,244,250,0)');
    g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();}
  // base leggermente grigia
  const lg=g.createLinearGradient(0,60,0,128);lg.addColorStop(0,'rgba(0,0,0,0)');lg.addColorStop(1,'rgba(150,160,175,0.25)');g.globalCompositeOperation='source-atop';g.fillStyle=lg;g.fillRect(0,0,256,128);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;}
const cloudTexs=[cloudTex(),cloudTex(),cloudTex(),cloudTex()];
const clouds=[];
for(let i=0;i<70;i++){const m=new THREE.SpriteMaterial({map:cloudTexs[i%4],transparent:true,depthWrite:false,fog:false,opacity:0.75+Math.random()*0.25});
  const sp=new THREE.Sprite(m);const a=Math.random()*Math.PI*2,r=300+Math.random()*2600;sp.position.set(400+Math.cos(a)*r,260+Math.random()*320,Math.sin(a)*r);
  const w=260+Math.random()*420;sp.scale.set(w,w*0.42,1);scene.add(sp);clouds.push(sp);}
// Alpi a nord, colline a sud: catene con creste frattali, roccia e neve (fuori dalla nebbia)
function ridgeMesh(x0,x1,z0,z1,nx,nz,hf,colf){const g=new THREE.PlaneGeometry(x1-x0,z1-z0,nx,nz);g.rotateX(-Math.PI/2);g.translate((x0+x1)/2,0,(z0+z1)/2);
  const p=g.attributes.position,c=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=hf(x,z);p.setY(i,h);}
  g.computeVertexNormals();const n=g.attributes.normal;for(let i=0;i<p.count;i++){const cc=colf(p.getY(i),n.getY(i),p.getX(i),p.getZ(i));c.set(cc,i*3);}
  g.setAttribute('color',new THREE.BufferAttribute(c,3));const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,fog:false}));scene.add(m);return m;}
const fbm=(x,z,oct)=>{let a=0,f=1,am=1;for(let i=0;i<oct;i++){a+=am*(1-Math.abs(Math.sin(x*f*0.0021+i*1.7)*Math.cos(z*f*0.0027+i*2.3)));f*=2.03;am*=0.5;}return a;};
if(!WORLD_IT)ridgeMesh(-4500,6000,-5600,-3300,210,46,(x,z)=>{const t=Math.min(1,(-3300-z)/700);return Math.max(-30,t*(fbm(x,z,5)*520-180)*(0.75+0.25*Math.sin(x*0.0007)));},
  (h,ny,x,z)=>{const rock=[0.36,0.37,0.4],snow=[0.9,0.92,0.96],forest=[0.2,0.3,0.2];const sn=Math.max(0,Math.min(1,(h-600+50*Math.sin(x*0.01))/90))*Math.min(1,ny*1.4);
    const fo=Math.max(0,Math.min(1,(330-h)/140));let c=rock.map((v,i)=>v*(1-fo)+forest[i]*fo);c=c.map((v,i)=>v*(1-sn)+snow[i]*sn);return c.map(v=>v*(0.55+0.3*ny));});
if(!WORLD_IT)ridgeMesh(-4000,5500,2500,4200,160,30,(x,z)=>{const t=Math.min(1,(z-2500)/500);return t*(fbm(x+900,z,4)*160-40);},
  (h,ny)=>{const g=[0.35,0.47,0.3],d=[0.42,0.48,0.34];const k=Math.min(1,h/150);return g.map((v,i)=>(v*(1-k)+d[i]*k)*(0.7+0.3*ny));});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

const hemiL=new THREE.HemisphereLight(0xdfefff, 0x5a6347, 0.45);scene.add(hemiL);
const sun = new THREE.DirectionalLight(0xfff0d8, 1.75);
const MOBILE=navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<900;
// prestazioni: gli oggetti nascosti (auto del traffico in attesa, abitacoli, pedoni fuori vista) non ricalcolano le matrici a ogni fotogramma
{const _umw=THREE.Object3D.prototype.updateMatrixWorld;THREE.Object3D.prototype.updateMatrixWorld=function(force){if(!this.visible&&!this.isCamera&&!this.isLight&&this.parent){this._stale=true;return;}if(this._stale){this._stale=false;force=true;}_umw.call(this,force);};}
// ================= MODELLI glTF: utilità comuni =================
// legge un attributo anche se quantizzato (interi normalizzati) o interlacciato
function gRd(a,i,c){const il=a.isInterleavedBufferAttribute,arr=il?a.data.array:a.array,st=il?a.data.stride:a.itemSize,off=il?a.offset:0;let v=arr[i*st+off+c];
  if(a.normalized){if(arr instanceof Int16Array)v=Math.max(v/32767,-1);else if(arr instanceof Uint16Array)v/=65535;else if(arr instanceof Int8Array)v=Math.max(v/127,-1);else if(arr instanceof Uint8Array)v/=255;}return v;}
const _gv=new THREE.Vector3(),_gn=new THREE.Vector3(),_gm3=new THREE.Matrix3();
// trasforma la geometria di una mesh in float, nello spazio della matrice M
function gBake(mesh,M){const g=mesh.geometry,P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv,n=P.count;
  const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2);_gm3.getNormalMatrix(M);
  for(let i=0;i<n;i++){_gv.set(gRd(P,i,0),gRd(P,i,1),gRd(P,i,2)).applyMatrix4(M);pos[i*3]=_gv.x;pos[i*3+1]=_gv.y;pos[i*3+2]=_gv.z;
    if(N){_gn.set(gRd(N,i,0),gRd(N,i,1),gRd(N,i,2)).applyMatrix3(_gm3).normalize();nor[i*3]=_gn.x;nor[i*3+1]=_gn.y;nor[i*3+2]=_gn.z;}
    if(U){uv[i*2]=gRd(U,i,0);uv[i*2+1]=gRd(U,i,1);}}
  let idx;if(g.index){idx=new Uint32Array(g.index.count);for(let i=0;i<g.index.count;i++)idx[i]=g.index.getX(i);}else{idx=new Uint32Array(n);for(let i=0;i<n;i++)idx[i]=i;}
  if(M.determinant()<0)for(let t=0;t<idx.length;t+=3){const a=idx[t+1];idx[t+1]=idx[t+2];idx[t+2]=a;}
  return{pos,nor,uv,idx,n,hasN:!!N};}
function gMerge(list){let nv=0,ni=0;list.forEach(b=>{nv+=b.n;ni+=b.idx.length;});const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),uv=new Float32Array(nv*2),idx=new Uint32Array(ni);
  let ov=0,oi=0,anyN=true;list.forEach(b=>{pos.set(b.pos,ov*3);nor.set(b.nor,ov*3);uv.set(b.uv,ov*2);for(let i=0;i<b.idx.length;i++)idx[oi+i]=b.idx[i]+ov;ov+=b.n;oi+=b.idx.length;if(!b.hasN)anyN=false;});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(new THREE.BufferAttribute(idx,1));
  if(!anyN)g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;}
function gBox(list){const b=new THREE.Box3();list.forEach(x=>{for(let i=0;i<x.n;i++)b.expandByPoint(_gv.set(x.pos[i*3],x.pos[i*3+1],x.pos[i*3+2]));});return b;}
function gShift(list,dx,dy,dz,s=1){list.forEach(x=>{for(let i=0;i<x.n;i++){x.pos[i*3]=(x.pos[i*3]+dx)*s;x.pos[i*3+1]=(x.pos[i*3+1]+dy)*s;x.pos[i*3+2]=(x.pos[i*3+2]+dz)*s;}});}
// fa sì che i materiali dei modelli ricevano il cielo come riflesso e non siano troppo lucidi in assenza di mappe
function gFixMat(m){if(!m||m.userData.fixed)return m;m.userData.fixed=true;m.aoMap=null;m.lightMap=null;if(m.vertexTangents){m.vertexTangents=false;if(m.normalScale)m.normalScale.y*=-1;}if(m.map)m.map.anisotropy=4;if(m.transparent&&m.opacity>0.95&&!m.alphaTest)m.transparent=false;return m;}

sun.castShadow = !QG.lo; sun.shadow.mapSize.set(MOBILE||QG.mid?1024:2048,MOBILE||QG.mid?1024:2048);
Object.assign(sun.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:10,far:260});
sun.shadow.bias=-0.0005; scene.add(sun); scene.add(sun.target);

function mat(c,o={}){return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:0.85,metalness:0},o));}

