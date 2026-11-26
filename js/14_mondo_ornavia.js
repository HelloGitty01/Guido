// Guido · 14 mondo ornavia — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ================= NORD-OVEST: costruzione a mattonelle, laghi, navigatore =================
const BASE0=scene.children.slice();
NWT=(()=>{if(!NW)return null;const HIDE=false;
  const TS=400,RAD=QG.lo?2:(MOBILE||QG.mid)?3:4,DET=(MOBILE||!QG.hi)?1:2,FS=2000,FR=MOBILE?2:3,tiles=new Map(),far=new Map(),anims=[];
  const tk=(i,j)=>i*100003+j;
  const hsh=(i,j)=>{let h=(i*374761393+j*668265263)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967295;};
  const vn=(x,z)=>{const i=Math.floor(x),j=Math.floor(z),u=x-i,v=z-j,su=u*u*(3-2*u),sv=v*v*(3-2*v);return (hsh(i,j)*(1-su)+hsh(i+1,j)*su)*(1-sv)+(hsh(i,j+1)*(1-su)+hsh(i+1,j+1)*su)*sv;};
  const fbm=(x,z,o)=>{let a=0,f=1,am=0.5;for(let k=0;k<o;k++){a+=am*vn(x*f,z*f);f*=2.03;am*=0.5;}return a;};
  // boschetti: macchie d'alberi raggruppate invece di alberi sparsi uniformi
  const CLUMP=(x,z,h)=>h<6?0:sstep(0.6,0.74,fbm(x/120+5.3,z/120-2.1,2)/0.75);
  const forestF=(x,z,h,sl)=>{if(h<85)return 0;const n=fbm(x/700+11,z/700,3);return sstep(0.42,0.6,n+sstep(110,260,h)*0.22+sl*0.5)*(1-sstep(950,1150,h));};
  // ---------- materiali ----------
  const ROCK=(()=>{const I=window.HDON&&window.HDIMG;if(!I||!I.roccia)return null;const t=new THREE.Texture(I.roccia);t.wrapS=t.wrapT=THREE.MirroredRepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;t.needsUpdate=true;return t;})();
  const terrM=addRelief(new THREE.MeshStandardMaterial({map:grassTex,vertexColors:true,roughness:1,envMapIntensity:0.35}),3,0.6);terrM.color.setRGB(1.1,0.95,0.84);
  // prato "pulito": colore medio dell'erba modulato dalla tavolozza di zona; il dettaglio della texture (solo luminosità) si vede da vicino e sparisce entro un centinaio di metri, niente mosaico in lontananza
  {let avg=new THREE.Vector3(0.15,0.24,0.06);try{const c=grassTex.image,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let r=0,g=0,b=0,n=0;for(let i=0;i<d.length;i+=16){r+=d[i];g+=d[i+1];b+=d[i+2];n++;}const L=v=>Math.pow(v/n/255,2.2);avg.set(L(r),L(g),L(b));}catch(e){}
   if(terrM.normalScale)terrM.normalScale.set(0.3,0.3);var GAVG=avg;}
  const farM=terrM.clone();const nearBox={value:new THREE.Vector4(1,1,0,0)};
  farM.onBeforeCompile=sh=>{sh.uniforms.nearBox=nearBox;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;uniform vec4 nearBox;').replace('void main() {','void main() {\nif(vWP.x>nearBox.x&&vWP.x<nearBox.z&&vWP.z>nearBox.y&&vWP.z<nearBox.w)discard;').replace('#include <map_fragment>','diffuseColor.rgb*=gAvg*vec3(1.22,1.16,0.86)*mix(1.0,dot(mapTexelToLinear(texture2D(map,vUv*0.0137+vec2(0.21,0.43))).rgb/gAvg,vec3(0.3333)),0.3);').replace('uniform vec4 nearBox;','uniform vec4 nearBox;uniform vec3 gAvg;');sh.uniforms.gAvg={value:GAVG};};
  farM.customProgramCacheKey=()=>'nwfar4';
  // erba a più scale: niente ripetizione visibile, chiazze più chiare e più scure
  const grassFrag=sh=>{sh.uniforms.gAvg={value:GAVG};sh.fragmentShader='uniform vec3 gAvg;\n'+sh.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
    vec4 texelColor=mapTexelToLinear(texture2D(map,vUv));vec4 t2=mapTexelToLinear(texture2D(map,vUv*0.173+vec2(0.31,0.57)));
    float fdT=1.0-smoothstep(8.0,70.0,length(vViewPosition));float lmT=dot(texelColor.rgb/gAvg,vec3(0.3333))*0.6+dot(t2.rgb/gAvg,vec3(0.3333))*0.4;
    float mcT=dot(mapTexelToLinear(texture2D(map,vUv*0.0137+vec2(0.21,0.43))).rgb/gAvg,vec3(0.3333));
    diffuseColor.rgb*=gAvg*vec3(1.22,1.16,0.86)*mix(1.0,mcT,0.3)*mix(1.0,lmT,0.45*fdT);   // colore pulito; il dettaglio dell'erba si vede solo da vicino
    #endif`);
    // pacchetto HD: roccia vera sui pendii ripidi e in alta quota
    if(ROCK){sh.uniforms.rockMap={value:ROCK};sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float rk;varying float vRk;varying vec3 vRw;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvRk=rk;vRw=(modelMatrix*vec4(transformed,1.0)).xyz;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D rockMap;varying float vRk;varying vec3 vRw;').replace('#include <color_fragment>',`#include <color_fragment>
      if(vRk>0.01){vec3 r1=texture2D(rockMap,vRw.xz/23.0).rgb,r2=texture2D(rockMap,vRw.zx/61.0+0.37).rgb;vec3 rc=mapTexelToLinear(vec4(r1*0.6+r2*0.4,1.0)).rgb;rc=mix(vec3(dot(rc,vec3(0.3,0.5,0.2))),rc,0.45)*vec3(0.95,0.97,1.04);
        #ifdef USE_COLOR
        vec3 vc=vColor.rgb;
        #else
        vec3 vc=vec3(0.62);
        #endif
        diffuseColor.rgb=mix(diffuseColor.rgb,rc*vc*1.55,smoothstep(0.2,0.9,vRk));}`);}};
  terrM.onBeforeCompile=grassFrag;terrM.customProgramCacheKey=()=>ROCK?'grass4r':'grass4';
  {const fb=farM.onBeforeCompile;farM.onBeforeCompile=sh=>{fb(sh);grassFrag(sh);};}
  const ASF=window.HDON&&window.HDIMG&&HDIMG.asfalto;
  const roadTex=(kind,lanes)=>{const t=canvasTex(ASF?512:256,(g,n)=>{const pav=kind==='pv';g.fillStyle=pav?'#9d978c':'#45474b';g.fillRect(0,0,n,n);
      if(ASF&&!pav){g.globalAlpha=0.9;g.drawImage(ASF,0,0,n,n);g.globalAlpha=1;g.fillStyle='rgba(80,82,86,.25)';g.fillRect(0,0,n,n);}
      else for(let i=0;i<(pav?2600:4200);i++){const v=pav?120+Math.random()*50|0:55+Math.random()*30|0;g.fillStyle=`rgba(${v},${v-2},${v-6},.35)`;g.fillRect(Math.random()*n,Math.random()*n,2,2);}
      if(pav){g.fillStyle='#b7b2a9';g.fillRect(0,0,n,n);for(let y=0;y<n;y+=32)for(let x=-(y/32%2)*32;x<n;x+=64){const v=168+Math.random()*26|0;g.fillStyle=`rgb(${v},${v-3},${v-9})`;g.fillRect(x+1,y+1,62,30);}for(let i=0;i<2000;i++){g.fillStyle='rgba(60,60,60,.1)';g.fillRect(Math.random()*n,Math.random()*n,1.5,1.5);}return;}
      if(pav){g.strokeStyle='rgba(70,64,58,.35)';g.lineWidth=1.5;for(let y=0;y<n;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(n,y);g.stroke();}return;}
      g.fillStyle='#e8e8e2';const E=kind==='pl'?0:1;
      if(E){g.fillRect(n*0.025,0,n*0.03,n);g.fillRect(n*0.945,0,n*0.03,n);}
      const dash=(u)=>{g.fillRect(u*n-n*0.012,0,n*0.024,n*0.375);};
      if(kind==='r2')dash(0.5);
      if(kind==='m'){for(let k=1;k<lanes;k++)dash(0.055+(0.89*k/lanes));}});
    t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;};
  const TEX={pl:roadTex('pl'),r2:roadTex('r2'),pv:roadTex('pv'),m1:roadTex('m',1),m2:roadTex('m',2),m3:roadTex('m',3),m4:roadTex('m',4),r1:roadTex('m',1)};
  const RANK=[9,7,8,7,6,5,4,3,2,1,0];
  const mcache=new Map();
  function roadMat(key,rank){const k=key+rank;if(mcache.has(k))return mcache.get(k);const m=new THREE.MeshStandardMaterial({map:TEX[key],roughness:key==='pv'?0.85:0.92,polygonOffset:true,polygonOffsetFactor:-1-rank*0.5,polygonOffsetUnits:-2-rank*2});addRelief(m,key==='pv'?5:3.5,0.55);mcache.set(k,m);return m;}
  function texKey(R){if(R.c>=9)return 'pv';if(R.c===8)return 'pl';if(R.c===7)return 'r2';
    if(R.o){const l=R.c===0?Math.max(2,Math.round((R.w-3)/3.6)):R.c===1||R.c===3?1:Math.max(1,Math.round((R.w-1.5)/3.5));return 'm'+Math.min(4,l);}return 'r2';}
  const waterM=new THREE.MeshStandardMaterial({color:0x2b5a73,roughness:0.08,metalness:0.15,envMapIntensity:1.2,transparent:true,opacity:0.9});
  // onde: la superficie resta piatta, si muovono le normali (riflessi che corrono); ampiezza per specchio d'acqua: poche nei laghi, tante nel mare
  const WAVT={value:0},waveMat=(amp)=>{const m=waterM.clone();m.onBeforeCompile=sh=>{sh.uniforms.uT=WAVT;sh.uniforms.uAmp={value:amp};
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWp;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWp=(modelMatrix*vec4(transformed,1.0)).xyz;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uT;uniform float uAmp;varying vec3 vWp;\nvec2 wv(vec2 p,vec2 d,float f,float sp){float ph=dot(p,d)*f+uT*sp;return d*cos(ph)*f;}').replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
      {vec2 p=vWp.xz;vec2 g=wv(p,normalize(vec2(1.0,0.35)),0.21,1.7)*0.55+wv(p,normalize(vec2(-0.4,1.0)),0.37,2.3)*0.35+wv(p,normalize(vec2(0.8,-0.7)),0.83,3.1)*0.18+wv(p,normalize(vec2(-0.9,-0.2)),1.9,4.6)*0.07;
       vec3 wn=normalize(vec3(-g.x*uAmp,1.0,-g.y*uAmp));normal=normalize((viewMatrix*vec4(wn,0.0)).xyz);}`);};m.customProgramCacheKey=()=>'wave';return m;};
  NW.waveAmp=L=>/mare/i.test(L.n||'')||L.lv<=0.5?1.0:0.28;
  const riverM=new THREE.MeshStandardMaterial({color:0x3a6170,roughness:0.15,metalness:0.1,envMapIntensity:1,polygonOffset:true,polygonOffsetFactor:-0.5,polygonOffsetUnits:-1});
  const portM=mat(0xb5b0a4,{roughness:0.85}),concM=mat(0x9a968e,{roughness:0.9,side:THREE.DoubleSide}),deckM=mat(0x77756f,{roughness:0.92,side:THREE.DoubleSide}),tunM=new THREE.MeshStandardMaterial({color:0x4a4846,roughness:0.95,side:THREE.DoubleSide}),lampM=new THREE.MeshBasicMaterial({color:0xffe2a0});
  const railM=new THREE.MeshStandardMaterial({color:0xaeb3b8,metalness:0.6,roughness:0.4,side:THREE.DoubleSide});
  // banchina (terra che sfuma nel prato) e ciuffo d'erba alta: due quadrati incrociati con fili disegnati, che spariscono dolcemente oltre i 200 m
  const VERGE=(()=>{const m=new THREE.MeshStandardMaterial({vertexColors:true,transparent:true,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float va;varying float vA;').replace('#include <begin_vertex>','#include <begin_vertex>\nvA=va;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vA;').replace('#include <dithering_fragment>','#include <dithering_fragment>\ngl_FragColor.a*=vA;');};m.customProgramCacheKey=()=>'verge1';
    const tex=canvasTex(256,(g,n)=>{g.clearRect(0,0,n,n);for(let i=0;i<150;i++){const x=n*0.5+(Math.random()-0.5)*n*0.7*Math.random(),h=n*(0.3+Math.random()*0.66),bend=(x-n/2)*0.8+(Math.random()-0.5)*n*0.2,w=1.2+Math.random()*2.2;
        const c=[[120,148,62],[146,166,74],[176,176,96],[104,134,56],[190,182,110]][i%5];g.strokeStyle=`rgb(${c[0]},${c[1]},${c[2]})`;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(x,n);g.quadraticCurveTo(x+bend*0.3,n-h*0.6,x+bend,n-h);g.stroke();}});
    tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;
    const tm=new THREE.MeshStandardMaterial({map:tex,alphaTest:0.4,side:THREE.DoubleSide,roughness:1});tm.alphaToCoverage=true;
    tm.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <project_vertex>',`vec4 wpT=modelMatrix*instanceMatrix*vec4(transformed,1.0);float dT=distance(wpT.xz,cameraPosition.xz);transformed*=1.0-smoothstep(150.0,210.0,dT);
      #include <project_vertex>`);};tm.customProgramCacheKey=()=>'tuft1';
    const q=(r)=>{const g=new THREE.PlaneGeometry(1.1,0.9);g.translate(0,0.45,0);g.rotateY(r);return g;};
    const A=q(0),B=q(Math.PI/2),g=new THREE.BufferGeometry();['position','normal','uv'].forEach(k=>{const a=A.attributes[k],b=B.attributes[k],arr=new Float32Array(a.array.length+b.array.length);arr.set(a.array);arr.set(b.array,a.array.length);g.setAttribute(k,new THREE.BufferAttribute(arr,a.itemSize));});
    const ia=[...A.index.array],nA=A.attributes.position.count;g.setIndex(ia.concat([...B.index.array].map(v=>v+nA)));
    // pietre del muretto: file irregolari di sassi grigio-bruni, muschio in basso
    const wt=canvasTex(512,(g,n)=>{g.fillStyle='#5b574c';g.fillRect(0,0,n,n);let y=0;while(y<n){const rh=18+Math.random()*22;let x=-Math.random()*30;while(x<n){const w=24+Math.random()*46,c=90+Math.random()*60|0,t=Math.random()*14;
        g.fillStyle=`rgb(${c+t|0},${c+t*0.6|0},${c-8|0})`;g.beginPath();g.ellipse(x+w/2,y+rh/2,w/2-1.5,rh/2-1.5,(Math.random()-0.5)*0.25,0,7);g.fill();g.fillStyle='rgba(255,255,255,.08)';g.beginPath();g.ellipse(x+w/2-2,y+rh/2-3,w/3,rh/5,0,0,7);g.fill();x+=w;}y+=rh;}
      const gr=g.createLinearGradient(0,0,0,n);gr.addColorStop(0,'rgba(60,80,30,0)');gr.addColorStop(0.75,'rgba(60,80,30,0)');gr.addColorStop(1,'rgba(70,95,35,.55)');g.fillStyle=gr;g.fillRect(0,0,n,n);});
    const wm=new THREE.MeshStandardMaterial({map:wt,roughness:0.95});
    // cartello di curva: pannello bianco con frecce nere (una versione per lato) su paletto grigio
    const chev=dir=>{const t=canvasTex(256,(g,n)=>{g.fillStyle='#f4f4f0';g.fillRect(0,0,n,n);g.fillStyle='#111';for(let k=0;k<2;k++){const x0=n*(0.12+k*0.38);g.beginPath();
        if(dir>0){g.moveTo(x0,n*0.12);g.lineTo(x0+n*0.22,n*0.5);g.lineTo(x0,n*0.88);g.lineTo(x0+n*0.13,n*0.88);g.lineTo(x0+n*0.35,n*0.5);g.lineTo(x0+n*0.13,n*0.12);}
        else{const xr=n-x0;g.moveTo(xr,n*0.12);g.lineTo(xr-n*0.22,n*0.5);g.lineTo(xr,n*0.88);g.lineTo(xr-n*0.13,n*0.88);g.lineTo(xr-n*0.35,n*0.5);g.lineTo(xr-n*0.13,n*0.12);}g.fill();}
        g.strokeStyle='#999';g.lineWidth=6;g.strokeRect(3,3,n-6,n-6);});return new THREE.MeshStandardMaterial({map:t,roughness:0.6,side:THREE.DoubleSide});};
    const cg=(()=>{const P=new THREE.PlaneGeometry(0.62,0.5);P.translate(0,1.15,0);const S=new THREE.BoxGeometry(0.06,1.4,0.06);S.translate(0,0.7,-0.04);
      const out=new THREE.BufferGeometry(),pa=[P,S].map(x=>x.toNonIndexed());['position','normal','uv'].forEach(k=>{const arr=new Float32Array(pa[0].attributes[k].array.length+pa[1].attributes[k].array.length);arr.set(pa[0].attributes[k].array);arr.set(pa[1].attributes[k].array,pa[0].attributes[k].array.length);out.setAttribute(k,new THREE.BufferAttribute(arr,pa[0].attributes[k].itemSize));});
      out.addGroup(0,pa[0].attributes.position.count,0);out.addGroup(pa[0].attributes.position.count,pa[1].attributes.position.count,1);return out;})();
    const postM=new THREE.MeshStandardMaterial({color:0x8a8d90,roughness:0.6});
    const ch={g:cg,m:[[chev(1),postM],[chev(-1),postM]]};
    return{m,tm,g,wm,ch};})();
  // delineatore: paletto bianco con fascia nera e catadiottro (arancio a destra, bianco a sinistra); montante del guardrail
  const DELG=(()=>{const box=(w,h,d,y,c,x=0)=>{const g=new THREE.BoxGeometry(w,h,d).toNonIndexed();g.translate(x,y,0);const n=g.attributes.position.count,C=new Float32Array(n*3),col=new THREE.Color(c);for(let i=0;i<n;i++){C[i*3]=col.r;C[i*3+1]=col.g;C[i*3+2]=col.b;}g.setAttribute('color',new THREE.BufferAttribute(C,3));return g;};
    const merge=L=>{const P=[],N=[],C=[];L.forEach(g=>{P.push(...g.attributes.position.array);N.push(...g.attributes.normal.array);C.push(...g.attributes.color.array);});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));return g;};
    const O=0xff6a10,Wt=0xf4f4f4,mk=(a,b)=>merge([box(0.1,1.05,0.12,0.52,0xeeeeea),box(0.105,0.2,0.125,0.86,0x161616),box(0.012,0.1,0.08,0.86,a,-0.056),box(0.012,0.1,0.08,0.86,b,0.056)]);
    return{r:mk(O,Wt),l:mk(Wt,O),p:(()=>{const g=new THREE.BoxGeometry(0.12,0.85,0.08);g.translate(0,0.42,0);return g;})(),m:new THREE.MeshLambertMaterial({vertexColors:true})};})();
  const facTex=canvasTex(128,(g,n)=>{g.fillStyle='#fff';g.fillRect(0,0,n,n);for(let y=0;y<2;y++)for(let x=0;x<2;x++){g.fillStyle='rgba(60,50,40,.18)';g.fillRect(x*64+14,y*64+12,36,44);g.fillStyle='#3d4650';g.fillRect(x*64+18,y*64+16,28,36);g.fillStyle='rgba(120,90,60,.55)';g.fillRect(x*64+12,y*64+14,5,40);g.fillRect(x*64+47,y*64+14,5,40);}
    g.fillStyle='rgba(0,0,0,.07)';g.fillRect(0,60,n,4);g.fillRect(0,124,n,4);});
  facTex.wrapS=facTex.wrapT=THREE.RepeatWrapping;facTex.anisotropy=4;
  const bldM=addRelief(new THREE.MeshStandardMaterial({map:facTex,vertexColors:true,roughness:0.88,side:THREE.DoubleSide}),4,0.8);
  // facciate per tipo di edificio: ogni tessera = 2 finestre (7 m) x 2 piani (6,4 m); il piano terra dei palazzi ha i negozi
  const FAC=(()=>{const N=256,C=128;const win=(g,x,y,w,h,frame)=>{if(frame){g.fillStyle=frame;g.fillRect(x-5,y-5,w+10,h+9);}const gr=g.createLinearGradient(x,y,x+w,y+h);gr.addColorStop(0,'#2c3640');gr.addColorStop(0.55,'#46525d');gr.addColorStop(1,'#26303a');g.fillStyle=gr;g.fillRect(x,y,w,h);
        g.fillStyle='rgba(220,230,240,.18)';g.fillRect(x+2,y+2,w*0.35,h-4);g.fillStyle='rgba(200,200,190,.9)';g.fillRect(x+w/2-1.5,y,3,h);};
    const T=(draw,size)=>{const sz=size||N,k=CFG.facX===false?1:2;const t=canvasTex(sz*k,(g,n)=>{g.scale(k,k);draw(g,sz);});t.anisotropy=8;return t;};   // disegnate al doppio della risoluzione: finestre e cornici nitide
    const dirt=(g,n,a)=>{for(let i=0;i<900;i++){g.fillStyle=`rgba(70,60,50,${Math.random()*a})`;g.fillRect(Math.random()*n,Math.random()*n,2,3);}};
    const hist=T((g,n)=>{g.fillStyle='#fff';g.fillRect(0,0,n,n);dirt(g,n,0.05);for(let r=0;r<2;r++)for(let c=0;c<2;c++){const x=c*C,y=r*C;
        g.fillStyle='rgba(0,0,0,.10)';g.fillRect(x,y+C-10,C,6);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(x,y+C-14,C,4);
        win(g,x+44,y+30,40,64,'#f2ede2');g.fillStyle='#ece6da';g.fillRect(x+38,y+96,52,7);g.fillRect(x+38,y+18,52,8);
        const sh=['#3f5a3c','#4b6345','#6b4a32'][(r+c)%3==0?2:0];g.fillStyle=sh;g.fillRect(x+22,y+30,18,64);g.fillRect(x+88,y+30,18,64);g.fillStyle='rgba(0,0,0,.22)';for(let k=0;k<64;k+=5){g.fillRect(x+22,y+30+k,18,1.5);g.fillRect(x+88,y+30+k,18,1.5);}}});
    const mod=T((g,n)=>{g.fillStyle='#fff';g.fillRect(0,0,n,n);dirt(g,n,0.03);for(let r=0;r<2;r++)for(let c=0;c<2;c++){const x=c*C,y=r*C;
        win(g,x+18,y+22,92,70,null);g.fillStyle='#d9d6cf';g.fillRect(x,y+96,C,12);g.fillStyle='rgba(60,64,70,.75)';g.fillRect(x,y+76,C,3);for(let k=4;k<C;k+=9)g.fillRect(x+k,y+76,2,20);
        g.fillStyle='rgba(0,0,0,.12)';g.fillRect(x,y+108,C,5);g.fillStyle='rgba(190,120,70,.55)';if((r+c)%2)g.fillRect(x+18,y+22,92,30);}});
    const off=T((g,n)=>{const gr=g.createLinearGradient(0,0,n,n);gr.addColorStop(0,'#5d7180');gr.addColorStop(0.5,'#8aa0ae');gr.addColorStop(1,'#4f6270');g.fillStyle=gr;g.fillRect(0,0,n,n);
        g.fillStyle='rgba(255,255,255,.12)';for(let i=0;i<6;i++)g.fillRect(Math.random()*n,0,30,n);g.fillStyle='#c9ced2';for(let x=0;x<n;x+=32)g.fillRect(x,0,3,n);for(let y=0;y<n;y+=C/2)g.fillRect(0,y,n,4);g.fillStyle='rgba(30,40,50,.35)';for(let y=0;y<n;y+=C/2)g.fillRect(0,y+4,n,10);});
    const ind=T((g,n)=>{g.fillStyle='#fff';g.fillRect(0,0,n,n);for(let x=0;x<n;x+=8){g.fillStyle='rgba(0,0,0,.10)';g.fillRect(x,0,3,n);g.fillStyle='rgba(255,255,255,.4)';g.fillRect(x+4,0,2,n);}
        g.fillStyle='rgba(60,70,80,.85)';g.fillRect(0,18,n,22);g.fillStyle='rgba(220,225,230,.6)';for(let x=0;x<n;x+=32)g.fillRect(x,18,3,22);g.fillStyle='rgba(0,0,0,.08)';g.fillRect(0,n-12,n,12);});
    const low=T((g,n)=>{g.fillStyle='#fff';g.fillRect(0,0,n,n);dirt(g,n,0.06);for(let c=0;c<2;c++){const x=c*C;g.fillStyle='#8d8f91';g.fillRect(x+20,n-110,88,110);g.fillStyle='rgba(0,0,0,.25)';for(let k=0;k<110;k+=7)g.fillRect(x+20,n-110+k,88,2);}g.fillStyle='rgba(0,0,0,.1)';g.fillRect(0,0,n,10);});
    const shop=T((g,n)=>{g.fillStyle='#fff';g.fillRect(0,0,n,n);dirt(g,n,0.08);g.fillStyle='#8a8378';g.fillRect(0,n-14,n,14);
        for(let c=0;c<2;c++){const x=c*C;const sg=['#7a2a22','#1f3c5a','#2f4b2f','#5b4a2a','#333'][(Math.random()*5)|0];g.fillStyle=sg;g.fillRect(x+10,n-212,108,26);g.fillStyle='rgba(255,255,255,.75)';g.fillRect(x+24,n-203,60,7);
          win(g,x+14,n-176,100,150,'#4a4540');g.fillStyle='rgba(255,235,190,.18)';g.fillRect(x+16,n-120,96,90);}});
    const mk=(t,ex)=>addRelief(new THREE.MeshStandardMaterial(Object.assign({map:t,vertexColors:true,roughness:0.85,side:THREE.DoubleSide},ex||{})),4,0.8);
    // chalet di legno: assi orizzontali, finestre piccole con persiane e balcone
    const chal=T((g,n)=>{g.fillStyle='#a87a4f';g.fillRect(0,0,n,n);for(let y=0;y<n;y+=10){g.fillStyle=`rgb(${150+Math.random()*30|0},${100+Math.random()*24|0},${60+Math.random()*14|0})`;g.fillRect(0,y,n,8);g.fillStyle='rgba(40,25,10,.45)';g.fillRect(0,y+8,n,2);}
        for(let r=0;r<2;r++)for(let c=0;c<2;c++){const x=c*C,y=r*C;win(g,x+46,y+34,36,44,'#f3eee4');g.fillStyle='#5a3a22';g.fillRect(x+28,y+34,16,44);g.fillRect(x+84,y+34,16,44);
          if(r===0){g.fillStyle='#6b4527';g.fillRect(x,y+96,C,8);for(let k=2;k<C;k+=8)g.fillRect(x+k,y+80,3,18);g.fillRect(x,y+78,C,4);}
          g.fillStyle='#d24a3a';for(let k=0;k<4;k++){g.beginPath();g.arc(x+50+k*8,y+80,4,0,7);g.fill();}}});
    // pietra del borgo medievale
    const stn=T((g,n)=>{g.fillStyle='#b9ad98';g.fillRect(0,0,n,n);for(let y=0;y<n;y+=14)for(let x=-(y/14%2)*14;x<n;x+=28){const v=150+Math.random()*50|0;g.fillStyle=`rgb(${v},${v-8},${v-20})`;g.fillRect(x+1,y+1,26,12);}
        for(let r=0;r<2;r++)for(let c=0;c<2;c++){const x=c*C,y=r*C;g.fillStyle='#d9cfbd';g.beginPath();g.moveTo(x+46,y+92);g.lineTo(x+46,y+46);g.quadraticCurveTo(x+64,y+24,x+82,y+46);g.lineTo(x+82,y+92);g.fill();
          g.fillStyle='#2c3238';g.beginPath();g.moveTo(x+50,y+90);g.lineTo(x+50,y+48);g.quadraticCurveTo(x+64,y+30,x+78,y+48);g.lineTo(x+78,y+90);g.fill();g.fillStyle='#6a4a30';g.fillRect(x+36,y+48,12,42);g.fillRect(x+80,y+48,12,42);}});
    const mkB=(t)=>addRelief(new THREE.MeshStandardMaterial({map:t,vertexColors:true,roughness:0.85,side:THREE.DoubleSide}),4,0.8);
    // [materiale, metri per ripetizione in larghezza, in altezza]
    const base=[[mkB(fTex),12,12],[mkB(fTexB),12,12],[mk(off,{roughness:0.25,metalness:0.35,envMapIntensity:1.3}),7,6.4],[mk(ind,{roughness:0.7}),7,0],[mkB(fTexC),12,12],[mk(low),7,0],[mk(shop),7,6.4],
      [mk(chal),7,6.4],[mk(hist),7,6.4],[mk(mod),7,6.4],[mk(stn),7,6.4]];
    // pacchetto HD: facciate fotografiche (palazzoni, condomini, case di mattoni) e finestre dipinte su pietra, intonaco e mattoni veri
    const I=window.HDON&&window.HDIMG||{};if(CFG.photoFac&&I.blocchi1&&I.pietra&&I.intonaco&&I.mattoni){
      const ph=(img)=>T((g,n)=>g.drawImage(img,0,0,n,n),512),mul=(img,over)=>T((g,n)=>{g.drawImage(img,0,0,n,n);g.globalCompositeOperation='multiply';g.drawImage(over.image,0,0,n,n);g.globalCompositeOperation='source-over';},512);
      base.push([mk(ph(I.blocchi1)),24,30],[mk(ph(I.condominio)),20,24],[mk(ph(I.facciate)),16,13],[mk(mul(I.pietra,hist)),7,6.4],[mk(mul(I.intonaco,hist)),7,6.4],[mk(mul(I.mattoni,mod)),7,6.4],
        [mk(ph(I.blocchi2)),24,30],[mk(ph(I.blocchi3)),24,30],[mk(mul(I.pietra,stn)),7,6.4],
        [mk(mul(I.mattoni,ind),{roughness:0.8}),7,0],[mk(mul(I.intonaco,mod)),7,6.4],[mk(mul(I.intonaco,shop)),7,6.4]);}
    return base;})();
  const FAC_N=11,FAC_HD=FAC.length>FAC_N;
  // quale facciata dare a un palazzo, secondo il carattere della città (solo col pacchetto HD)
  // 11 palazzoni · 12 condomini · 13 case di mattoni (porto) · 14 pietra · 15 intonaco storico · 16 mattoni · 17-18 palazzoni · 19 pietra antica
  // 20 capannoni in mattoni · 21 intonaco moderno · 22 negozi su intonaco. Restano come prima solo uffici di vetro, tettoie basse e baite di legno.
  const hdKind=(k,st,h,bi)=>{const r=hsh(bi,13),gen=k<2||k===4||k===9;if(k===2||k===5||k===7)return k;if(k===6)return 22;if(k===3)return 20;
    if(st==='industria'){if(gen)return h>14?(r<0.4?11:r<0.7?17:18):(r<0.6?16:21);if(k===8)return 16;return 19;}
    if(st==='capitale'){if(gen)return h>20?(r<0.55?12:r<0.8?17:11):(r<0.7?21:16);if(k===8)return 15;return 19;}
    if(st==='porto'){if(gen||k===8)return h<22?(r<0.6?13:r<0.8?16:21):(r<0.5?11:12);return 19;}
    if(st==='arte'||st==='borgo'||st==='terme'){if(k===10)return 19;if(k===8)return r<0.5?14:15;return r<0.35?14:r<0.85?15:21;}
    if(st==='alpino'){if(k===10||k===8)return r<0.6?19:14;return r<0.5?14:21;}
    if(st==='lido'||st==='lago'||st==='lago2'||st==='paese'){if(k===8)return 15;if(k===10)return 19;return r<0.65?21:r<0.85?15:16;}
    if(k===8)return 15;if(k===10)return 19;return h>24?(r<0.5?12:17):(r<0.7?21:16);};
  // loghi di grandi aziende inventate per i grattacieli (atlante 2×4)
  const LOGO=(()=>{const B=[['VALCOM','#0a4fa8','#fff',0],['NORDIA','#0d5c3f','#fff',1,'BANCA'],['ORBIS','#111','#ffb400',2],['AltaEnergia','#e8f3ff','#e2421b',3],['KRONO','#5b1d8c','#fff',4],['VELIA','#b0122b','#fff',5,'ASSICURAZIONI'],['lumina','#0b0f1a','#4de0ff',6],['FERRO & CO','#2a2a2a','#e8e2d4',7]];
    const t=canvasTex(1024,(g,n)=>{const W=512,H=256;B.forEach(([nm,bg,fg,ic,sub],i)=>{const x0=(i%2)*W,y0=((i/2)|0)*H;g.fillStyle=bg;g.fillRect(x0+6,y0+6,W-12,H-12);g.fillStyle=fg;g.strokeStyle=fg;g.lineWidth=10;const cx=x0+110,cy=y0+H/2;
      if(ic===0){g.beginPath();g.moveTo(cx-50,cy-45);g.lineTo(cx,cy+50);g.lineTo(cx+50,cy-45);g.stroke();}else if(ic===1){g.beginPath();g.moveTo(cx-55,cy+45);g.lineTo(cx,cy-50);g.lineTo(cx+55,cy+45);g.closePath();g.fill();}
      else if(ic===2){g.beginPath();g.arc(cx,cy,48,0,7);g.stroke();g.beginPath();g.ellipse(cx,cy,70,18,-0.4,0,7);g.stroke();}else if(ic===3){for(let k=0;k<3;k++){g.beginPath();g.arc(cx,cy+30,20+k*22,Math.PI,2*Math.PI);g.stroke();}}
      else if(ic===4){g.beginPath();g.arc(cx,cy,50,0,7);g.stroke();g.beginPath();g.moveTo(cx,cy);g.lineTo(cx,cy-36);g.moveTo(cx,cy);g.lineTo(cx+26,cy+10);g.stroke();}else if(ic===5){g.beginPath();g.moveTo(cx,cy-55);g.bezierCurveTo(cx+60,cy-40,cx+50,cy+30,cx,cy+55);g.bezierCurveTo(cx-50,cy+30,cx-60,cy-40,cx,cy-55);g.fill();}
      else if(ic===6){g.beginPath();for(let k=0;k<5;k++){const a=k/5*Math.PI*2-Math.PI/2;g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a)*55,cy+Math.sin(a)*55);}g.stroke();}else{g.fillRect(cx-45,cy-45,35,90);g.fillRect(cx+10,cy-45,35,90);}
      g.textAlign='left';g.textBaseline='middle';let s=92;const f=i%3===0?"bold {s}px 'Bebas Neue',Impact,Arial":i%3===1?"bold {s}px 'Oswald',Arial":"{s}px 'Playfair Display',Georgia,serif";g.font=f.replace('{s}',s);while(g.measureText(nm).width>300&&s>30){s-=2;g.font=f.replace('{s}',s);}
      g.fillText(nm,x0+190,cy-(sub?14:0));if(sub){g.font="bold 26px 'Oswald',Arial";g.fillText(sub,x0+194,cy+46);}});});
    const m=new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:0xffffff,emissiveIntensity:0,roughness:0.5,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});return m;})();
  // località turistiche: negozietti, souvenir, gelaterie, dehors
  const TOURIST=new Set(['Lido Serena','Porto Calvino','Castellago','Montecastro','San Rocco Terme','Pievalta']);
  // insegne al neon: stesso atlante, solo la fascia alta, che lampeggia (di sera molto evidente)
  const NEON=(()=>{const m=new THREE.MeshBasicMaterial({map:shopTex,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
    let t=0;const tick=(dt,night)=>{t+=dt;const ph=Math.sin(t*2.1)+0.6*Math.sin(t*7.3+1),on=ph>-0.8?1:0.15;m.opacity=(0.25+0.75*night)*on;};return{m,tick};})();
  // tavolini con ombrellone davanti a bar, ristoranti e gelaterie
  const DEHORS=(()=>{const tg=new THREE.CylinderGeometry(0.4,0.4,0.05,12).translate(0,0.74,0),lg=new THREE.CylinderGeometry(0.04,0.06,0.74,6).translate(0,0.37,0),pg=new THREE.CylinderGeometry(0.03,0.03,2.3,6).translate(0,1.15,0),ug=new THREE.ConeGeometry(1.25,0.5,8,1,true).translate(0,2.25,0),cg=new THREE.BoxGeometry(0.42,0.45,0.42).translate(0,0.22,0);
    const tm=new THREE.MeshStandardMaterial({color:0xf0ece4,roughness:0.5}),mm=new THREE.MeshStandardMaterial({color:0x3a3d40,metalness:0.5,roughness:0.5}),um=new THREE.MeshStandardMaterial({vertexColors:false,color:0xffffff,roughness:0.8,side:THREE.DoubleSide}),cm=new THREE.MeshStandardMaterial({color:0x6b4a30,roughness:0.8});
    const UC=[0xc8312e,0xf2f0e8,0x1f6e5a,0xe8b23a,0x2c4f8a];
    return(T,D,x0,z0)=>{const n=D.length/4;if(!n)return;const M=new THREE.Matrix4(),V=new THREE.Vector3(),Q=new THREE.Quaternion(),S=new THREE.Vector3(1,1,1),Y=new THREE.Vector3(0,1,0),c=new THREE.Color();
      const mk=(g,m,cnt)=>{const im=new THREE.InstancedMesh(g,m,cnt);im.position.set(x0,0,z0);im.castShadow=true;scene.add(im);T.objs.push(im);return im;};
      const it=mk(tg,tm,n),il=mk(lg,mm,n),ip=mk(pg,mm,n),iu=mk(ug,um,n),ic=mk(cg,cm,n*2);
      for(let k=0;k<n;k++){const x=D[k*4]-x0,y=D[k*4+1],z=D[k*4+2]-z0,r=D[k*4+3];V.set(x,y,z);Q.setFromAxisAngle(Y,r*6);M.compose(V,Q,S);[it,il,ip,iu].forEach(im=>im.setMatrixAt(k,M));iu.setColorAt(k,c.setHex(UC[(r*UC.length)|0]));
        for(let j=0;j<2;j++){V.set(x+Math.cos(r*6+j*Math.PI)*0.75,y,z+Math.sin(r*6+j*Math.PI)*0.75);M.compose(V,Q,S);ic.setMatrixAt(k*2+j,M);}}
      [it,il,ip,iu,ic].forEach(im=>{im.instanceMatrix.needsUpdate=true;});if(iu.instanceColor)iu.instanceColor.needsUpdate=true;};})();
  const shopM=new THREE.MeshStandardMaterial({map:shopTex,roughness:0.6,emissiveMap:shopTex,emissive:0xffffff,emissiveIntensity:0}),awnM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.9,side:THREE.DoubleSide});
  const tileRoofM=addRelief(new THREE.MeshStandardMaterial({map:tileTex,roughness:0.9,side:THREE.DoubleSide}),6,0.9),darkRoofM=new THREE.MeshStandardMaterial({map:plankTex,color:0x7a6a60,roughness:0.9,side:THREE.DoubleSide});
  const roofM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.9,side:THREE.DoubleSide});
  const stoneTex=canvasTex(128,(g,n)=>{g.fillStyle='#fff';g.fillRect(0,0,n,n);for(let x=0;x<n;x+=16){g.fillStyle='rgba(90,80,70,.25)';g.fillRect(x,0,3,n);g.fillStyle='rgba(255,255,255,.5)';g.fillRect(x+3,0,2,n);}
    g.fillStyle='rgba(60,60,70,.35)';for(let x=6;x<n;x+=32){g.beginPath();g.moveTo(x,n*0.95);g.lineTo(x,n*0.35);g.quadraticCurveTo(x+6,n*0.15,x+12,n*0.35);g.lineTo(x+12,n*0.95);g.fill();}});
  stoneTex.wrapS=stoneTex.wrapT=THREE.RepeatWrapping;const stoneM=addRelief(new THREE.MeshStandardMaterial({map:stoneTex,vertexColors:true,roughness:0.8,side:THREE.DoubleSide}),5,0.9);
  const parkM=new THREE.MeshStandardMaterial({map:grassTex,color:0x8fb36b,roughness:1,polygonOffset:true,polygonOffsetFactor:-0.6,polygonOffsetUnits:-1.5});parkM.onBeforeCompile=sh=>grassFrag(sh);parkM.customProgramCacheKey=()=>'park2';
  const houseG=new THREE.BoxGeometry(1,1,1).translate(0,0.5,0);
  const roofG=(()=>{const g=new THREE.BufferGeometry();const p=[-.5,0,-.5,.5,0,-.5,0,1,-.5, -.5,0,.5,0,1,.5,.5,0,.5, -.5,0,-.5,0,1,-.5,0,1,.5, -.5,0,-.5,0,1,.5,-.5,0,.5, .5,0,-.5,.5,0,.5,0,1,.5, .5,0,-.5,0,1,.5,0,1,-.5];
    g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;})();
  const houseM=new THREE.MeshStandardMaterial({map:facTex,roughness:0.9}),hroofM=mat(0xffffff,{roughness:0.85,side:THREE.DoubleSide});
  const crownG=new THREE.IcosahedronGeometry(1,1),trunkG=new THREE.CylinderGeometry(0.12,0.18,1,6).translate(0,0.5,0),firG=new THREE.ConeGeometry(1,1,7).translate(0,0.5,0);
  const crownM=mat(0xffffff,{roughness:1}),firM=mat(0xffffff,{roughness:1}),trkM=mat(0x5b4633);
  const TREEV=(()=>{let sd=11;const rn=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
    const lump=(r,det,sx,sy,sz)=>{const g=new THREE.IcosahedronGeometry(r,det).toNonIndexed(),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+0.22*Math.sin(x*17.1+y*9.3)*Math.sin(z*13.7+x*5.1);p.setXYZ(i,x*k*sx,y*k*sy,z*k*sz);}return g;};
    const merge=parts=>{let n=0;parts.forEach(q=>n+=q.g.attributes.position.count);const P=new Float32Array(n*3),C=new Float32Array(n*3);let o=0;
      parts.forEach(({g,c,dx,dy,dz,shade})=>{const p=g.attributes.position;for(let i=0;i<p.count;i++){P[(o+i)*3]=p.getX(i)+(dx||0);P[(o+i)*3+1]=p.getY(i)+(dy||0);P[(o+i)*3+2]=p.getZ(i)+(dz||0);
        const f=(shade?0.72+0.5*Math.max(0,Math.min(1,(p.getY(i)+0.25)/0.5)):1)*(0.9+0.2*rn());C[(o+i)*3]=c[0]*f;C[(o+i)*3+1]=c[1]*f;C[(o+i)*3+2]=c[2]*f;}o+=p.count;});
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('color',new THREE.BufferAttribute(C,3));g.computeVertexNormals();return g;};
    const bark=[0.36,0.27,0.19],leaf=[[0.27,0.42,0.17],[0.33,0.48,0.2],[0.22,0.36,0.15],[0.4,0.5,0.2]];
    const trunk=(h,r0,r1)=>new THREE.CylinderGeometry(r1,r0,h,7).translate(0,h/2,0).toNonIndexed();
    const br=(len,ang,rot)=>{const g=new THREE.CylinderGeometry(0.008,0.016,len,5).translate(0,len/2,0);g.rotateZ(ang);g.rotateY(rot);return g.toNonIndexed();};
    const V=[];
    // 0: latifoglia tonda (città, parchi)
    {const parts=[{g:trunk(0.42,0.04,0.024),c:bark},{g:br(0.25,0.7,0.5),c:bark,dy:0.3},{g:br(0.22,-0.8,2.1),c:bark,dy:0.34}];
     [[0,0.66,0,0.3],[0.17,0.56,0.05,0.22],[-0.16,0.58,-0.06,0.23],[0.03,0.82,0.12,0.2],[-0.06,0.78,-0.15,0.21],[0.12,0.74,-0.14,0.19],[-0.12,0.5,0.14,0.18]].forEach(([x,y,z,r],k)=>parts.push({g:lump(r,1,1,0.85,1),c:leaf[k%4],dx:x,dy:y,dz:z,shade:1}));V.push(merge(parts));}
    // 1: pioppo / cipresso
    {const parts=[{g:trunk(0.25,0.03,0.02),c:bark}];[0.35,0.52,0.68,0.82,0.94].forEach((y,k)=>parts.push({g:lump(0.13-k*0.012,1,1,1.4,1),c:leaf[(k+1)%4],dy:y,shade:1}));V.push(merge(parts));}
    // 2: pino
    {const parts=[{g:trunk(0.35,0.03,0.015),c:bark}];[[0.25,0.3,0.32],[0.45,0.25,0.27],[0.62,0.19,0.24],[0.78,0.12,0.22]].forEach(([y,r,h],k)=>parts.push({g:new THREE.ConeGeometry(r,h,8).translate(0,h/2,0).toNonIndexed(),c:[0.12,0.26+k*0.02,0.14],dy:y,shade:1}));V.push(merge(parts));}
    // 3: latifoglia semplice (boschi lontani)
    {const parts=[{g:trunk(0.32,0.04,0.024),c:bark}];[[0,0.6,0,0.32],[0.16,0.5,0.06,0.22],[-0.14,0.72,-0.05,0.24],[0.05,0.48,-0.17,0.2]].forEach(([x,y,z,r],k)=>parts.push({g:lump(r,0,1,0.9,1),c:leaf[k%4],dx:x,dy:y,dz:z,shade:1}));V.push(merge(parts));}
    // 4: palma (lidi e porti)
    {const parts=[];for(let i=0;i<6;i++)parts.push({g:new THREE.CylinderGeometry(0.018-i*0.0015,0.022-i*0.0015,0.13,6).translate(0,0.065,0).toNonIndexed(),c:[0.48,0.38,0.26],dx:i*i*0.004,dy:i*0.125});
     for(let k=0;k<8;k++){const a=k/8*Math.PI*2,g=new THREE.ConeGeometry(0.05,0.42,4).rotateZ(-Math.PI/2).translate(0.2,0,0).toNonIndexed();g.scale(1,0.25,1);g.rotateZ(-0.35);g.rotateY(a);parts.push({g,c:leaf[k%4].map(v=>v*1.1),dx:0.1,dy:0.76});}
     parts.push({g:lump(0.05,0,1,1,1),c:[0.4,0.3,0.18],dx:0.1,dy:0.74});V.push(merge(parts));}
    // 5: cipresso slanciato (città d'arte e terme)
    {const parts=[{g:trunk(0.12,0.025,0.018),c:bark}];[0.18,0.34,0.5,0.66,0.8,0.92].forEach((y,k)=>parts.push({g:lump(0.085-k*0.009,1,1,2.0,1),c:[0.13,0.3,0.16],dy:y,shade:1}));V.push(merge(parts));}
    return V;})();
  const treeVM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.95});
  // ---------- alberi dettagliati (pacchetto HD): vicino alla camera i modelli veri, lontano le sagome di sempre ----------
  const HDT=(()=>{if(!window.HDON)return null;try{const V={};
    // la versione lontana non ha coordinate di texture: materiale pieno col colore medio della texture (altrimenti le foglie spariscono e restano i tronchi)
    const avgC=new Map();const farMat=(mm,by,nm)=>{let src=null;for(const m of by.keys())if(m.name===nm){src=m;break;}const map=src&&src.map;let col=new THREE.Color(0.25,0.33,0.18);
      if(map&&map.image){let a=avgC.get(map);if(!a){try{const cv=document.createElement('canvas');cv.width=cv.height=24;const g=cv.getContext('2d');g.drawImage(map.image,0,0,24,24);const d=g.getImageData(0,0,24,24).data;let r=0,gg=0,b=0,n=0;for(let i=0;i<d.length;i+=4)if(d[i+3]>140){r+=d[i];gg+=d[i+1];b+=d[i+2];n++;}if(n)a=new THREE.Color(r/n/255,gg/n/255,b/n/255).convertSRGBToLinear();}catch(e){}avgC.set(map,a||null);}if(a)col=a.clone();}
      const f=new THREE.MeshStandardMaterial({color:col.multiply(mm.color),roughness:0.95,metalness:0,side:mm.side});f.name=mm.name+'_far';return f;};
    const prep=(key,G,leafRe,sink=0,tint=1)=>{if(!G)return;const sc=G.scene;sc.updateMatrixWorld(true);const by=new Map();sc.traverse(m=>{if(!m.isMesh)return;if(!by.has(m.material))by.set(m.material,[]);by.get(m.material).push(gBake(m,m.matrixWorld));});
      const all=[...by.values()].flat(),bb=gBox(all),h=bb.max.y-bb.min.y;
      // il tronco: centro della base
      const low=new THREE.Box3();all.forEach(x=>{for(let i=0;i<x.n;i++)if(x.pos[i*3+1]<bb.min.y+0.04*h)low.expandByPoint(_gv.set(x.pos[i*3],0,x.pos[i*3+2]));});const c=low.isEmpty()?bb.getCenter(new THREE.Vector3()):low.getCenter(new THREE.Vector3());
      gShift(all,-c.x,-bb.min.y-sink*h,-c.z,1/(h*(1-sink)));
      const parts=[...by.entries()].map(([m,l])=>{const mm=gFixMat(m.clone());const leaf=leafRe.test(m.name)||m.transparent||m.alphaTest>0;
        if(leaf){mm.transparent=false;mm.alphaTest=0.45;mm.alphaToCoverage=true;mm.side=THREE.DoubleSide;if(mm.map){mm.map=coverageMips(mm.map,0.45);}mm.roughness=0.9;mm.metalness=0;if(tint!==1)mm.color.multiplyScalar(tint);}else{mm.roughness=Math.max(0.8,mm.roughness);mm.metalness=0;}
        return{geo:gMerge(l),mat:mm,name:m.name};});
      // versione leggera per la distanza (stesso modello, poche foglie e niente rami fini): stessi materiali
      let far=null;const FG=MODELS['hd_'+key2file[key]+'_far'];if(FG){const fs=FG.scene;fs.updateMatrixWorld(true);const fb=new Map();fs.traverse(m=>{if(!m.isMesh)return;const nm=m.material.name;if(!fb.has(nm))fb.set(nm,[]);fb.get(nm).push(gBake(m,m.matrixWorld));});
        const fa=[...fb.values()].flat();gShift(fa,-c.x,-bb.min.y-sink*h,-c.z,1/(h*(1-sink)));far=[...fb.entries()].map(([nm,l])=>{const P=parts.find(p=>p.name===nm)||parts[0];return{geo:gMerge(l),mat:farMat(P.mat,by,P.name)};});}
      V[key]={parts,far,items:new Set(),im:null};};
    const key2file={lin:'linden',fir:'fir',palm:'palm',cyp:'cypress',pop:'poplar'};
    prep('lin',MODELS.hd_linden,/001/);prep('fir',MODELS.hd_fir,/branch/i,0.28,1.45);prep('palm',MODELS.hd_palm,/leaves/i);prep('cyp',MODELS.hd_cypress,/2_sided/i,0,1.1);prep('pop',MODELS.hd_poplar,/branch/i,0,1.1);
    const CAP=MOBILE||QG.mid?50:110,TOT=MOBILE||QG.mid?60:130,RAD0=MOBILE?140:210,Z=new THREE.Matrix4().makeScale(0,0,0),M4=new THREE.Matrix4(),shown=new Set();let tm=0,HRAD=RAD0;window.HDTQ=l=>{HRAD=RAD0*[1,0.65,0.4][l];};
    Object.values(V).forEach(v=>{v.im=v.parts.map(p=>{const im=new THREE.InstancedMesh(p.geo,p.mat,CAP);im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(CAP*3).fill(1),3);im.instanceColor.setUsage(THREE.DynamicDrawUsage);im.count=0;im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(im);return im;});});
    // it: {v,x,z,m(Matrix4),c(Color),im,q,T}
    const add=(T,it)=>{if(!V[it.v])return false;(T.hdt||(T.hdt=[])).push(it);it.T=T;return true;};
    const drop=T=>{if(T.hdt)T.hdt.forEach(it=>shown.delete(it));T.hdt=null;};
    // a fine costruzione della zona: gli alberi di quella zona diventano modelli 3D leggeri (e le sagome poligonali spariscono)
    const buildFar=T=>{if(!T.hdt)return;const by={};T.hdt.forEach(it=>{if(!it.far&&V[it.v]&&V[it.v].far)(by[it.v]||(by[it.v]=[])).push(it);});
      Object.entries(by).forEach(([k,L])=>{const ims=V[k].far.map(p=>{const im=new THREE.InstancedMesh(p.geo,p.mat,L.length);im.frustumCulled=false;im.receiveShadow=true;
          L.forEach((it,q)=>{im.setMatrixAt(q,it.m);im.setColorAt(q,it.c);});scene.add(im);T.dobj.push(im);return im;});
        L.forEach((it,q)=>{it.far=ims;it.fq=q;if(it.im){it.im.visible=false;}});});};
    const update=(dt,force)=>{tm-=dt;if(tm>0&&!force)return;tm=0.4;const RAD=HRAD,cx=camera.position.x,cz=camera.position.z,R2=RAD*RAD,cand={};Object.keys(V).forEach(k=>cand[k]=[]);
      tiles.forEach(T=>{if(!T.det||!T.hdt)return;const x0=T.i*TS,z0=T.j*TS;if(cx<x0-RAD||cx>x0+TS+RAD||cz<z0-RAD||cz>z0+TS+RAD)return;
        for(const it of T.hdt){const d=(it.x-cx)**2+(it.z-cz)**2;if(d<R2)cand[it.v].push([d,it]);}});
      const now=new Set(),dirty=new Set();
      // tetto complessivo: i più vicini, di qualunque specie
      {const all=[];Object.keys(V).forEach(k=>cand[k].forEach(c=>all.push(c)));if(all.length>TOT){all.sort((a,b)=>a[0]-b[0]);const lim=all[TOT-1][0];Object.keys(V).forEach(k=>cand[k]=cand[k].filter(c=>c[0]<=lim));}}
      Object.keys(V).forEach(k=>{const L=cand[k];L.sort((a,b)=>a[0]-b[0]);const v=V[k],n=Math.min(CAP,L.length);
        for(let q=0;q<n;q++){const it=L[q][1];now.add(it);v.im.forEach(im=>{im.setMatrixAt(q,it.m);im.setColorAt(q,it.c);});}
        v.im.forEach(im=>{im.count=n;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;});});
      shown.forEach(it=>{if(!now.has(it)&&it.T.det){if(it.far){it.far.forEach(im=>{im.setMatrixAt(it.fq,it.m);dirty.add(im);});}else if(it.im.parent){it.im.setMatrixAt(it.q,it.m0);dirty.add(it.im);}}});
      now.forEach(it=>{if(!shown.has(it)){if(it.far){it.far.forEach(im=>{im.setMatrixAt(it.fq,Z);dirty.add(im);});}else{if(!it.m0){it.m0=new THREE.Matrix4();it.im.getMatrixAt(it.q,it.m0);}it.im.setMatrixAt(it.q,Z);dirty.add(it.im);}}});
      dirty.forEach(im=>im.instanceMatrix.needsUpdate=true);shown.clear();now.forEach(it=>shown.add(it));};
    return Object.keys(V).length?{V,add,drop,update,buildFar}:null;}catch(e){console.warn('alberi HD non preparati',e);return null;}})();
  // ---------- laghi: costruiti una volta sola ----------
  if(!HIDE)NW.lakes.forEach(L=>{try{const ct=[];for(let i=0;i<L.p.length;i+=2)ct.push(new THREE.Vector2(L.p[i],L.p[i+1]));const hs=L.holes.map(h=>{const a=[];for(let i=0;i<h.length;i+=2)a.push(new THREE.Vector2(h[i],h[i+1]));return a;});
    const tri=THREE.ShapeUtils.triangulateShape(ct,hs),all=ct.concat(...hs),pos=new Float32Array(all.length*3);all.forEach((v,i)=>{pos[i*3]=v.x;pos[i*3+1]=L.lv;pos[i*3+2]=v.y;});
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex(tri.flat());g.computeVertexNormals();if(g.attributes.normal.array[1]<0)g.index.array.reverse();g.computeVertexNormals();
    const m=new THREE.Mesh(g,waveMat(NW.waveAmp(L)));m.receiveShadow=true;scene.add(m);}catch(e){console.warn('lago',L.n,e);}});
  // ---------- monumenti: il Duomo, costruito dalla sua pianta vera ----------
  const LMS={segs:[]};
  (NW.J.lms||[]).forEach(([kind,rg,g0])=>{if(kind!=='duomo'||HIDE)return;try{
    const n=rg.length/2;let cx=0,cz=0;for(let i=0;i<n;i++){cx+=rg[i*2];cz+=rg[i*2+1];}cx/=n;cz/=n;
    let sxx=0,szz=0,sxz=0;for(let i=0;i<n;i++){const dx=rg[i*2]-cx,dz=rg[i*2+1]-cz;sxx+=dx*dx;szz+=dz*dz;sxz+=dx*dz;}
    const th=0.5*Math.atan2(2*sxz,sxx-szz);let ax=Math.cos(th),az=Math.sin(th);if(ax>0){ax=-ax;az=-az;}// asse verso la facciata (ovest)
    const bx=-az,bz=ax;let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;for(let i=0;i<n;i++){const dx=rg[i*2]-cx,dz=rg[i*2+1]-cz,a=dx*ax+dz*az,b=dx*bx+dz*bz;a0=Math.min(a0,a);a1=Math.max(a1,a);b0=Math.min(b0,b);b1=Math.max(b1,b);}
    const W=(a,b)=>[cx+ax*a+bx*b,cz+az*a+bz*b],Hw=30,Hn=46,nw=(b1-b0)*0.3,bm=(b0+b1)/2;
    const stM=new THREE.MeshStandardMaterial({map:stoneTex,color:0xf3e9dd,roughness:0.7}),spM=new THREE.MeshStandardMaterial({color:0xf2e8dc,roughness:0.6}),roofDM=new THREE.MeshStandardMaterial({color:0xd8d0c5,roughness:0.8,side:THREE.DoubleSide});
    const grp=new THREE.Group();scene.add(grp);
    // muri perimetrali e tetto delle navate laterali
    {const P=[],U=[],I=[];let per=0;for(let i=0;i<n;i++){const x1=rg[i*2],z1=rg[i*2+1],x2=rg[(i+1)%n*2],z2=rg[(i+1)%n*2+1],L=Math.hypot(x2-x1,z2-z1),s=P.length/3;
        P.push(x1,g0-1,z1,x2,g0-1,z2,x1,g0+Hw,z1,x2,g0+Hw,z2);U.push(per/6,0,(per+L)/6,0,per/6,Hw/12,(per+L)/6,Hw/12);per+=L;I.push(s,s+1,s+2,s+1,s+3,s+2);LMS.segs.push([x1,z1,x2,z2]);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:stoneTex,color:0xf3e9dd,roughness:0.7,side:THREE.DoubleSide}));m.castShadow=m.receiveShadow=true;grp.add(m);
      const ct=[];for(let i=0;i<n;i++)ct.push(new THREE.Vector2(rg[i*2],rg[i*2+1]));const tri=THREE.ShapeUtils.triangulateShape(ct,[]);const RP=[];ct.forEach(v=>RP.push(v.x,g0+Hw,v.y));
      const gr=new THREE.BufferGeometry();gr.setAttribute('position',new THREE.Float32BufferAttribute(RP,3));gr.setIndex(tri.flat());gr.computeVertexNormals();const mr=new THREE.Mesh(gr,roofDM);mr.castShadow=true;grp.add(mr);}
    // navata centrale con tetto a capanna
    const box=(a,b,y,la,lb,h,M)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(la,h,lb),M);const [x,z]=W(a,b);m.position.set(x,y+h/2,z);m.rotation.y=-Math.atan2(az,ax);m.castShadow=m.receiveShadow=true;grp.add(m);return m;};
    const nA0=a0+2,nA1=a1-12;box((nA0+nA1)/2,bm,g0+Hw-1,nA1-nA0,nw,Hn-Hw+1,stM);
    {const L=nA1-nA0,g=new THREE.BufferGeometry(),hw=nw/2+0.5,hr=7;g.setAttribute('position',new THREE.Float32BufferAttribute([-L/2,0,-hw,L/2,0,-hw,-L/2,hr,0,L/2,hr,0,-L/2,0,hw,L/2,0,hw],3));g.setIndex([0,2,1,1,2,3,4,5,2,5,3,2,0,4,2,1,3,5]);g.computeVertexNormals();
      const m=new THREE.Mesh(g,roofDM);const [x,z]=W((nA0+nA1)/2,bm);m.position.set(x,g0+Hn,z);m.rotation.y=-Math.atan2(az,ax);m.castShadow=true;grp.add(m);}
    // tiburio e guglia maggiore con la Madonnina
    const ta=a0+(a1-a0)*0.6,[tx,tz]=W(ta,bm);
    {const c1=new THREE.Mesh(new THREE.CylinderGeometry(8,9,22,8),stM);c1.position.set(tx,g0+Hn+11,tz);grp.add(c1);const c2=new THREE.Mesh(new THREE.CylinderGeometry(1.2,6.5,34,8),spM);c2.position.set(tx,g0+Hn+22+17,tz);grp.add(c2);
     const c3=new THREE.Mesh(new THREE.CylinderGeometry(0.25,1.2,10,8),spM);c3.position.set(tx,g0+Hn+56+5,tz);grp.add(c3);
     const md=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.9,4.2,8),new THREE.MeshStandardMaterial({color:0xe0b040,metalness:0.9,roughness:0.25,envMapIntensity:1.6}));md.position.set(tx,g0+Hn+66+2.1,tz);grp.add(md);[c1,c2,c3].forEach(c=>c.castShadow=true);}
    // guglie: lungo il perimetro, sui fianchi della navata e sulla facciata
    const SP=[];let acc=0;for(let i=0;i<n;i++){const x1=rg[i*2],z1=rg[i*2+1],x2=rg[(i+1)%n*2],z2=rg[(i+1)%n*2+1],L=Math.hypot(x2-x1,z2-z1);acc+=L;while(acc>7.5){acc-=7.5;const t=1-acc/L;SP.push([x1+(x2-x1)*t,g0+Hw,z1+(z2-z1)*t,1]);}}
    for(let a=nA0+4;a<nA1;a+=8)[-1,1].forEach(sd=>{const [x,z]=W(a,bm+sd*(nw/2+0.3));SP.push([x,g0+Hn,z,0.9]);});
    for(let k=0;k<6;k++){const b=bm+(k-2.5)*(b1-b0)*0.85/5,[x,z]=W(a0+1,b);SP.push([x,g0+Hw,z,1.9]);}
    {const base=new THREE.BoxGeometry(1.4,1,1.4).translate(0,0.5,0),cone=new THREE.ConeGeometry(0.75,1,6).translate(0,0.5,0);
     const i1=new THREE.InstancedMesh(base,spM,SP.length),i2=new THREE.InstancedMesh(cone,spM,SP.length),M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),V=new THREE.Vector3(),S3=new THREE.Vector3();
     SP.forEach(([x,y,z,k],q)=>{i1.setMatrixAt(q,M4.compose(V.set(x,y,z),Q,S3.set(k,6*k,k)));i2.setMatrixAt(q,M4.compose(V.set(x,y+6*k,z),Q,S3.set(k,9*k,k)));});[i1,i2].forEach(im=>{im.castShadow=true;grp.add(im);});}
    // facciata a capanna verso la piazza
    {const [x,z]=W(a0+0.6,bm),g=new THREE.BufferGeometry(),hw=(b1-b0)*0.42;g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-hw,0,0,hw,0,16,0],3));g.setIndex([0,1,2]);g.computeVertexNormals();
     const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:stoneTex,color:0xf3e9dd,roughness:0.7,side:THREE.DoubleSide}));m.position.set(x,g0+Hw,z);m.rotation.y=-Math.atan2(az,ax);grp.add(m);}
  }catch(e){console.warn('Duomo',e);}});
  // ---------- Valdonia: chiese, torri, monumenti, ciminiere, porto, spiaggia, barche, mucche ----------
  const nightMats=[[LOGO,1.1]],lampPoleMX=new THREE.MeshStandardMaterial({color:0x6a6f75,metalness:0.6,roughness:0.45});
  function signTex(kind,lines){return canvasTex(512,(g,n)=>{const hw=kind!=='st',bg=hw?'#1f6e3d':'#1d4f9c';const H2=kind==='hwd'?272:kind.startsWith('hw')?240:280;g.canvas.height=H2;
    g.fillStyle=bg;g.fillRect(0,0,512,H2);g.strokeStyle='#fff';g.lineWidth=8;g.strokeRect(10,10,492,H2-20);g.fillStyle='#fff';g.textAlign='left';
    if(kind==='hw1'||kind==='hw2'){g.font='bold 38px Arial';g.fillText(lines[0],40,70);g.font='bold 60px Arial';g.fillText(lines[1],40,145);g.font='bold 40px Arial';if(lines[2])g.fillText(lines[2],40,205);
      g.save();g.translate(440,140);g.rotate(kind==='hw2'?0.7:0);g.beginPath();g.moveTo(0,-60);g.lineTo(32,-18);g.lineTo(12,-18);g.lineTo(12,60);g.lineTo(-12,60);g.lineTo(-12,-18);g.lineTo(-32,-18);g.closePath();g.fill();g.restore();}
    else if(kind==='hwd'){g.font='bold 50px Arial';lines.forEach((l,i)=>g.fillText(l,40,80+i*74));}
    else if(kind==='a1'){g.fillStyle='#fff';g.beginPath();g.ellipse(120,140,80,62,0,0,7);g.fill();g.fillStyle=bg;g.font='bold 70px Arial';g.textAlign='center';g.fillText('A1',120,165);g.fillStyle='#fff';g.textAlign='left';g.font='bold 52px Arial';g.fillText('Autostrada',220,160);}
    else{g.font='bold 62px Arial';g.fillText(lines[0],40,120);g.font='bold 48px Arial';g.fillText(lines[1],40,210);g.save();g.translate(450,140);g.beginPath();g.moveTo(0,-70);g.lineTo(36,-20);g.lineTo(13,-20);g.lineTo(13,70);g.lineTo(-13,70);g.lineTo(-13,-20);g.lineTo(-36,-20);g.closePath();g.fill();g.restore();}});}
  const ADS=[['Caffè Ornello','Il risveglio di Valdonia','#5a3420','#f3e2c4','#c98a3c'],['Gelati Polare','Freschi di montagna','#bfe6f5','#0f4c75','#ffffff'],['Birra Valdorna','Bionda dal 1921','#14432b','#f2c84b','#f2c84b'],['Pasta Calvina','Al dente, sempre','#1d4fa0','#ffd23f','#ffffff'],
    ['Assicurazioni Fenice','Viaggia sereno','#8c1c1c','#ffffff','#f5a623'],['Moto Rondine','Libertà su due ruote','#111111','#ff7a1a','#ffffff'],['Acqua Pievalta','Sorgente alpina','#ffffff','#1565c0','#7fb8e6'],['Banca Serena','Il tuo futuro, in buone mani','#13284f','#ffffff','#5ec4b6'],
    ['Pneumatici Grippa','Tenuta su ogni strada','#ffd400','#111111','#111111'],['Supermercati Sole','Aperti 7 giorni su 7','#ff8a00','#ffffff','#ffe066'],['Radio Guido','Musica che fa strada','#d7261e','#ffffff','#5e1511'],['Terme di San Rocco','Relax a un passo','#0f6e6e','#ffffff','#9fe0d8'],
    ['Mobilificio Ferrandina','Arreda la tua vita','#5b3a1e','#ffe9c7','#d9a066'],['Formaggi Pievalta','Stagionati in alta quota','#f6e27a','#5a3a10','#c0392b'],['Pizzeria Da Gino','Forno a legna dal 1968','#1e7a3a','#ffffff','#e53935'],['Concessionaria Vroom','Usato garantito','#0d47a1','#ffeb3b','#ffffff'],
    ['Ornapetrol','Il pieno di Valdonia','#c8202a','#ffffff','#ffd23f'],['Cantine Collebruna','Rosso di collina','#5a0f1e','#f4d9a8','#d9a066'],['Lido Serena','Il mare più bello','#4fc3f7','#ffffff','#ffeb3b'],['Gatto Crocchette','Il gatto ringrazia','#ff7f2a','#ffffff','#4a2600'],['Autoscuola Guido','Patente in 30 giorni','#ffffff','#c8202a','#1d4fa0'],['Salumificio Montecastro','Tradizione di borgo','#7a1f1a','#ffe0b2','#ffb74d']];
  function adTex(i){const [b,sl,bg,fg,ac]=ADS[i%ADS.length];return canvasTex(512,(g,n)=>{g.canvas.height=256;g.fillStyle=bg;g.fillRect(0,0,512,256);g.fillStyle=ac;g.globalAlpha=0.35;
      for(let k=0;k<5;k++){g.beginPath();g.arc(420+k*8,40+k*30,60-k*8,0,7);g.fill();}g.globalAlpha=1;g.fillRect(0,214,512,10);g.fillStyle=fg;g.textAlign='left';
      g.font='bold '+(b.length>16?52:64)+'px Arial';g.fillText(b,32,110);g.font='italic 34px Arial';g.fillText(sl,34,170);g.strokeStyle=fg;g.lineWidth=6;g.strokeRect(8,8,496,240);});}
  // finestre accese di notte: maschera ricavata dalle zone scure delle facciate (una finestra su tre circa)
  function nightMask(tex){const img=tex.image;if(!img||!img.getContext)return null;const w=img.width,h=img.height,d=img.getContext('2d').getImageData(0,0,w,h).data,L=new Float32Array(w*h);
    for(let i=0;i<w*h;i++)L[i]=0.3*d[i*4]+0.59*d[i*4+1]+0.11*d[i*4+2];const sorted=Array.from(L).sort((a,b)=>a-b),th=Math.min(80,sorted[(w*h*0.18)|0]+4);
    const lab=new Int32Array(w*h).fill(-1),c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),out=g.createImageData(w,h);let id=0;
    for(let i=0;i<w*h;i++){if(L[i]>=th||lab[i]>=0)continue;const lit=Math.random()<0.38,col=[255,200+Math.random()*40,120+Math.random()*60],st=[i];lab[i]=id;
      while(st.length){const p=st.pop(),x=p%w,y=(p/w)|0;if(lit){out.data[p*4]=col[0];out.data[p*4+1]=col[1];out.data[p*4+2]=col[2];}out.data[p*4+3]=255;
        for(const q of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(q>=0&&lab[q]<0&&L[q]<th){lab[q]=id;st.push(q);}}id++;}
    for(let i=0;i<w*h;i++)if(out.data[i*4+3]===0)out.data[i*4+3]=255;g.putImageData(out,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;return t;}
  let nightOn=null;
  // luci della città che si accendono gradualmente col buio (lv 0..1), non tutte di colpo
  let nightLv=-1;function setNight(on,lv){const t=lv==null?(on?1:0):lv;if(Math.abs(t-nightLv)<0.01)return;nightLv=t;nightOn=t>0.5;
    if(t>0)FAC.forEach(([m])=>{if(!m.userData.nm&&m.map){m.userData.nm=1;const tx=nightMask(m.map);if(tx){m.emissiveMap=tx;m.emissive=new THREE.Color(0xffffff);m.needsUpdate=true;}}});
    FAC.forEach(([m])=>{m.emissiveIntensity=0.9*t;});shopM.emissiveIntensity=0.75*t;lampHeadM.emissiveIntensity=2.2*t;poolM.visible=t>0.05;if(poolM.userData.op0==null)poolM.userData.op0=poolM.opacity;poolM.opacity=poolM.userData.op0*t;nightMats.forEach(([m,k])=>m.emissiveIntensity=k*t);}
  const LMX=(()=>{const L=NW.J.lms||[],M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),V=new THREE.Vector3(),S3=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0),co=new THREE.Color();
    const box4=(x,z,rot,w,l)=>{const c=Math.cos(rot),s=Math.sin(rot),P=[[-l/2,-w/2],[l/2,-w/2],[l/2,w/2],[-l/2,w/2]].map(([a,b])=>[x+a*c-b*s,z+a*s+b*c]);for(let q=0;q<4;q++)LMS.segs.push([P[q][0],P[q][1],P[(q+1)%4][0],P[(q+1)%4][1]]);};
    const plasterM=new THREE.MeshStandardMaterial({map:stoneTex,color:0xeee4d2,roughness:0.85}),towerM=new THREE.MeshStandardMaterial({map:stoneTex,color:0xc9b79a,roughness:0.9});
    const gable=(w,l,rh)=>{const g=new THREE.BufferGeometry(),hw=w/2+0.4,hl=l/2+0.4;g.setAttribute('position',new THREE.Float32BufferAttribute([-hl,0,-hw,hl,0,-hw,-hl,rh,0,hl,rh,0,-hl,0,hw,hl,0,hw],3));
      g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,l/3,0,0,w/5,l/3,w/5,0,0,l/3,0],2));g.setIndex([0,2,1,1,2,3,4,5,2,5,3,2,0,4,2,1,3,5]);g.computeVertexNormals();return g;};
    const grp=new THREE.Group();scene.add(grp);const add=(m,sh)=>{m.castShadow=sh!==false;m.receiveShadow=true;grp.add(m);return m;};
    const anim={boats:[],smoke:[],herds:[]};
    L.forEach(e=>{const k=e[0];try{
      if(k==='church'){const [,x,z,rot,w,l,h,g]=e,G=new THREE.Group();G.position.set(x,g,z);G.rotation.y=-rot;
        const nave=new THREE.Mesh(new THREE.BoxGeometry(l,h,w),plasterM);nave.position.y=h/2;G.add(nave);const rf=new THREE.Mesh(gable(w,l,w*0.4),tileRoofM);rf.position.y=h;G.add(rf);
        const tw=w*0.42,th=h*2.3,tow=new THREE.Mesh(new THREE.BoxGeometry(tw,th,tw),plasterM);tow.position.set(l/2-tw/2,th/2,w/2+tw/2);G.add(tow);
        const bel=new THREE.Mesh(new THREE.BoxGeometry(tw*0.7,2.2,tw*1.02),new THREE.MeshStandardMaterial({color:0x2a2a2a}));bel.position.set(l/2-tw/2,th-2.2,w/2+tw/2);G.add(bel);
        const sp=new THREE.Mesh(new THREE.ConeGeometry(tw*0.75,tw*1.4,4),tileRoofM);sp.rotation.y=Math.PI/4;sp.position.set(l/2-tw/2,th+tw*0.7,w/2+tw/2);G.add(sp);
        const ros=new THREE.Mesh(new THREE.CircleGeometry(w*0.16,16),new THREE.MeshStandardMaterial({color:0x5a6a7a,roughness:0.3,metalness:0.4}));ros.position.set(-l/2-0.05,h*0.7,0);ros.rotation.y=-Math.PI/2;G.add(ros);
        G.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});grp.add(G);box4(x,z,rot,w,l);}
      else if(k==='tower'){const [,x,z,h,w,g]=e,t=add(new THREE.Mesh(new THREE.BoxGeometry(w,h,w),towerM));t.position.set(x,g+h/2,z);
        for(let q=0;q<12;q++){const a=q%3,sd=(q/3)|0,m=add(new THREE.Mesh(new THREE.BoxGeometry(1.1,1.4,1.1),towerM)),o=(a-1)*w*0.36,p=w/2-0.55;const [dx,dz]=[[o,p],[p,o],[o,-p],[-p,o]][sd];m.position.set(x+dx,g+h+0.7,z+dz);}
        box4(x,z,0,w,w);}
      else if(k==='monu'){const [,x,z,rot,size,g]=e;if(!MONU)return;const t=MONU[(Math.abs(Math.round(x*7+z*3))%MONU.length)],bw=t.box.max.x-t.box.min.x,bd=t.box.max.z-t.box.min.z,sc=Math.min(size/Math.max(bw,bd),26/t.box.max.y);
        const G=gInstance(t,sc);G.position.set(x,g,z);G.rotation.y=-rot;grp.add(G);const f=t.foot;box4(x,z,rot,(f.max.z-f.min.z)*sc,(f.max.x-f.min.x)*sc);}
      else if(k==='chim'){const [,x,z,h,g]=e,m=add(new THREE.Mesh(new THREE.CylinderGeometry(1.3,2.2,h,10),new THREE.MeshStandardMaterial({color:0x8a5a48,roughness:0.9})));m.position.set(x,g+h/2,z);
        for(const yy of [0.55,0.85]){const r=add(new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.6,1.6,10),new THREE.MeshStandardMaterial({color:0xe8e4dc})));r.position.set(x,g+h*yy,z);}
        anim.smoke.push({x,z,y:g+h,p:[]});LMS.segs.push([x-1.6,z,x+1.6,z],[x,z-1.6,x,z+1.6]);}
      else if(k==='crane'){const [,x,z,rot,g]=e,yel=new THREE.MeshStandardMaterial({color:0xd8a020,roughness:0.6}),G=new THREE.Group();G.position.set(x,g,z);G.rotation.y=rot;
        [[-6,-5],[6,-5],[-6,5],[6,5]].forEach(([a,b])=>{const l=new THREE.Mesh(new THREE.BoxGeometry(0.9,26,0.9),yel);l.position.set(a,13,b);G.add(l);});
        const top=new THREE.Mesh(new THREE.BoxGeometry(14,4,12),yel);top.position.y=27;G.add(top);const boom=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.6,46),yel);boom.position.set(0,29,14);G.add(boom);
        const cab=new THREE.Mesh(new THREE.BoxGeometry(4,3,4),new THREE.MeshStandardMaterial({color:0xeeeeee}));cab.position.set(0,24,6);G.add(cab);G.traverse(o=>{if(o.isMesh)o.castShadow=true;});grp.add(G);}
      else if(k==='quay'){const P=e[1],top=e[2],A=[],I=[];for(let q=0;q<P.length/2;q++){const s0=A.length/3;A.push(P[q*2],-5,P[q*2+1],P[q*2],top,P[q*2+1]);if(q){I.push(s0-2,s0,s0-1,s0-1,s0,s0+1);LMS.segs.push([P[q*2-2],P[q*2-1],P[q*2],P[q*2+1]]);}}
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(A,3));g.setIndex(I);g.computeVertexNormals();add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x9a968e,roughness:0.9,side:THREE.DoubleSide})),false);}
      else if(k==='ship'){const [,x,z,rot,len,ty]=e,G=new THREE.Group(),B=len*0.15,hull=new THREE.Shape();hull.moveTo(-len/2,-B/2);hull.lineTo(len*0.32,-B/2);hull.quadraticCurveTo(len/2,-B*0.2,len/2,0);hull.quadraticCurveTo(len/2,B*0.2,len*0.32,B/2);hull.lineTo(-len/2,B/2);hull.lineTo(-len/2,-B/2);
        const hg=new THREE.ExtrudeGeometry(hull,{depth:len*0.09,bevelEnabled:false});hg.rotateX(-Math.PI/2);hg.translate(0,-len*0.03,0);
        const hc=[0x223a5e,0xf2f2f2,0x8a2a22][ty%3];G.add(new THREE.Mesh(hg,new THREE.MeshStandardMaterial({color:hc,roughness:0.6})));const dk=len*0.06;
        const sup=new THREE.Mesh(new THREE.BoxGeometry(len*(ty===1?0.6:0.14),len*(ty===1?0.1:0.12),B*0.9),new THREE.MeshStandardMaterial({color:0xf4f4f0,roughness:0.5}));sup.position.set(ty===1?-len*0.05:-len*0.38,dk+len*(ty===1?0.05:0.06),0);G.add(sup);
        const fun=new THREE.Mesh(new THREE.CylinderGeometry(B*0.12,B*0.14,len*0.08,10),new THREE.MeshStandardMaterial({color:0xc23a2a}));fun.position.set(-len*0.4,dk+len*0.16,0);G.add(fun);
        if(ty===0){const cols=[0xb03a2e,0x2e6db0,0xe0a020,0x2e8a4a,0x777777,0xd06a20];for(let a=0;a<7;a++)for(let b=0;b<3;b++)for(let c=0;c<2;c++){const m=new THREE.Mesh(new THREE.BoxGeometry(len*0.075,2.5,B*0.28),new THREE.MeshStandardMaterial({color:cols[(a*3+b*5+c)%6],roughness:0.7}));m.position.set(-len*0.22+a*len*0.08,dk+1.25+c*2.5,(b-1)*B*0.3);G.add(m);}}
        if(ty===1)for(let q=0;q<2;q++){const w=new THREE.Mesh(new THREE.BoxGeometry(len*0.55,0.8,B*0.92),new THREE.MeshStandardMaterial({color:0x2b3640}));w.position.set(-len*0.05,dk+2+q*3,0);G.add(w);}
        G.position.set(x,0,z);G.rotation.y=-rot;G.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});grp.add(G);}
      else if(k==='umbr'){const P=e[1],n=P.length/2;if(!n)return;const pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04,0.04,2.4,5).translate(0,1.2,0),new THREE.MeshStandardMaterial({color:0xdddddd}),n),
        can=new THREE.InstancedMesh(new THREE.ConeGeometry(1.25,0.55,8).translate(0,2.45,0),new THREE.MeshStandardMaterial({roughness:0.8}),n),bed=new THREE.InstancedMesh(new THREE.BoxGeometry(0.7,0.25,1.9).translate(0.9,0.3,0),new THREE.MeshStandardMaterial({color:0xf2f0ea}),n);
        const cols=[0xd8322a,0x2c6fb8,0xf0c020,0x2a9a5a,0xf07a20,0xffffff];for(let q=0;q<n;q++){const x=P[q*2],z=P[q*2+1],g=NW.Hg(x,z);M4.compose(V.set(x,g,z),Q.identity(),S3.set(1,1,1));pole.setMatrixAt(q,M4);can.setMatrixAt(q,M4);bed.setMatrixAt(q,M4);co.setHex(cols[q*7%6]).convertSRGBToLinear();can.setColorAt(q,co);}
        [pole,can,bed].forEach(m=>{m.castShadow=true;grp.add(m);});}
      else if(k==='boat'){const [,cx,cz,rx,rz,ph,sp,ty,lv]=e,G=new THREE.Group(),L=ty?9:7.5,hs=new THREE.Shape();hs.moveTo(-L/2,-1.2);hs.lineTo(L*0.25,-1.2);hs.quadraticCurveTo(L/2,-0.4,L/2,0);hs.quadraticCurveTo(L/2,0.4,L*0.25,1.2);hs.lineTo(-L/2,1.2);hs.lineTo(-L/2,-1.2);
        const hg=new THREE.ExtrudeGeometry(hs,{depth:1.1,bevelEnabled:false});hg.rotateX(-Math.PI/2);hg.translate(0,-0.4,0);G.add(new THREE.Mesh(hg,new THREE.MeshStandardMaterial({color:ty?0xffffff:[0xf2f2f2,0x1e3d6b,0xb02a22][Math.abs(Math.round(cx))%3],roughness:0.4})));
        if(ty){const mast=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,10,6),new THREE.MeshStandardMaterial({color:0xcccccc}));mast.position.set(0.3,5.6,0);G.add(mast);const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute([0.3,1.2,0,0.3,10.3,0,-3.6,1.3,0],3));sg.computeVertexNormals();
          G.add(new THREE.Mesh(sg,new THREE.MeshStandardMaterial({color:0xfafaf5,side:THREE.DoubleSide,roughness:0.7})));}
        else{const cb=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.1,1.8),new THREE.MeshStandardMaterial({color:0xe8e8e8}));cb.position.set(-0.4,1.2,0);G.add(cb);const gl=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.7,1.6),new THREE.MeshStandardMaterial({color:0x334455,roughness:0.2}));gl.position.set(0.85,1.3,0);gl.rotation.z=0.5;G.add(gl);}
        G.traverse(o=>{if(o.isMesh)o.castShadow=true;});grp.add(G);anim.boats.push({G,cx,cz,rx,rz,ph,sp,lv});}
      else if(k==='sign'){const [,x,z,ang,kind,lines]=e,dx=Math.cos(ang),dz=Math.sin(ang),hw=kind.startsWith('hw'),W=hw?6.4:2.6,Hh=hw?(kind==='hwd'?3.4:3.0):1.4,y0=NW.Hg(x,z),yr=Math.max(y0,NW.H(x,z)),y=yr+(hw?4.2:2.0);
        const tex=signTex(kind,lines),G=new THREE.Group();G.position.set(x,yr,z);G.rotation.y=Math.atan2(-dx,-dz);
        const pn=new THREE.Mesh(new THREE.PlaneGeometry(W,Hh),new THREE.MeshStandardMaterial({map:tex,roughness:0.5,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:0}));pn.position.y=y-yr;G.add(pn);nightMats.push([pn.material,0.35]);
        const bk=new THREE.Mesh(new THREE.BoxGeometry(W,Hh,0.08),new THREE.MeshStandardMaterial({color:0x8a8e92,metalness:0.5,roughness:0.5}));bk.position.set(0,y-yr,-0.06);G.add(bk);
        (hw?[-W/2+0.4,W/2-0.4]:[0]).forEach(o=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.09,y-yr+Hh/2,8),lampPoleMX);p.position.set(o,(y-yr+Hh/2)/2-0.3,-0.12);G.add(p);});
        G.traverse(o=>{if(o.isMesh)o.castShadow=true;});grp.add(G);}
      else if(k==='bill'){const [,x,z,ang,ad,g]=e,dx=Math.cos(ang),dz=Math.sin(ang),G=new THREE.Group(),tex=adTex(ad);G.position.set(x,g,z);G.rotation.y=Math.atan2(-dx,-dz);
        const pn=new THREE.Mesh(new THREE.PlaneGeometry(8,4),new THREE.MeshStandardMaterial({map:tex,roughness:0.6,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:0}));pn.position.y=5.2;G.add(pn);nightMats.push([pn.material,0.55]);
        const bk=new THREE.Mesh(new THREE.BoxGeometry(8.3,4.3,0.25),new THREE.MeshStandardMaterial({color:0x5a5e62,roughness:0.7}));bk.position.set(0,5.2,-0.15);G.add(bk);
        [-2.6,2.6].forEach(o=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.16,4.6,8),lampPoleMX);p.position.set(o,2.3,-0.2);G.add(p);});
        G.traverse(o=>{if(o.isMesh)o.castShadow=true;});grp.add(G);box4(x,z,0,1,1);}
      else if(k==='fuel'){const [,x,z,rot,nm,kd]=e,yr=NW.H(x,z),G=new THREE.Group();G.position.set(x,yr,z);G.rotation.y=-rot;const hw=kd==='hw';
        const wh=new THREE.MeshStandardMaterial({color:0xf4f4f2,roughness:0.5}),rd=new THREE.MeshStandardMaterial({color:0xc8202a,roughness:0.45,emissive:0xc8202a,emissiveIntensity:0}),gy=new THREE.MeshStandardMaterial({color:0x6d7277,metalness:0.5,roughness:0.4});
        nightMats.push([rd,0.5]);const L=hw?26:16,Wc=hw?13:11;
        const ap=new THREE.Mesh(new THREE.PlaneGeometry(L+14,22).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:0x9a9a96,roughness:0.95,polygonOffset:true,polygonOffsetFactor:-1}));ap.position.set(0,0.03,14.5);ap.receiveShadow=true;G.add(ap);
        const cn=new THREE.Mesh(new THREE.BoxGeometry(L,0.7,Wc),wh);cn.position.set(0,5.6,2.4);G.add(cn);const band=new THREE.Mesh(new THREE.BoxGeometry(L+0.1,0.32,Wc+0.1),rd);band.position.set(0,5.4,2.4);G.add(band);
        const lt=new THREE.Mesh(new THREE.PlaneGeometry(L-1,Wc-1).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff4e0,emissiveIntensity:0}));lt.position.set(0,5.24,2.4);G.add(lt);nightMats.push([lt.material,1.2]);
        const isl=new THREE.Mesh(new THREE.BoxGeometry(L-4,0.2,1.4),new THREE.MeshStandardMaterial({color:0xd8d5cc,roughness:0.8}));isl.position.set(0,0.1,4.8);G.add(isl);
        for(let q=-1;q<=1;q++){const px=q*(L/2-4);const pil=new THREE.Mesh(new THREE.BoxGeometry(0.45,5.3,0.45),wh);pil.position.set(px,2.65,4.8);G.add(pil);
          [-1.6,1.6].forEach(o=>{if(q===0&&!hw)return;const pu=new THREE.Mesh(new THREE.BoxGeometry(0.9,1.7,0.55),wh);pu.position.set(px+o,1.05,4.8);G.add(pu);const tp=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.25,0.6),rd);tp.position.set(px+o,1.9,4.8);G.add(tp);
            const sc=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.32),new THREE.MeshStandardMaterial({color:0x223344,emissive:0x66ccff,emissiveIntensity:0.6}));sc.position.set(px+o,1.45,4.51);sc.rotation.y=Math.PI;G.add(sc);});}
        const sh=new THREE.Mesh(new THREE.BoxGeometry(hw?18:10,4.2,hw?9:7),new THREE.MeshStandardMaterial({color:hw?0xe9e2d4:0xf1efea,roughness:0.8}));sh.position.set(0,2.1,hw?17.5:14.5);G.add(sh);
        const gl=new THREE.Mesh(new THREE.PlaneGeometry(hw?14:7,2.2),new THREE.MeshStandardMaterial({color:0x2e4a5e,roughness:0.15,metalness:0.4,emissive:0xffe2a8,emissiveIntensity:0}));gl.position.set(0,1.6,(hw?17.5-4.51:14.5-3.51));gl.rotation.y=Math.PI;G.add(gl);nightMats.push([gl.material,0.6]);
        const sgT=canvasTex(256,(g,n)=>{g.fillStyle='#c8202a';g.fillRect(0,0,n,n/2);g.fillStyle='#fff';g.font='bold 44px sans-serif';g.textAlign='center';g.fillText(hw?'RISTORO':'BAR',n/2,58);g.font='bold 30px sans-serif';g.fillText('ORNAPETROL',n/2,104);});
        const sg=new THREE.Mesh(new THREE.PlaneGeometry(hw?8:6,hw?1.6:1.2),new THREE.MeshStandardMaterial({map:sgT,emissiveMap:sgT,emissive:0xffffff,emissiveIntensity:0}));sgT.repeat.set(1,0.5);sgT.offset.set(0,0.5);sg.position.set(0,3.6,(hw?17.5-4.52:14.5-3.52));sg.rotation.y=Math.PI;G.add(sg);nightMats.push([sg.material,0.9]);
        const tot=new THREE.Mesh(new THREE.BoxGeometry(0.5,hw?9:6,2.2),rd);tot.position.set(-(L/2+4),(hw?9:6)/2,7);G.add(tot);
        const prT=canvasTex(128,(g,n)=>{g.fillStyle='#fff';g.fillRect(0,0,n,n*2);g.fillStyle='#c8202a';g.font='bold 22px sans-serif';g.textAlign='center';g.fillText('ORNAPETROL',64,26);g.fillStyle='#111';g.font='bold 20px monospace';g.fillText('Benzina 1,79',64,62);g.fillText('Diesel  1,69',64,92);});
        [1,-1].forEach(sd=>{const pp=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshStandardMaterial({map:prT,emissiveMap:prT,emissive:0xffffff,emissiveIntensity:0}));pp.position.set(-(L/2+4)+sd*0.26,(hw?9:6)-1.6,7);pp.rotation.y=sd*Math.PI/2;G.add(pp);nightMats.push([pp.material,0.8]);});
        G.traverse(o=>{if(o.isMesh){o.castShadow=o!==ap&&o!==lt;o.receiveShadow=true;}});grp.add(G);
        const c=Math.cos(rot),s2=Math.sin(rot),W2=(lx,lz)=>[x+lx*c-lz*s2,z+lx*s2+lz*c];
        {const[a1,b1]=W2(0,4.8);box4(a1,b1,rot,1.4,L-4);}{const[a1,b1]=W2(0,hw?17.5:14.5);box4(a1,b1,rot,hw?9:7,hw?18:10);}{const[a1,b1]=W2(-(L/2+4),7);box4(a1,b1,rot,2.2,0.5);}}
      else if(k==='cows')anim.herds.push({x:e[1],z:e[2],n:e[3],g:e[4],cows:null});
      else if(k==='island'){const [,x,z,r,g]=e,gr=new THREE.Mesh(new THREE.CircleGeometry(r,28),parkM);gr.rotation.x=-Math.PI/2;gr.position.set(x,NW.Hground(x,z)+0.2,z);grp.add(gr);gr.receiveShadow=true;
        const cb=add(new THREE.Mesh(new THREE.CylinderGeometry(r+0.25,r+0.25,0.3,28,1,true),new THREE.MeshStandardMaterial({color:0xd9d6cf,roughness:0.8,side:THREE.DoubleSide})),false);cb.position.set(x,NW.Hground(x,z)+0.1,z);
        const tk=add(new THREE.Mesh(trunkG,trkM));tk.scale.set(1.3,4,1.3);tk.position.set(x,NW.Hground(x,z),z);const cr=add(new THREE.Mesh(crownG,new THREE.MeshStandardMaterial({color:0x3f6b30,roughness:1})));cr.scale.setScalar(3.2);cr.position.set(x,NW.Hground(x,z)+5.5,z);
        for(let q=0;q<16;q++){const a=q/16*Math.PI*2,b=(q+1)/16*Math.PI*2;LMS.segs.push([x+Math.cos(a)*r,z+Math.sin(a)*r,x+Math.cos(b)*r,z+Math.sin(b)*r]);}}
    }catch(err){console.warn('ornavia',k,err);}});
    // fumo delle ciminiere: sprite che salgono e sbiadiscono
    const smT=canvasTex(64,(g,n)=>{const gr=g.createRadialGradient(32,32,2,32,32,30);gr.addColorStop(0,'rgba(120,115,110,.75)');gr.addColorStop(1,'rgba(120,115,110,0)');g.fillStyle=gr;g.fillRect(0,0,n,n);});
    const smM=new THREE.SpriteMaterial({map:smT,transparent:true,depthWrite:false,fog:true});
    anim.smoke.forEach(S=>{for(let q=0;q<9;q++){const sp=new THREE.Sprite(smM.clone());sp.visible=false;grp.add(sp);S.p.push({sp,t:q/9});}});
    let T0=0;
    function update(dt){T0+=dt;const cx=camera.position.x,cz=camera.position.z;
      anim.boats.forEach(b=>{if(Math.abs(b.cx-cx)+Math.abs(b.cz-cz)>4000){b.G.visible=false;return;}b.G.visible=true;const a=b.ph+T0*b.sp,x=b.cx+Math.cos(a)*b.rx,z=b.cz+Math.sin(a)*b.rz;
        b.G.position.set(x,b.lv+0.05*Math.sin(T0*1.7+b.ph),z);b.G.rotation.y=Math.atan2(Math.cos(a)*b.rz,Math.sin(a)*b.rx)+(b.sp>0?0:Math.PI);b.G.rotation.z=0.03*Math.sin(T0*1.3+b.ph);});
      anim.smoke.forEach(S=>{const near=Math.abs(S.x-cx)+Math.abs(S.z-cz)<2500;S.p.forEach(P=>{P.sp.visible=near;if(!near)return;P.t=(P.t+dt*0.07)%1;const t=P.t;P.sp.position.set(S.x+t*22,S.y+2+t*40,S.z+t*8);P.sp.scale.setScalar(5+t*26);P.sp.material.opacity=0.85*(1-t);});});
      anim.herds.forEach(H=>{const d=Math.abs(H.x-cx)+Math.abs(H.z-cz);if(d<450&&!H.cows){H.cows=[];for(let q=0;q<H.n;q++){const a=makeAnimal('cow'),x=H.x+(hsh(q,H.x|0)-0.5)*26,z=H.z+(hsh(q+9,H.z|0)-0.5)*26;a.position.set(x,NW.Hground(x,z),z);a.rotation.y=hsh(q,3)*6.28;scene.add(a);H.cows.push(a);}}
        else if(d>650&&H.cows){H.cows.forEach(a=>scene.remove(a));H.cows=null;}
        if(H.cows&&d<200)H.cows.forEach(a=>{if(a.userData.mixer)a.userData.mixer.update(dt);});});}
    const smog=L.filter(e=>e[0]==='smog').map(e=>({x:e[1],z:e[2],r:e[3]}));
    return {update,smog};})();
  // ---------- indici per mattonella ----------
  const segT=new Map();NW.roads.forEach((R,ri)=>{for(let i=0;i<R.N-1;i++){const k=tk(Math.floor((R.X[i]+R.X[i+1])/2/TS),Math.floor((R.Z[i]+R.Z[i+1])/2/TS));let l=segT.get(k);if(!l)segT.set(k,l=[]);l.push(ri,i);}});
  const rivers=NW.J.rivers.map(([w,n,p])=>({w,n,p}));const rivT=new Map();rivers.forEach((R,ri)=>{for(let i=0;i<R.p.length/2-1;i++){const k=tk(Math.floor((R.p[i*2]+R.p[i*2+2])/2/TS),Math.floor((R.p[i*2+1]+R.p[i*2+3])/2/TS));let l=rivT.get(k);if(!l)rivT.set(k,l=[]);l.push(ri,i);}});
  const bldT=new Map();NW.J.blds.forEach((b,bi)=>{const k=tk(Math.floor(b[3][0]/TS),Math.floor(b[3][1]/TS));let l=bldT.get(k);if(!l)bldT.set(k,l=[]);l.push(bi);});
  const swM=addRelief(new THREE.MeshStandardMaterial({map:paverTex,color:0xe2ded6,roughness:0.9,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),6,0.8);
  const manTex=canvasTex(64,(g,n)=>{g.fillStyle='#3a3a3a';g.beginPath();g.arc(32,32,31,0,7);g.fill();g.strokeStyle='#6a6a68';g.lineWidth=3;g.beginPath();g.arc(32,32,28,0,7);g.stroke();g.strokeStyle='#555';g.lineWidth=2;for(let k=-20;k<=20;k+=8){g.beginPath();g.moveTo(32+k,8);g.lineTo(32+k,56);g.stroke();g.beginPath();g.moveTo(8,32+k);g.lineTo(56,32+k);g.stroke();}});
  const manM=new THREE.MeshStandardMaterial({map:manTex,transparent:true,alphaTest:0.5,roughness:0.6,metalness:0.4,polygonOffset:true,polygonOffsetFactor:-8,polygonOffsetUnits:-16}),manG=new THREE.CircleGeometry(0.38,14).rotateX(-Math.PI/2);
  const lampPoleG=(()=>{const a=new THREE.CylinderGeometry(0.06,0.09,7.6,7).translate(0,3.8,0).toNonIndexed(),b=new THREE.BoxGeometry(1.7,0.08,0.08).translate(0.85,7.5,0).toNonIndexed(),g=new THREE.BufferGeometry(),pa=a.attributes.position.array,pb=b.attributes.position.array,P=new Float32Array(pa.length+pb.length);P.set(pa);P.set(pb,pa.length);g.setAttribute('position',new THREE.BufferAttribute(P,3));g.computeVertexNormals();return g;})();
  const lampHeadG=new THREE.BoxGeometry(0.7,0.16,0.32).translate(1.6,7.42,0),lampPoleM=new THREE.MeshStandardMaterial({color:0x4a4f55,metalness:0.6,roughness:0.45}),lampHeadM=new THREE.MeshStandardMaterial({color:0xdddddd,emissive:0xffd28a,emissiveIntensity:0});
  const poolTex=canvasTex(64,(g,n)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,210,140,1)');gr.addColorStop(1,'rgba(255,210,140,0)');g.fillStyle=gr;g.fillRect(0,0,n,n);});
  const poolM=new THREE.MeshBasicMaterial({map:poolTex,transparent:true,opacity:0.32,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-10,polygonOffsetUnits:-20}),poolG=new THREE.CircleGeometry(7,20).rotateX(-Math.PI/2);poolM.visible=false;
  function furniture(T){const x0=T.i*TS,z0=T.j*TS,l=segT.get(T.key);if(!l)return;const LP=[],MH=[];
    for(let q=0;q<l.length;q+=2){const R=NW.roads[l[q]],i=l[q+1];if(!NW.swRoad(R)||!NW.cityAt(R.X[i],R.Z[i]))continue;const a=R.cum[i],b=R.cum[i+1],L=b-a;if(L<0.5)continue;
      const tx=(R.X[i+1]-R.X[i])/L,tz=(R.Z[i+1]-R.Z[i])/L,nx=-tz,nz=tx;
      for(let s=Math.ceil(a/29)*29;s<b;s+=29){const t=(s-a)/L,x=R.X[i]+tx*(s-a),z=R.Z[i]+tz*(s-a),h=R.Hh[i]+(R.Hh[i+1]-R.Hh[i])*t,sd=((s/29)|0)%2?1:-1;if(NW.nearJ(x,z,13))continue;
        const lo=R.w/2+Math.min(1.5,(NW.SWW||2.5)*0.55),px=x+nx*sd*lo,pz=z+nz*sd*lo;LP.push([px,h+NW.SWH,pz,Math.atan2(nz*sd,-nx*sd),x+nx*sd*(R.w/2-1.0),z+nz*sd*(R.w/2-1.0),h]);addSeg(T,px-0.1,pz,px+0.1,pz);}
      for(let s=Math.ceil((a+17)/43)*43-17;s<b;s+=43){const t=(s-a)/L,x=R.X[i]+tx*(s-a),z=R.Z[i]+tz*(s-a),h=R.Hh[i]+(R.Hh[i+1]-R.Hh[i])*t,sd=((s/43)|0)%2?1:-1;MH.push([x+nx*sd*R.w/4,h+0.06,z+nz*sd*R.w/4]);}}
    const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),V=new THREE.Vector3(),S1=new THREE.Vector3(1,1,1),UPV=new THREE.Vector3(0,1,0);
    if(LP.length){const ip=new THREE.InstancedMesh(lampPoleG,lampPoleM,LP.length),ih=new THREE.InstancedMesh(lampHeadG,lampHeadM,LP.length),io=new THREE.InstancedMesh(poolG,poolM,LP.length);
      LP.forEach(([x,y,z,rot,gx,gz,gh],k)=>{Q.setFromAxisAngle(UPV,rot);M4.compose(V.set(x,y,z),Q,S1);ip.setMatrixAt(k,M4);ih.setMatrixAt(k,M4);Q.identity();io.setMatrixAt(k,M4.compose(V.set(gx,gh+0.08,gz),Q,S1));});
      ip.castShadow=true;[ip,ih,io].forEach(m=>{scene.add(m);T.dobj.push(m);});}
    if(MH.length){const im=new THREE.InstancedMesh(manG,manM,MH.length);MH.forEach(([x,y,z],k)=>im.setMatrixAt(k,M4.compose(V.set(x,y,z),Q.identity(),S1)));scene.add(im);T.dobj.push(im);}}
  const RLS=(NW.J.rails||[]).map(([k,p])=>({k,p})),railT=new Map();RLS.forEach((R,ri)=>{for(let i=0;i<R.p.length/2-1;i++){const k=tk(Math.floor((R.p[i*2]+R.p[i*2+2])/2/TS),Math.floor((R.p[i*2+1]+R.p[i*2+3])/2/TS));let l=railT.get(k);if(!l)railT.set(k,l=[]);l.push(ri,i);}});
  const trackM=new THREE.MeshStandardMaterial({color:0x9a9ea3,metalness:0.7,roughness:0.35,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-12});
  const TR=NW.J.trees||[],treeT=new Map();for(let i=0;i<TR.length/2;i++){const k=tk(Math.floor(TR[i*2]/TS),Math.floor(TR[i*2+1]/TS));let l=treeT.get(k);if(!l)treeT.set(k,l=[]);l.push(i);}
  const areaT=new Map();NW.J.areas.forEach((a,ai)=>{const k=tk(Math.floor(a[1][0]/TS),Math.floor(a[1][1]/TS));let l=areaT.get(k);if(!l)areaT.set(k,l=[]);l.push(ai);});
  // ---------- colore del terreno ----------
  let TCR=0;
  function tcol(x,z,h,sl){const n=0.86+0.14*fbm(x/80,z/80,2);let c;
    const fld=hsh(Math.floor(x/140+fbm(x/300,z/300,1)*2),Math.floor(z/110));
    // tavolozza per zona: costa calda e asciutta, colline verdi morbide, montagna più fredda; macchie grandi di prato più giallo o più verde
    const mz=fbm(x/1100+3,z/1100-7,2)/0.75,coast=1-sstep(25,140,h),mont=sstep(380,800,h);
    let base=[0.96+0.14*mz,0.85-0.03*mz,0.64-0.04*mz];base=base.map((v,q)=>v*(1-coast)+[1.05,0.9,0.66][q]*coast);base=base.map((v,q)=>v*(1-mont)+[0.8,0.82,0.7][q]*mont);
    if(h<230&&sl<0.1&&fld>0.42)c=[[1.08,0.9,0.58],[0.86,0.86,0.58],[1.0,0.82,0.6],[0.82,0.82,0.54]][(fld*40|0)%4].map((v,q)=>v*0.75+base[q]*0.25);else c=base;
    const gk=CLUMP(x,z,h);c=c.map(v=>v*(1-0.22*gk));
    const ff=forestF(x,z,h,sl);c=c.map((v,q)=>v*(1-ff)+[0.42,0.48,0.38][q]*ff);
    const rock=sstep(0.55,0.95,sl)+sstep(900,1100,h)*0.6;c=c.map((v,q)=>v*(1-Math.min(1,rock))+[0.62,0.6,0.57][q]*Math.min(1,rock));
    const snow=sstep(1250,1400,h+60*n);TCR=Math.min(1,rock)*(1-snow);c=c.map((v,q)=>v*(1-snow)+2.3*snow);
    const ci=NW.cityAt(x,z),pa=ci?null:NW.placeAt(x,z);const urb=ci?1:pa?(1-sstep(0.55,1,pa.f))*(pa.p.t===2?0.4:0.75):0;
    c=c.map((v,q)=>v*(1-urb)+[0.66,0.64,0.6][q]*urb);
    const lk=NW.lakeAt(x,z);if(lk&&h<NW.lakes[lk-1].lv)c=[0.72,0.68,0.55];
    if(h<3.4)c=[0.95,0.86,0.62];
    return c.map(v=>v*n*smogK(x,z));}
  function smogK(x,z){let k=1;for(const S of LMX.smog){const d=Math.hypot(x-S.x,z-S.z);if(d<S.r)k=Math.min(k,0.72+0.28*sstep(0.3,1,d/S.r));}return k;}
  // ---------- griglia di terreno ----------
  function terrain(x0,z0,size,n,hf,material,skipNear,paved){const N=n+1,rkA=ROCK?new Float32Array(N*N):null,pos=new Float32Array(N*N*3),col=new Float32Array(N*N*3),uv=new Float32Array(N*N*2),Hs=new Float32Array(N*N),st=size/n;
    for(let b=0;b<N;b++)for(let a=0;a<N;a++){const x=x0+a*st,z=z0+b*st,k=b*N+a,h=hf(x,z);Hs[k]=h;pos[k*3]=a*st;pos[k*3+1]=h-(paved?0.3:0.04);pos[k*3+2]=b*st;uv[k*2]=x/9;uv[k*2+1]=z/9;}
    // la griglia del terreno è larga (10-20 m): fra un vertice sul ciglio della strada e uno a monte il prato può salire sopra l'asfalto.
    // Si abbassano i vertici delle celle attraversate dalla strada sotto la quota della carreggiata (mai alzati: i rilevati restano)
    const HOLE=new Set();if(skipNear==='carve'){const ti=Math.round(x0/TS),tj=Math.round(z0/TS),LO=new Map(),CAND=[];
      // in galleria il terreno deve restare sopra la volta; fuori (e davanti agli imbocchi) sotto la carreggiata
      const portals=R=>{if(R._pt)return R._pt;let f=-1,l=-1;for(let i=0;i<R.N-1;i++){if(NW.Hg((R.X[i]+R.X[i+1])/2,(R.Z[i]+R.Z[i+1])/2)-(R.Hh[i]+R.Hh[i+1])/2>3){if(f<0)f=i;l=i+1;}}return R._pt=[f,l];};
      const inTunP=(R,x,z)=>{const[f,l]=portals(R);if(f<0)return false;const dfx=R.X[f+1]-R.X[f],dfz=R.Z[f+1]-R.Z[f],dlx=R.X[l-1]-R.X[l],dlz=R.Z[l-1]-R.Z[l];
        return (x-R.X[f])*dfx+(z-R.Z[f])*dfz>0&&(x-R.X[l])*dlx+(z-R.Z[l])*dlz>0;};
      const mark=(R,a,b,h,tin)=>{if(a<0||b<0||a>n||b>n)return;const k=b*N+a;if(tin)return;if(!(LO.get(k)<=h))LO.set(k,h);};
      for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){const l=segT.get(tk(ti+di,tj+dj));if(!l)continue;
        for(let q=0;q<l.length;q+=2){const R=NW.roads[l[q]],i=l[q+1];if(R.b||R.c>=9)continue;const ax=R.X[i],az=R.Z[i],bx=R.X[i+1],bz=R.Z[i+1],L=Math.hypot(bx-ax,bz-az);if(L<0.01)continue;
          const hw=R.w/2+(R.t?1.6:0.8);if(Math.max(ax,bx)<x0-hw-st||Math.min(ax,bx)>x0+size+hw+st||Math.max(az,bz)<z0-hw-st||Math.min(az,bz)>z0+size+hw+st)continue;
          const nx=-(bz-az)/L,nz=(bx-ax)/L,M=Math.ceil(L/(st*0.35));
          for(let u=0;u<=M;u++){const f=u/M,x=ax+(bx-ax)*f,z=az+(bz-az)*f,h=R.Hh[i]+(R.Hh[i+1]-R.Hh[i])*f-0.14;
            const tin=R.t&&inTunP(R,x,z);for(const o of [-hw,-hw/2,0,hw/2,hw]){const a=Math.floor((x+nx*o-x0)/st),b=Math.floor((z+nz*o-z0)/st);if(tin){if(a>=0&&b>=0&&a<n&&b<n)CAND.push(a,b,h);continue;}mark(R,a,b,h);mark(R,a+1,b,h);mark(R,a,b+1,h);mark(R,a+1,b+1,h);}}}}
      LO.forEach((v,k)=>{if(Hs[k]>v){Hs[k]=v;pos[k*3+1]=v-0.04;}});
      // sopra la galleria, dove il terreno passerebbe dentro la volta (vicino agli imbocchi), si apre un buco: si vede la galleria in trincea
      for(let c=0;c<CAND.length;c+=3){const a=CAND[c],b=CAND[c+1],h=CAND[c+2],m=Math.min(Hs[b*N+a],Hs[b*N+a+1],Hs[(b+1)*N+a],Hs[(b+1)*N+a+1]);if(m<h+6.6)HOLE.add(b*n+a);}}
    for(let b=0;b<N;b++)for(let a=0;a<N;a++){const k=b*N+a,hx=(Hs[b*N+Math.min(n,a+1)]-Hs[b*N+Math.max(0,a-1)])/(st*((a>0&&a<n)?2:1)),hz=(Hs[Math.min(n,b+1)*N+a]-Hs[Math.max(0,b-1)*N+a])/(st*((b>0&&b<n)?2:1));
      {const xx=x0+a*st,zz=z0+b*st;if(paved){const sk=smogK(xx,zz);col.set(Hs[k]<3.2?[1.15,1.02,0.78]:[1.05*sk,1.03*sk*0.97,1*sk*0.92],k*3);}else{col.set(tcol(xx,zz,Hs[k],Math.hypot(hx,hz)),k*3);if(rkA)rkA[k]=TCR;}}}
    const idx=[];for(let b=0;b<n;b++)for(let a=0;a<n;a++){if(HOLE.has(b*n+a))continue;const p=b*N+a,q=p+1,r=p+N,s=r+1;idx.push(p,r,q,q,r,s);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(rkA)g.setAttribute('rk',new THREE.BufferAttribute(rkA,1));g.setIndex(idx);g.computeVertexNormals();
    const m=new THREE.Mesh(g,material);m.position.set(x0,0,z0);m.receiveShadow=true;scene.add(m);return m;}
  // ---------- nastri stradali ----------
  function buildRoads(T){const x0=T.i*TS,z0=T.j*TS,l=segT.get(T.key);if(!l)return;const groups=new Map(),tun=[],brg=[],rails=[];
    // raggruppa i segmenti consecutivi della stessa strada
    const runs=new Map();for(let q=0;q<l.length;q+=2){const ri=l[q],i=l[q+1];let r=runs.get(ri);if(!r)runs.set(ri,r=[]);r.push(i);}
    runs.forEach((list,ri)=>{const R=NW.roads[ri];list.sort((a,b)=>a-b);let s=list[0],p=list[0];const emit=(a,b)=>{const key=texKey(R),rank=RANK[R.c],k=key+'|'+rank;let G=groups.get(k);if(!G)groups.set(k,G={key,rank,P:[],U:[],I:[]});ribbon(R,a,b+2,G,x0,z0);
        if(R.t)tun.push([R,a,b+2]);if(R.b)brg.push([R,a,b+2]);if(R.c===0&&!R.b&&!R.t&&!NW.cityAt(R.X[a],R.Z[a]))rails.push([R,a,b+2]);};
      if(R.t){list=list.filter(i=>NW.Hg((R.X[i]+R.X[i+1])/2,(R.Z[i]+R.Z[i+1])/2)-(R.Hh[i]+R.Hh[i+1])/2>3);if(!list.length)return;s=p=list[0];}
      for(let k=1;k<list.length;k++){if(list[k]!==p+1){emit(s,p);s=list[k];}p=list[k];}emit(s,p);});
    groups.forEach(G=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(G.P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(G.U,2));g.setIndex(G.I);g.computeVertexNormals();
      const m=new THREE.Mesh(g,roadMat(G.key,G.rank));m.position.set(x0,0,z0);m.receiveShadow=true;scene.add(m);T.objs.push(m);});
    // gallerie: pareti e volta con lampade
    if(tun.length){const P=[],I=[],LP=[],LI=[];tun.forEach(([R,a,b])=>{for(let i=a;i<b;i++){const n=nrm(R,i),hw=R.w/2+0.6;const base=P.length/3,h=R.Hh[i];
        P.push(R.X[i]-n[0]*hw-x0,h-0.2,R.Z[i]-n[1]*hw-z0,R.X[i]-n[0]*hw-x0,h+5.6,R.Z[i]-n[1]*hw-z0,R.X[i]+n[0]*hw-x0,h+5.6,R.Z[i]+n[1]*hw-z0,R.X[i]+n[0]*hw-x0,h-0.2,R.Z[i]+n[1]*hw-z0);
        if(i>a){const pb=base-4;for(let s=0;s<3;s++)I.push(pb+s,base+s,pb+s+1,pb+s+1,base+s,base+s+1);}
        const lb=LP.length/3;LP.push(R.X[i]-n[0]*0.25-x0,h+5.55,R.Z[i]-n[1]*0.25-z0,R.X[i]+n[0]*0.25-x0,h+5.55,R.Z[i]+n[1]*0.25-z0);if(i>a)LI.push(lb-2,lb,lb-1,lb-1,lb,lb+1);}});
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();const m=new THREE.Mesh(g,tunM);m.position.set(x0,0,z0);scene.add(m);T.objs.push(m);
      const gl=new THREE.BufferGeometry();gl.setAttribute('position',new THREE.Float32BufferAttribute(LP,3));gl.setIndex(LI);const ml=new THREE.Mesh(gl,lampM);ml.position.set(x0,0,z0);scene.add(ml);T.objs.push(ml);}
    // imbocchi delle gallerie: portale in cemento con fascia
    tun.forEach(([R,a,b])=>{if(!R._pt){let f=-1,l=-1;for(let i=0;i<R.N-1;i++){if(NW.Hg((R.X[i]+R.X[i+1])/2,(R.Z[i]+R.Z[i+1])/2)-(R.Hh[i]+R.Hh[i+1])/2>3){if(f<0)f=i;l=i+1;}}R._pt=[f,l];}
      R._pt.forEach((pi,e)=>{if(pi<0||pi<a||pi>=b)return;const n=nrm(R,pi),hw=R.w/2+0.6,h=R.Hh[pi],tx=n[1],tz=-n[0],ang=Math.atan2(-n[1],n[0]);
        const add=(w,hh,d,lo,y)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),portM);m.position.set(R.X[pi]+n[0]*lo,h+y,R.Z[pi]+n[1]*lo);m.rotation.y=ang;m.castShadow=true;scene.add(m);T.objs.push(m);};
        add(3.2,9,1.4,-(hw+1.6),4.3);add(3.2,9,1.4,hw+1.6,4.3);add(2*hw+6.4,3.1,1.4,0,7.25);add(2*hw+6.8,0.5,1.6,0,8.9);});});
    // ponti e viadotti: impalcato a cassone, banchine larghe, parapetti in cemento, pile (più grosse quando sono alte), archi sui viadotti più alti
    if(brg.length){const P=[],I=[],PP=[],SP=[],SI=[],AP=[],AI=[],BX=NW.BRX;
      const strip=(A,Ix,pts)=>{const b=A.length/3;pts.forEach(p=>A.push(p[0]-x0,p[1],p[2]-z0));return b;};
      brg.forEach(([R,a,b])=>{
        // banchine ai lati della carreggiata e cassone sotto l'impalcato
        for(const sd of [-1,1]){for(let i=a;i<b;i++){const n=nrm(R,i),h=R.Hh[i]+0.05,o0=sd*R.w/2,o1=sd*(R.w/2+BX),o2=sd*(R.w/2+BX+0.45),base=SP.length/3;
            SP.push(R.X[i]+n[0]*o0-x0,h,R.Z[i]+n[1]*o0-z0, R.X[i]+n[0]*o1-x0,h,R.Z[i]+n[1]*o1-z0, R.X[i]+n[0]*o2-x0,h-1.7,R.Z[i]+n[1]*o2-z0);
            if(i>a){const p=base-3;SI.push(p,p+1,p+3,p+1,p+4,p+3);SI.push(p+1,p+2,p+4,p+2,p+5,p+4);}}}
        for(let i=a;i<b;i++){const n=nrm(R,i),h=R.Hh[i]-1.65,o=R.w/2+BX+0.45,base=SP.length/3;SP.push(R.X[i]-n[0]*o-x0,h,R.Z[i]-n[1]*o-z0,R.X[i]+n[0]*o-x0,h,R.Z[i]+n[1]*o-z0);if(i>a){const p=base-2;SI.push(p,p+2,p+1,p+1,p+2,p+3);}}
        // parapetti
        [-1,1].forEach(sd=>{for(let i=a;i<b;i++){const n=nrm(R,i),o=sd*(R.w/2+BX+0.15),h=R.Hh[i]+0.05,base=P.length/3;
          P.push(R.X[i]+n[0]*o-x0,h-0.6,R.Z[i]+n[1]*o-z0,R.X[i]+n[0]*o-x0,h+1.05,R.Z[i]+n[1]*o-z0);if(i>a)I.push(base-2,base,base-1,base-1,base,base+1);}});
        // pile: interasse e spessore crescono con l'altezza
        let maxC=0;for(let i=a;i<b-1;i++){const L=R.cum[i+1]-R.cum[i];const gh0=NW.Hg(R.X[i],R.Z[i]);maxC=Math.max(maxC,R.Hh[i]-gh0);const ns=Math.max(1,Math.floor(L/(maxC>14?40:28)));for(let s2=0;s2<ns;s2++){const t=(s2+0.5)/ns,x=R.X[i]+(R.X[i+1]-R.X[i])*t,z=R.Z[i]+(R.Z[i+1]-R.Z[i])*t,h=R.Hh[i]+(R.Hh[i+1]-R.Hh[i])*t,gh=NW.Hg(x,z);
          if(h-gh<3.2)continue;let blocked=false;for(const q of NW.near(x,z,4))if(q.R!==R&&q.h<h-2)blocked=true;const n=nrm(R,i);if(!blocked)PP.push([x-x0,gh-1,z-z0,h-gh-1.0,Math.min(3.4,1.6+(h-gh)*0.06),Math.atan2(-n[1],n[0])]);}}
        // arco: solo sui viadotti lunghi e molto alti
        const L=R.cum[b-1]-R.cum[a];if(L>110&&maxC>20&&((R.X[a]*7+R.Z[a]*3)|0)%3!==1){let i0=-1,i1=-1;for(let i=a;i<b;i++){const c=R.Hh[i]-NW.Hg(R.X[i],R.Z[i]);if(c>7){if(i0<0)i0=i;i1=i;}}
          if(i0>=0&&i1-i0>=2){const s0=R.cum[i0],s1=R.cum[i1],g0=NW.Hg(R.X[i0],R.Z[i0]),g1=NW.Hg(R.X[i1],R.Z[i1]);
            for(const sd of [-1,1]){let prev=-1;for(let i=i0;i<=i1;i++){const t=(R.cum[i]-s0)/Math.max(1,s1-s0),deck=R.Hh[i]-1.7,base0=g0+(g1-g0)*t,y=Math.min(deck,base0+(deck-base0+2)*4*t*(1-t)*1.0),n=nrm(R,i),o=sd*(R.w/2*0.55),cx=R.X[i]+n[0]*o,cz=R.Z[i]+n[1]*o,tx=n[1],tz=-n[0];
                const base=AP.length/3;for(const[dx,dy] of [[-0.6,-0.9],[0.6,-0.9],[0.6,0.9],[-0.6,0.9]])AP.push(cx+n[0]*dx-x0,y+dy,cz+n[1]*dx-z0);
                if(prev>=0)for(let k=0;k<4;k++){const k2=(k+1)%4;AI.push(prev+k,base+k,prev+k2,prev+k2,base+k,base+k2);}prev=base;
                if(deck-y>1.2&&i%2===0)PP.push([cx-x0,y,cz-z0,deck-y+0.1,0.55,Math.atan2(-n[1],n[0])]);}}}}});
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();const m=new THREE.Mesh(g,concM);m.position.set(x0,0,z0);scene.add(m);T.objs.push(m);
      if(SI.length){const g2=new THREE.BufferGeometry();g2.setAttribute('position',new THREE.Float32BufferAttribute(SP,3));g2.setIndex(SI);g2.computeVertexNormals();const m2=new THREE.Mesh(g2,deckM);m2.position.set(x0,0,z0);m2.receiveShadow=true;m2.castShadow=true;scene.add(m2);T.objs.push(m2);}
      if(AI.length){const g3=new THREE.BufferGeometry();g3.setAttribute('position',new THREE.Float32BufferAttribute(AP,3));g3.setIndex(AI);g3.computeVertexNormals();const m3=new THREE.Mesh(g3,concM);m3.position.set(x0,0,z0);m3.castShadow=true;scene.add(m3);T.objs.push(m3);}
      if(PP.length){const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1).translate(0,0.5,0),concM,PP.length);const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0);PP.forEach(([x,y,z,hh,w,a],q)=>im.setMatrixAt(q,M4.compose(new THREE.Vector3(x+x0,y,z+z0),Q.setFromAxisAngle(Y,a),new THREE.Vector3(w*1.9,hh,w))));im.castShadow=true;scene.add(im);T.objs.push(im);}}
    // guardrail lungo le autostrade
    if(rails.length){const P=[],I=[];rails.forEach(([R,a,b])=>{[-1,1].forEach(sd=>{for(let i=a;i<b;i++){const n=nrm(R,i),o=sd*(R.w/2+0.4),h=R.Hh[i],base=P.length/3;
        P.push(R.X[i]+n[0]*o-x0,h+0.45,R.Z[i]+n[1]*o-z0,R.X[i]+n[0]*o-x0,h+0.8,R.Z[i]+n[1]*o-z0);if(i>a)I.push(base-2,base,base-1,base-1,base,base+1);}});});
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();const m=new THREE.Mesh(g,railM);m.position.set(x0,0,z0);scene.add(m);T.objs.push(m);}
    // paletti delineatori ogni 25 m sulle strade extraurbane e montanti del guardrail in autostrada: riferimenti che scorrono ai lati e danno la velocità
    {const D=[],Dl=[],Pst=[],SP=25;
      for(let q=0;q<l.length;q+=2){const R=NW.roads[l[q]],i=l[q+1];if(R.priv||R.t||R.b||R.c>7)continue;const a=R.cum[i],b=R.cum[i+1],L=b-a;if(L<0.5)continue;
        const tx=(R.X[i+1]-R.X[i])/L,tz=(R.Z[i+1]-R.Z[i])/L,nx=-tz,nz=tx;
        if(R.c===0){if(NW.cityAt(R.X[i],R.Z[i]))continue;for(let u=Math.ceil(a/4)*4;u<b;u+=4){const f=(u-a)/L,x=R.X[i]+(R.X[i+1]-R.X[i])*f,z=R.Z[i]+(R.Z[i+1]-R.Z[i])*f,h=R.Hh[i]+(R.Hh[i+1]-R.Hh[i])*f;[-1,1].forEach(sd=>Pst.push(x+nx*sd*(R.w/2+0.48)-x0,h,z+nz*sd*(R.w/2+0.48)-z0,Math.atan2(-tz,tx)));}continue;}
        for(let u=Math.ceil(a/SP)*SP;u<b;u+=SP){const f=(u-a)/L,x=R.X[i]+(R.X[i+1]-R.X[i])*f,z=R.Z[i]+(R.Z[i+1]-R.Z[i])*f;if(NW.cityAt(x,z)||NW.nearJ(x,z,16))continue;const h=R.Hh[i]+(R.Hh[i+1]-R.Hh[i])*f,ry=Math.atan2(-tz,tx);
          [1,-1].forEach(sd=>{const px=x+nx*sd*(R.w/2+0.75),pz=z+nz*sd*(R.w/2+0.75);if(NW.Hg(px,pz)<h-2.5)return;(sd>0?D:Dl).push(px-x0,h,pz-z0,ry);});}}
      const put=(arr,geo,mat)=>{const n=arr.length/4;if(!n)return;const im=new THREE.InstancedMesh(geo,mat,n),M=new THREE.Matrix4(),Q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),V=new THREE.Vector3(),S1=new THREE.Vector3(1,1,1);
        for(let k=0;k<n;k++){Q.setFromAxisAngle(Y,arr[k*4+3]);V.set(arr[k*4],arr[k*4+1],arr[k*4+2]);M.compose(V,Q,S1);im.setMatrixAt(k,M);}im.position.set(x0,0,z0);im.frustumCulled=false;im.matrixAutoUpdate=false;im.updateMatrix();scene.add(im);T.objs.push(im);};
      put(D,DELG.r,DELG.m);put(Dl,DELG.l,DELG.m);put(Pst,DELG.p,railM);}
    // bordi strada di campagna: banchina di terra sfumata verso il prato e ciuffi d'erba alta che scorrono ai lati
    if(!QG.lo){const VP=[],VC=[],VA=[],VI=[],TF=[],dens=MOBILE?0.3:1;
      for(let q=0;q<l.length;q+=2){const R=NW.roads[l[q]],i=l[q+1];if(R.priv||R.t||R.b||R.c>7||R.c===0)continue;const a=R.cum[i],b=R.cum[i+1],L=b-a;if(L<0.5)continue;
        if(NW.cityAt(R.X[i],R.Z[i])||NW.cityAt(R.X[i+1],R.Z[i+1]))continue;
        const tx=(R.X[i+1]-R.X[i])/L,tz=(R.Z[i+1]-R.Z[i])/L,nx=-tz,nz=tx,hw=R.w/2,VW=1.2;
        [1,-1].forEach(sd=>{const base=VP.length/3;
          for(let k=0;k<2;k++){const x=k?R.X[i+1]:R.X[i],z=k?R.Z[i+1]:R.Z[i],h=k?R.Hh[i+1]:R.Hh[i];
            const ix=x+nx*sd*(hw-0.05),iz=z+nz*sd*(hw-0.05),ox=x+nx*sd*(hw+VW),oz=z+nz*sd*(hw+VW),ho=Math.max(h-0.6,Math.min(h+0.6,NW.Hground(ox,oz)))+0.04;
            VP.push(ix-x0,h+0.03,iz-z0,ox-x0,ho,oz-z0);VC.push(0.17,0.14,0.08,0.2,0.2,0.09);VA.push(0.95,0);}
          VI.push(...(sd>0?[base,base+1,base+2,base+1,base+3,base+2]:[base,base+2,base+1,base+1,base+2,base+3]));
          if(NW.nearJ(R.X[i],R.Z[i],10))return;
          for(let u=Math.ceil(a/0.4)*0.4;u<b;u+=0.4){const rr=hsh(Math.floor(u*7.3)+l[q]*131,sd>0?17:977);if(rr>dens)continue;const f=(u-a)/L,off=hw+0.7+Math.pow(hsh(Math.floor(u*3.1)+l[q],sd+5),1.6)*3.2,
              x=R.X[i]+(R.X[i+1]-R.X[i])*f+nx*sd*off,z=R.Z[i]+(R.Z[i+1]-R.Z[i])*f+nz*sd*off,h=NW.Hground(x,z);if(waterLv(x,z)!=null)continue;{const yh0=NW.yh;NW.yh=NaN;const rq=NW.roadAt(x,z,0.6);NW.yh=yh0;if(rq)continue;}TF.push(x-x0,h,z-z0,rr*40,0.45+hsh(Math.floor(u*5.7)+3,l[q])*0.55);}});}
      // muretti a secco lungo alcuni tratti di strada di campagna (a tratti, non agli incroci)
      {const WP=[],WU=[],WI=[];for(let q=0;q<l.length;q+=2){const R=NW.roads[l[q]],i=l[q+1];if(R.priv||R.t||R.b||R.c>7||R.c<3)continue;const a=R.cum[i],b=R.cum[i+1],L=b-a;if(L<0.5)continue;
          const mid=(a+b)/2;if(hsh(Math.floor(mid/180),l[q])>0.45)continue;if(NW.cityAt(R.X[i],R.Z[i])||NW.nearJ(R.X[i],R.Z[i],14)||NW.nearJ(R.X[i+1],R.Z[i+1],14))continue;
          const tx=(R.X[i+1]-R.X[i])/L,tz=(R.Z[i+1]-R.Z[i])/L,nx=-tz,nz=tx;
          [1,-1].forEach(sd=>{if(hsh(Math.floor(mid/240)+7,l[q]*3+sd)>0.6)return;const off=R.w/2+3.6,th=0.32,H=0.85;
            const pts=[0,1].map(k=>{const x=(k?R.X[i+1]:R.X[i])+nx*sd*off,z=(k?R.Z[i+1]:R.Z[i])+nz*sd*off;return[x,z,NW.Hground(x,z)-0.1];});
            if(waterLv(pts[0][0],pts[0][1])!=null)return;
            {const yh0=NW.yh;NW.yh=NaN;let hit=false;for(let f=0;f<=1.001&&!hit;f+=Math.min(1,3.5/L)){const x=pts[0][0]+(pts[1][0]-pts[0][0])*f,z=pts[0][1]+(pts[1][1]-pts[0][1])*f;if(NW.roadAt(x,z,1.2)||(window.HOMEZ&&HOMEZ(x,z)))hit=true;}NW.yh=yh0;if(hit)return;}   // mai muretti su un'altra strada, svincolo o cavalcavia
            const v0=a/3,v1=b/3,ox=nx*th,oz=nz*th,base=WP.length/3;
            pts.forEach(([x,z,h],k)=>{const v=k?v1:v0;WP.push(x-ox-x0,h,z-oz-z0, x-ox*0.6-x0,h+H,z-oz*0.6-z0, x+ox*0.6-x0,h+H,z+oz*0.6-z0, x+ox-x0,h,z+oz-z0);WU.push(v,0,v,0.47,v,0.53,v,1);});
            WI.push(base,base+4,base+1,base+1,base+4,base+5, base+1,base+5,base+2,base+2,base+5,base+6, base+2,base+6,base+3,base+3,base+6,base+7);});}
        if(WP.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(WP,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(WU,2));g.setIndex(WI);g.computeVertexNormals();
          const m=new THREE.Mesh(g,VERGE.wm);m.position.set(x0,0,z0);m.castShadow=m.receiveShadow=true;scene.add(m);T.objs.push(m);T.segs&&0;}}
      // curve strette fuori città: cartelli a frecce (bianche e nere) sul lato esterno, lungo tutta la curva
      {const CH=[[],[]];const kOf=R=>{if(R._k)return R._k;const k=new Float32Array(R.N);for(let j=1;j<R.N-1;j++){const ax=R.X[j]-R.X[j-1],az=R.Z[j]-R.Z[j-1],bx=R.X[j+1]-R.X[j],bz=R.Z[j+1]-R.Z[j],la=Math.hypot(ax,az),lb=Math.hypot(bx,bz);if(la<0.1||lb<0.1)continue;
          const ang=Math.atan2(ax*bz-az*bx,ax*bx+az*bz);k[j]=ang/((la+lb)/2);}const sm=new Float32Array(R.N);for(let j=0;j<R.N;j++){let a=0,n=0;for(let q=j-2;q<=j+2;q++)if(q>=0&&q<R.N){a+=k[q];n++;}sm[j]=a/n;}return R._k=sm;};
        for(let q=0;q<l.length;q+=2){const R=NW.roads[l[q]],i=l[q+1];if(R.priv||R.t||R.b||R.c>7||R.c===0)continue;const a=R.cum[i],b=R.cum[i+1],L=b-a;if(L<0.5)continue;
          const K=kOf(R),kk=(K[i]+K[i+1])/2;if(Math.abs(kk)<1/95)continue;if(NW.cityAt(R.X[i],R.Z[i]))continue;
          const tx=(R.X[i+1]-R.X[i])/L,tz=(R.Z[i+1]-R.Z[i])/L,nx=-tz,nz=tx,out=kk>0?-1:1;   // lato esterno della curva
          for(let u=Math.ceil(a/11)*11;u<b;u+=11){const f=(u-a)/L,x=R.X[i]+tx*(u-a)+nx*out*(R.w/2+1.3),z=R.Z[i]+tz*(u-a)+nz*out*(R.w/2+1.3);
            {const yh0=NW.yh;NW.yh=NaN;const rq=NW.roadAt(x,z,0.4);NW.yh=yh0;if(rq&&rq.R!==R)continue;}
            CH[kk>0?0:1].push(x-x0,NW.Hground(x,z),z-z0,Math.atan2(nx*out,nz*out)+Math.PI);}}
        CH.forEach((A,j)=>{if(!A.length)return;const n=A.length/4,im=new THREE.InstancedMesh(VERGE.ch.g,VERGE.ch.m[j],n),M=new THREE.Matrix4(),Q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),V=new THREE.Vector3(),S1=new THREE.Vector3(1,1,1);
          for(let k=0;k<n;k++){Q.setFromAxisAngle(Y,A[k*4+3]);V.set(A[k*4],A[k*4+1],A[k*4+2]);M.compose(V,Q,S1);im.setMatrixAt(k,M);}im.position.set(x0,0,z0);im.castShadow=true;im.updateMatrix();im.matrixAutoUpdate=false;scene.add(im);T.objs.push(im);});}
      if(VP.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(VP,3));g.setAttribute('color',new THREE.Float32BufferAttribute(VC,3));g.setAttribute('va',new THREE.Float32BufferAttribute(VA,1));g.setIndex(VI);g.computeVertexNormals();
        const m=new THREE.Mesh(g,VERGE.m);m.position.set(x0,0,z0);m.renderOrder=1;scene.add(m);T.objs.push(m);}
      if(TF.length){const n=TF.length/5,im=new THREE.InstancedMesh(VERGE.g,VERGE.tm,n),M=new THREE.Matrix4(),Q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),V=new THREE.Vector3(),S=new THREE.Vector3();
        for(let k=0;k<n;k++){Q.setFromAxisAngle(Y,TF[k*5+3]);V.set(TF[k*5],TF[k*5+1],TF[k*5+2]);const sc=TF[k*5+4];S.set(sc,sc*(0.8+0.4*((k*37)%10)/10),sc);M.compose(V,Q,S);im.setMatrixAt(k,M);}
        im.position.set(x0,0,z0);im.frustumCulled=false;im.matrixAutoUpdate=false;im.updateMatrix();scene.add(im);T.objs.push(im);}}
    // marciapiedi rialzati con cordolo (interrotti agli incroci)
    {const A=[],Uv=[],I=[];const q4=(p,uv)=>{const s0=A.length/3;p.forEach(v=>A.push(v[0]-x0,v[1],v[2]-z0));uv.forEach(u=>Uv.push(u[0],u[1]));I.push(s0,s0+1,s0+2,s0+1,s0+3,s0+2);};
      runs.forEach((list,ri)=>{const R=NW.roads[ri];if(!NW.swRoad(R)||!NW.cityAt(R.X[list[0]],R.Z[list[0]]))return;const hw=R.w/2,W=NW.SWW,Hs=NW.SWH;
        list.forEach(i=>{const ax=R.X[i],az=R.Z[i],bx=R.X[i+1],bz=R.Z[i+1],L=Math.hypot(bx-ax,bz-az);if(L<0.5)return;const tx=(bx-ax)/L,tz=(bz-az)/L,nx=-tz,nz=tx,n=Math.max(1,Math.round(L/3));
          for(let k=0;k<n;k++){const t0=k/n,t1=(k+1)/n,mx=ax+(bx-ax)*(t0+t1)/2,mz=az+(bz-az)*(t0+t1)/2;if(NW.nearJ(mx,mz,11))continue;
            const p0x=ax+(bx-ax)*t0,p0z=az+(bz-az)*t0,p1x=ax+(bx-ax)*t1,p1z=az+(bz-az)*t1,h0=R.Hh[i]+(R.Hh[i+1]-R.Hh[i])*t0,h1=R.Hh[i]+(R.Hh[i+1]-R.Hh[i])*t1;
            for(const sd of [1,-1]){const ix=nx*sd*hw,iz=nz*sd*hw,ox=nx*sd*(hw+W),oz=nz*sd*(hw+W);
              const a=[p0x+ix,h0+Hs,p0z+iz],b=[p1x+ix,h1+Hs,p1z+iz],c=[p0x+ox,h0+Hs,p0z+oz],d=[p1x+ox,h1+Hs,p1z+oz];
              q4([a,b,c,d],[[a[0]/2,a[2]/2],[b[0]/2,b[2]/2],[c[0]/2,c[2]/2],[d[0]/2,d[2]/2]]);
              q4([[a[0],h0+0.03,a[2]],[b[0],h1+0.03,b[2]],a,b],[[0,0],[L/n/2,0],[0,0.06],[L/n/2,0.06]]);
              q4([c,d,[c[0],h0-0.4,c[2]],[d[0],h1-0.4,d[2]]],[[0,0],[L/n/2,0],[0,0.2],[L/n/2,0.2]]);}}});});
      if(I.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(A,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(Uv,2));g.setIndex(I);g.computeVertexNormals();
        const m=new THREE.Mesh(g,swM);m.position.set(x0,0,z0);m.receiveShadow=true;scene.add(m);T.objs.push(m);}}
    // binari del tram e dei treni
    const lt=railT.get(T.key);if(lt){const P=[],I=[];for(let q=0;q<lt.length;q+=2){const R=RLS[lt[q]],i=lt[q+1],p=R.p,ax=p[i*2],az=p[i*2+1],bx=p[i*2+2],bz=p[i*2+3],dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz)||1,nx=-dz/L,nz=dx/L;
        const ns=Math.max(1,Math.ceil(L/6));for(let s=0;s<ns;s++){const t0=s/ns,t1=(s+1)/ns,x0a=ax+dx*t0,z0a=az+dz*t0,x1a=ax+dx*t1,z1a=az+dz*t1,h0=NW.H(x0a,z0a)+0.08,h1=NW.H(x1a,z1a)+0.08;
          for(const o of [-0.72,0.72]){const b=P.length/3,w=0.05;P.push(x0a+nx*(o-w)-x0,h0,z0a+nz*(o-w)-z0,x0a+nx*(o+w)-x0,h0,z0a+nz*(o+w)-z0,x1a+nx*(o-w)-x0,h1,z1a+nz*(o-w)-z0,x1a+nx*(o+w)-x0,h1,z1a+nz*(o+w)-z0);I.push(b,b+2,b+1,b+1,b+2,b+3);}}}
      if(I.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();const m=new THREE.Mesh(g,trackM);m.position.set(x0,0,z0);m.receiveShadow=true;scene.add(m);T.objs.push(m);}}
    // fiumi
    const lr=rivT.get(T.key);if(lr){const P=[],I=[];for(let q=0;q<lr.length;q+=2){const R=rivers[lr[q]],i=lr[q+1],p=R.p;const ax=p[i*2],az=p[i*2+1],bx=p[i*2+2],bz=p[i*2+3],dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz)||1,nx=-dz/L*R.w/2,nz=dx/L*R.w/2;
        if(NW.lakeAt((ax+bx)/2,(az+bz)/2))continue;const ha=NW.Hg(ax,az)+0.08,hb=NW.Hg(bx,bz)+0.08,base=P.length/3;
        P.push(ax-nx-x0,ha,az-nz-z0,ax+nx-x0,ha,az+nz-z0,bx-nx-x0,hb,bz-nz-z0,bx+nx-x0,hb,bz+nz-z0);I.push(base,base+1,base+2,base+1,base+3,base+2);}
      if(I.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();const m=new THREE.Mesh(g,riverM);m.position.set(x0,0,z0);scene.add(m);T.objs.push(m);}}}
  function nrm(R,i){const a=Math.max(0,i-1),b=Math.min(R.N-1,i+1);let dx=R.X[b]-R.X[a],dz=R.Z[b]-R.Z[a];const l=Math.hypot(dx,dz)||1;return[-dz/l,dx/l];}
  function ribbon(R,a,b,G,x0,z0){const base=G.P.length/3,hw=R.w/2,lift=0.05+(R.c>=9?0.02:0);
    for(let i=a;i<b;i++){// normale a mitra: media delle direzioni dei due segmenti, con larghezza compensata
      let n1=null,n2=null;if(i>0){const dx=R.X[i]-R.X[i-1],dz=R.Z[i]-R.Z[i-1],l=Math.hypot(dx,dz)||1;n1=[-dz/l,dx/l];}if(i<R.N-1){const dx=R.X[i+1]-R.X[i],dz=R.Z[i+1]-R.Z[i],l=Math.hypot(dx,dz)||1;n2=[-dz/l,dx/l];}
      let nx=(n1?n1[0]:0)+(n2?n2[0]:0),nz=(n1?n1[1]:0)+(n2?n2[1]:0);const nl=Math.hypot(nx,nz)||1;nx/=nl;nz/=nl;const ref=n2||n1,cs=Math.max(0.5,nx*ref[0]+nz*ref[1]),w=hw/cs;
      const h=R.Hh[i]+lift,v=R.cum[i]/12;G.P.push(R.X[i]-nx*w-x0,h,R.Z[i]-nz*w-z0,R.X[i]+nx*w-x0,h,R.Z[i]+nz*w-z0);G.U.push(0,v,1,v);
      if(i>a){const p=base+(i-a-1)*2;G.I.push(p,p+1,p+2,p+1,p+3,p+2);}}}
  // ---------- dettagli: edifici veri, paesi, alberi, mucche ----------
  const bseg=new Map(),BC=24;
  function addSeg(T,x1,z1,x2,z2){const s=[x1,z1,x2,z2];T.segs.push(s);for(let a=Math.floor(Math.min(x1,x2)/BC);a<=Math.floor(Math.max(x1,x2)/BC);a++)for(let b=Math.floor(Math.min(z1,z2)/BC);b<=Math.floor(Math.max(z1,z2)/BC);b++){const k=tk(a,b);let l=bseg.get(k);if(!l)bseg.set(k,l=[]);l.push(s);}}
  {const T0={segs:[]};LMS.segs.forEach(q=>addSeg(T0,...q));}
  // ================= VARIETÀ: animali, cartelli, cassonetti, arredo, zone industriali degradate, imprevisti =================
  const VX=(()=>{const SESS=Math.random()*1000|0,LC=c=>new THREE.Color(c).convertSRGBToLinear();
    const propVM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.85,flatShading:true});
    const _V=new THREE.Vector3(),_Q=new THREE.Quaternion(),_E=new THREE.Euler(),_S=new THREE.Vector3(),_M=new THREE.Matrix4();
    const GB=new THREE.BoxGeometry(1,1,1).toNonIndexed(),GC=new THREE.CylinderGeometry(0.5,0.5,1,10).toNonIndexed(),GC6=new THREE.CylinderGeometry(0.5,0.5,1,6).toNonIndexed(),GS=new THREE.SphereGeometry(0.5,8,6).toNonIndexed(),GI=new THREE.IcosahedronGeometry(0.5,0).toNonIndexed(),GCo=new THREE.ConeGeometry(0.5,1,8).toNonIndexed(),GT=new THREE.TorusGeometry(0.4,0.15,6,12).toNonIndexed();
    // tutto l'arredo statico di una mattonella finisce in un'unica mesh a colori per vertice
    function PB(x0,z0){const P=[],C=[];const o={x0,z0,get n(){return P.length/3},add(geo,col,x,y,z,ry=0,sx=1,sy=1,sz=1,rx=0,rz=0){_M.compose(_V.set(x-x0,y,z-z0),_Q.setFromEuler(_E.set(rx,ry,rz,'YXZ')),_S.set(sx,sy,sz));const p=geo.attributes.position,c=LC(col);
        for(let i=0;i<p.count;i++){_V.set(p.getX(i),p.getY(i),p.getZ(i)).applyMatrix4(_M);P.push(_V.x,_V.y,_V.z);C.push(c.r,c.g,c.b);}},
      mesh(){if(!P.length)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();
        const m=new THREE.Mesh(g,propVM);m.position.set(x0,0,z0);m.castShadow=true;m.receiveShadow=true;o.m=m;return m;}};return o;}
    LOOSE.mat=propVM;
    const rx=(T,a)=>hsh(T.i*131+a+SESS,T.j*977+a*7+SESS*3);
    // ---------- animali ----------
    const AP={sheep:{bl:0.8,bh:0.42,bw:0.42,leg:0.36,col:0xeeeae0,hd:0x2a2522,lc:0x2a2522,nk:0.18,hs:0.13,sp:0.5,fl:4},
      goat:{bl:0.72,bh:0.34,bw:0.3,leg:0.46,col:0xd9cfbf,hd:0xcfc3b0,lc:0x6b5b4b,nk:0.28,hs:0.11,sp:0.6,fl:5,horn:1},
      horse:{bl:1.6,bh:0.62,bw:0.5,leg:0.92,col:0x7a4a2a,hd:0x7a4a2a,lc:0x3a2414,nk:0.62,hs:0.2,sp:1.2,fl:7,mane:0x2a1a10},
      horse2:{bl:1.6,bh:0.62,bw:0.5,leg:0.92,col:0xd9d4ca,hd:0xd9d4ca,lc:0x8a8478,nk:0.62,hs:0.2,sp:1.2,fl:7,mane:0xb8b2a6},
      deer:{bl:1.05,bh:0.42,bw:0.33,leg:0.78,col:0x9a6a3e,hd:0x9a6a3e,lc:0x5e3f22,nk:0.5,hs:0.13,sp:1.0,fl:9,ant:1},
      chick:{bl:0.26,bh:0.16,bw:0.16,leg:0.12,col:0xf4efe4,hd:0xf4efe4,lc:0xe0a020,nk:0.08,hs:0.06,sp:0.35,fl:2.5,comb:1}};
    const AM={};const am=c=>AM[c]||(AM[c]=new THREE.MeshStandardMaterial({color:LC(c),roughness:0.9,flatShading:true}));
    function mkAnimal(kind){const P=AP[kind],G=new THREE.Group(),B=new THREE.Group(),add=(geo,c,x,y,z,sx,sy,sz,p)=>{const m=new THREE.Mesh(geo,am(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;(p||B).add(m);return m;};
      B.position.y=P.leg+P.bh/2;G.add(B);
      if(kind==='sheep')for(let i=0;i<5;i++)add(GI,P.col,(i%2?0.08:-0.08),0.02*(i%3),(i-2)*0.15,P.bw*1.5,P.bh*1.6,P.bl*0.5);else add(GS,P.col,0,0,0,P.bw*2,P.bh*2,P.bl);
      const N=new THREE.Group();N.position.set(0,P.bh*0.25,P.bl*0.42);B.add(N);
      if(kind!=='sheep'&&kind!=='chick')add(GC6,P.col,0,P.nk*0.45,P.nk*0.25,P.bw*0.55,P.nk,P.bw*0.6,N).rotation.x=0.55;
      const Hd=new THREE.Group();Hd.position.set(0,P.nk*0.9,P.nk*0.5);N.add(Hd);add(GS,P.hd,0,0,P.hs*0.6,P.hs*1.3,P.hs*1.3,P.hs*(kind==='horse'||kind==='horse2'?3:2.2),Hd);
      if(kind==='sheep')add(GI,P.col,0,P.hs*0.7,0,P.hs*1.6,P.hs*1.1,P.hs*1.6,Hd);
      if(P.mane)add(GB,P.mane,0,P.nk*0.6,P.nk*0.15,0.08,P.nk*0.9,0.2,N).rotation.x=0.55;
      if(P.horn)[-1,1].forEach(s=>add(GCo,0x5a4a3a,s*0.04,P.hs*1.1,-0.02,0.04,0.16,0.04,Hd).rotation.x=-0.6);
      if(P.ant)[-1,1].forEach(s=>{const a=add(GC6,0x6a5440,s*0.05,P.hs*1.5,0,0.02,0.3,0.02,Hd);a.rotation.z=s*0.4;const b=add(GC6,0x6a5440,s*0.12,P.hs*2.3,0.04,0.015,0.16,0.015,Hd);b.rotation.set(0.5,0,s*-0.3);});
      if(P.comb)add(GB,0xd02020,0,P.hs*0.9,P.hs*0.3,0.02,0.05,0.08,Hd);
      if(kind==='chick')add(GCo,0xe0a020,0,0,P.hs*1.6,0.03,0.06,0.03,Hd).rotation.x=Math.PI/2;
      [-1,1].forEach(s=>add(GCo,P.hd,s*P.hs*0.7,P.hs*0.7,0,P.hs*0.5,P.hs*0.8,P.hs*0.3,Hd).rotation.z=-s*0.9);
      const legs=[];[[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([sx,sz],q)=>{if(kind==='chick'&&q>1)return;const L=new THREE.Group();L.position.set(sx*P.bw*0.55,P.leg,sz*P.bl*0.36*(kind==='chick'?0:1));G.add(L);
        add(GC6,P.lc,0,-P.leg/2,0,Math.max(0.025,P.bw*0.22),P.leg,Math.max(0.025,P.bw*0.22),L);legs.push(L);});
      const tl=add(GC6,P.mane||P.lc,0,0.05,-P.bl*0.5,0.04,kind==='horse'||kind==='horse2'?0.5:0.15,0.04);tl.rotation.x=0.5;
      G.userData={B,N,Hd,legs,ph:Math.random()*6,P,kind};return G;}
    const FA=[];
    // una figura fatta di tanti pezzi diventa un'unica mesh a colori per vertice (una sola chiamata di disegno)
    function mergeGroup(G){G.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(G.matrixWorld).invert(),P=[],C=[],m=new THREE.Matrix4();
      G.traverse(o=>{if(!o.isMesh)return;let vis=true;for(let q=o;q&&q!==G;q=q.parent)if(!q.visible)vis=false;if(!vis)return;const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry,p=geo.attributes.position,mat=Array.isArray(o.material)?o.material[0]:o.material,c=mat&&mat.color?mat.color:new THREE.Color(1,1,1);
        m.multiplyMatrices(inv,o.matrixWorld);for(let k=0;k<p.count;k++){_V.set(p.getX(k),p.getY(k),p.getZ(k)).applyMatrix4(m);P.push(_V.x,_V.y,_V.z);C.push(c.r,c.g,c.b);}});
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();return g;}
    const LOG={};const loGeo=k=>LOG[k]||(LOG[k]=mergeGroup(mkAnimal(k)));
    function flat(T,G,x,y,z,ry){const m=new THREE.Mesh(mergeGroup(G),propVM);m.position.set(x,y,z);m.rotation.y=ry;m.castShadow=true;m.updateMatrix();m.matrixAutoUpdate=false;scene.add(m);T.dobj.push(m);return m;}
    // vicino: animale articolato che pascola e cammina; lontano: un solo pezzo che si sposta; molto lontano: nascosto
    function animUpd(A,dt,t,cx,cz){const P=AP[A.kind],dc=Math.abs(A.x-cx)+Math.abs(A.z-cz);if(dc>200){if(A.lo.visible)A.lo.visible=false;if(A.g&&A.g.visible)A.g.visible=false;return;}
      const dp=Math.hypot(pl.x-A.x,pl.z-A.z),car=Math.abs(pl.vx)>2&&!HOME.mode;
      if(car&&dp<(A.kind==='deer'?40:14)){A.st='flee';A.stT=A.kind==='deer'?6:2.5;const a=Math.atan2(A.x-pl.x,A.z-pl.z);A.tx=A.x+Math.sin(a)*30;A.tz=A.z+Math.cos(a)*30;}
      A.stT-=dt;if(A.stT<=0){if(A.st==='flee'||A.st==='walk'||Math.random()<0.5){A.st='graze';A.stT=4+Math.random()*8;}else{A.st='walk';A.stT=3+Math.random()*4;const a=Math.random()*6.28,r=Math.random()*A.r;A.tx=A.hx+Math.cos(a)*r;A.tz=A.hz+Math.sin(a)*r;}}
      let sp=0;if(A.st!=='graze'){const dx=A.tx-A.x,dz=A.tz-A.z,d=Math.hypot(dx,dz);if(d>0.3){const th=Math.atan2(dx,dz);let dh=Math.atan2(Math.sin(th-A.h),Math.cos(th-A.h));A.h+=Math.sign(dh)*Math.min(Math.abs(dh),dt*(A.st==='flee'?5:1.5));
          sp=(A.st==='flee'?P.sp*P.fl:P.sp)*Math.max(0,Math.cos(dh));A.x+=Math.sin(A.h)*sp*dt;A.z+=Math.cos(A.h)*sp*dt;}else if(A.st==='walk')A.stT=0;}
      A.sp+=(sp-A.sp)*Math.min(1,dt*4);A.ph+=dt*(2+A.sp*5/Math.max(0.3,P.leg*2));const k=Math.min(1,A.sp/P.sp),y=NW.Hground(A.x,A.z);
      if(dc<50){if(!A.g){A.g=mkAnimal(A.kind);scene.add(A.g);A.T.dobj.push(A.g);}const g=A.g,u=g.userData;g.visible=true;A.lo.visible=false;
        u.legs.forEach((L,i)=>{L.rotation.x=Math.sin(A.ph+(i===0||i===3?0:Math.PI))*0.5*k;});
        const graze=A.st==='graze'?(A.kind==='chick'?0.9+Math.sin(t*9+A.ph)*0.5:0.9+Math.sin(t*0.8+A.ph)*0.12):-0.1;u.N.rotation.x+=(graze-u.N.rotation.x)*Math.min(1,dt*3);
        u.B.position.y=P.leg+P.bh/2+Math.abs(Math.sin(A.ph))*0.03*k*(A.st==='flee'?3:1);g.position.set(A.x,y,A.z);g.rotation.y=A.h;}
      else{if(A.g&&A.g.visible)A.g.visible=false;const m=A.lo;m.visible=true;m.position.set(A.x,y+Math.abs(Math.sin(A.ph))*0.04*k,A.z);m.rotation.y=A.h;m.updateMatrix();}}
    function herd(T,kind,x,z,n,r){for(let q=0;q<n;q++){const a=q/n*6.28+rx(T,q)*2,d=Math.sqrt(rx(T,q+50))*r,ax=x+Math.cos(a)*d,az=z+Math.sin(a)*d,h=rx(T,q+9)*6.28;
        const lo=new THREE.Mesh(loGeo(kind),propVM);lo.userData.shared=1;lo.position.set(ax,NW.Hground(ax,az),az);lo.rotation.y=h;lo.castShadow=true;lo.matrixAutoUpdate=false;lo.updateMatrix();scene.add(lo);T.dobj.push(lo);
        FA.push({g:null,lo,T,kind,x:ax,z:az,hx:x,hz:z,r,h,st:'graze',stT:rx(T,q+70)*6,sp:0,ph:rx(T,q+3)*6});}}
    // ---------- testi dipinti: cartelli, graffiti, insegne ----------
    const TX={};function tex(key,draw,w=256,h=256){if(TX[key])return TX[key];const t=canvasTex(w,(g)=>{g.canvas.width=w;g.canvas.height=h;draw(g,w,h);});t.needsUpdate=true;return TX[key]=t;}
    const MT={};function tm(key,draw,w,h,tr){return MT[key]||(MT[key]=new THREE.MeshStandardMaterial({map:tex(key,draw,w,h),transparent:!!tr,alphaTest:tr?0.4:0,roughness:0.6,side:THREE.DoubleSide}));}
    const warn=(sym)=>(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#d01818';g.beginPath();g.moveTo(w/2,8);g.lineTo(w-8,h-22);g.lineTo(8,h-22);g.closePath();g.fill();g.fillStyle='#fff';g.beginPath();g.moveTo(w/2,42);g.lineTo(w-38,h-40);g.lineTo(38,h-40);g.closePath();g.fill();
      g.fillStyle='#111';g.strokeStyle='#111';g.lineWidth=12;g.lineCap='round';g.lineJoin='round';const cx=w/2,cy=h*0.6;
      if(sym==='cdx'||sym==='csx'){const s=sym==='cdx'?1:-1;g.beginPath();g.moveTo(cx-s*14,cy+44);g.lineTo(cx-s*14,cy);g.quadraticCurveTo(cx-s*14,cy-24,cx+s*14,cy-30);g.stroke();g.beginPath();g.moveTo(cx+s*30,cy-30);g.lineTo(cx+s*8,cy-46);g.lineTo(cx+s*10,cy-14);g.closePath();g.fill();}
      if(sym==='deer'){g.beginPath();g.ellipse(cx+4,cy+6,34,16,0,0,7);g.fill();g.lineWidth=7;[[-22,0],[-12,6],[18,6],[28,0]].forEach(([dx,a])=>{g.beginPath();g.moveTo(cx+dx,cy+14);g.lineTo(cx+dx+a*0.3,cy+46);g.stroke();});g.beginPath();g.moveTo(cx+30,cy);g.lineTo(cx+44,cy-26);g.stroke();g.beginPath();g.ellipse(cx+48,cy-30,10,7,0.4,0,7);g.fill();g.lineWidth=4;g.beginPath();g.moveTo(cx+44,cy-36);g.lineTo(cx+38,cy-56);g.moveTo(cx+40,cy-48);g.lineTo(cx+30,cy-54);g.moveTo(cx+50,cy-36);g.lineTo(cx+56,cy-56);g.stroke();}
      if(sym==='cow'){g.beginPath();g.rect(cx-36,cy-14,62,30);g.fill();g.lineWidth=8;[-30,-18,12,22].forEach(dx=>{g.beginPath();g.moveTo(cx+dx,cy+14);g.lineTo(cx+dx,cy+44);g.stroke();});g.beginPath();g.rect(cx+24,cy-24,22,18);g.fill();}
      if(sym==='slope'){g.beginPath();g.moveTo(cx-50,cy+40);g.lineTo(cx+50,cy+40);g.lineTo(cx+50,cy+6);g.closePath();g.fill();g.font='bold 30px Arial';g.textAlign='center';g.fillText('10%',cx-8,cy-10);}
      if(sym==='rock'){g.beginPath();g.moveTo(cx-40,cy+44);g.lineTo(cx-40,cy-40);g.lineTo(cx-22,cy-40);g.lineTo(cx-22,cy+44);g.fill();[[0,-20,10],[14,0,8],[8,26,11],[30,30,7]].forEach(([dx,dy,r])=>{g.beginPath();g.arc(cx+dx,cy+dy,r,0,7);g.fill();});}
      if(sym==='work'){g.beginPath();g.arc(cx-8,cy-26,9,0,7);g.fill();g.lineWidth=9;g.beginPath();g.moveTo(cx-10,cy-14);g.lineTo(cx,cy+12);g.lineTo(cx-18,cy+42);g.moveTo(cx,cy+12);g.lineTo(cx+12,cy+42);g.moveTo(cx-6,cy-6);g.lineTo(cx+22,cy+2);g.stroke();g.beginPath();g.moveTo(cx+18,cy+42);g.lineTo(cx+44,cy+42);g.lineTo(cx+34,cy+22);g.fill();}
      if(sym==='kids'){g.beginPath();g.arc(cx-16,cy-24,9,0,7);g.arc(cx+18,cy-16,7,0,7);g.fill();g.lineWidth=9;g.beginPath();g.moveTo(cx-16,cy-12);g.lineTo(cx-14,cy+14);g.lineTo(cx-28,cy+42);g.moveTo(cx-14,cy+14);g.lineTo(cx-2,cy+42);g.moveTo(cx+18,cy-6);g.lineTo(cx+18,cy+16);g.lineTo(cx+8,cy+40);g.moveTo(cx+18,cy+16);g.lineTo(cx+28,cy+40);g.moveTo(cx-4,cy-6);g.lineTo(cx+12,cy);g.stroke();}};
    const town=(n,exit)=>(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);g.strokeStyle='#111';g.lineWidth=10;g.strokeRect(10,10,w-20,h-20);g.fillStyle='#111';g.textAlign='center';g.textBaseline='middle';
      let fs=70;g.font='bold '+fs+'px Arial';while(g.measureText(n.toUpperCase()).width>w-60&&fs>30){fs-=4;g.font='bold '+fs+'px Arial';}g.fillText(n.toUpperCase(),w/2,h/2);
      if(exit){g.strokeStyle='#c81818';g.lineWidth=18;g.beginPath();g.moveTo(30,h-24);g.lineTo(w-30,24);g.stroke();}};
    const GRAF=['VALDONIA LIBERA','ZONA 47','GATTO','NO FUTURE','SKRT','VALDORNA CREW','BRUNO + ALE','RESPECT','WOW','KAOS','2026','FERRO'];
    const grafTex=i=>tex('graf'+i,(g,w,h)=>{g.clearRect(0,0,w,h);const word=GRAF[i%GRAF.length],cols=[['#ff3b8d','#2b1055'],['#35e0a1','#103a2b'],['#ffd23f','#7a2e00'],['#4dc3ff','#0c2b52'],['#ff6b35','#2a0f00'],['#c77dff','#22004a']][i%6];
      g.save();g.translate(w/2,h/2);g.rotate((i%3-1)*0.08);let fs=150;g.font='900 '+fs+'px Impact, Arial Black, sans-serif';while(g.measureText(word).width>w*0.9&&fs>40){fs-=6;g.font='900 '+fs+'px Impact, Arial Black, sans-serif';}
      g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=fs*0.22;g.strokeStyle='#111';g.strokeText(word,0,0);g.lineWidth=fs*0.1;g.strokeStyle='#fff';g.strokeText(word,0,0);g.fillStyle=cols[0];g.fillText(word,0,0);
      g.fillStyle=cols[1];g.globalAlpha=0.5;g.fillText(word,4,6);g.globalAlpha=1;g.fillStyle=cols[0];for(let k=0;k<7;k++){const x=-w*0.4+k*w*0.13+((k*37)%11),y=fs*0.35;g.fillRect(x,y,4,10+((k*53)%40));}g.restore();},512,256);
    const grafM=i=>MT['gm'+i]||(MT['gm'+i]=new THREE.MeshStandardMaterial({map:grafTex(i),transparent:true,alphaTest:0.3,roughness:0.9,polygonOffset:true,polygonOffsetFactor:-2,side:THREE.DoubleSide}));
    const plane=(T,mat,x,y,z,ry,w,h)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.set(x,y,z);m.rotation.y=ry;scene.add(m);T.dobj.push(m);return m;};
    // ---------- elenco cartelli calcolato una volta sola su tutta la rete ----------
    const SIG=new Map();const sigAdd=(x,z,o)=>{const k=tk(Math.floor(x/TS),Math.floor(z/TS));let l=SIG.get(k);if(!l)SIG.set(k,l=[]);l.push(Object.assign({x,z},o));};
    {const PL=NW.places.filter(p=>p.t===0||p.t===2);
      NW.roads.forEach((R,ri)=>{if(R.c<3||R.c>8||R.priv||R.t||R.b)return;
        // cartelli d'inizio e fine centro abitato dove la strada attraversa il confine del paese
        for(const p of PL){const Rr=(p.t===0?(NW.cities.find(c=>c.n===p.n)||{}).r1||p.R:p.R)*0.95;let prev=null;
          for(let i=0;i<R.N;i++){const d=Math.hypot(R.X[i]-p.x,R.Z[i]-p.z)<Rr;if(prev!==null&&d!==prev&&i>0){const tx=R.X[i]-R.X[i-1],tz=R.Z[i]-R.Z[i-1],L=Math.hypot(tx,tz)||1;let ux=tx/L,uz=tz/L;if(prev===false&&d===true){}else{ux=-ux;uz=-uz;}
              const mx=(R.X[i]+R.X[i-1])/2,mz=(R.Z[i]+R.Z[i-1])/2,off=R.w/2+1.4;sigAdd(mx-uz*off,mz+ux*off,{k:'town',n:p.n,ry:Math.atan2(-ux,-uz),h:(R.Hh[i]+R.Hh[i-1])/2});
              if(!R.o)sigAdd(mx+uz*off,mz-ux*off,{k:'townx',n:p.n,ry:Math.atan2(ux,uz),h:(R.Hh[i]+R.Hh[i-1])/2});}prev=d;}}
        if(R.c>7)return;
        // curve pericolose, animali, pendenze, caduta massi, cartelloni pubblicitari
        let lastS=-1e9,lastA=-1e9,lastB=-1e9;const ang=i=>Math.atan2(R.Z[i+1]-R.Z[i],R.X[i+1]-R.X[i]);
        for(let i=2;i<R.N-3;i++){const s=R.cum[i];if(NW.cityAt(R.X[i],R.Z[i]))continue;
          let j=i;while(j<R.N-2&&R.cum[j]-s<45)j++;let d=ang(j)-ang(i);d=Math.atan2(Math.sin(d),Math.cos(d));
          if(Math.abs(d)>0.55&&s-lastS>320){lastS=s;[[1,i],[-1,j]].forEach(([dir,k])=>{let q=k;const tgt=dir>0?R.cum[k]-75:R.cum[k]+75;while(q>1&&q<R.N-2&&(dir>0?R.cum[q]>tgt:R.cum[q]<tgt))q-=dir;
              const tx=(R.X[q+1]-R.X[q])*dir,tz=(R.Z[q+1]-R.Z[q])*dir,L=Math.hypot(tx,tz)||1,ux=tx/L,uz=tz/L,off=R.w/2+1.2;if(R.o&&dir<0)return;
              sigAdd(R.X[q]-uz*off,R.Z[q]+ux*off,{k:'warn',sym:(d*dir>0)===true?'cdx':'csx',ry:Math.atan2(-ux,-uz),h:R.Hh[q]});});}
          if(s-lastA>1600&&i%7===0){const ff=forestF(R.X[i],R.Z[i],R.Hh[i],0.1),hh=R.Hh[i],slope=i+8<R.N?(R.Hh[i+8]-R.Hh[i])/Math.max(1,R.cum[i+8]-s):0;
            const sym=hh>780&&hsh(ri,i)<0.6?'rock':Math.abs(slope)>0.075?'slope':ff>0.4?'deer':hh<420&&hsh(ri,i+3)<0.35?'cow':null;
            if(sym){lastA=s;const dir=sym==='slope'?(slope<0?1:-1):1,tx=(R.X[i+1]-R.X[i])*dir,tz=(R.Z[i+1]-R.Z[i])*dir,L=Math.hypot(tx,tz)||1,ux=tx/L,uz=tz/L,off=R.w/2+1.2;if(!(R.o&&dir<0))sigAdd(R.X[i]-uz*off,R.Z[i]+ux*off,{k:'warn',sym,ry:Math.atan2(-ux,-uz),h:R.Hh[i]});}}
          if(R.c<=6&&s-lastB>1100&&hsh(ri*3,i)<0.06){lastB=s;const tx=R.X[i+1]-R.X[i],tz=R.Z[i+1]-R.Z[i],L=Math.hypot(tx,tz)||1,ux=tx/L,uz=tz/L,sd=hsh(ri,i*5)<0.5?1:-1,off=R.w/2+7;
            const bx=R.X[i]-uz*off*sd,bz=R.Z[i]+ux*off*sd;if(Math.abs(NW.Hg(bx,bz)-R.Hh[i])<3)sigAdd(bx,bz,{k:'bill',ad:(ri*7+i)%ADS.length,ad2:(ri*3+i+5)%ADS.length,ry:Math.atan2(ux,uz),h:NW.Hg(bx,bz)});}}});}
    const postG=new THREE.CylinderGeometry(0.045,0.045,1,6);
    function buildSigns(T,pb){const l=SIG.get(T.key);if(!l)return;for(const s of l){const g=NW.Hground(s.x,s.z);
        if(s.k==='town'||s.k==='townx'){const front=tm('t_'+s.n,town(s.n,false),512,192),back=tm('tx_'+s.n,town(s.n,true),512,192);pb.add(GC6,0x8a8f94,s.x,g+1.1,s.z,0,0.09,2.2,0.09);
          const m1=new THREE.Mesh(new THREE.PlaneGeometry(1.9,0.72),s.k==='town'?front:back);m1.material=m1.material.clone();m1.material.side=THREE.FrontSide;m1.position.set(s.x,g+2.05,s.z);m1.rotation.y=s.ry;scene.add(m1);T.dobj.push(m1);
          const m2=new THREE.Mesh(new THREE.PlaneGeometry(1.9,0.72),new THREE.MeshStandardMaterial({color:0x9aa0a6,roughness:0.6}));m2.position.copy(m1.position);m2.position.x-=Math.sin(s.ry)*0.03;m2.position.z-=Math.cos(s.ry)*0.03;m2.rotation.y=s.ry+Math.PI;scene.add(m2);T.dobj.push(m2);}
        else if(s.k==='warn'){pb.add(GC6,0x8a8f94,s.x,g+1.05,s.z,0,0.08,2.1,0.08);const m=new THREE.Mesh(new THREE.PlaneGeometry(0.95,0.95),tm('w_'+s.sym,warn(s.sym),256,256,true));m.position.set(s.x,g+2.25,s.z);m.rotation.y=s.ry;scene.add(m);T.dobj.push(m);
          const b=new THREE.Mesh(new THREE.CircleGeometry(0.5,3),new THREE.MeshStandardMaterial({color:0x9aa0a6}));b.position.set(s.x-Math.sin(s.ry)*0.01,g+2.2,s.z-Math.cos(s.ry)*0.01);b.rotation.set(0,s.ry+Math.PI,Math.PI/2);scene.add(b);T.dobj.push(b);}
        else if(s.k==='bill'){const c=Math.cos(s.ry),sn=Math.sin(s.ry);[-1.8,1.8].forEach(o=>pb.add(GB,0x5c5f63,s.x+c*o,g+1.6,s.z-sn*o,s.ry,0.18,3.2,0.18));pb.add(GB,0x3a3c3f,s.x,g+4.3,s.z,s.ry,5.4,2.7,0.18);
          [[s.ad,0.1],[s.ad2,-0.1]].forEach(([ad,o],q)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(5.2,2.5),MT['ad'+ad]||(MT['ad'+ad]=new THREE.MeshStandardMaterial({map:adTex(ad),roughness:0.7})));m.position.set(s.x+sn*o,g+4.3,s.z+c*o);m.rotation.y=s.ry+(q?Math.PI:0);scene.add(m);T.dobj.push(m);});
          addSeg(T,s.x+c*-1.9,s.z-sn*-1.9,s.x+c*1.9,s.z-sn*1.9);}}}
    // ---------- città: cassonetti della differenziata, fermate del bus, panchine, fioriere, motorini ----------
    const BIN=[0x2f7d32,0x1f5fae,0xe5c021,0x6d6f72,0x6b4a2b],VESPA=[0x9fd3c7,0xd8342c,0xf2efe6,0x2a2d31,0xf0c419];
    NW.BST=NW.BST||new Map();const BST=NW.BST;
    function city(T,pb){const l=segT.get(T.key);if(!l)return;let nb=0,nbus=0;
      for(let q=0;q<l.length;q+=2){const R=NW.roads[l[q]],i=l[q+1];if(!NW.swRoad(R))continue;const C=NW.cityAt(R.X[i],R.Z[i]);if(!C)continue;const a=R.cum[i],b=R.cum[i+1],L=b-a;if(L<2)continue;
        const tx=(R.X[i+1]-R.X[i])/L,tz=(R.Z[i+1]-R.Z[i])/L,nx=-tz,nz=tx,ry=Math.atan2(-tz,tx);
        for(let s=Math.ceil((a+14.5)/87)*87-14.5;s<b&&nb<26;s+=87){const t=(s-a)/L,x=R.X[i]+tx*(s-a),z=R.Z[i]+tz*(s-a),h=R.Hh[i]+(R.Hh[i+1]-R.Hh[i])*t+NW.SWH;if(NW.nearJ(x,z,14))continue;
          const sd=hsh(l[q],(s|0))<0.5?1:-1,off=R.w/2+0.75,n=3+((hsh(s|0,l[q])*3)|0);nb++;
          for(let k=0;k<n;k++){const o=(k-(n-1)/2)*1.55,bx=x+nx*sd*off+tx*o,bz=z+nz*sd*off+tz*o,col=BIN[(k+(s|0))%5],big=col===0x6d6f72||col===0x6b4a2b;
            // cassonetti: oggetti leggeri che l'auto sposta (campana del vetro ~120 kg, cassonetti 50-90 kg pieni a metà)
            if(col===0x2f7d32)loose(T,pb,bx,bz,h,0.55,120,()=>{pb.add(GC,col,bx,h+0.65,bz,0,1.1,1.3,1.1);pb.add(GS,col,bx,h+1.3,bz,0,1.1,0.6,1.1);});
            else loose(T,pb,bx,bz,h,0.6,big?90:55,()=>{pb.add(GB,col,bx,h+0.62,bz,ry,1.4,1.24,big?1.05:0.9);pb.add(GB,0x2a2b2d,bx,h+1.28,bz,ry,1.45,0.08,big?1.1:0.95);[-0.5,0.5].forEach(w=>pb.add(GC6,0x111111,bx+tx*w,h+0.08,bz+tz*w,0,0.16,0.16,0.16,Math.PI/2));},true);}
          if(hsh(s|0,7)<0.3)for(let k=0;k<2+((hsh(s|0,9)*3)|0);k++){const gx=x+nx*sd*(off+0.9)+tx*(k*0.5-1),gz=z+nz*sd*(off+0.9)+tz*(k*0.4);loose(T,pb,gx,gz,h,0.3,6,()=>pb.add(GI,0x1b1c1e,gx,h+0.28,gz,k,0.6,0.55,0.55));}}
        // cantiere stradale (pacchetto HD): transenne sul marciapiede, coni lungo il bordo, cartello di lavori in corso prima
        if(HDX&&HDX.roadProp&&L>8&&R.c>=2&&R.c<=7&&!R.t&&!R.b&&hsh(l[q],i+77)<0.007){const s0=a+L*0.5,x=R.X[i]+tx*(s0-a),z=R.Z[i]+tz*(s0-a),h=R.Hh[i]+(R.Hh[i+1]-R.Hh[i])*((s0-a)/L);
          if(!NW.nearJ(x,z,22)){(window.__rw=window.__rw||[]).push([x,z,tx,tz]);const sd=hsh(l[q],i+78)<0.5?1:-1,ed=R.w/2,put=(k,j,px,pz,py,r)=>{const g=HDX.roadProp(k,j);if(!g)return null;g.position.set(px,py,pz);g.rotation.y=r;scene.add(g);T.dobj.push(g);return g;};
            for(let k=0;k<5;k++){const o=k*2.1-4.2,px=x+tx*o+nx*sd*(ed+0.9),pz=z+tz*o+nz*sd*(ed+0.9);put(k%2?'barrB':'barrA',k,px,pz,h+NW.SWH,ry);addSeg(T,px-tx,pz-tz,px+tx,pz+tz);}
            for(let k=0;k<7;k++){const o=k*1.8-6,px=x+tx*o+nx*sd*(ed-0.45),pz=z+tz*o+nz*sd*(ed-0.45);put('cone',k%3,px,pz,h+0.02,k);}
            const dir=sd>0?-1:1,wx=x+tx*dir*14+nx*sd*(ed+0.7),wz=z+tz*dir*14+nz*sd*(ed+0.7);put('works',0,wx,wz,h+NW.SWH,Math.atan2(-tz*dir,tx*dir)-Math.PI/2);}}
        // fermata del bus sulle strade principali
        if(R.c<=5)for(let s=Math.ceil((a+40)/330)*330-40;s<b&&nbus<3;s+=330){const t=(s-a)/L,x=R.X[i]+tx*(s-a),z=R.Z[i]+tz*(s-a),h=R.Hh[i]+(R.Hh[i+1]-R.Hh[i])*t+NW.SWH;if(NW.nearJ(x,z,25))continue;nbus++;
          const sd=((s/330)|0)%2?1:-1,off=R.w/2+2.6,bx=x+nx*sd*off,bz=z+nz*sd*off,ry2=ry;
          {const ri=l[q];let A=BST.get(ri);if(!A)BST.set(ri,A=[]);if(!A.some(o=>Math.abs(o.s-s)<1))A.push({s,x:bx,z:bz});}
          // chi aspetta l'autobus (pacchetto HD)
          if(HDX&&HDX.person){const np=(hsh(s|0,l[q]+5)*3.4)|0;for(let k=0;k<np;k++){const o=(k-(np-1)/2)*0.95+(hsh(k,s|0)-0.5)*0.4,dd=0.1+hsh(k+3,s|0)*1.0,px=bx+tx*(o+2.6)-nx*sd*dd,pz=bz+tz*(o+2.6)-nz*sd*dd;
            const m=HDX.person((hsh(s|0,k+l[q])*8)|0);m.position.set(px,h,pz);m.rotation.y=Math.atan2(-nx*sd,-nz*sd)+(hsh(k,9)-0.5)*1.4;scene.add(m);T.dobj.push(m);if(m.userData.mixer)anims.push({m,T});}}pb.add(GB,0x3d4f63,bx,h+2.5,bz,ry2,3.6,0.08,1.6);pb.add(GB,0xbfd8e6,bx-nx*sd*0.75,h+1.3,bz-nz*sd*0.75,ry2,3.4,2.3,0.05);[-1.7,1.7].forEach(o=>pb.add(GB,0x3d4f63,bx+tx*o,h+1.25,bz+tz*o,ry2,0.08,2.5,1.5));
          pb.add(GB,0x7a5a3a,bx-nx*sd*0.45,h+0.48,bz-nz*sd*0.45,ry2,2.6,0.08,0.4);pb.add(GC6,0x8a8f94,bx+tx*2.3+nx*sd*0.6,h+1.4,bz+tz*2.3+nz*sd*0.6,0,0.07,2.8,0.07);
          const sg=new THREE.Mesh(new THREE.CircleGeometry(0.32,16),tm('bus',(g,w,h)=>{g.fillStyle='#f2c400';g.beginPath();g.arc(w/2,h/2,w/2-2,0,7);g.fill();g.fillStyle='#103a7a';g.font='bold 80px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('BUS',w/2,h/2+4);}));
          sg.position.set(bx+tx*2.3+nx*sd*0.6,h+2.75,bz+tz*2.3+nz*sd*0.6);sg.rotation.y=Math.atan2(nx*sd,nz*sd);scene.add(sg);T.dobj.push(sg);
          addSeg(T,bx-tx*1.8,bz-tz*1.8,bx+tx*1.8,bz+tz*1.8);}
        // motorini parcheggiati e fioriere
        if(hsh(l[q],i)<0.08){const s=a+L*0.5,x=R.X[i]+tx*(s-a),z=R.Z[i]+tz*(s-a),h=R.Hh[i]+(R.Hh[i+1]-R.Hh[i])*0.5+NW.SWH,sd=hsh(i,l[q])<0.5?1:-1,off=R.w/2+0.9;if(!NW.nearJ(x,z,12))
          for(let k=0;k<2+((hsh(i,3)*3)|0);k++){const vx=x+nx*sd*off+tx*(k*0.9),vz=z+nz*sd*off+tz*(k*0.9),c=VESPA[(i+k)%5],r2=ry+Math.PI/2+0.3;
            pb.add(GB,c,vx,h+0.55,vz,r2,1.2,0.35,0.42);pb.add(GB,c,vx+Math.cos(r2)*0.45,h+0.75,vz-Math.sin(r2)*0.45,r2,0.18,0.7,0.5);pb.add(GB,0x222222,vx-Math.cos(r2)*0.2,h+0.8,vz+Math.sin(r2)*0.2,r2,0.6,0.1,0.3);
            [0.48,-0.45].forEach(o=>pb.add(GC,0x151515,vx+Math.cos(r2)*o,h+0.24,vz-Math.sin(r2)*o,r2,0.46,0.12,0.46,Math.PI/2));}}
        if(C.st==='arte'||C.st==='terme'||C.st==='capitale'?hsh(l[q],i+1)<0.12:hsh(l[q],i+1)<0.05){const s=a+L*0.3,x=R.X[i]+tx*(s-a),z=R.Z[i]+tz*(s-a),h=R.Hh[i]+NW.SWH,sd=-1,off=R.w/2+1.2;if(!NW.nearJ(x,z,12)){
          const px=x+nx*sd*off,pz=z+nz*sd*off;pb.add(GB,0xb9a98f,px,h+0.35,pz,ry,1.6,0.7,0.6);pb.add(GI,[0x3f7d34,0x4f8a35][i%2],px,h+0.85,pz,0,1.5,0.6,0.6);[0xe0405a,0xf2c230,0xffffff].forEach((fc,k)=>pb.add(GS,fc,px+tx*(k-1)*0.4,h+1.05,pz+tz*(k-1)*0.4,0,0.18,0.18,0.18));
          pb.add(GB,0x7a5a3a,px+tx*2.2,h+0.45,pz+tz*2.2,ry,1.8,0.08,0.45);pb.add(GB,0x7a5a3a,px+tx*2.2-nx*sd*0.2,h+0.75,pz+tz*2.2-nz*sd*0.2,ry,1.8,0.45,0.06);addSeg(T,px-tx*0.8,pz-tz*0.8,px+tx*3,pz+tz*3);}}}}
    // ---------- zone industriali degradate ----------
    const FIRE=[];const fireTex=canvasTex(64,(g,n)=>{const gr=g.createRadialGradient(32,40,2,32,36,30);gr.addColorStop(0,'rgba(255,240,170,1)');gr.addColorStop(0.35,'rgba(255,140,30,0.9)');gr.addColorStop(1,'rgba(200,40,0,0)');g.fillStyle=gr;g.fillRect(0,0,n,n);});
    function mergeQuads(L){const P=[],N=[],U=[];L.forEach(g=>{const q=g.toNonIndexed();P.push(...q.attributes.position.array);N.push(...q.attributes.normal.array);U.push(...q.attributes.uv.array);});const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));return g;}
    function grim(T,pb){const x0=T.i*TS,z0=T.j*TS;const GQ=new Map(),gq=(gi,x,y,z,ry,w,h)=>{const g=new THREE.PlaneGeometry(w,h);g.rotateY(ry);g.translate(x-x0,y,z-z0);if(!GQ.has(gi))GQ.set(gi,[]);GQ.get(gi).push(g);};
      try{grim2(T,pb,gq);}finally{GQ.forEach((L,gi)=>{const m=new THREE.Mesh(mergeQuads(L),grafM(gi));m.position.set(x0,0,z0);m.receiveShadow=true;scene.add(m);T.dobj.push(m);});}}
    function grim2(T,pb,gq){const x0=T.i*TS,z0=T.j*TS;const Z=LMX.smog.filter(S=>S.x+S.r*1.3>x0&&S.x-S.r*1.3<x0+TS&&S.z+S.r*1.3>z0&&S.z-S.r*1.3<z0+TS);if(!Z.length)return;
      const inZ=(x,z)=>Z.some(S=>Math.hypot(x-S.x,z-S.z)<S.r*1.25);
      // graffiti sui muri dei capannoni
      const bl=bldT.get(T.key)||[];let ng=0;for(const bi of bl){if(ng>28)break;const b=NW.J.blds[bi],ring=b[3],n=ring.length/2;if(n<3||!inZ(ring[0],ring[1]))continue;let cx=0,cz=0;for(let q=0;q<n;q++){cx+=ring[q*2];cz+=ring[q*2+1];}cx/=n;cz/=n;
        for(let q=0;q<n&&ng<30;q++){const ax=ring[q*2],az=ring[q*2+1],bx=ring[(q+1)%n*2],bz=ring[(q+1)%n*2+1],L=Math.hypot(bx-ax,bz-az);if(L<5||rx(T,bi*11+q)>0.62)continue;
          let nx=(bz-az)/L,nz=-(bx-ax)/L;const mx=(ax+bx)/2,mz=(az+bz)/2;if((mx-cx)*nx+(mz-cz)*nz<0){nx=-nx;nz=-nz;}const w=Math.min(L-1,7),gi=(bi*3+q+SESS)%GRAF.length;
          gq(gi,mx+nx*0.07,NW.Hground(mx+nx*0.5,mz+nz*0.5)+1.35,mz+nz*0.07,Math.atan2(nx,nz),w,w/2.6);ng++;}}
      // macerie, falò nei bidoni, auto bruciate, gomme, pallet, carrelli, figure losche, cani randagi
      const BB=bl.map(bi=>{const r=NW.J.blds[bi][3];let a=1e9,b=-1e9,c=1e9,d=-1e9;for(let q=0;q<r.length;q+=2){a=Math.min(a,r[q]);b=Math.max(b,r[q]);c=Math.min(c,r[q+1]);d=Math.max(d,r[q+1]);}return[a-3,b+3,c-3,d+3,r];});
      const inB=(x,z)=>BB.some(([a,b,c,d,r])=>{if(x<a||x>b||z<c||z>d)return false;let ins=false;for(let i=0,j=r.length-2;i<r.length;j=i,i+=2){const xi=r[i],zi=r[i+1],xj=r[j],zj=r[j+1];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)ins=!ins;}return ins||(x>a+3&&x<b-3&&z>c+3&&z<d-3&&false);});
      // sporcizia diffusa: macchie d'olio, cartacce, lattine
      for(let k=0;k<160;k++){const x=x0+rx(T,k*3+900)*TS,z=z0+rx(T,k*3+901)*TS;if(!inZ(x,z)||inB(x,z))continue;const g=NW.Hground(x,z),r=rx(T,k*3+902);
        if(r<0.4)pb.add(GC,[0x2b2926,0x34312c,0x1f1e1c][k%3],x,g+0.025,z,r*9,1.5+r*3,0.02,1+r*2);else pb.add(GB,[0xe8e4dc,0xb0302a,0x3a6aa8,0xd8c040,0x777777][k%5],x,g+0.04,z,r*20,0.25,0.04,0.18);}
      let nf=0;for(let k=0;k<120;k++){const x=x0+rx(T,k*5+1)*TS,z=z0+rx(T,k*5+2)*TS;if(!inZ(x,z)||inB(x,z)||inB(x+3,z)||inB(x-3,z)||inB(x,z+3)||inB(x,z-3))continue;let ok=true;for(const q of NW.near(x,z,5))if(q.R.c<10){ok=false;break;}if(!ok)continue;
        if(segQ(x,z).some(s=>{const dx=s[2]-s[0],dz=s[3]-s[1],L2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-s[0])*dx+(z-s[1])*dz)/L2));return Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t)<3;}))continue;
        const g=NW.Hground(x,z),r=rx(T,k*5+3),ry=rx(T,k*5+4)*6.28;
        if(r<0.16){// auto bruciata
          pb.add(GB,0x2a2522,x,g+0.75,z,ry,4.0,0.7,1.7);pb.add(GB,0x1a1715,x-Math.cos(ry)*0.3,g+1.3,z+Math.sin(ry)*0.3,ry,2.0,0.55,1.5);pb.add(GB,0x6a3a1a,x+Math.cos(ry)*1.2,g+1.12,z-Math.sin(ry)*1.2,ry,1.2,0.05,1.6);
          [[-1.3,-1],[1.3,-1],[-1.3,1],[1.3,1]].forEach(([a,b])=>pb.add(GC,0x3a3634,x+Math.cos(ry)*a+Math.sin(ry)*b*0.8,g+0.3,z-Math.sin(ry)*a+Math.cos(ry)*b*0.8,ry,0.35,0.12,0.35,Math.PI/2));
          const c=Math.cos(ry),s=Math.sin(ry),P=[[-2,-0.85],[2,-0.85],[2,0.85],[-2,0.85]].map(([a,b])=>[x+a*c+b*s,z-a*s+b*c]);for(let q=0;q<4;q++)addSeg(T,P[q][0],P[q][1],P[(q+1)%4][0],P[(q+1)%4][1]);}
        else if(r<0.3&&nf<1){// bidone con falò e figure intorno
          nf++;pb.add(GC,0x5a3a26,x,g+0.45,z,0,0.6,0.9,0.6);pb.add(GT,0x4a2a16,x,g+0.6,z,0,0.82,0.8,0.82,Math.PI/2);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:fireTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.position.set(x,g+1.2,z);sp.scale.set(1,1.4,1);scene.add(sp);T.dobj.push(sp);FIRE.push({sp,T,y:g+1.2,ph:k});
          const np=2+((rx(T,k+90)*2)|0);for(let q=0;q<np;q++){const a=q/np*6.28+r*9,hx=x+Math.cos(a)*1.2,hz=z+Math.sin(a)*1.2,h=makeHuman(rx(T,q+k)<0.25?'woman':'man');h.traverse(o=>{if(o.isMesh&&o.material&&o.material.color){o.material=o.material.clone();o.material.color.multiplyScalar(0.55);}});
            flat(T,h,hx,NW.Hground(hx,hz),hz,Math.atan2(-(z-hz),x-hx));}addSeg(T,x-0.4,z,x+0.4,z);}
        else if(r<0.45){// mucchio di sacchi e rifiuti
          for(let q=0;q<7;q++)pb.add(GI,[0x1b1c1e,0x22301f,0x3a3a3a,0x5a4a32][q%4],x+(rx(T,k+q)-0.5)*2.4,g+0.25+(q%3)*0.15,z+(rx(T,k+q+7)-0.5)*2.4,q,0.6+q%3*0.15,0.5,0.6);pb.add(GB,0x7a6a55,x+0.9,g+0.1,z-0.4,ry,0.9,0.18,0.6);}
        else if(r<0.58){// pila di gomme
          {const nq=4+(k%3);loose(T,pb,x,z,g,0.5,9*nq,()=>{for(let q=0;q<nq;q++)pb.add(GT,0x141414,x+((q%2)*0.15),g+0.15+q*0.27,z,q*0.3,1.1,1.1,1.1,Math.PI/2);});}}
        else if(r<0.7){// pallet accatastati e un carrello della spesa
          for(let q=0;q<3;q++)pb.add(GB,0x9a7a52,x,g+0.07+q*0.15,z,ry+q*0.1,1.2,0.12,0.8);pb.add(GB,0x9aa0a6,x+1.6,g+0.75,z+0.4,ry+0.7,0.9,0.5,0.55);[[-0.35,-0.2],[0.35,-0.2],[-0.35,0.2],[0.35,0.2]].forEach(([a,b])=>pb.add(GC6,0x333333,x+1.6+a,g+0.08,z+0.4+b,0,0.1,0.12,0.1));}
        else if(r<0.8){// recinzione sfondata
          const c=Math.cos(ry),s=Math.sin(ry);for(let q=0;q<4;q++){const px=x+c*q*2.2,pz=z-s*q*2.2;pb.add(GC6,0x6a6e72,px,g+1,pz,0,0.07,2,0.07,q===2?0.35:0,q===3?-0.25:0);}pb.add(GB,0x8a9096,x+c*2.2,g+1.1,z-s*2.2,ry,6.6,1.8,0.02,0,0.08);}
        else if(r<0.88){// cani randagi
          for(let q=0;q<1+((rx(T,k+44)*3)|0);q++){const d=makeDog(),dx=x+(q-1)*1.4,dz=z+(rx(T,q+k)-0.5)*2;flat(T,d,dx,NW.Hground(dx,dz),dz,rx(T,k+q*3)*6.28);}}
        else{// macchia d'olio e muretto con graffito
          const w=new THREE.Mesh(new THREE.BoxGeometry(6,2.2,0.3),am(0x8a867e));w.position.set(x,g+1.1,z);w.rotation.y=ry;w.castShadow=w.receiveShadow=true;scene.add(w);T.dobj.push(w);
          [1,-1].forEach(sd=>gq((k+(sd>0?0:5)+SESS)%GRAF.length,x+Math.sin(ry)*0.16*sd,g+1.15,z+Math.cos(ry)*0.16*sd,ry+(sd>0?0:Math.PI),5.6,2.1));
          const c=Math.cos(ry),s=Math.sin(ry);addSeg(T,x-c*3,z+s*3,x+c*3,z-s*3);}}}
    // ---------- campagna e montagna: greggi, cavalli, cervi, galline, balle di fieno, imprevisti sulle strade ----------
    function country(T,pb){const x0=T.i*TS,z0=T.j*TS;
      const spot=(k,cond)=>{for(let t=0;t<6;t++){const x=x0+rx(T,k*13+t)*TS,z=z0+rx(T,k*13+t+6)*TS;if(NW.cityAt(x,z)||NW.placeAt(x,z))continue;let ok=true;for(const q of NW.near(x,z,18))if(q.R.c<10){ok=false;break;}if(!ok)continue;
        const lk=NW.lakeAt(x,z),h=NW.Hg(x,z);if(lk&&h<NW.lakes[lk-1].lv+1)continue;if(h<4)continue;const sl=Math.abs(NW.Hg(x+6,z)-NW.Hg(x-6,z))/12+Math.abs(NW.Hg(x,z+6)-NW.Hg(x,z-6))/12;if(cond(h,sl,forestF(x,z,h,sl)))return{x,z,h};}return null;};
      let s;
      if(rx(T,1)<0.28&&(s=spot(1,(h,sl,ff)=>h>230&&h<900&&sl<0.3&&ff<0.25)))herd(T,'sheep',s.x,s.z,6+((rx(T,2)*8)|0),12);
      if(rx(T,3)<0.18&&(s=spot(2,(h,sl,ff)=>h>650&&sl<0.75&&ff<0.4)))herd(T,'goat',s.x,s.z,3+((rx(T,4)*5)|0),10);
      if(rx(T,5)<0.15&&(s=spot(3,(h,sl,ff)=>h>20&&h<600&&sl<0.12&&ff<0.15))){const n=2+((rx(T,6)*3)|0);for(let q=0;q<n;q++)herd(T,rx(T,q+7)<0.6?'horse':'horse2',s.x+q*3,s.z,1,14);
        // recinto del paddock
        const R=18;for(let q=0;q<24;q++){const a=q/24*6.28,px=s.x+Math.cos(a)*R,pz=s.z+Math.sin(a)*R,g=NW.Hg(px,pz);pb.add(GC6,0x8a6a44,px,g+0.6,pz,0,0.12,1.2,0.12);const a2=(q+0.5)/24*6.28,mx=s.x+Math.cos(a2)*R,mz=s.z+Math.sin(a2)*R;pb.add(GB,0xa07a50,mx,g+0.85,mz,-a2,0.06,0.08,R*0.27);pb.add(GB,0xa07a50,mx,g+0.45,mz,-a2,0.06,0.08,R*0.27);}}
      if(rx(T,8)<0.14&&(s=spot(4,(h,sl,ff)=>ff>0.25&&ff<0.65&&sl<0.4)))herd(T,'deer',s.x,s.z,1+((rx(T,9)*3)|0),16);
      if(rx(T,10)<0.12&&(s=spot(5,(h,sl,ff)=>h>20&&h<500&&sl<0.15&&ff<0.2))){herd(T,'chick',s.x,s.z,5+((rx(T,11)*7)|0),5);pb.add(GB,0x9a6a3e,s.x+4,NW.Hg(s.x+4,s.z)+0.9,s.z,0.3,2.2,1.8,1.6);pb.add(GB,0x7a3a22,s.x+4,NW.Hg(s.x+4,s.z)+1.95,s.z,0.3,2.5,0.25,1.9);}
      if(rx(T,12)<0.22&&(s=spot(6,(h,sl,ff)=>h>15&&h<400&&sl<0.08&&ff<0.1))){for(let q=0;q<5+((rx(T,13)*8)|0);q++){const bx=s.x+(rx(T,q+20)-0.5)*70,bz=s.z+(rx(T,q+40)-0.5)*70,g=NW.Hg(bx,bz);if(NW.near(bx,bz,6).some(o=>o.R.c<10))continue;
          if(q%2)pb.add(GC,0xd9b35a,bx,g+0.75,bz,rx(T,q)*3,1.5,1.25,1.5,Math.PI/2);else pb.add(GB,0xd9b35a,bx,g+0.45,bz,rx(T,q)*3,1.2,0.9,2.2);addSeg(T,bx-0.6,bz,bx+0.6,bz);}
        // trattore nel campo
        if(rx(T,14)<0.4){const tx=s.x+10,tz=s.z-8,g=NW.Hg(tx,tz),ry=rx(T,15)*6.28,c=Math.cos(ry),sn=Math.sin(ry);pb.add(GB,0x2f7d32,tx,g+1.1,tz,ry,2.4,0.9,1.2);pb.add(GB,0x2f7d32,tx-c*0.6,g+1.9,tz+sn*0.6,ry,1.1,1.3,1.1);pb.add(GB,0xbfd8e6,tx-c*0.6,g+1.95,tz+sn*0.6,ry,1.15,0.9,1.0);
          [[-0.9,1,1.5],[1.0,0.7,0.95]].forEach(([a,r2,wd])=>[1,-1].forEach(sd=>pb.add(GC,0x141414,tx+c*a+sn*sd*0.85,g+r2*0.75,tz-sn*a+c*sd*0.85,ry,r2*1.5,0.4,r2*1.5,Math.PI/2)));addSeg(T,tx-c*1.8,tz+sn*1.8,tx+c*1.8,tz-sn*1.8);}}
      // imprevisti lungo le statali: auto in panne, cantiere, bancarella della frutta
      const l=segT.get(T.key);if(!l)return;const ev=rx(T,30);if(ev>0.3)return;
      for(let q=0;q<l.length;q+=2){const R=NW.roads[l[q]],i=l[q+1];if(R.c<3||R.c>7||R.priv||R.t||R.b||NW.cityAt(R.X[i],R.Z[i]))continue;const a=R.cum[i],b=R.cum[i+1],L=b-a;if(L<25)continue;
        const tx=(R.X[i+1]-R.X[i])/L,tz=(R.Z[i+1]-R.Z[i])/L,nx=-tz,nz=tx,x=(R.X[i]+R.X[i+1])/2,z=(R.Z[i]+R.Z[i+1])/2,h=(R.Hh[i]+R.Hh[i+1])/2,ry=Math.atan2(-tz,tx),off=R.w/2+1.4;if(NW.nearJ(x,z,40))continue;
        const px=x+nx*off,pz=z+nz*off;if(Math.abs(NW.Hg(px,pz)-h)>1.2)continue;
        if(ev<0.1){// auto in panne con le quattro frecce e il triangolo
          const k=randType(),m=makeCar(k,randColor());m.position.set(px,h,pz);m.rotation.y=ry;scene.add(m);T.dobj.push(m);FIRE.push({car:m,T});
          const tr=new THREE.Mesh(new THREE.ConeGeometry(0.35,0.55,3),am(0xd01818));tr.position.set(x+nx*(R.w/2-0.4)-tx*30,h+0.3,z+nz*(R.w/2-0.4)-tz*30);tr.rotation.y=ry;scene.add(tr);T.dobj.push(tr);
          const hx=px+nx*1.6-tx*1.2,hz=pz+nz*1.6-tz*1.2;flat(T,makeHuman(rx(T,33)<0.5?'woman':'man'),hx,NW.Hground(hx,hz),hz,Math.atan2(nz,-nx));
          const T2=TYPES[k]||TYPES.berlina,c=Math.cos(ry),s2=Math.sin(ry),hl=T2.L/2,hw=T2.W/2,P=[[-hl,-hw],[hl,-hw],[hl,hw],[-hl,hw]].map(([a2,b2])=>[px+a2*c+b2*s2,pz-a2*s2+b2*c]);for(let u=0;u<4;u++)addSeg(T,P[u][0],P[u][1],P[(u+1)%4][0],P[(u+1)%4][1]);}
        else if(ev<0.2){// cantiere sul ciglio: coni, transenne, cartello
          for(let k=0;k<8;k++){const cx=x+nx*(R.w/2+0.3)+tx*(k*3-12),cz=z+nz*(R.w/2+0.3)+tz*(k*3-12);pb.add(GCo,0xff6a00,cx,h+0.35,cz,0,0.4,0.7,0.4);pb.add(GC,0xffffff,cx,h+0.42,cz,0,0.27,0.1,0.27);}
          pb.add(GB,0xd8d8d8,px,h+0.9,pz,ry,4,0.3,0.1);pb.add(GB,0xd01818,px,h+0.9,pz,ry,1.2,0.32,0.11);pb.add(GB,0xe8c020,px+tx*3,h+0.6,pz+tz*3,ry,2.6,1.2,1.6);
          const sg=new THREE.Mesh(new THREE.PlaneGeometry(0.95,0.95),tm('w_work',warn('work'),256,256,true));sg.position.set(x+nx*(R.w/2+1)-tx*40,h+1.5,z+nz*(R.w/2+1)-tz*40);sg.rotation.y=Math.atan2(-tx,-tz);scene.add(sg);T.dobj.push(sg);pb.add(GC6,0x8a8f94,sg.position.x,h+0.7,sg.position.z,0,0.08,1.4,0.08);
          addSeg(T,px-tx*2,pz-tz*2,px+tx*4,pz+tz*4);}
        else{// bancarella di frutta e verdura
          const sx=px+nx*1.5,sz=pz+nz*1.5;pb.add(GB,0x8a5a32,sx,h+0.8,sz,ry,2.6,0.08,1.1);[-1.2,1.2].forEach(o=>pb.add(GB,0x6a4426,sx+tx*o,h+0.4,sz+tz*o,ry,0.08,0.8,1.0));
          [[0xd82a20,-0.9],[0xf2a020,-0.3],[0x7cc23a,0.3],[0xf2d43a,0.9]].forEach(([c,o])=>{pb.add(GB,0xb8915a,sx+tx*o,h+0.92,sz+tz*o,ry,0.55,0.18,0.8);for(let k=0;k<4;k++)pb.add(GS,c,sx+tx*(o+(k%2-0.5)*0.22),h+1.06,sz+tz*(o+(k%2-0.5)*0.22)+((k>>1)-0.5)*0.3,0,0.16,0.16,0.16);});
          pb.add(GC6,0xdddddd,sx,h+1.3,sz,0,0.05,2.6,0.05);pb.add(GCo,0xd82a20,sx,h+2.5,sz,0,3,0.5,3);
          const sg=new THREE.Mesh(new THREE.PlaneGeometry(1.6,0.5),tm('frutta',(g,w,h2)=>{g.fillStyle='#fff8e0';g.fillRect(0,0,w,h2);g.fillStyle='#1d6b2a';g.font='bold 54px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('FRUTTA FRESCA',w/2,h2/2);},512,160));
          sg.position.set(sx-nx*0.6,h+0.6,sz-nz*0.6);sg.rotation.y=Math.atan2(-nx,-nz);scene.add(sg);T.dobj.push(sg);const vx=sx+nx*0.9,vz=sz+nz*0.9;flat(T,makeHuman('oldm'),vx,NW.Hground(vx,vz),vz,Math.atan2(nz,-nx));
          addSeg(T,sx-tx*1.4,sz-tz*1.4,sx+tx*1.4,sz+tz*1.4);}
        break;}}
    // la costruzione è distribuita su più fotogrammi (una mattonella alla volta, a budget di tempo) per non dare scatti
    const Q=[];function tile(T){if(!Q.includes(T))Q.push(T);}
    function build(T){const n0=T.dobj.length,pb=PB(T.i*TS,T.j*TS);try{buildSigns(T,pb);city(T,pb);grim(T,pb);country(T,pb);}catch(e){console.warn('varietà',e);}const m=pb.mesh();if(m){scene.add(m);T.dobj.push(m);}
      // tutto ciò che non si muove: niente ricalcolo delle matrici a ogni fotogramma
      for(let q=n0;q<T.dobj.length;q++){const o=T.dobj[q];if(o.isSprite||!o.matrixAutoUpdate||o.userData.mixer)continue;o.updateMatrixWorld(true);o.traverse(c=>{c.matrixAutoUpdate=false;});}}
    function drop(T){const qi=Q.indexOf(T);if(qi>=0)Q.splice(qi,1);for(let q=FA.length-1;q>=0;q--)if(FA[q].T===T)FA.splice(q,1);for(let q=FIRE.length-1;q>=0;q--)if(FIRE[q].T===T)FIRE.splice(q,1);}
    function update(dt){const t0=performance.now();while(Q.length&&performance.now()-t0<4){const T=Q.shift();if(T.det)build(T);}
      const cx=camera.position.x,cz=camera.position.z,t=simT;FA.forEach(A=>animUpd(A,dt,t,cx,cz));
      const blink=(t%0.8)<0.4;FIRE.forEach(F=>{if(F.sp){const f=0.85+0.3*Math.sin(t*13+F.ph)+0.15*Math.sin(t*31+F.ph*2);F.sp.scale.set(1.0*f,1.5*f,1);F.sp.position.y=F.y+0.1*Math.sin(t*7+F.ph);}
        else if(F.car){const u=F.car.userData;if(u.indL)u.indL.emissiveIntensity=blink?3:0;if(u.indR)u.indR.emissiveIntensity=blink?3:0;}});}
    return{tile,drop,update,FA,SIG,flush:()=>{while(Q.length){const T=Q.shift();if(T.det)build(T);}}};})();
  function detail(T){if(T.det)return;T.det=true;T.dobj=[];T.segs=[];furniture(T);VX.tile(T);const x0=T.i*TS,z0=T.j*TS,rnd=a=>hsh(T.i*131+a,T.j*977+a*7);
    if(HIDE){(bldT.get(T.key)||[]).forEach(bi=>{const b=NW.J.blds[bi],rg=b[3],n=rg.length/2;if(b[6]>2)return;for(let q=0;q<n;q++)addSeg(T,rg[q*2],rg[q*2+1],rg[(q+1)%n*2],rg[(q+1)%n*2+1]);});return;}
    // edifici: facciate per tipo, negozi al piano terra sul lato della strada, tetti a falde o piani
    const bl=bldT.get(T.key);if(bl){const GG=FAC.map(()=>({P:[],C:[],U:[],I:[]})),G1={P:[],C:[],U:[],I:[]},RP=[],RC=[],RI=[],TP=[],TU=[],TI=[],DP=[],DU=[],DI=[],SP=[],SU=[],SI=[],AP=[],AC=[],AI=[],NP=[],NU=[],NI=[],DH=[],LGP=[],LGU=[],LGI=[],col=new THREE.Color();
      const quad=(G,ax,az,bx,bz,ya,yb,u0,u1,va,vb)=>{const s=G.P.length/3;G.P.push(ax-x0,ya,az-z0,bx-x0,ya,bz-z0,ax-x0,yb,az-z0,bx-x0,yb,bz-z0);G.U.push(u0,va,u1,va,u0,vb,u1,vb);for(let t=0;t<4;t++)G.C.push(col.r,col.g,col.b);G.I.push(s,s+1,s+2,s+1,s+3,s+2);};
      const tri=(A,Uv,I,pts,uvs)=>{const s=A.length/3;pts.forEach(p=>A.push(p[0]-x0,p[1],p[2]-z0));uvs.forEach(u=>Uv.push(u[0],u[1]));I.push(s,s+1,s+2);};
      bl.forEach(bi=>{const b=NW.J.blds[bi],h=b[0],cc=b[1],gnd=b[2],ring=b[3],church=b[4],holes=b[5],mh=b[6]||0,kd=b[7]==null?0:b[7],roof=b[8]||0;const n=ring.length/2;if(n<3)return;
        const k0=(kd&15)%FAC_N,kind=FAC_HD?hdKind(k0,(NW.cityAt(ring[0],ring[1])||{}).st,h,bi):k0,shopF=(kd&16)&&mh<0.5&&h>6,[FM,su,sv]=FAC[kind],G=GG[kind];
        col.setHex(church===1?0xe4ddd0:cc).convertSRGBToLinear();if(kind===11||kind===12||kind===13||kind===17||kind===18||kind===14||kind===19||kind===16||kind===20)col.setRGB(0.92+0.08*hsh(bi,3),0.92+0.08*hsh(bi,3),0.9+0.08*hsh(bi,4));const y0=mh>0.5?gnd:gnd-1.5,y1=gnd+h;
        let cx=0,cz=0;for(let q=0;q<n;q++){cx+=ring[q*2];cz+=ring[q*2+1];}cx/=n;cz/=n;
        [ring].concat(holes||[]).forEach(rg=>{const n=rg.length/2;let per=0;for(let q=0;q<n;q++){const ax=rg[q*2],az=rg[q*2+1],bx=rg[(q+1)%n*2],bz=rg[(q+1)%n*2+1],L=Math.hypot(bx-ax,bz-az);
          const u0=per/su,u1=(per+L)/su;per+=L;
          if(church)quad(G1,ax,az,bx,bz,y0,y1,per/7-L/7,per/7,(y0-gnd)/6.4,h/6.4);
          else quad(G,ax,az,bx,bz,y0,y1,u0,u1,sv?(y0-gnd)/sv:0,sv?h/sv:1);
          if(!(mh>2))addSeg(T,ax,az,bx,bz);}});
        // negozi sul fronte (lato 0)
        if(shopF&&n===4){const ax=ring[0],az=ring[1],bx=ring[2],bz=ring[3],L=Math.hypot(bx-ax,bz-az),tx=(bx-ax)/L,tz=(bz-az)/L;let nx=-tz,nz=tx;const mx=(ax+bx)/2,mz=(az+bz)/2;if((mx-cx)*nx+(mz-cz)*nz<0){nx=-nx;nz=-nz;}
          const rx=nz,rz=-nx,k=Math.max(1,Math.round(L/6.2)),seg=L/k,gy=gnd+0.02;
          const cty=NW.cityAt(cx,cz),dC=cty?Math.hypot(cx-cty.wx,cz-cty.wz)/cty.r1:0.8,tour=cty?TOURIST.has(cty.n):true,zone=tour&&hsh(bi,7)<0.6?'t':dC<0.32?'c':dC<0.68?'s':'p';
          for(let q=0;q<k;q++){const cell=shopPick(zone,hsh(bi,q)),[u0,v0,u1s,v1]=shopUV(cell),c0=-L/2+q*seg+0.15,c1=c0+seg-0.3,ox=mx+nx*0.05,oz=mz+nz*0.05;
            const Lx=ox+rx*c0,Lz=oz+rz*c0,Rx=ox+rx*c1,Rz=oz+rz*c1,s0=SP.length/3;SP.push(Lx-x0,gy,Lz-z0,Rx-x0,gy,Rz-z0,Lx-x0,gy+3.6,Lz-z0,Rx-x0,gy+3.6,Rz-z0);SU.push(u0,v0,u1s,v0,u0,v1,u1s,v1);SI.push(s0,s0+1,s0+2,s0+1,s0+3,s0+2);
            if(SHOPS[cell][6]){const n0=NP.length/3;NP.push(Lx-x0+nx*0.03,gy+2.5,Lz-z0+nz*0.03,Rx-x0+nx*0.03,gy+2.5,Rz-z0+nz*0.03,Lx-x0+nx*0.03,gy+3.6,Lz-z0+nz*0.03,Rx-x0+nx*0.03,gy+3.6,Rz-z0+nz*0.03);const vv=v0+(v1-v0)*0.69;NU.push(u0,vv,u1s,vv,u0,v1,u1s,v1);NI.push(n0,n0+1,n0+2,n0+1,n0+3,n0+2);}
            if(['bar','food','gel','pub'].includes(SHOPS[cell][3])&&(zone==='t'||zone==='c')&&hsh(bi,q+31)<0.7){const mc=(c0+c1)/2;for(let j=0;j<2;j++){const off=(j-0.5)*2.2;DH.push(ox+rx*(mc+off)+nx*2.3,gy,oz+rz*(mc+off)+nz*2.3,hsh(bi,q+j+40));}}
            if(['bar','food','sweet','moda','shop','pub'].includes(SHOPS[cell][3])&&hsh(bi,q+50)<0.55){const ac=new THREE.Color([0xb8312f,0x2e6e3e,0xc9a227,0x1f4f8a,0x7a3b6b,0xd8d2c4][(hsh(bi,q+9)*6)|0]).convertSRGBToLinear(),s1=AP.length/3,ex=nx*1.4,ez=nz*1.4,y=gnd+3.25;
              AP.push(Lx-x0,y+0.6,Lz-z0,Rx-x0,y+0.6,Rz-z0,Lx+ex-x0,y,Lz+ez-z0,Rx+ex-x0,y,Rz+ez-z0);for(let t=0;t<4;t++)AC.push(ac.r,ac.g,ac.b);AI.push(s1,s1+2,s1+1,s1+1,s1+2,s1+3);}}}
        // grattacieli brandizzati: logo di una grande azienda (inventata) in cima a due facce opposte, illuminato di sera
        if(n===4&&y1-gnd>50&&hsh(bi,91)<0.65){const li=(hsh(bi,92)*8)|0,[lu0,lv0,lu1,lv1]=[(li%2)/2,1-(((li/2)|0)+1)/4,(li%2)/2+0.5,1-((li/2)|0)/4];
          for(const f of [0,2]){const ax=ring[f*2],az=ring[f*2+1],bx=ring[(f*2+2)%8],bz=ring[(f*2+3)%8],L=Math.hypot(bx-ax,bz-az);if(L<14)continue;let nx=-(bz-az)/L,nz=(bx-ax)/L;const mx=(ax+bx)/2,mz=(az+bz)/2;if((mx-cx)*nx+(mz-cz)*nz<0){nx=-nx;nz=-nz;}
            const w=Math.min(L*0.92,36),h=w*0.5,tx=(bx-ax)/L,tz=(bz-az)/L,sgn=((tx*nz-tz*nx)>0?1:-1),yb=y1-h-1.5,ox=mx+nx*0.12,oz=mz+nz*0.12,Lx=ox-tx*w/2*sgn,Lz=oz-tz*w/2*sgn,Rx=ox+tx*w/2*sgn,Rz=oz+tz*w/2*sgn,b=LGP.length/3;
            LGP.push(Lx-x0,yb,Lz-z0,Rx-x0,yb,Rz-z0,Lx-x0,yb+h,Lz-z0,Rx-x0,yb+h,Rz-z0);LGU.push(lu0,lv0,lu1,lv0,lu0,lv1,lu1,lv1);LGI.push(b,b+1,b+2,b+1,b+3,b+2,b,b+2,b+1,b+1,b+2,b+3);}}
        // tetto
        if((roof===1||roof===2)&&n===4&&!church){const c=[0,1,2,3].map(q=>[ring[q*2],ring[q*2+1]]),ov=roof===2?0.9:0.35;
          const e0=Math.hypot(c[1][0]-c[0][0],c[1][1]-c[0][1]),e1=Math.hypot(c[2][0]-c[1][0],c[2][1]-c[1][1]),o=e0>=e1?0:1;
          const k=[0,1,2,3].map(q=>c[(q+o)%4]),span=o?e0:e1,rh=Math.min(roof===2?5:4.2,span*(roof===2?0.42:0.32));
          const ex=k.map(p=>{const vx=p[0]-cx,vz=p[1]-cz,l=Math.hypot(vx,vz)||1;return[p[0]+vx/l*ov,p[1]+vz/l*ov];});
          const m03=[(ex[0][0]+ex[3][0])/2,(ex[0][1]+ex[3][1])/2],m12=[(ex[1][0]+ex[2][0])/2,(ex[1][1]+ex[2][1])/2],yr=y1-(roof===2?0.15:0.05),yt=y1+rh;
          const A=roof===2?DP:TP,Uv=roof===2?DU:TU,I=roof===2?DI:TI,uv=p=>[p[0]/3,p[2]/3];
          const P3=(p,y)=>[p[0],y,p[1]];const s0=[P3(ex[0],yr),P3(ex[1],yr),P3(m12,yt),P3(m03,yt)],s1=[P3(ex[2],yr),P3(ex[3],yr),P3(m03,yt),P3(m12,yt)];
          [s0,s1].forEach(Q=>{const w=Math.hypot(Q[1][0]-Q[0][0],Q[1][2]-Q[0][2]),hh=Math.hypot(rh,span/2+ov);tri(A,Uv,I,[Q[0],Q[1],Q[2]],[[0,0],[w/3,0],[w/3,hh/3]]);tri(A,Uv,I,[Q[0],Q[2],Q[3]],[[0,0],[w/3,hh/3],[0,hh/3]]);});
          // timpani col colore della facciata
          [[k[1],k[2]],[k[3],k[0]]].forEach(([p,q])=>{const m=[(p[0]+q[0])/2,(p[1]+q[1])/2],s=G.P.length/3;G.P.push(p[0]-x0,y1,p[1]-z0,q[0]-x0,y1,q[1]-z0,m[0]-x0,yt-0.1,m[1]-z0);G.U.push(0,0.2,0.2,0.2,0.1,0.25);for(let t=0;t<3;t++)G.C.push(col.r,col.g,col.b);G.I.push(s,s+1,s+2);});}
        else{const ct=[];for(let q=0;q<n;q++)ct.push(new THREE.Vector2(ring[q*2],ring[q*2+1]));const hs=(holes||[]).map(hr=>{const a=[];for(let q=0;q<hr.length;q+=2)a.push(new THREE.Vector2(hr[q],hr[q+1]));return a;});
          let tr;try{tr=THREE.ShapeUtils.triangulateShape(ct,hs);}catch(e){tr=[];}ct.push(...[].concat(...hs));
          const s=RP.length/3,rv=hsh(bi,1),rc=church?[0.35,0.3,0.27]:(kind===3||kind===20)?[0.42,0.43,0.45]:[0.30+0.08*rv,0.30+0.08*rv,0.29+0.07*rv];ct.forEach(v=>{RP.push(v.x-x0,y1+0.02,v.y-z0);RC.push(...rc);});tr.forEach(t=>RI.push(s+t[0],s+t[1],s+t[2]));
          // cornicione
          if(h>6&&kind!==3&&kind!==5&&kind!==20&&n<=12){col.multiplyScalar(0.92);for(let q=0;q<n;q++){const ax=ring[q*2],az=ring[q*2+1],bx=ring[(q+1)%n*2],bz=ring[(q+1)%n*2+1],vx=(ax+bx)/2-cx,vz=(az+bz)/2-cz,l=Math.hypot(vx,vz)||1,ox=vx/l*0.35,oz=vz/l*0.35;
            quad(G,ax+ox,az+oz,bx+ox,bz+oz,y1-0.5,y1+0.6,0.02,0.04,0.02,0.04);}}}});
      const put=(A,Uv,I,M,Cc)=>{if(!I.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(A,3));if(Uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(Uv,2));if(Cc)g.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));g.setIndex(I);g.computeVertexNormals();
        const m=new THREE.Mesh(g,M);m.position.set(x0,0,z0);m.castShadow=true;m.receiveShadow=true;scene.add(m);T.dobj.push(m);};
      GG.forEach((G,k)=>put(G.P,G.U,G.I,FAC[k][0],G.C));put(G1.P,G1.U,G1.I,stoneM,G1.C);put(RP,null,RI,roofM,RC);put(TP,TU,TI,tileRoofM);put(DP,DU,DI,darkRoofM);put(SP,SU,SI,shopM);put(AP,null,AI,awnM,AC);put(NP,NU,NI,NEON.m);put(LGP,LGU,LGI,LOGO);DEHORS(T,DH,x0,z0);}
    // alberi veri (censimento e filari)
    const tl=treeT.get(T.key);if(tl&&tl.length){const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),V=new THREE.Vector3(),S3=new THREE.Vector3(),co=new THREE.Color(),UPV=new THREE.Vector3(0,1,0);
      const by=[[],[],[],[],[],[]];tl.forEach(ti=>{const C=NW.cityAt(TR[ti*2],TR[ti*2+1]),st=C&&C.st,r=hsh(ti,3);let v=r<0.82?0:1;
        if(st==='lido'||st==='porto')v=r<0.7?4:v;else if(st==='arte'||st==='terme')v=r<0.55?5:v;else if(st==='alpino')v=r<0.7?2:v;by[v].push(ti);});
      by.forEach((L,vi)=>{if(!L.length)return;const im=new THREE.InstancedMesh(TREEV[vi],treeVM,L.length);
        L.forEach((ti,q)=>{const x=TR[ti*2],z=TR[ti*2+1],g=NW.Hground(x,z),v=hsh(ti,7),s=(vi===4?10:vi===5?12:vi===2?10:vi?11:8)+v*5;Q.setFromAxisAngle(UPV,v*6.28);im.setMatrixAt(q,M4.compose(V.set(x,g-0.1,z),Q,S3.set(s*(0.9+0.2*hsh(ti,9)),s,s*(0.9+0.2*hsh(ti,5)))));
          co.setRGB(0.85+0.3*v,0.9+0.2*hsh(ti,4),0.85+0.2*v);im.setColorAt(q,co);addSeg(T,x-0.25,z,x+0.25,z);
          if(HDT){const hv=['lin','pop','fir','lin','palm','cyp'][vi];if(hv){const k=hv==='lin'?0.95:hv==='fir'?1.25:hv==='cyp'?0.95:1.05;HDT.add(T,{v:hv,x,z,m:new THREE.Matrix4().compose(V.set(x,g-0.15,z),Q,S3.set(s*k*(0.9+0.2*hsh(ti,9)),s*k,s*k*(0.9+0.2*hsh(ti,5)))),c:new THREE.Color(0.9+0.15*v,0.92+0.12*hsh(ti,4),0.88+0.12*v),im,q});}}});
        im.castShadow=true;im.receiveShadow=true;scene.add(im);T.dobj.push(im);});if(HDT)HDT.buildFar(T);}
    // parchi e piazze
    const al=areaT.get(T.key);if(al){const P=[],I=[],PP=[],PI=[],WP=[],WI=[];al.forEach(ai=>{const [kind,ring]=NW.J.areas[ai];const ct=[];for(let q=0;q<ring.length;q+=2)ct.push(new THREE.Vector2(ring[q],ring[q+1]));let tri;try{tri=THREE.ShapeUtils.triangulateShape(ct,[]);}catch(e){return;}
        const A=kind===1?PP:kind===2?WP:P,B=kind===1?PI:kind===2?WI:I,s=A.length/3;ct.forEach(v=>A.push(v.x-x0,NW.Hground(v.x,v.y)+(kind===1?0.075:kind===2?0.06:0.03),v.y-z0));tri.forEach(t=>B.push(s+t[0],s+t[1],s+t[2]));});
      [[P,I,parkM],[PP,PI,roadMat('pv',1)],[WP,WI,riverM]].forEach(([A,B,M])=>{if(!B.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(A,3));g.setIndex(B);g.computeVertexNormals();if(g.attributes.normal.array[1]<0){g.index.array.reverse();g.computeVertexNormals();}
        const uv=[];for(let q=0;q<A.length;q+=3)uv.push((A[q]+x0)/6,(A[q+2]+z0)/6);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));const m=new THREE.Mesh(g,M);m.position.set(x0,0,z0);m.receiveShadow=true;scene.add(m);T.dobj.push(m);});}
    // paesi e periferie generate, alberi, mucche
    const H=[],R=[],tr=[],fr=[];let herd=null;
    const free=(x,z,m)=>{if(NW.cityAt(x,z))return false;for(const q of NW.near(x,z,m))if(q.R.c<10)return false;const lk=NW.lakeAt(x,z);if(lk&&NW.Hg(x,z)<NW.lakes[lk-1].lv+0.5)return false;return true;};
    for(let k=0;k<320;k++){const x=x0+rnd(k*3+1)*TS,z=z0+rnd(k*3+2)*TS;const pa=NW.placeAt(x,z);if(!pa)continue;const p=pa.p,f=pa.f;
      const dens=p.t===0?0.95:p.t===1?0.85:0.75;if(rnd(k*5+9)>dens*(1-f*f*0.8))continue;
      // vicino a una strada (le case stanno lungo le vie), tranne nelle città grandi
      let best=null;for(const q of NW.near(x,z,32))if(q.R.c<=8&&(!best||q.d<best.d))best=q;if(!best&&p.t!==0)continue;
      if(!free(x,z,3.5))continue;const g=NW.Hground(x,z),sl=Math.abs(NW.Hg(x+8,z)-NW.Hg(x-8,z))/16+Math.abs(NW.Hg(x,z+8)-NW.Hg(x,z-8))/16;if(sl>0.35)continue;
      // niente case sotto il livello di una strada in rilevato
      if(best&&best.d<24){const R2=best.R,i2=best.i,rh=Math.max(R2.Hh[i2],R2.Hh[i2+1]||R2.Hh[i2]);if(rh-g>1.2)continue;}
      let rot=rnd(k)*6.28;if(best){const R2=best.R;rot=Math.atan2(-(R2.Z[best.i+1]-R2.Z[best.i]),R2.X[best.i+1]-R2.X[best.i]);}
      const tall=p.t===0?(1-f)*(p.R>2000?0.9:0.6):p.t===1?(1-f)*0.35:0.04,big=rnd(k+31)<tall;
      const w=big?14+rnd(k+3)*12:8+rnd(k+3)*5,d=big?11+rnd(k+4)*6:7+rnd(k+4)*4,h=big?12+rnd(k+5)*(p.t===0?18:9):5.5+rnd(k+5)*3;
      H.push([x,g-0.8,z,w,h+0.8,d,rot,big]);if(!big)R.push([x,g+h,z,w*1.08,2.2+rnd(k+6),d*1.1,rot]);
      const c=Math.cos(rot),s=Math.sin(rot),cx=[[w/2,d/2],[-w/2,d/2],[-w/2,-d/2],[w/2,-d/2]].map(([a,b])=>[x+a*c+b*s,z-a*s+b*c]);for(let q=0;q<4;q++)addSeg(T,cx[q][0],cx[q][1],cx[(q+1)%4][0],cx[(q+1)%4][1]);}
    for(let k=0;k<700;k++){const x=x0+rnd(k*7+100)*TS,z=z0+rnd(k*7+101)*TS,h=NW.Hg(x,z);const sl=Math.abs(NW.Hg(x+6,z)-NW.Hg(x-6,z))/12+Math.abs(NW.Hg(x,z+6)-NW.Hg(x,z-6))/12;
      if(h>1080||sl>1.1)continue;if(window.HOMEZ2&&HOMEZ2(x,z))continue;const ff=forestF(x,z,h,sl);const pa=NW.placeAt(x,z);if(pa&&pa.f<0.9)continue;
      if(ff<0.3&&rnd(k+500)>0.006+0.3*CLUMP(x,z,h)){if(!herd&&ff<0.1&&h>90&&h<600&&sl<0.12&&rnd(k+77)>0.995&&COWX&&free(x,z,25))herd={x,z};continue;}
      if(!free(x,z,5))continue;const g=NW.Hground(x,z);
      if(h>420||(h>200&&rnd(k+3)>0.55)){if(fr.length<260)fr.push([x,g,z,6+rnd(k)*8]);}else if(tr.length<230)tr.push([x,g,z,3.5+rnd(k+5)*4.5]);}
    // fast food lungo le provinciali vicino alle città (pacchetto HD)
    if(HDX&&HDX.food&&rnd(901)<0.14){const C=NW.cities.find(c=>{const d=Math.hypot(c.wx-(x0+TS/2),c.wz-(z0+TS/2));return d>c.R*0.9&&d<c.R+1800;});
      if(C)for(let k=0;k<30;k++){const x=x0+40+rnd(k*11+903)*(TS-80),z=z0+40+rnd(k*11+904)*(TS-80);let best=null;for(const q of NW.near(x,z,60))if(q.R.c>=2&&q.R.c<=5&&!q.R.t&&!q.R.b&&(!best||q.d<best.d))best=q;if(!best)continue;
        const R2=best.R,i=best.i,dx=R2.X[i+1]-R2.X[i],dz=R2.Z[i+1]-R2.Z[i],l=Math.hypot(dx,dz)||1,tx=dx/l,tz=dz/l,nx=-tz,nz=tx;
        // il punto più vicino sulla strada, poi ci si sposta di lato
        const u=Math.max(0,Math.min(l,(x-R2.X[i])*tx+(z-R2.Z[i])*tz)),qx=R2.X[i]+tx*u,qz=R2.Z[i]+tz*u,sd=(x-qx)*nx+(z-qz)*nz>0?1:-1,[fw,fd]=HDX.foodSize,off=R2.w/2+fd/2+3;
        const cx=qx+nx*sd*off,cz=qz+nz*sd*off;if(NW.cityAt(cx,cz)||NW.lakeAt(cx,cz))continue;let ok=true,hmin=1e9,hmax=-1e9;
        for(const[a2,b2]of[[-1,-1],[1,-1],[1,1],[-1,1],[0,0]]){const px=cx+tx*a2*fw/2+nx*b2*fd/2,pz=cz+tz*a2*fw/2+nz*b2*fd/2,hh=NW.Hg(px,pz);hmin=Math.min(hmin,hh);hmax=Math.max(hmax,hh);for(const q of NW.near(px,pz,R2.w/2+1))if(q.R!==R2&&q.R.c<10){ok=false;break;}}
        if(!ok||hmax-hmin>1.6)continue;if(H.some(([hx,,hz])=>Math.abs(hx-cx)<fw&&Math.abs(hz-cz)<fw))continue;
        const g=HDX.food();g.position.set(cx,hmax+0.06,cz);g.rotation.y=Math.atan2(-tz,tx)+(sd>0?Math.PI:0);scene.add(g);T.dobj.push(g);
        // il piazzale copre il terreno: un basamento sotto, e niente alberi sopra
        const bs=new THREE.Mesh(new THREE.BoxGeometry(fw,hmax-hmin+0.6,fd),concM);bs.position.set(cx,(hmax+hmin)/2-0.25,cz);bs.rotation.y=g.rotation.y;scene.add(bs);T.dobj.push(bs);
        tr.splice(0,tr.length,...tr.filter(([px,,pz])=>Math.hypot(px-cx,pz-cz)>fw*0.75));fr.splice(0,fr.length,...fr.filter(([px,,pz])=>Math.hypot(px-cx,pz-cz)>fw*0.75));
        const bw=fw*0.38,bd=fd*0.3,c0=Math.cos(g.rotation.y),s0=Math.sin(g.rotation.y),P=[[-bw,-bd],[bw,-bd],[bw,bd],[-bw,bd]].map(([a2,b2])=>[cx+a2*c0+b2*s0,cz-a2*s0+b2*c0]);for(let q=0;q<4;q++)addSeg(T,P[q][0],P[q][1],P[(q+1)%4][0],P[(q+1)%4][1]);
        (window.__food=window.__food||[]).push([cx,cz]);break;}}
    const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),V=new THREE.Vector3(),S3=new THREE.Vector3(),co=new THREE.Color(),UP=new THREE.Vector3(0,1,0);
    if(H.length){const im=new THREE.InstancedMesh(houseG,houseM,H.length);H.forEach(([x,y,z,w,h,d,rot,big],q)=>{Q.setFromAxisAngle(UP,rot);im.setMatrixAt(q,M4.compose(V.set(x,y,z),Q,S3.set(w,h,d)));const v=hsh(q,x|0);co.setHex([0xe6d0a8,0xd9b98a,0xeee0c4,0xcf9f7a,0xe2c79c,0xd4c0a0][(v*6)|0]).convertSRGBToLinear();im.setColorAt(q,co);});
      im.castShadow=true;im.receiveShadow=true;scene.add(im);T.dobj.push(im);}
    if(R.length){const im=new THREE.InstancedMesh(roofG,hroofM,R.length);R.forEach(([x,y,z,w,h,d,rot],q)=>{Q.setFromAxisAngle(UP,rot+Math.PI/2);im.setMatrixAt(q,M4.compose(V.set(x,y,z),Q,S3.set(d,h,w)));co.setRGB(0.42+0.12*hsh(q,3),0.15+0.04*hsh(q,4),0.08);im.setColorAt(q,co);});im.castShadow=true;scene.add(im);T.dobj.push(im);}
    const inst=(geo,m,list,sx,ys,cf,hv)=>{if(!list.length)return;const im=new THREE.InstancedMesh(geo,m,list.length);list.forEach(([x,y,z,s],q)=>{im.setMatrixAt(q,M4.compose(V.set(x,y+ys*s,z),Q.identity(),S3.set(s*sx,s,s*sx)));cf(co,hsh(q,x|0));im.setColorAt(q,co);
      if(HDT&&hv){const r=hsh(q,(z|0)+7),v=hv(x,z,r);if(v){const k=v==='lin'?1.05:v==='fir'?1.2:v==='pop'?1.0:0.95,Qr=new THREE.Quaternion().setFromAxisAngle(UP,r*6.28);HDT.add(T,{v,x,z,m:new THREE.Matrix4().compose(new THREE.Vector3(x,y-0.15,z),Qr,new THREE.Vector3(s*k*(0.9+0.2*r),s*k,s*k*(1.1-0.2*r))),c:co.clone(),im,q});}}});im.castShadow=true;scene.add(im);T.dobj.push(im);};
    // vicino ai laghi e al mare le latifoglie diventano palme
    const nearWater=(x,z)=>{for(const[dx,dz]of[[0,0],[50,0],[-50,0],[0,50],[0,-50]]){const lk=NW.lakeAt(x+dx,z+dz);if(lk&&NW.Hg(x+dx,z+dz)<NW.lakes[lk-1].lv+0.3)return true;}return false;};
    inst(TREEV[3],treeVM,tr.map(([x,y,z,s])=>[x,y,z,s*1.3]),1.15,0,(c,v)=>c.setRGB(0.8+0.3*v,0.85+0.25*v,0.8),(x,z,r)=>nearWater(x,z)&&NW.Hg(x,z)<260?(r<0.5?'palm':'pop'):r<0.12?'pop':'lin');
    inst(TREEV[2],treeVM,fr.map(([x,y,z,s])=>[x,y,z,s*1.25]),0.85,0,(c,v)=>c.setRGB(0.85+0.25*v,0.9+0.2*v,0.85),()=>'fir');
    if(HDT)HDT.buildFar(T);
    tr.concat(fr).forEach(([x,,z])=>addSeg(T,x-0.35,z,x+0.35,z));
    if(herd){const n=3+((rnd(5)*4)|0);for(let q=0;q<n;q++){const a=makeAnimal('cow'),x=herd.x+(rnd(q+30)-0.5)*24,z=herd.z+(rnd(q+40)-0.5)*24;a.position.set(x,NW.Hground(x,z),z);a.rotation.y=rnd(q)*6.28;scene.add(a);T.dobj.push(a);if(a.userData.mixer)anims.push({m:a,T});}}}
  function undetail(T){if(!T.det)return;T.det=false;if(HDT)HDT.drop(T);looseDrop(T);VX.drop(T);T.dobj.forEach(o=>{scene.remove(o);if(o.isInstancedMesh)o.dispose();else if(o.isMesh&&!o.userData.shared)o.geometry.dispose();});
    for(let q=anims.length-1;q>=0;q--)if(anims[q].T===T)anims.splice(q,1);
    T.segs.forEach(s=>{for(let a=Math.floor(Math.min(s[0],s[2])/BC);a<=Math.floor(Math.max(s[0],s[2])/BC);a++)for(let b=Math.floor(Math.min(s[1],s[3])/BC);b<=Math.floor(Math.max(s[1],s[3])/BC);b++){const l=bseg.get(tk(a,b));if(l){const p=l.indexOf(s);if(p>=0)l.splice(p,1);}}});T.segs=[];}
  const cityM=new THREE.MeshStandardMaterial({map:paverTex,vertexColors:true,roughness:0.9,envMapIntensity:0.35});
  function build(i,j){const T={i,j,key:tk(i,j),objs:[],det:false};const x0=i*TS,z0=j*TS,ct=NW.cityAt(x0+TS/2,z0+TS/2)&&(bldT.get(tk(i,j))||[]).length>12;
    if(!HIDE){T.objs.push(terrain(x0,z0,TS,ct?40:(MOBILE||QG.lo)?20:32,NW.Hground,ct?cityM:terrM,ct?false:'carve',!!ct));buildRoads(T);}tiles.set(T.key,T);return T;}
  function drop(T){undetail(T);T.objs.forEach(o=>{scene.remove(o);if(o.isInstancedMesh)o.dispose();else if(o.geometry)o.geometry.dispose();});tiles.delete(T.key);}
  function buildFar(i,j){const x0=i*FS,z0=j*FS,m=terrain(x0,z0,FS,25,(x,z)=>NW.Hg(x,z)-1.5,farM);m.receiveShadow=false;const F={i,j,m};far.set(tk(i,j),F);return F;}
  const okTile=(x,z,s)=>x+s>NW.GX0&&z+s>NW.GZ0&&x<NW.GX1&&z<NW.GZ1;
  let lastBox=null;
  function update(dt,force){const cx=camera.position.x,cz=camera.position.z;if(!NW.inside(cx,cz)&&!force)return;const ci=Math.floor(cx/TS),cj=Math.floor(cz/TS);
    let n=force?1e9:1,allNear=true;const want=[];
    for(let a=-RAD;a<=RAD;a++)for(let b=-RAD;b<=RAD;b++){const i=ci+a,j=cj+b;if(!okTile(i*TS,j*TS,TS))continue;const T=tiles.get(tk(i,j)),dd=Math.max(Math.abs(a),Math.abs(b));
      if(!T){want.push([dd,i,j]);allNear=false;}else if(dd<=DET&&!T.det)want.push([dd-0.5,i,j]);else if(dd>DET+1&&T.det)undetail(T);}
    want.sort((p,q)=>p[0]-q[0]);for(const [dd,i,j] of want){if(n--<=0)break;const T=tiles.get(tk(i,j));if(T)detail(T);else{const t=build(i,j);if(Math.round(dd)<=DET&&force)detail(t);}}
    tiles.forEach(T=>{if(Math.abs(T.i-ci)>RAD+1||Math.abs(T.j-cj)>RAD+1)drop(T);});
    if(allNear){lastBox=[(ci-RAD)*TS+1,(cj-RAD)*TS+1,(ci+RAD+1)*TS-1,(cj+RAD+1)*TS-1];}
    if(lastBox)nearBox.value.set(...lastBox);
    // lontano: terreno semplificato fino a 7 km
    if(!HIDE&&(n>0||force)){const fi=Math.floor(cx/FS),fj=Math.floor(cz/FS);for(let a=-FR;a<=FR;a++)for(let b=-FR;b<=FR;b++){const i=fi+a,j=fj+b;if(!okTile(i*FS,j*FS,FS))continue;if(!far.has(tk(i,j))){buildFar(i,j);if(!force)break;}}}
    far.forEach((F,k)=>{const fi=Math.floor(cx/FS),fj=Math.floor(cz/FS);if(Math.abs(F.i-fi)>FR+1||Math.abs(F.j-fj)>FR+1){scene.remove(F.m);F.m.geometry.dispose();far.delete(k);}});
    if(HDT)HDT.update(dt,force);WAVT.value+=dt;
    anims.forEach(a=>{const p=a.m.position;if(Math.abs(p.x-cx)+Math.abs(p.z-cz)<160)a.m.userData.mixer.update(dt);});LMX.update(dt);VX.update(dt);}
  function segQ(x,z){return bseg.get(tk(Math.floor(x/BC),Math.floor(z/BC)))||[];}
  function addDyn(list){const T={segs:[]};list.forEach(q=>addSeg(T,...q));return T;}
  function remDyn(T){T.segs.forEach(s=>{for(let a=Math.floor(Math.min(s[0],s[2])/BC);a<=Math.floor(Math.max(s[0],s[2])/BC);a++)for(let b=Math.floor(Math.min(s[1],s[3])/BC);b<=Math.floor(Math.max(s[1],s[3])/BC);b++){const l=bseg.get(tk(a,b));if(l){const p=l.indexOf(s);if(p>=0)l.splice(p,1);}}});T.segs=[];}
  // ---------- navigatore sulle strade vere ----------
  const NN=NW.J.nodes.length/2,NX=new Float64Array(NN),NZ=new Float64Array(NN);for(let i=0;i<NN;i++){NX[i]=NW.J.nodes[i*2];NZ[i]=NW.J.nodes[i*2+1];}
  const E=NW.J.edges.map(([ri,i0,i1,a,b,o])=>{const R=NW.roads[ri];return{ri,i0,i1,a,b,o,len:R.cum[i1]-R.cum[i0]};});
  const OUT=Array.from({length:NN},()=>[]);E.forEach((e,k)=>{OUT[e.a].push(k*2);if(!e.o)OUT[e.b].push(k*2+1);});
  const nodeHash=new Map();for(let i=0;i<NN;i++){const k=tk(Math.floor(NX[i]/200),Math.floor(NZ[i]/200));let l=nodeHash.get(k);if(!l)nodeHash.set(k,l=[]);l.push(i);}
  function nearestNode(x,z){let best=-1,bd=1e18;for(let r=0;r<6&&best<0;r++){for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++){const l=nodeHash.get(tk(Math.floor(x/200)+a,Math.floor(z/200)+b));if(l)for(const i of l){const d=Math.hypot(NX[i]-x,NZ[i]-z);if(d<bd){bd=d;best=i;}}}}return best;}
  function epts(k){const e=E[k>>1],R=NW.roads[e.ri],P=[];for(let i=e.i0;i<=e.i1;i++)P.push([R.X[i],R.Z[i]]);if(k&1)P.reverse();return P;}
  function dijkstra(src,dst){const dist=new Float64Array(NN).fill(1e18),prev=new Int32Array(NN).fill(-1),heap=[];
    const push=(d,n)=>{heap.push([d,n]);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
    const pop=()=>{const t=heap[0],l=heap.pop();if(heap.length){heap[0]=l;let i=0;for(;;){const a=i*2+1,b=a+1;let m=i;if(a<heap.length&&heap[a][0]<heap[m][0])m=a;if(b<heap.length&&heap[b][0]<heap[m][0])m=b;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return t;};
    src.forEach(([n,c,k])=>{if(c<dist[n]){dist[n]=c;prev[n]=-2-k;push(c,n);}});
    while(heap.length){const [d,u]=pop();if(d>dist[u])continue;if(u===dst)break;for(const k of OUT[u]){const e=E[k>>1],v=k&1?e.a:e.b,cl=NW.roads[e.ri].c,pen=cl===8?2.2:cl===7?1.25:1;const nd=d+e.len*pen;if(nd<dist[v]){dist[v]=nd;prev[v]=k;push(nd,v);}}}
    if(dist[dst]>=1e18)return null;const ks=[];let v=dst;while(prev[v]>=0){const k=prev[v];ks.unshift(k);const e=E[k>>1];v=k&1?e.b:e.a;}return {ks,first:-2-prev[v],start:v};}
  function buildRoute(dst){const m=/^nwp_(\d+)$/.exec(dst||'');if(!m)return null;const P0=NW.places[+m[1]];if(!P0)return null;const dn=nearestNode(P0.x,P0.z);if(dn<0)return null;
    // partenza: il segmento di strada su cui si trova l'auto
    const hx=Math.cos(pl.h),hz=-Math.sin(pl.h);let best=null;for(const q of NW.near(pl.x,pl.z,25)){if(q.R.c>8)continue;if(!best||q.d<best.d)best=q;}
    const src=[];if(best){const R=best.R,ri=NW.roads.indexOf(R);E.forEach((e,k)=>{if(e.ri!==ri||e.i0>best.i||e.i1<=best.i)return;const sAt=R.cum[best.i]+(R.cum[best.i+1]-R.cum[best.i])*best.t,dx=R.X[best.i+1]-R.X[best.i],dz=R.Z[best.i+1]-R.Z[best.i],fwd=dx*hx+dz*hz>=0;
        src.push([e.b,R.cum[e.i1]-sAt+(fwd?0:180),k*2]);if(!e.o)src.push([e.a,sAt-R.cum[e.i0]+(fwd?180:0),k*2+1]);});}
    if(!src.length){const n=nearestNode(pl.x,pl.z);if(n<0)return null;src.push([n,Math.hypot(NX[n]-pl.x,NZ[n]-pl.z),-1]);}
    const res=dijkstra(src,dn);if(!res)return null;
    const pts=[[pl.x,pl.z]];if(res.first>=0){const fp=epts(res.first);// tratto residuo del segmento iniziale
      let bi=0,bd=1e18;fp.forEach((p,i)=>{const d=Math.hypot(p[0]-pl.x,p[1]-pl.z);if(d<bd){bd=d;bi=i;}});for(let i=bi+1;i<fp.length;i++)pts.push(fp[i]);}else pts.push([NX[res.start],NZ[res.start]]);
    const man=[];let prevK=res.first;
    res.ks.forEach((k,i)=>{const startIdx=pts.length-1,ep=epts(k);ep.forEach((p,j)=>{if(j>0)pts.push(p);});
      const e=E[k>>1],R=NW.roads[e.ri];if(prevK<0){prevK=k;return;}const pe=epts(prevK),R0=NW.roads[E[prevK>>1].ri];
      const a=pe[pe.length-2],b=pe[pe.length-1],c=ep[1],d1=[b[0]-a[0],b[1]-a[1]],d2=[c[0]-b[0],c[1]-b[1]],ang=Math.atan2(d1[0]*d2[1]-d1[1]*d2[0],d1[0]*d2[0]+d1[1]*d2[1]);
      const node=k&1?e.b:e.a,choices=OUT[node].length,named=(R.n||R.ref)!==(R0.n||R0.ref);
      let kind=null;if(R0.c===0&&R.c===1)kind='exit';else if(R0.c===1&&R.c===0)kind='enter';else if(R0.c===2&&R.c===3)kind='exit';
      if(kind||(choices>1&&(Math.abs(ang)>0.42||(named&&Math.abs(ang)>0.2)))){man.push({idx:startIdx,ang,nw:true,kind,name:R.n,ref:R.ref,c:R.c});}
      prevK=k;});
    const P=makePath(pts,false);man.forEach(m=>{m.s=P.cum[Math.min(m.idx,P.cum.length-1)];});
    // via le indicazioni inutili: proseguimenti dritti, inversioni dovute agli spartitraffico, svolte ravvicinate
    let M2=man.filter(m=>m.kind||(Math.abs(m.ang)>0.42&&Math.abs(m.ang)<2.6));const M3=[];M2.forEach(m=>{const l=M3[M3.length-1];if(l&&m.s-l.s<30){if(Math.abs(m.ang)>Math.abs(l.ang)||m.kind)M3[M3.length-1]=m;}else M3.push(m);});
    return {P,man:M3,dst,said:{},dest:{x:NX[dn],z:NZ[dn],id:dst}};}
  function manText(m){const a=m.ang*57.3,on=m.ref&&m.c<=3?' sulla '+m.ref:m.name?(' in '+m.name):'';
    if(m.kind==='exit')return "prendi l'uscita"+(m.name?' per '+m.name:'');if(m.kind==='enter')return 'immettiti'+(m.ref?' sulla '+m.ref:" in autostrada");
    if(Math.abs(a)<25)return 'prosegui'+on;if(Math.abs(a)>150)return 'fai inversione';return (Math.abs(a)<50?(a>0?'tieni la destra':'tieni la sinistra'):a>0?'svolta a destra':'svolta a sinistra')+on;}
  // strade nella minimappa e nello schermo del navigatore
  function drawRoads(g,tp,range,scale){

    if(HIDE&&!NW.cityAt(pl.x,pl.z))return;const ci=Math.floor(pl.x/TS),cj=Math.floor(pl.z/TS),r=Math.ceil(range/TS);const LW=[7,4,6,4,5,4.5,4,3,2.2,1.6];
    for(let pass=0;pass<2;pass++){g.strokeStyle=pass?'#8b9790':'#5d6b62';for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++){const l=segT.get(tk(ci+a,cj+b));if(!l)continue;
      for(let q=0;q<l.length;q+=2){const R=NW.roads[l[q]],i=l[q+1];if(R.c>=9)continue;if((R.c<=3)!==(pass===1))continue;g.lineWidth=LW[R.c]*scale;g.beginPath();g.moveTo(...tp(R.X[i],R.Z[i]));g.lineTo(...tp(R.X[i+1],R.Z[i+1]));g.stroke();}}}}
  // vie percorribili di una città (per scegliere da dove partire)
  const cityR=c=>{const p=NW.places.find(p=>p.n===c.n&&p.t===0);return Math.max(c.r1,(p?p.R:0)+400);};
  function streets(name){const c=NW.cities.find(c=>c.n===name);if(!c)return[];const S=new Set(),RR=cityR(c);NW.roads.forEach(R=>{if(R.c>8||!R.n||R.t)return;const m=Math.floor(R.N/2);if(Math.hypot(R.X[m]-c.wx,R.Z[m]-c.wz)<RR)S.add(R.n);});return [...S].sort((a,b)=>a.localeCompare(b,'it'));}
  // nelle città 3D il mondo è in scala reale ovunque: un punto della mappa compressa va riportato alla distanza vera dal centro
  function toReal(x,z,c){const dx=x-c.wx,dz=z-c.wz,r=Math.hypot(dx,dz);if(r<=c.r1||r<1e-6)return[x,z];const T=NW.M.rho,st=NW.M.rstep;let d;
    if(r>=T[T.length-1])d=(T.length-1)*st+(r-T[T.length-1])*NW.M.S;else{let k=0;while(k<T.length-2&&T[k+1]<r)k++;d=(k+(r-T[k])/Math.max(1e-6,T[k+1]-T[k]))*st;}
    return[c.wx+dx/r*d,c.wz+dz/r*d];}
  function spawnVia(name,via){const c=NW.cities.find(c=>c.n===name);if(!c||!via)return false;const v=via.trim().toLowerCase();let best=null;

    const RR=cityR(c);NW.roads.forEach(R=>{if(R.c>8||R.t||!R.n||R.n.toLowerCase()!==v)return;for(let i=0;i<R.N-1;i++){const mx=(R.X[i]+R.X[i+1])/2,mz=(R.Z[i]+R.Z[i+1])/2,d=Math.hypot(mx-c.wx,mz-c.wz),L=R.cum[i+1]-R.cum[i];if(d>RR||L<8)continue;const sc=d-Math.min(L,40);if(!best||sc<best.sc)best={sc,R,i};}});
    if(!best)return false;const R=best.R,i=best.i;let a=[R.X[i],R.Z[i]],b=[R.X[i+1],R.Z[i+1]];if(HIDE){a=toReal(a[0],a[1],c);b=toReal(b[0],b[1],c);}
    const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1,off=R.o?0:R.w/4;pl.x=a[0]+dx*0.3-dz/l*off;pl.z=a[1]+dz*0.3+dx/l*off;pl.h=Math.atan2(-dz,dx);return true;}
  // punto di partenza controllato: se è in pendenza, dentro una galleria o sopra un'altra strada, si cerca il tratto piano più vicino
  function flatAt(x,z,h){const fx=Math.cos(h),fz=-Math.sin(h),rx=Math.sin(h),rz=Math.cos(h);NW.yh=NaN;const Hh=(a,b)=>NW.H(x+fx*a+rx*b,z+fz*a+rz*b),c=Hh(0,0);
    return Math.abs(Hh(0,0.9)-Hh(0,-0.9))<0.25&&Math.abs(Hh(1.6,0)-Hh(-1.6,0))<0.45&&NW.Hg(x,z)-c<1.5;}
  function fixStart(){if(flatAt(pl.x,pl.z,pl.h))return;const L=[];for(const R of NW.roads){if(R.b||R.t||R.c<5)continue;for(let i=0;i<R.N-1;i++){const mx=(R.X[i]+R.X[i+1])/2,mz=(R.Z[i]+R.Z[i+1])/2,d=Math.hypot(mx-pl.x,mz-pl.z);if(d<600&&R.cum[i+1]-R.cum[i]>8)L.push([d,R,i]);}}
    L.sort((a,b)=>a[0]-b[0]);for(const[d,R,i] of L){const ex=R.X[i+1]-R.X[i],ez=R.Z[i+1]-R.Z[i],l=Math.hypot(ex,ez),h=Math.atan2(-ez,ex),x=(R.X[i]+R.X[i+1])/2-ez/l*1.8,z=(R.Z[i]+R.Z[i+1])/2+ex/l*1.8;
      if(flatAt(x,z,h)){pl.x=x;pl.z=z;pl.h=h;return;}}}
  function spawn(name,via){const s=NW.J.starts.find(t=>t[0]===name)||NW.J.starts[0];pl.x=s[1];pl.z=s[2];pl.h=s[3];if(via&&!spawnVia(name,via)){pl.navMsg='Via non trovata: parto dal centro';pl.navMsgT=4;}if(!via)fixStart();NW.yh=NaN;pl.terrH=NW.H(pl.x,pl.z);NW.yh=pl.terrH;update(0,true);}
  function dests(){const L=[];const d=NW.places.map((p,i)=>[p,i]).filter(([p])=>p.t<=1).sort((a,b)=>a[0].n.localeCompare(b[0].n));d.forEach(([p,i])=>L.push(['nwp_'+i,p.n+(p.t===0?'':'')]));return L;}
  // ---------- traffico e pedoni di Valdonia: fitti in città, medi fuori, radi in montagna ----------
  const TRF=(()=>{const NE=E.length,ECELL=200,eh=new Map();
    E.forEach((e,k)=>{const R=NW.roads[e.ri];if(R.c>7&&R.c!==8)return;const im=(e.i0+e.i1)>>1,key=tk(Math.floor(R.X[im]/ECELL),Math.floor(R.Z[im]/ECELL));let l=eh.get(key);if(!l)eh.set(key,l=[]);l.push(k);});
    const onE=new Map(),list=[],pool=[],pedPool=[],pedPools={},peds2=[];let spT=0,pT=0,made=0;
    const lens=E.map(e=>e.len);
    function roadPos(e,dir,s,off){const R=NW.roads[e.ri],L=e.len,d=dir?L-s:s,cu=R.cum[e.i0]+Math.max(0,Math.min(L,d));let lo=e.i0,hi=e.i1;while(hi-lo>1){const m=(lo+hi)>>1;if(R.cum[m]<=cu)lo=m;else hi=m;}
      const sl=R.cum[lo+1]-R.cum[lo]||1,t=(cu-R.cum[lo])/sl;let dx=R.X[lo+1]-R.X[lo],dz=R.Z[lo+1]-R.Z[lo];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;if(dir){dx=-dx;dz=-dz;}
      const x=R.X[lo]+(R.X[lo+1]-R.X[lo])*t,z=R.Z[lo]+(R.Z[lo+1]-R.Z[lo])*t,h=R.Hh[lo]+(R.Hh[lo+1]-R.Hh[lo])*t;return{x:x-dz*off,z:z+dx*off,h,dx,dz,g:(R.Hh[lo+1]-R.Hh[lo])/sl*(dir?-1:1)};}
    const zone=(x,z)=>{if(NW.cityAt(x,z))return 0;return NW.Hg(x,z)>600?2:1;};
    function v0of(R,x,z,urb){if(R.c===0)return 31;if(R.c===1)return 15;if(urb)return R.c<=5?13.5:11.5;if(R.c===8)return 8;return R.c<=5?23:NW.Hg(x,z)>600?14:18;}
    function key(k){return k;}
    function makeOne(){let c=pool.pop();if(!c){const k=randTrafType(),T=TYPES[k];c={T,m:(PHYS[k]&&PHYS0[k]?PHYS0[k].m:T.truck?3800:T.bus?11000:1250),mesh:makeCar(k,randColor()),honkCd:0,flashT:0,hold:0,a:0,horn:{f:300+Math.random()*340,ratio:1.26,wave:'square',cut:1500+Math.random()*2000,single:Math.random()<0.25,det:0}};scene.add(c.mesh);made++;}c.mesh.visible=true;return c;}
    function place(c,k,s){c.k=k;c.s=s;let l=onE.get(k);if(!l)onE.set(k,l=[]);l.push(c);}
    function unplace(c){const l=onE.get(c.k);if(l){const i=l.indexOf(c);if(i>=0)l.splice(i,1);}}
    function despawn(c){unplace(c);c.kn=null;c.bs=null;c.bo=0;c.turnSide=null;c.turnT=0;c.lcT=0;c.distract=null;c.dbl=null;c.stuckT=0;c.rt=0;c.brk=0;if(c.mesh.userData.indL)hazards(c.mesh.userData,false);c.mesh.visible=false;const i=list.indexOf(c);if(i>=0)list.splice(i,1);const j=cars.indexOf(c);if(j>=0)cars.splice(j,1);pool.push(c);}
    function turnR(e,dir,en,ndir){const a=roadPos(e,dir,e.len,0),b=roadPos(en,ndir,0,0),cs=a.dx*b.dx+a.dz*b.dz;if(cs>0.985)return 0;const r=Math.min(cs<-0.5?5:9,e.len*0.42,en.len*0.42);return r<1.5?0:r;}
    function arcPos(A,B,u){u=u<0?0:u>1?1:u;const k=Math.hypot(B.x-A.x,B.z-A.z)*1.05,u2=u*u,u3=u2*u,h00=2*u3-3*u2+1,h10=u3-2*u2+u,h01=-2*u3+3*u2,h11=u3-u2,d00=6*u2-6*u,d10=3*u2-4*u+1,d01=-d00,d11=3*u2-2*u;
      const x=h00*A.x+h10*A.dx*k+h01*B.x+h11*B.dx*k,z=h00*A.z+h10*A.dz*k+h01*B.z+h11*B.dz*k;let dx=d00*A.x+d10*A.dx*k+d01*B.x+d11*B.dx*k,dz=d00*A.z+d10*A.dz*k+d01*B.z+d11*B.dz*k;const l=Math.hypot(dx,dz)||1;
      return{x,z,h:A.h+(B.h-A.h)*u,dx:dx/l,dz:dz/l};}
    function nextEdge(c){const e=E[c.k>>1],node=c.k&1?e.a:e.b,opts=OUT[node].filter(k=>(k>>1)!==(c.k>>1)&&NW.roads[E[k>>1].ri].c<=8&&!NW.roads[E[k>>1].ri].priv);if(!opts.length)return c.k^1;
      // si preferisce restare su strade dello stesso tipo
      const R0=NW.roads[e.ri],w=opts.map(k=>{const R=NW.roads[E[k>>1].ri];return (R.c===R0.c?3:1)*(R.c===0&&R0.c!==0&&R0.c!==1?0.2:1)*(R.c===1&&R0.c===0?0.25:1);});let t=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<opts.length;i++){t-=w[i];if(t<=0)return opts[i];}return opts[0];}
    function laneOff(R,c){if(R.o)return R.w>=9?(c.lane?1.75:-1.75):0;return Math.min(R.w/4,2.1);}
    function spawnNear(fill){const cx=pl.x,cz=pl.z,ci=Math.floor(cx/ECELL),cj=Math.floor(cz/ECELL),cand=[];
      for(let a=-3;a<=3;a++)for(let b=-3;b<=3;b++){if(Math.abs(a)+Math.abs(b)<1)continue;const l=eh.get(tk(ci+a,cj+b));if(l)for(const k of l)cand.push(k);}
      if(!cand.length)return;for(let tries=0;tries<6;tries++){const ek=cand[(Math.random()*cand.length)|0],e=E[ek],R=NW.roads[e.ri],dir=R.o?0:(Math.random()<0.5?0:1),k=ek*2+dir,s=Math.random()*e.len;if(R.priv)continue;
        const p=roadPos(e,dir,s,0),d=Math.hypot(p.x-cx,p.z-cz);if(d<(fill?60:170)||d>520)continue;const z=zone(p.x,p.z),w=[1,0.45,0.18][z]*(R.c===0?1.6:R.c===8?0.3:1);if(Math.random()>w)continue;
        const l=onE.get(k);if(l&&l.some(o=>Math.abs(o.s-s)<14))continue;const c=makeOne();c.lane=R.o&&R.w>=9&&Math.random()<0.6?1:0;c.v=v0of(R,p.x,p.z,z===0)*0.8;c.wait=0;c.nk=null;c.pk=null;c.lofs=null;place(c,k,s);const q=roadPos(e,dir,s,laneOff(R,c));c.dx=q.dx;c.dz=q.dz;c.mesh.position.set(q.x,q.h+0.02,q.z);c.mesh.rotation.y=Math.atan2(-q.dz,q.dx);list.push(c);cars.push(c);return;}}
    function target(){const k=CFG.traf??1,z=zone(pl.x,pl.z);const q=NW.roadAt(pl.x,pl.z,4);if(q&&q.R.c<=1)return Math.round((MOBILE?16:26)*k);return Math.round([MOBILE?26:44,MOBILE?12:18,MOBILE?5:8][z]*k);}
    const lock=new Map();
    // ---- semafori: due fasi (assi della griglia), 37 s di ciclo ----
    const TLS=(NW.J.lms||[]).filter(e=>e[0]==='tl').map(e=>({x:e[1],z:e[2],ax:Math.cos(e[3]),az:Math.sin(e[3]),off:hsh(e[1]|0,e[2]|0)*37,heads:[[],[]],st:['',''],in:false}));
    const nodeTL=new Map();TLS.forEach(T=>{const n=nearestNode(T.x,T.z);if(n>=0&&Math.hypot(NX[n]-T.x,NZ[n]-T.z)<1.5)nodeTL.set(n,T);});
    function tlState(T,g){const t=(simT+T.off)%37;if(g===0)return t<14?'G':t<17?'Y':'R';return t<18.5?'R':t<32.5?'G':t<35.5?'Y':'R';}
    const tlGroup=(T,dx,dz)=>Math.abs(dx*T.ax+dz*T.az)>0.707?0:1;
    const LON={R:new THREE.MeshBasicMaterial({color:0xff2a1a}),Y:new THREE.MeshBasicMaterial({color:0xffb000}),G:new THREE.MeshBasicMaterial({color:0x22ff66})},LOFF=new THREE.MeshStandardMaterial({color:0x222222,roughness:0.5});
    const poleM=new THREE.MeshStandardMaterial({color:0x3a3d40,metalness:0.5,roughness:0.5}),boxG=new THREE.BoxGeometry(0.3,1.0,0.34),lampG=new THREE.CircleGeometry(0.11,12),poleG2=new THREE.CylinderGeometry(0.07,0.08,3.3,8).translate(0,1.65,0);
    const TLsegT={segs:[]};TLS.forEach(T=>{[[T.ax,T.az,0],[-T.ax,-T.az,0],[-T.az,T.ax,1],[T.az,-T.ax,1]].forEach(([dx,dz,g])=>{const x=T.x-dx*9.5-dz*6.8,z=T.z-dz*9.5+dx*6.8,h=NW.Hground(x,z),G=new THREE.Group();G.position.set(x,h,z);G.rotation.y=Math.atan2(dz,-dx);
        const p=new THREE.Mesh(poleG2,poleM);G.add(p);const b=new THREE.Mesh(boxG,poleM);b.position.set(0,3.1,0);G.add(b);const L=['R','Y','G'].map((c,i)=>{const m=new THREE.Mesh(lampG,LOFF);m.position.set(0.18,3.42-i*0.32,0);m.rotation.y=Math.PI/2;G.add(m);return m;});
        scene.add(G);T.heads[g].push(L);addSeg(TLsegT,x-0.12,z,x+0.12,z);});});
    function tlUpdate(){const cx=camera.position.x,cz=camera.position.z;TLS.forEach(T=>{if(Math.abs(T.x-cx)+Math.abs(T.z-cz)>700)return;[0,1].forEach(g=>{const s=tlState(T,g);if(s===T.st[g])return;T.st[g]=s;T.heads[g].forEach(L=>{L[0].material=s==='R'?LON.R:LOFF;L[1].material=s==='Y'?LON.Y:LOFF;L[2].material=s==='G'?LON.G:LOFF;});});});
      // passaggio col rosso del giocatore
      TLS.forEach(T=>{if(Math.abs(T.x-pl.x)+Math.abs(T.z-pl.z)>40)return;const d=Math.hypot(T.x-pl.x,T.z-pl.z),inside=d<7;if(inside&&!T.in&&Math.abs(pl.vx)>2){const fx=Math.cos(pl.h),fz=-Math.sin(pl.h),s=tlState(T,tlGroup(T,fx,fz));if(s==='R'){pl.infr.rosso++;pl.infrMsg='Passato col rosso!';pl.infrT=3;ding(2);penalty('rosso');}}T.in=inside;});}
    // ---- strisce pedonali: agli incroci delle vie di città, qualche metro prima del centro dell'incrocio ----
    const DEG=new Uint8Array(NN);E.forEach(e=>{DEG[e.a]++;DEG[e.b]++;});
    const CWE=new Map(),CWR=new Map(),CWL=[];
    E.forEach((e,ek)=>{const R=NW.roads[e.ri];if(R.c<2||R.c>7||R.b||R.t||R.priv||e.len<24)return;
      for(const end of [0,1]){const node=end?e.b:e.a;if(DEG[node]<3)continue;const d=Math.min(e.len*0.3,5.4+R.w*0.12),s=end?e.len-d:d,q=roadPos(e,0,s,0);if(!NW.cityAt(q.x,q.z))continue;
        const w={ek,s,end,R,cum:R.cum[e.i0]+s,x:q.x,z:q.z,h:q.h,dx:q.dx,dz:q.dz,w:R.w,occT:-9,waitT:-9};CWL.push(w);
        if(!CWE.has(ek))CWE.set(ek,[]);CWE.get(ek).push(w);if(!CWR.has(R))CWR.set(R,[]);CWR.get(R).push(w);}});
    const ZB=(()=>{const MAXI=MOBILE?1600:3200,g=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),m=new THREE.MeshStandardMaterial({color:0xe6e6e0,roughness:0.85,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
      const im=new THREE.InstancedMesh(g,m,MAXI);im.count=0;im.receiveShadow=true;im.frustumCulled=false;scene.add(im);const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),V=new THREE.Vector3(),S=new THREE.Vector3(2.6,1,0.5),Y=new THREE.Vector3(0,1,0);let bx=1e9,bz=1e9;
      function upd(){if(Math.abs(pl.x-bx)+Math.abs(pl.z-bz)<150)return;bx=pl.x;bz=pl.z;let n=0;
        for(const w of CWL){if(Math.abs(w.x-bx)+Math.abs(w.z-bz)>560)continue;const nx=-w.dz,nz=w.dx;Q.setFromAxisAngle(Y,Math.atan2(-w.dz,w.dx));const half=w.w/2-0.6;
          for(let l=-half;l<=half+0.01&&n<MAXI;l+=1.0){{const sx=w.x+nx*l,sz=w.z+nz*l;V.set(sx,Math.max(w.h,NW.H(sx,sz))+0.025,sz);}M.compose(V,Q,S);im.setMatrixAt(n++,M);}}
        im.count=n;im.instanceMatrix.needsUpdate=true;}
      return{upd,im};})();
    const cwEnd=(c,dir)=>{const l=CWE.get(c.k>>1);return !!l&&l.some(w=>w.end===(dir?0:1));};
    // ---- persone (autisti degli incidenti): stesso aspetto dei pedoni ----
    const mkP=kind=>{const m=kind==='man'?makePed():makeHuman(kind);m.userData.kind=kind;attachHi(m,kind);scene.add(m);return m;};
    function animP(m,ph,mv,act,angry){const u=m.userData,near=Math.abs(m.position.x-camera.position.x)+Math.abs(m.position.z-camera.position.z)<(MOBILE?40:70);
      if(u.hiP){u.hiP.w.visible=near;u.loP.visible=!near;if(near){PPL.pose(u.hiP,ph,mv,!!angry,simT);if(act==='phone')PPL.phone(u.hiP,simT);else if(act==='talk'&&mv<0.05)PPL.talk(u.hiP,simT+ph);}return;}
      if(u.human)u.anim(ph);}
    const _cd=new THREE.Vector3();
    function camSees(x,z,maxD){const dx=x-camera.position.x,dz=z-camera.position.z,d=Math.hypot(dx,dz);if(d>maxD)return false;camera.getWorldDirection(_cd);return (dx*_cd.x+dz*_cd.z)/(d||1)>0.5;}
    // ---- incidenti fra auto del traffico: tamponamenti, rottami sull'asfalto, fumo dal cofano, a volte un incendio ----
    const WRECKS=[],crashQ=[];let crashT=110+Math.random()*120,dblT=40+Math.random()*50;
    const FIRET=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,42,2,32,34,30);gr.addColorStop(0,'rgba(255,248,200,1)');gr.addColorStop(0.3,'rgba(255,170,50,0.95)');gr.addColorStop(0.65,'rgba(225,70,10,0.55)');gr.addColorStop(1,'rgba(120,20,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
    function tryCrash(force){if(WRECKS.length>=4)return false;const cand=[];
      for(const c of list){if(c.v<(force?4:7)||c.kn||c.dbl||c.distract||!c.mesh.visible)continue;const p=c.mesh.position,d=Math.hypot(p.x-pl.x,p.z-pl.z);if(d<45||d>(force?400:240)||!camSees(p.x,p.z,force?420:260))continue;
        const R=NW.roads[E[c.k>>1].ri];if(R.c<=1)continue;const l=onE.get(c.k)||[];
        for(const o of l){if(o===c)continue;const g=o.s-c.s-(o.T.L+c.T.L)/2;if(g>4&&g<120&&(!R.o||R.w<9||o.lane===c.lane)&&!o.dbl){cand.push({c,o,d});break;}}
        if(c.nk!=null&&!cand.some(q=>q.c===c)){const rem=E[c.k>>1].len-c.s;for(const o of onE.get(c.nk)||[]){const g=rem+o.s-(o.T.L+c.T.L)/2;if(g>4&&g<120&&!o.dbl){cand.push({c,o,d});break;}}}}
      if(!cand.length)return false;cand.sort((a,b)=>a.d-b.d);const b=cand[0];b.c.distract={o:b.o,t:16};return true;}
    function tryDbl(){for(const c of list){if(c.v<3||c.kn||c.distract||c.dbl)continue;const p=c.mesh.position,d=Math.hypot(p.x-pl.x,p.z-pl.z);if(d<45||d>230)continue;
        const e=E[c.k>>1],R=NW.roads[e.ri];if(R.c<4||R.c>7||!NW.cityAt(p.x,p.z))continue;if(e.len-c.s<35||c.s<12)continue;c.dbl={t:10+Math.random()*18,st:0};return true;}return false;}
    function hazards(ud,on){if(ud.indL){ud.indL.emissiveIntensity=on?3:0;ud.indR.emissiveIntensity=on?3:0;}}
    function toWreck(c,v,vl,spin,part,dv){unplace(c);c.distract=null;c.dbl=null;c.kn=null;const i=list.indexOf(c);if(i>=0)list.splice(i,1);const j=cars.indexOf(c);if(j>=0)cars.splice(j,1);
      const M=c.mesh,ry=M.rotation.y,fx=Math.cos(ry),fz=-Math.sin(ry),ud=M.userData,map=new Map(),mats=[];
      // materiali propri (quelli del modello sono condivisi con le altre auto), un po' più scuri: ammaccature, polvere, vetri rotti
      M.traverse(o=>{if(!o.isMesh||!o.material)return;const cl=q=>{if(!map.has(q)){const n=q.clone();map.set(q,n);mats.push(n);if(n.color&&!(n.emissiveIntensity>0.05)&&n!==ud.tailM){n.color.multiplyScalar(0.84);if(n.roughness!=null)n.roughness=Math.min(1,n.roughness+0.15);}}return map.get(q);};
        o.material=Array.isArray(o.material)?o.material.map(cl):cl(o.material);});
      ['tailM','headM','indL','indR','revM','paint'].forEach(k=>{if(ud[k]&&map.has(ud[k]))ud[k]=map.get(ud[k]);});if(ud.headM)ud.headM.emissiveIntensity=part==='front'&&dv>5?0:ud.headM.emissiveIntensity;
      const nx=-fz,nz=fx;const W={c,M,T:c.T,x:M.position.x,z:M.position.z,y:M.position.y,yaw:ry,vx:fx*v+nx*vl,vz:fz*v+nz*vl,r:spin,t:0,rest:0,part,dv,mats,ud,objs:[],ppl:[],phase:'slide',steam:Math.min(1,dv/6),fire:null,fireIn:null};
      M.rotation.z=part==='front'?-0.02:0.015;WRECKS.push(W);return W;}
    function debris(x,y,z,a,W,dv){let pc=0x777777;W.M.traverse(o=>{if(o.isMesh&&o.material&&/body|paint/.test(o.material.name||'')&&o.material.color)pc=o.material.color.getHex();});
      const n=Math.min(26,8+dv*1.8|0);for(let i=0;i<n;i++){const r=Math.random(),col=r<0.4?pc:r<0.75?0x161616:0x9fc3d6,sz=r<0.75?0.08+Math.random()*0.22:0.05+Math.random()*0.08;
        const m=new THREE.Mesh(new THREE.BoxGeometry(sz,0.02+Math.random()*0.04,sz*(0.5+Math.random())),new THREE.MeshStandardMaterial({color:col,roughness:r>=0.75?0.1:0.7,metalness:r>=0.75?0.4:0.1,transparent:r>=0.75,opacity:0.8}));
        const a2=Math.random()*6.28,d=Math.random()*(1.2+dv*0.25),px=x+Math.cos(a2)*d,pz=z+Math.sin(a2)*d;m.position.set(px,NW.H(px,pz)+0.03,pz);m.rotation.set(0,Math.random()*6,0);scene.add(m);W.objs.push(m);}
      if(dv>4){const b=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.2,0.14),new THREE.MeshStandardMaterial({color:0x1b1b1b,roughness:0.6}));const a2=Math.random()*6.28,px=x+Math.cos(a2)*1.5,pz=z+Math.sin(a2)*1.5;b.position.set(px,NW.H(px,pz)+0.08,pz);b.rotation.set(0,Math.random()*6,0.08);scene.add(b);W.objs.push(b);}}
    function crash(a,b){if(!list.includes(a)||!list.includes(b))return;const ma=a.m||1300,mb=b.m||1300,va=Math.max(a.v,b.v+3),vb=b.v,e=0.15,dv=va-vb;
      const va2=(ma*va+mb*vb-mb*e*dv)/(ma+mb),vb2=(ma*va+mb*vb+ma*e*dv)/(ma+mb),k=Math.min(1,dv/8);
      const x=(a.mesh.position.x+b.mesh.position.x)/2,z=(a.mesh.position.z+b.mesh.position.z)/2,y=(a.mesh.position.y+b.mesh.position.y)/2;
      const Wa=toWreck(a,va2,(Math.random()-0.5)*1.2*k,(Math.random()-0.5)*1.6*k,'front',dv),Wb=toWreck(b,vb2,(Math.random()-0.5)*0.8*k,(Math.random()-0.5)*1.0*k,'rear',dv);
      Wa.mate=Wb;Wb.mate=Wa;debris(x,y,z,a,Wa,dv);if(Math.random()<(dv>10?0.55:dv>6?0.28:0.12))Wa.fireIn=5+Math.random()*12;
      {const d=Math.hypot(x-camera.position.x,z-camera.position.z),rt=new THREE.Vector3();camera.getWorldDirection(_cd);rt.set(-_cd.z,0,_cd.x);const pan=Math.max(-0.8,Math.min(0.8,((x-camera.position.x)*rt.x+(z-camera.position.z)*rt.z)/(d||1)));
        crashSound(Math.max(0.6,dv*0.9*Math.max(0.15,1-d/280)),'front',pan);}
      // i passanti vicini si fermano a guardare, qualcuno riprende col telefono
      for(const P of peds2){if(P.down||P.cross)continue;const d=Math.hypot(P.m.position.x-x,P.m.position.z-z);if(d<50){P.look={x,z,t:12+Math.random()*30};P.stopT=0;if(Math.random()<0.45)P.actL='phone';}}
      if(Math.hypot(x-pl.x,z-pl.z)<300&&Math.random()<0.5){pl.navMsg='💥 Incidente qui vicino';pl.navMsgT=3;}}
    function startPush(W){const q=NW.roadAt(W.x,W.z,14);if(!q||q.R.b||q.R.t){W.phase='still';return;}const R=q.R,i=Math.min(q.i,R.N-2);let tx=R.X[i+1]-R.X[i],tz=R.Z[i+1]-R.Z[i];const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;const nx=-tz,nz=tx;
      const lat=(W.x-R.X[i])*nx+(W.z-R.Z[i])*nz,sd=lat>=0?1:-1,tl=sd*(R.w/2+0.35),mv=Math.max(-6,Math.min(6,tl-lat));
      const ry=Math.atan2(-tz,tx),c1=Math.cos(W.yaw-ry),ty=c1>=0?ry:ry+Math.PI;let dy=ty-W.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));
      Object.assign(W,{phase:'push',tx:W.x+nx*mv,tz:W.z+nz*mv,tyaw:W.yaw+dy*0.85});}
    function addPeople(W){const side=Math.random()<0.5?1:-1,fx=Math.cos(W.yaw),fz=-Math.sin(W.yaw),nx=-fz*side,nz=fx*side;
      const kind=['man','man','woman','oldm','woman'][(Math.random()*5)|0],m=mkP(kind),sx=W.x+nx*(W.T.W/2+0.4),sz=W.z+nz*(W.T.W/2+0.4),far=W.fire||W.fireIn!=null;
      m.position.set(sx,NW.H(sx,sz),sz);const off=far?9:2.6,tx=W.x+nx*(W.T.W/2+off)+fx*(W.part==='front'?2.5:-2.5),tz=W.z+nz*(W.T.W/2+off)+fz*(W.part==='front'?2.5:-2.5);
      W.ppl.push({m,tx,tz,ph:Math.random()*6,act:W.part==='front'?'phone':'talk',angry:W.part==='rear'?6+Math.random()*6:0});}
    function ignite(W){const g=new THREE.Group();scene.add(g);W.objs.push(g);const sp=[];for(let i=0;i<8;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:FIRET,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0}));g.add(s);sp.push({s,u:Math.random(),v:(Math.random()-0.5),ph:Math.random()*6});}
      const gl=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:FIRET,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.5}));scene.add(gl);W.objs.push(gl);
      W.fire={g,sp,gl,t:0};W.fireIn=null;hazards(W.ud,false);}
    function wreckStep(dt){const night=NIGHT||WX!=='clear';
      for(let i=WRECKS.length-1;i>=0;i--){const W=WRECKS[i],M=W.M,fx=Math.cos(W.yaw),fz=-Math.sin(W.yaw);W.t+=dt;
        if(W.phase==='slide'){const sp=Math.hypot(W.vx,W.vz);if(sp>0.01){const d=Math.min(sp,6.5*dt);W.vx-=W.vx/sp*d;W.vz-=W.vz/sp*d;}W.r-=Math.sign(W.r)*Math.min(Math.abs(W.r),2.2*dt);W.x+=W.vx*dt;W.z+=W.vz*dt;W.yaw+=W.r*dt;
          if(sp<0.05&&Math.abs(W.r)<0.03){W.rest+=dt;if(W.rest>(W.fireIn!=null?2:5))startPush(W);}}
        else if(W.phase==='push'){const dx=W.tx-W.x,dz=W.tz-W.z,d=Math.hypot(dx,dz),st=Math.min(d,0.8*dt);if(d>0.02){W.x+=dx/d*st;W.z+=dz/d*st;}W.yaw+=(W.tyaw-W.yaw)*Math.min(1,dt*0.5);
          if(d<=0.02){W.phase='still';const hl=W.T.L/2,hw=W.T.W/2,c=Math.cos(W.yaw),s2=-Math.sin(W.yaw),P=[[-hl,-hw],[hl,-hw],[hl,hw],[-hl,hw]].map(([a,b])=>[W.x+a*c-b*s2,W.z+a*s2+b*c]),sg=[];for(let q=0;q<4;q++)sg.push([P[q][0],P[q][1],P[(q+1)%4][0],P[(q+1)%4][1]]);W.dyn=addDyn(sg);}}
        W.y=NW.H(W.x,W.z);M.position.set(W.x,W.y+0.02,W.z);M.rotation.y=W.yaw;
        if(!W.fire)hazards(W.ud,(simT*1.5)%1<0.5);if(W.ud.tailM)W.ud.tailM.emissiveIntensity=night?0.8:0.1;
        // vapore dal radiatore che si spegne piano
        if(W.part==='front'&&!W.fire&&W.steam>0.05&&W.t<150&&Math.random()<dt*W.steam*9*(1-W.t/150)){const L=W.T.L/2-0.5;SMOKE.emit(W.x+fx*L+(Math.random()-0.5)*0.5,W.y+(W.T.hb||0.9)+0.1,W.z+fz*L+(Math.random()-0.5)*0.5,(Math.random()-0.5)*0.3,0.55+Math.random()*0.4,(Math.random()-0.5)*0.3,2.2+Math.random(),0.35,1.6,0.32,0.86);}
        if(W.fireIn!=null&&W.phase==='still'){W.fireIn-=dt;if(W.part==='front'&&Math.random()<dt*6)SMOKE.emit(W.x+fx*(W.T.L/2-0.6),W.y+(W.T.hb||0.9),W.z+fz*(W.T.L/2-0.6),0,0.7,0,2.5,0.4,1.8,0.4,0.35);if(W.fireIn<=0)ignite(W);}
        if(W.fire){const F=W.fire;F.t+=dt;const grow=Math.min(1,F.t/18),spread=Math.min(1,F.t/55),L=W.T.L,H=(W.T.hb||0.9);
          F.sp.forEach((o,k)=>{const u=W.part==='front'?0.5-o.u*(0.25+0.75*spread):o.u-0.5,x=W.x+fx*u*L*0.85+(-fz)*o.v*W.T.W*0.7,z=W.z+fz*u*L*0.85+fx*o.v*W.T.W*0.7,fl=0.75+0.25*Math.sin(simT*11+o.ph)+0.15*Math.sin(simT*23+o.ph*2),sc=(0.5+1.6*grow*(k<3||spread>k/8?1:0.2))*fl;
            o.s.position.set(x,W.y+H*0.7+sc*0.45,z);o.s.scale.set(sc*0.9,sc*1.3,1);o.s.material.opacity=Math.min(1,grow*1.4)*(0.75+0.25*fl);});
          F.gl.position.set(W.x,W.y+0.05,W.z);const gs=(2+3*grow)*(0.9+0.1*Math.sin(simT*9));F.gl.scale.set(gs*1.6,1,gs);F.gl.material.opacity=0.35+0.15*Math.sin(simT*13);
          if(Math.random()<dt*(6+16*grow)){const u=(Math.random()-0.5)*L*(0.3+0.6*spread);SMOKE.emit(W.x+fx*u,W.y+H+0.6,W.z+fz*u,0.25+(Math.random()-0.5)*0.4,1.6+Math.random()*1.2,(Math.random()-0.5)*0.4,4+Math.random()*2.5,0.9,4.2,0.55,0.1+Math.random()*0.08);}
          // la carrozzeria brucia: diventa nera piano piano
          if(F.t<90)W.mats.forEach(m=>{if(m.color&&!(m.emissiveIntensity>0.05))m.color.lerp(_burnt,dt*0.012*(0.4+spread));});
          if(F.t>200){F.sp.forEach(o=>o.s.material.opacity*=0.98);}}
        // gli autisti scendono: uno telefona, l'altro discute; con l'incendio si allontanano
        if(W.t>2.5&&!W.ppl.length&&W.phase!=='slide')addPeople(W);
        for(const Pp of W.ppl){const m=Pp.m,dx=Pp.tx-m.position.x,dz=Pp.tz-m.position.z,d=Math.hypot(dx,dz);let mv=0;
          if(d>0.15){const v=(W.fire?2.2:1.1)*dt;m.position.x+=dx/d*Math.min(d,v);m.position.z+=dz/d*Math.min(d,v);m.rotation.y=Math.atan2(-dz,dx);mv=1;Pp.ph+=dt*6;}
          else{const o=W.mate&&W.mate.ppl[0]&&W.mate.ppl[0]!==Pp?W.mate.ppl[0].m.position:{x:W.x,z:W.z};m.rotation.y=Math.atan2(-(o.z-m.position.z),o.x-m.position.x);if(Pp.angry>0)Pp.angry-=dt;}
          m.position.y=NW.H(m.position.x,m.position.z);animP(m,Pp.ph,mv,mv?null:(Pp.angry>0?null:Pp.act),Pp.angry>0&&!mv);}
        const far=Math.hypot(W.x-pl.x,W.z-pl.z);
        if((W.t>(W.fire?320:220)&&!camSees(W.x,W.z,220))||far>950){scene.remove(M);W.objs.forEach(o=>scene.remove(o));W.ppl.forEach(Pp=>scene.remove(Pp.m));if(W.dyn)remDyn(W.dyn);WRECKS.splice(i,1);}}}
    const _burnt=new THREE.Color(0x141110);
    function step(dt){
      ZB.upd();wreckStep(dt);
      crashT-=dt;if(crashT<=0)crashT=tryCrash()?150+Math.random()*210:12;
      dblT-=dt;if(dblT<=0){dblT=40+Math.random()*60;tryDbl();}
      spT-=dt;if(spT<=0){spT=0.18;const def=target()-list.length;for(let n=0;n<(def>10?8:def>0?1:0);n++)spawnNear(def>10);}
      for(let i=list.length-1;i>=0;i--){const c=list[i],p=c.mesh.position;if(Math.abs(p.x-pl.x)+Math.abs(p.z-pl.z)>780||list.length>target()+12)despawn(c);}
      // abbaglianti: chi è davanti sulla stessa carreggiata a due corsie si sposta a destra
      if(pl.flash){const fx=Math.cos(pl.h),fz=-Math.sin(pl.h);for(const c of list){const p=c.mesh.position,dx=p.x-pl.x,dz=p.z-pl.z,al=dx*fx+dz*fz,lt=Math.abs(-dx*fz+dz*fx);if(al>3&&al<70&&lt<3.5&&(c.dx*fx+c.dz*fz)>0.8){const R=NW.roads[E[c.k>>1].ri];if(R.o&&R.w>=9)c.lane=1;}}}
      const despQ=[];
      for(const c of list){const e=E[c.k>>1],R=NW.roads[e.ri],L=e.len,dir=c.k&1,urb=NW.cityAt(c.mesh.position.x,c.mesh.position.z);
        // carattere dell'autista: chi va un po' più forte, chi tiene più distanza, chi parte in ritardo al verde
        c.honkCd=(c.honkCd||0)-dt;
        if(c.vk==null){c.vk=0.9+Math.random()*0.22;c.react=0.35+Math.random()*Math.random()*2.2;c.hw=0.85+Math.random()*0.45;c.rt=0;c.stuckT=0;}
        let v0=v0of(R,c.mesh.position.x,c.mesh.position.z,urb)*(c.T.truck?0.85:1)*c.vk,red=false,lead=null,gapP=1e9;const D=c.distract;
        if(D&&(!list.includes(D.o)||(D.o.k!==c.k&&D.o.k!==c.nk)||(D.t-=dt)<0))c.distract=null;
        // capofila sullo stesso tratto
        let gap=1e9,vl=0;const l=onE.get(c.k)||[];for(const o of l){if(o===c)continue;const d=o.s-c.s;if(d>0&&d<gap&&(!R.o||R.w<9||o.lane===c.lane)){if(c.distract&&o===c.distract.o){if(d-(o.T.L+c.T.L)/2<0.15)crashQ.push([c,o]);continue;}gap=d-(o.T.L+c.T.L)/2;vl=o.v;lead=o;}}
        if(c.nk==null)c.nk=nextEdge(c);
        const rem=L-c.s;
        if(c.distract&&c.distract.o.k===c.nk&&rem+c.distract.o.s-(c.distract.o.T.L+c.T.L)/2<0.15)crashQ.push([c,c.distract.o]);
        if(gap>rem&&c.stuckT<15){const l2=onE.get(c.nk)||[];for(const o of l2){if(c.distract&&o===c.distract.o)continue;const d=rem+o.s;if(d<gap){gap=d-(o.T.L+c.T.L)/2;vl=o.v;}}}
        // curva all'incrocio
        if(rem<40){const e2=E[c.nk>>1],R2=NW.roads[e2.ri];if(R2!==R){const pa=roadPos(e,dir,Math.max(0,L-6),0),pb=roadPos(e2,c.nk&1,Math.min(6,e2.len),0),cs=pa.dx*pb.dx+pa.dz*pb.dz;if(cs<0.7)v0=Math.min(v0,4+(rem/40)*v0*0.6+(cs+1)*3);}}
        // incrocio occupato: precedenza a chi arriva prima
        const node=dir?e.a:e.b,TL=nodeTL.get(node);if(TL&&rem<32){const st=tlState(TL,tlGroup(TL,c.dx||0,c.dz||0));if(st==='R'||(st==='Y'&&rem>7)){gap=Math.min(gap,rem-(cwEnd(c,dir)?9.2:6));vl=0;red=true;}}
        else if(rem<12&&R.c>1){const lk=lock.get(node);if(lk&&lk.c!==c&&simT-lk.t<4&&list.includes(lk.c)&&(lk.c.stuckT||0)<4&&c.stuckT<10){gap=Math.min(gap,rem-3);vl=0;c.wait+=dt;}else if(c.stuckT<4||!lk||lk.c===c)lock.set(node,{c,t:simT});}
        // l'auto del giocatore davanti
        {const fx=c.dx||1,fz=c.dz||0,dx=pl.x-p0(c).x,dz=pl.z-p0(c).z,al=dx*fx+dz*fz,lt=Math.abs(-dx*fz+dz*fx);if(al>0&&al<45&&lt<2.6){gapP=al-(pl.T.L+c.T.L)/2;gap=Math.min(gap,gapP);vl=Math.max(0,pl.vx);}}
        // strisce pedonali: ci si ferma per chi attraversa (e per chi aspetta, se c'è spazio per frenare)
        {const chk=(k,base)=>{const cl=CWE.get(k>>1);if(!cl)return;for(const w of cl){const cs=(k&1)?E[k>>1].len-w.s:w.s,d=base+cs-c.s-c.T.L/2;if(d<0.5||d>38)continue;const cl2=((k&1)?-1:1)*(c.lofs||0),occ=simT-w.occT<0.3&&cl2>w.occA-3&&cl2<w.occB+3,wt=simT-w.waitT<0.3;if(occ||(wt&&d>c.v*c.v/7+3)){gap=Math.min(gap,d-1.6);vl=0;}}};
          chk(c.k,0);if(rem<38&&c.nk!=null)chk(c.nk,rem);}
        // incidenti a bordo strada: si rallenta per guardare, e se un rottame occupa la corsia ci si ferma
        for(const W of WRECKS){const fx=c.dx||1,fz=c.dz||0,dx=W.x-p0(c).x,dz=W.z-p0(c).z,al=dx*fx+dz*fz,lt=Math.abs(-dx*fz+dz*fx);
          if(al>0&&al<40&&lt<(W.T.W+c.T.W)/2+0.2){gap=Math.min(gap,al-(W.T.L+c.T.L)/2-1.2);vl=0;}if(al>-8&&al<70&&lt<16)v0=Math.min(v0,W.fire?4:6);}
        // doppia fila: frecce d'emergenza, chi è dietro aspetta (e suona)
        if(c.dbl){const B=c.dbl;if(B.st===0){v0=Math.min(v0,c.v);if(c.v<0.25)B.st=1;}else{B.t-=dt;gap=Math.min(gap,0.1);if(B.t<=0){c.dbl=null;hazards(c.mesh.userData,false);}}if(c.dbl)hazards(c.mesh.userData,(simT*1.5)%1<0.5);}
        if(lead&&c.v<0.3&&lead.v<0.3&&gap<7&&c.honkCd<=0&&((lead.dbl&&lead.dbl.st===1&&c.stuckT>4)||(lead.rt>1.5&&lead.rt<lead.react&&!red))&&Math.random()<dt*0.8)aiHonk(c,0.25);
        // autobus: si accosta alla fermata sul proprio lato, apre le porte, poi riparte con la freccia a sinistra
        if(c.T.bus&&!c.kn){const cu=R.cum[e.i0]+(dir?L-c.s:c.s),px=c.mesh.position.x,pz=c.mesh.position.z;
          if(!c.bs){const A=NW.BST&&NW.BST.get(e.ri);if(A)for(const st of A){const d=(dir?cu-st.s:st.s-cu)-c.T.L*0.3;if(d<4||d>60||st===c.lastSt)continue;if((c.dx||1)*(st.z-pz)-(c.dz||0)*(st.x-px)>0){c.bs={st,ph:0,t:7+Math.random()*6,ri:e.ri,dir,to:40};break;}}}
          if(c.bs&&(c.bs.ri!==e.ri||c.bs.dir!==dir||(c.bs.ph===0&&(c.bs.to-=dt)<0))){c.lastSt=c.bs.st;c.bs=null;}
          if(c.bs){const B=c.bs,d=(dir?cu-B.st.s:B.st.s-cu)-c.T.L*0.3;
            if(B.ph===0){if(d<-6){c.bs=null;}else{gap=Math.min(gap,d+2.6);vl=0;v0=Math.min(v0,d<40?6:v0);if(c.v<0.3&&d<4)B.ph=1;}}
            else if(B.ph===1){gap=Math.min(gap,0.1);B.t-=dt;if(B.t<=0){B.ph=2;B.t=2.2;}}
            else{B.t-=dt;if(B.t>0.8)gap=Math.min(gap,0.1);if(B.t<=0){c.lastSt=B.st;c.bs=null;}}}
          const tgt=c.bs&&(c.bs.ph>0||((dir?cu-c.bs.st.s:c.bs.st.s-cu)<35))&&c.bs.ph<2?Math.max(0,R.w/2-(c.lofs||0)-1.45):0;c.bo=(c.bo||0)+(tgt-(c.bo||0))*Math.min(1,dt*0.9);v0*=0.85;}
        // frecce: prima di svoltare all'incrocio e quando si cambia corsia; sorpasso sulle strade con due corsie per senso
        if(c.turnT>0)c.turnT-=dt;if(c.lcT>0)c.lcT-=dt;
        if(c.nk!=null&&rem<45&&c.turnSide==null){const en=E[c.nk>>1],a1=roadPos(e,dir,Math.max(0,L-3),0),b1=roadPos(en,c.nk&1,Math.min(3,en.len),0),cr=a1.dx*b1.dz-a1.dz*b1.dx,dp=a1.dx*b1.dx+a1.dz*b1.dz;c.turnSide=dp<0.88?(cr<0?-1:1):0;}
        if(R.o&&R.w>=9&&lead&&gap<28&&lead.v<v0*0.8&&c.v>3&&!(c.lcT>0)&&!c.dbl&&!c.distract&&rem>30){const tl=c.lane?0:1;let free=true;for(const o of l){if(o!==c&&o.lane===tl&&o.s>c.s-14&&o.s<c.s+26){free=false;break;}}if(free){c.lane=tl;c.lcT=4.5;c.lcSide=tl?1:-1;}}
        {const ud=c.mesh.userData;if(ud.doors&&(c.bs||ud.doorOpen))ud.doors(!!(c.bs&&c.bs.ph===1&&c.bs.t>0.6),dt);}
        {const ud=c.mesh.userData;if(ud.indL&&!c.dbl){const side=c.bs?(c.bs.ph===2?-1:c.bs.ph===1?0:1):c.lcT>2?c.lcSide:c.turnT>0?c.turnSideP:(c.turnSide&&rem<45?c.turnSide:0),on=!!side&&((simT*1.5+(c.k%7)*0.13)%1<0.5);ud.indL.emissiveIntensity=on&&side<0?3:0;ud.indR.emissiveIntensity=on&&side>0?3:0;}}
        // mai fermi per sempre: dopo un po' si ignorano le precedenze bloccate; se nessuno guarda l'auto sparisce, altrimenti passa piano
        if(c.stuckT>45){gap=gapP;vl=0;v0=Math.min(v0,3.5);}
        if(c.distract){const D2=c.distract,gd=(D2.o.k===c.k?D2.o.s-c.s:rem+D2.o.s)-(D2.o.T.L+c.T.L)/2;if(gd<45&&!D2.bk&&D2.o.v>3){D2.bk=1;D2.o.brk=1.3+Math.random()*1.2;}gap=1e9;v0=Math.max(v0,c.v+2,12);}
        if(EVT.acc){const ex=EVT.acc.x-p0(c).x,ez=EVT.acc.z-p0(c).z,ed=Math.abs(ex)+Math.abs(ez);if(ed<320)v0=Math.min(v0,3.5+ed*0.035);}
        if(c.hold>0){c.hold-=dt;}
        const ss=(2.2+c.v*1.3)*c.hw+c.v*(c.v-vl)/(2*Math.sqrt(1.6*2.4)),g=Math.max(0.3,gap);let a=1.6*(1-Math.pow(c.v/Math.max(1,v0),4)-Math.pow(ss/g,2));a=Math.max(-8,Math.min(2.2,a));if(c.hold>0)a=Math.min(a,-3);if(c.brk>0){c.brk-=dt;a=Math.min(a,-6.5);}if(c.distract)a=Math.max(a,0.3);
        if(c.v<0.3&&a>0.3){c.rt+=dt;if(c.rt<c.react)a=0;}else if(c.v>1)c.rt=0;
        if(c.v<0.3&&!red&&!(c.hold>0)&&!c.kn&&!c.dbl&&!(lead&&(lead.dbl||lead.bs))&&!c.bs&&gapP>40)c.stuckT+=dt;else if(c.v>1.5)c.stuckT=0;else if(c.v>=0.3)c.stuckT=Math.max(0,c.stuckT-dt*2);
        if(c.stuckT>25&&!camSees(p0(c).x,p0(c).z,150)&&Math.hypot(p0(c).x-pl.x,p0(c).z-pl.z)>45)despQ.push(c);
        c.v=Math.max(0,c.v+a*dt);if(gap<0.5||!isFinite(c.v))c.v=0;c.a=a;c.s+=c.v*dt;
        if(c.s>=L){unplace(c);const ns=c.s-L,nk=c.nk;c.nk=null;if(lock.get(node)&&lock.get(node).c===c)lock.delete(node);c.pr=turnR(e,dir,E[nk>>1],nk&1);c.pk=c.pr>0?c.k:null;c.plofs=c.lofs;place(c,nk,ns);c.turnSideP=c.turnSide;c.turnT=c.turnSide?1.6:0;c.turnSide=null;
          const R2=NW.roads[E[nk>>1].ri];if(!(R2.o&&R2.w>=9))c.lane=0;else if(!(R.o&&R.w>=9))c.lane=1;}
        const e2=E[c.k>>1],R2=NW.roads[e2.ri],lt=laneOff(R2,c);c.lofs=c.lofs==null?lt:c.lofs+(lt-c.lofs)*Math.min(1,dt*1.3);let q=null;
        // curve raccordate: negli ultimi/primi metri di ogni tratto l'auto segue un arco (curva di Hermite) invece di girare a 90°
        if(c.pk!=null&&c.s<c.pr){const ep=E[c.pk>>1],A=roadPos(ep,c.pk&1,ep.len-c.pr,c.plofs),B=roadPos(e2,c.k&1,c.pr,c.lofs);q=arcPos(A,B,(c.pr+c.s)/(2*c.pr));}
        else{c.pk=null;if(c.nk!=null){const en=E[c.nk>>1],r=turnR(e2,c.k&1,en,c.nk&1),rm=e2.len-c.s;if(r>0&&rm<r){const A=roadPos(e2,c.k&1,e2.len-r,c.lofs),B=roadPos(en,c.nk&1,r,laneOff(NW.roads[en.ri],c));q=arcPos(A,B,(r-rm)/(2*r));}}}
        if(!q)q=roadPos(e2,c.k&1,c.s,(c.bo||0)+c.lofs+(c.dbl?Math.min(0.8,(c.dblO=(c.dblO||0)+dt*0.5)):(c.dblO=Math.max(0,(c.dblO||0)-dt*0.5))));c.dx=q.dx;c.dz=q.dz;c.mesh.position.set(q.x,q.h+0.02,q.z);c.mesh.rotation.y=Math.atan2(-q.dz,q.dx);
        // in salita e in discesa l'auto segue la pendenza (con un po' di inerzia)
        c.pit=(c.pit||0)+(Math.atan(Math.max(-0.3,Math.min(0.3,q.g||0)))-(c.pit||0))*Math.min(1,dt*4);c.mesh.rotation.z=c.pit;knock(c,dt);}
      despQ.forEach(c=>{if(list.includes(c))despawn(c);});while(crashQ.length){const[a,b]=crashQ.pop();crash(a,b);}
      tlUpdate();
      // pedoni sui marciapiedi delle città e dei paesi: uomini, donne, anziani, bambini per mano, cani al guinzaglio
      pT-=dt;const inTown=NW.cityAt(pl.x,pl.z),pTarget=inTown?Math.round((MOBILE?22:40)*Math.min(1.4,CFG.traf??1)):0;
      const getM=kind=>{const L=pedPools[kind]||(pedPools[kind]=[]);let m=L.pop();if(!m){m=kind==='man'?makePed():kind==='dog'?makeDog():makeHuman(kind);m.userData.kind=kind;attachHi(m,kind);scene.add(m);}m.visible=true;m.rotation.set(0,0,0);return m;};
      const putM=m=>{m.visible=false;(pedPools[m.userData.kind]||(pedPools[m.userData.kind]=[])).push(m);};
      if(pT<=0){pT=0.25;for(let pn=0;pn<(pTarget-peds2.length>10?6:1);pn++)if(peds2.length<pTarget){const q=NW.near(pl.x+(Math.random()-0.5)*360,pl.z+(Math.random()-0.5)*360,40);const c2=q.filter(o=>o.R.c>=4&&o.R.c<=7&&!o.R.b&&!o.R.t);
          if(c2.length){const o=c2[(Math.random()*c2.length)|0],R=o.R,x=R.X[o.i],z=R.Z[o.i],d=Math.hypot(x-pl.x,z-pl.z);if(d>60&&d<230&&NW.cityAt(x,z)){
            const r=Math.random(),kind=r<0.3?'man':r<0.6?'woman':r<0.72?'oldw':r<0.82?'oldm':'child',m=getM(kind);
            const P={m,kind,R,c:R.cum[o.i]+(R.cum[o.i+1]-R.cum[o.i])*o.t,side:Math.random()<0.5?-1:1,dir:Math.random()<0.5?-1:1,v:(1.1+Math.random()*0.4)*(m.userData.speed||1),down:false,t:0,ph:Math.random()*6,lat:1.5,kids:[]};
            if(kind==='child'){P.v=1.25;}
            else if(Math.random()<0.22){const k=getM('child'),C={m:k,kind:'child',lead:P,lat:0.85,down:false,t:0,ph:P.ph+1};P.kids.push(C);peds.push(C);P.v=Math.min(P.v,1.15);}
            if(kind!=='child'&&Math.random()<0.18){const dg=getM('dog'),ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0x222222}));scene.add(ln);P.dog={m:dg,ln,ph:0};}
            if(kind!=='child'&&!P.kids.length&&!P.dog){const r2=Math.random();if(r2<0.12){P.act='phone';P.v*=0.8;}else if(r2<0.2&&(kind==='man'||kind==='woman')){P.act='jog';P.v=2.5+Math.random()*0.7;}}
            peds2.push(P);peds.push(P);
            // due conoscenti fermi a chiacchierare sul marciapiede
            if(kind!=='child'&&!P.kids.length&&!P.dog&&!P.act&&Math.random()<0.1){const k2=['man','woman','oldw','oldm'][(Math.random()*4)|0],m2=getM(k2),st=18+Math.random()*40;
              const P2={m:m2,kind:k2,R,c:Math.min(R.cum[R.N-1]-1,P.c+0.95),side:P.side,dir:-P.dir,v:(1.05+Math.random()*0.4)*(m2.userData.speed||1),down:false,t:0,ph:Math.random()*6,lat:P.lat,kids:[]};
              P.stopT=P2.stopT=st;P.act=P2.act='talk';P.pair=P2;P2.pair=P;peds2.push(P2);peds.push(P2);}}}}}
      const sideOf=(R,c,lat,side)=>{let lo=0,hi=R.N-1;while(hi-lo>1){const md=(lo+hi)>>1;if(R.cum[md]<=c)lo=md;else hi=md;}const sl=R.cum[lo+1]-R.cum[lo]||1,t=(c-R.cum[lo])/sl;let dx=R.X[lo+1]-R.X[lo],dz=R.Z[lo+1]-R.Z[lo];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
        const off=side*(R.w/2+lat),x=R.X[lo]+(R.X[lo+1]-R.X[lo])*t-dz*off,z=R.Z[lo]+(R.Z[lo+1]-R.Z[lo])*t+dx*off;return {x,z,dx,dz,y:R.Hh[lo]+(R.Hh[lo+1]-R.Hh[lo])*t+(NW.nearJ(x,z,11)?0.05:NW.SWH)};};
      const animH=(P,m,v,x,z)=>{const near=Math.abs(x-camera.position.x)+Math.abs(z-camera.position.z)<(MOBILE?40:70),u=m.userData;
        if(u.hiP){u.hiP.w.visible=near;u.loP.visible=!near;if(near){PPL.pose(u.hiP,P.ph,v>0.05?(P.act==='jog'?1.35:1):0,!!P.angry,simT);const A=P.actL||P.act;if(A==='phone')PPL.phone(u.hiP,simT);else if(A==='talk'&&v<0.05)PPL.talk(u.hiP,simT+P.ph);u.hand=u.hiP.R.HandR?u.hiP.R.HandR.b:u.loHand;return;}u.hand=u.loHand;}
        if(P.angry&&u.human){u.anim(0);return;}
        if(m.userData.human){m.userData.anim(P.ph);return;}
        if(m.userData.mixer){m.userData.hi.visible=near;m.userData.lo.visible=!near;if(near){m.userData.mixer.update(dt*v/1.25);return;}}
        const sw=Math.sin(P.ph)*0.5;m.userData.legs[0].rotation.z=sw;m.userData.legs[1].rotation.z=-sw;m.userData.arms[0].rotation.z=-sw*0.7;m.userData.arms[1].rotation.z=sw*0.7;};
      const _hp=new THREE.Vector3();
      for(let i=peds2.length-1;i>=0;i--){const P=peds2[i],m=P.m;const R=P.R;
        const q0=sideOf(R,P.c,P.lat,P.side),far=Math.abs(q0.x-pl.x)+Math.abs(q0.z-pl.z)>420||!NW.cityAt(q0.x,q0.z)&&Math.abs(q0.x-pl.x)+Math.abs(q0.z-pl.z)>150;
        if(far){putM(m);P.kids.forEach(C=>{putM(C.m);const j=peds.indexOf(C);if(j>=0)peds.splice(j,1);});if(P.dog){putM(P.dog.m);scene.remove(P.dog.ln);}peds2.splice(i,1);const j=peds.indexOf(P);if(j>=0)peds.splice(j,1);continue;}
        if(P.down){pedDown(P,dt);P.kids.forEach(C=>{if(C.down)pedDown(C,dt);});continue;}
        // soste: chiacchiere, vetrine, curiosi davanti a un incidente
        if(P.look){P.look.t-=dt;if(P.look.t<=0){P.look=null;P.actL=null;}}
        if(P.stopT>0){P.stopT-=dt;if(P.stopT<=0){P.shop=false;if(P.act==='talk')P.act=null;P.pair=null;}}
        else if(!P.cross&&!P.look&&P.act!=='jog'&&!P.kids.length&&Math.random()<dt*0.012){P.stopT=3+Math.random()*7;P.shop=true;}
        const still=P.stopT>0||!!P.look;
        // strisce pedonali: chi ci passa davanti a volte attraversa
        if(!P.cross&&!still){const cl=CWR.get(R);if(cl){const nc=P.c+P.dir*P.v*dt;for(const w of cl){if((P.c-w.cum)*(nc-w.cum)<=0&&P.lastCW!==w){P.lastCW=w;if(Math.random()<0.35){P.cross={w,u:0,wt:0};P.c=w.cum;}break;}}}}
        let q,vEff=P.v;
        if(P.cross){const X=P.cross,w=X.w,Wd=w.w+2*P.lat;let wait=false;
          if(X.u===0){w.waitT=simT;X.wt+=dt;if(X.wt<9){for(const c of list){const p=c.mesh.position,dx=w.x-p.x,dz=w.z-p.z,al=dx*(c.dx||0)+dz*(c.dz||0);if(c.v>2.5&&al>0&&al<10+c.v*1.6&&Math.abs(-dx*(c.dz||0)+dz*(c.dx||0))<w.w/2+1.5){wait=true;break;}}
              {const fx=Math.cos(pl.h),fz=-Math.sin(pl.h),dx=w.x-pl.x,dz=w.z-pl.z,al=dx*fx+dz*fz;if(Math.abs(pl.vx)>2.5&&al>0&&al<12+Math.abs(pl.vx)*1.6&&Math.abs(-dx*fz+dz*fx)<w.w/2+2)wait=true;}}}
          const Lt=P.side*(w.w/2+P.lat)*(1-2*X.u);if(!wait){X.u=Math.min(1,X.u+P.v*1.25*dt/Wd);if(simT-w.occT>0.1){w.occA=w.occB=Lt;}else{w.occA=Math.min(w.occA,Lt);w.occB=Math.max(w.occB,Lt);}w.occT=simT;}q=sideOf(R,w.cum,Lt-w.w/2,1);if(Math.abs(Lt)<w.w/2)q.y=w.h+0.02;
          const mvx=q.dz*P.side,mvz=-q.dx*P.side;m.position.set(q.x,q.y,q.z);m.rotation.y=Math.atan2(-mvz,mvx);vEff=wait?0:P.v;
          if(X.u>=1){P.side=-P.side;P.cross=null;}}
        else{if(!still){P.c+=P.dir*P.v*dt;if(P.c<1||P.c>R.cum[R.N-1]-1){P.dir=-P.dir;P.c=Math.max(1,Math.min(R.cum[R.N-1]-1,P.c));}}else vEff=0;
          q=sideOf(R,P.c,P.lat,P.side);pedDodge(P,q,dt);m.position.set(q.x+(P.ox||0),q.y,q.z+(P.oz||0));
          if(P.look)m.rotation.y=Math.atan2(-(P.look.z-q.z),P.look.x-q.x);
          else if(P.stopT>0&&P.pair)m.rotation.y=Math.atan2(-(P.pair.m.position.z-q.z),P.pair.m.position.x-q.x);
          else if(P.stopT>0&&P.shop){const nx=-q.dz*P.side,nz=q.dx*P.side;m.rotation.y=Math.atan2(-nz,nx);}
          else m.rotation.y=Math.atan2(-q.dz*P.dir,q.dx*P.dir);
          if(P.dodgeT>0)m.rotation.y+=Math.sin(P.dodgeT*8)*0.3;}
        P.ph+=vEff*dt*5.5;animH(P,m,P.angry?0:vEff,q.x,q.z);
        P.kids.forEach(C=>{if(C.down){pedDown(C,dt);return;}const k=P.cross?{x:m.position.x+Math.sin(m.rotation.y)*0.5,y:m.position.y,z:m.position.z+Math.cos(m.rotation.y)*0.5,dx:1,dz:0}:sideOf(R,P.c+P.dir*0.15,C.lat,P.side);if(!P.cross)pedDodge(C,k,dt);C.m.position.set(k.x+(P.cross?0:C.ox||0),k.y,k.z+(P.cross?0:C.oz||0));C.m.rotation.y=m.rotation.y;C.ph+=vEff*dt*7;animH(C,C.m,vEff,k.x,k.z);});
        if(P.dog){const D=P.dog,k=P.cross?{x:m.position.x+Math.cos(m.rotation.y)*1.1,y:m.position.y,z:m.position.z-Math.sin(m.rotation.y)*1.1}:sideOf(R,P.c+P.dir*1.3,P.lat-0.55,P.side);D.m.position.set(k.x,k.y,k.z);D.m.rotation.y=m.rotation.y;D.ph+=vEff*dt*9;D.m.userData.anim(D.ph,simT);
          const pa=D.ln.geometry.attributes.position;if(m.userData.hand){m.userData.hand.getWorldPosition(_hp);}else{_hp.set(q.x,q.y+0.85,q.z);}pa.setXYZ(0,_hp.x,_hp.y,_hp.z);D.m.userData.collar.getWorldPosition(_hp);pa.setXYZ(1,_hp.x,_hp.y,_hp.z);pa.needsUpdate=true;D.ln.geometry.computeBoundingSphere();}}}
    function p0(c){return c.mesh.position;}
    return {step,list,peds:peds2,made:()=>made,spawnNear,crash:tryCrash,dbl:tryDbl,wrecks:WRECKS,cw:CWL,ZB};})();
  return {NEON,nightLv:()=>Math.max(0,nightLv),VX,update,segQ,addDyn,remDyn,tiles,far,build,detail,drop,buildRoute,manText,drawRoads,spawn,dests,nearestNode,streets,TRF,setNight};
})();


// ================= CITTÀ 3D FOTOREALISTICHE (Google Photorealistic 3D Tiles) =================
// Solo fuori da claude.ai (su GitHub Pages). Le città sono in scala 1:1 come nel mondo Nord-Ovest,
// quindi le piante OSM (collisioni, navigatore, minimappa) combaciano con le immagini 3D.

if(NWT&&window.fillVia)window.fillVia();
if(NWT){{const keep=new Set([sky,sun,sun.target,rain,destMark,skMesh,...dust,...clouds]);BASE0.forEach(o=>{if(!keep.has(o)&&!o.isLight)o.visible=false;});clouds.forEach(c=>{c.position.x+=8000;c.position.z+=8000;c.position.y+=950;});}camera.far=12000;camera.updateProjectionMatrix();const sd=document.getElementById('selDest');sd.innerHTML='';NWT.dests().forEach(([id,n])=>{const o=document.createElement('option');o.value=id;o.textContent=n;sd.appendChild(o);});
  if(PREF.dest&&[...sd.options].some(o=>o.value===PREF.dest))sd.value=PREF.dest;else{const c=[...sd.options].find(o=>o.textContent==='Como');if(c)sd.value=c.value;}}
if(NWT)HOME.init();window.__setCar=k=>switchCar(k);window.__hdx=HDX;window.__drv=DRV;window.__home=HOME;window.__loose=LOOSE;window.__cine=CINE;window.__mk={makeHuman,makeDog,makePed};window.__sim={cfg:CFG,PHYS,env:(t)=>{TIME=t;applyEnv();},NW,NWT,CARX,MAPLE,MONU,PROPS,HOUSE,PEDX,COWX,TYPES,peds:()=>peds,camera,animals:()=>animals,herds:()=>herds,buildRoute:(d)=>buildRoute(d),manText:(m)=>manText(m),mPath,TH,THREE,scene,pl,keys,cars,renderer,lanes,surfaceAt,step:(dt)=>{simT+=dt;updateLights(simT);for(let i=0;i<4;i++){readInput(dt/4);stepPhysics(dt/4);}if(!NWT)updateTraffic(dt);}};
requestAnimationFrame(loop);
