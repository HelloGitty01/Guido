// Guido · 11 navigatore menu — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ================= RETE STRADALE, NAVIGATORE, GARA, RIEPILOGO =================
const G2={nodes:{},edges:[]};
function gNode(id,x,z){G2.nodes[id]={id,x,z,out:[]};return G2.nodes[id];}
function gEdge(a,b,pts,both=true){const len=pts.reduce((t,p,i)=>i?t+Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1]):0,0);
  const e={a,b,pts,len};G2.nodes[a].out.push(e);G2.edges.push(e);if(both){const r={a:b,b:a,pts:pts.slice().reverse(),len};G2.nodes[b].out.push(r);G2.edges.push(r);}}
RL.forEach(x=>RL.forEach(z=>gNode('c'+x+'_'+z,x,z)));
RL.forEach(a=>{for(let i=0;i<RL.length-1;i++){gEdge('c'+RL[i]+'_'+a,'c'+RL[i+1]+'_'+a,[[RL[i],a],[RL[i+1],a]]);gEdge('c'+a+'_'+RL[i],'c'+a+'_'+RL[i+1],[[a,RL[i]],[a,RL[i+1]]]);}});
// anello a carreggiate separate: grafo orientato (esterna e interna girano in versi opposti)
function ringCycle(P,pre,keys){const pts={W:[RC.x-RH,0],K:[900,RC.z+RH],D:[RC.x+RH,0],M:[RC.x+RH,200]};
  const ord=keys.map(k=>({k,s:P.proj(...pts[k]).s})).sort((a,b)=>a.s-b.s);ord.forEach(o=>gNode(pre+o.k,...pts[o.k]));
  for(let i=0;i<ord.length;i++){const A=ord[i],B=ord[(i+1)%ord.length];const out=[];let s0=A.s,s1=B.s;if(s1<=s0)s1+=P.len;for(let sv=s0;sv<s1;sv+=10){const q=P.at(sv);out.push([q.x,q.z]);}const qb=P.at(s1);out.push([qb.x,qb.z]);gEdge(pre+A.k,pre+B.k,out,false);}}
ringCycle(ringPathR,'o',['W','K','M']);   // carreggiata esterna: uscite per lago e montagna
ringCycle(ringPath,'i',['W','D']);        // carreggiata interna: uscita per lo sterrato
{const xe=RL[RL.length-1],con=[[xe,0],[L,0],[RC.x-RH,0]];['oW','iW'].forEach(n=>{gEdge('c'+xe+'_0',n,con,false);gEdge(n,'c'+xe+'_0',con.slice().reverse(),false);});}
Object.values(G2.nodes).forEach(n=>{if(isRB(n.x,n.z))n.round=true;});
gNode('mEnd',mPath.endDisc.x,mPath.endDisc.z);gEdge('oM','mEnd',[[RC.x+RH,200],...mPath.pts.filter((p,i)=>i%2===0),[mPath.endDisc.x,mPath.endDisc.z]]);
gNode('lEnd',lPath.endPt.x,lPath.endPt.z);gEdge('oK','lEnd',[[900,RC.z+RH],...lPath.pts.filter((p,i)=>i%2===0)]);
{const dp=[RC.x+dirtR(0),0];gNode('dirt',dp[0],dp[1]);gEdge('iD','dirt',[[RC.x+RH,0],...accessPath.pts]);}
const isRingN=id=>id[0]==='o'||id[0]==='i';
const RLmin=RL[0],RLmax=RL[RL.length-1];const DESTS=[['mEnd','Belvedere in montagna'],['lEnd','Borgo sul lago'],['dirt','Pista sterrata'],['c'+RLmax+'_'+RLmin,'Città: incrocio nord-est'],['c'+RLmin+'_'+RLmax,'Città: incrocio sud-ovest']];if(RB){const id='c'+RB.x+'_'+RB.z,ex=DESTS.find(d=>d[0]===id);if(ex)ex[1]+=' (rotatoria)';else DESTS.push([id,'Città: rotatoria']);}
{const sd=document.getElementById('selDest');DESTS.forEach(([id,n])=>{const o=document.createElement('option');o.value=id;o.textContent=n;sd.appendChild(o);});
 const sm=document.getElementById('selMode');const up=()=>{document.getElementById('lblDest').style.display=['free','deliv','ring'].includes(sm.value)?'none':'';const lb=document.getElementById('lbView');if(lb)lb.innerHTML=lbMenu(sm.value);};sm.onchange=up;up();}

function dijkstra(src,dst,ban){const dist={},prev={},Q=new Set(Object.keys(G2.nodes));Object.keys(G2.nodes).forEach(k=>dist[k]=1e18);dist[src]=0;
  while(Q.size){let u=null,b=1e19;Q.forEach(k=>{if(dist[k]<b){b=dist[k];u=k;}});if(u===null||u===dst)break;Q.delete(u);
    G2.nodes[u].out.forEach(e=>{if(ban&&u===src&&ban(e))return;const d=dist[u]+e.len;if(d<dist[e.b]){dist[e.b]=d;prev[e.b]=e;}});}
  const es=[];let k=dst;while(k!==src){const e=prev[k];if(!e)return null;es.unshift(e);k=e.a;}return es;}
function nearestNode(x,z,hx,hz){let best=null,bd=1e18;Object.values(G2.nodes).forEach(n=>{const dx=n.x-x,dz=n.z-z,d=Math.hypot(dx,dz);const ahead=(dx*hx+dz*hz)>-5?0:120;if(d+ahead<bd){bd=d+ahead;best=n;}});return best;}
let route=null;
function buildRoute(dst,loose){if(NWT)return NWT.buildRoute(dst);const hx=Math.cos(pl.h),hz=-Math.sin(pl.h);let best=null;
  Object.values(G2.nodes).forEach(n=>{const dx=n.x-pl.x,dz=n.z-pl.z,d=Math.hypot(dx,dz);if(d>320||n.id===dst)return;if(!loose&&Math.abs(dx*(-hz)+dz*hx)>10)return;const ux0=d>1?dx/d:hx,uz0=d>1?dz/d:hz;const es=dijkstra(n.id,dst,e=>{const p0=e.pts[0],p1=e.pts[1],l=Math.hypot(p1[0]-p0[0],p1[1]-p0[1])||1;return ((p1[0]-p0[0])*ux0+(p1[1]-p0[1])*uz0)/l<-0.5;});if(!es||!es.length)return;
    const behind=(dx*hx+dz*hz)<-3?600:0,e0=es[0].pts,ex=e0[1][0]-e0[0][0],ez=e0[1][1]-e0[0][1],el=Math.hypot(ex,ez)||1,ux=d>1?dx/d:hx,uz=d>1?dz/d:hz,uturn=(ex*ux+ez*uz)/el<-0.5?150:0,c=d+behind+uturn+es.reduce((t,e)=>t+e.len,0);if(!best||c<best.c)best={c,n,es};});
  if(!best&&!loose)return buildRoute(dst,true);if(!best||!best.es.length)return null;const n0=best.n,es=best.es;
  const pts=[[pl.x,pl.z],[n0.x,n0.z]],man=[];es.forEach((e,i)=>{const startIdx=pts.length-1;e.pts.forEach((p,j)=>{if(j>0)pts.push(p);});
    {const pe=i>0?es[i-1].pts:[[pl.x,pl.z],[n0.x,n0.z]],a=pe[pe.length-2],b=pe[pe.length-1],c=e.pts[1];if(Math.hypot(b[0]-a[0],b[1]-a[1])<1)return;const d1=[b[0]-a[0],b[1]-a[1]],d2=[c[0]-b[0],c[1]-b[1]];
      const ang=Math.atan2(d1[0]*d2[1]-d1[1]*d2[0],d1[0]*d2[0]+d1[1]*d2[1]);if(i===0&&Math.abs(ang)<0.45)return;man.push({idx:startIdx,ang,node:e.a,ring:i>0&&isRingN(e.a)&&!isRingN(es[i-1].a),exit:isRingN(e.a)&&!isRingN(e.b)});}});
  const P=makePath(pts,false);man.forEach(m=>{m.s=P.cum[Math.min(m.idx,P.cum.length-1)];});
  return {P,man,dst,said:{},dest:G2.nodes[dst]};}
function manText(m){if(m.nw)return NWT.manText(m);const a=m.ang*57.3;if(G2.nodes[m.node]&&G2.nodes[m.node].round){const k=Math.abs(a)>150?4:Math.abs(a)<25?2:a>0?1:3;return 'alla rotatoria prendi la '+['','prima','seconda','terza','quarta'][k]+' uscita';}if(m.exit)return a>0?"prendi l'uscita a destra":"prendi l'uscita a sinistra";if(m.ring)return a>0?'immettiti a destra sulla tangenziale':'immettiti a sinistra sulla tangenziale';
  if(Math.abs(a)<25)return 'prosegui dritto';if(Math.abs(a)>150)return 'fai inversione';return a>0?'svolta a destra':'svolta a sinistra';}
// voce del navigatore: frasi registrate con una voce neurale (cartella voce/), unite a pezzi; se manca un pezzo si usa la sintesi del sistema
const VOCE=(()=>{const MAN={},LD={};let cur=[],seq=0;const buf=new Map();
  const norm=t=>t.toLowerCase().normalize('NFC').replace(/’/g,"'").replace(/[^a-z0-9àèéìòóù' ]+/g,' ').replace(/\s+/g,' ').trim();
  // due set registrati: voce femminile (voce/) e maschile (voce/m/); le battute di Radio Guido stanno nel primo
  const load=d=>LD[d]||(LD[d]=fetch(d+'voce.json').then(r=>r.json()).then(j=>{MAN[d]=j;}).catch(()=>{MAN[d]={};}));
  const dirOf=dj=>dj||CFG.voce!=='natm'?'voce/':'voce/m/';load('voce/');if(CFG.voce==='natm')load('voce/m/');
  const seg=(t,pre,d)=>{const man=MAN[d];if(!man)return null;const w=norm(t).split(' ').filter(Boolean),out=[];let i=0;
    while(i<w.length){let ok=0;for(let k=Math.min(14,w.length-i);k>0;k--){const f=man[pre+w.slice(i,i+k).join(' ')];if(f){out.push(d+f);i+=k;ok=1;break;}}if(!ok)return null;}return out.length?out:null;};
  const get=f=>{let p=buf.get(f);if(!p){p=fetch(f).then(r=>r.arrayBuffer()).then(a=>new Promise((res,rej)=>AC.decodeAudioData(a,res,rej)));p.catch(()=>buf.delete(f));buf.set(f,p);}return p;};
  // voce del sistema: la migliore voce italiana disponibile (quelle "naturali" di Edge, Google su Chrome, le "Premium" di Apple)
  let sv=null;const pick=()=>{try{const vs=speechSynthesis.getVoices().filter(v=>/^it/i.test(v.lang));const sc=v=>(/natural|neural/i.test(v.name)?50:0)+(/online/i.test(v.name)?20:0)+(/premium|enhanced|siri/i.test(v.name)?30:0)+(/google/i.test(v.name)?15:0)+(/elsa|isabella|diego|federica|alice/i.test(v.name)?5:0);vs.sort((a,b)=>sc(b)-sc(a));sv=vs[0]||null;}catch(e){}};
  try{pick();speechSynthesis.onvoiceschanged=pick;}catch(e){}
  const sys=(t,o)=>{try{const u=new SpeechSynthesisUtterance(t);u.lang='it-IT';if(sv)u.voice=sv;u.rate=o.rate||1.02;if(o.pitch)u.pitch=o.pitch;u.volume=o.vol||1;if(o.duck){RADIO.duck(true);u.onend=u.onerror=()=>RADIO.duck(false);setTimeout(()=>RADIO.duck(false),9000);}if(o.cancel)speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}};
  const stop=()=>{seq++;cur.forEach(s=>{try{s.stop();}catch(e){}});cur=[];try{speechSynthesis.cancel();}catch(e){}};
  function speak(t,o={}){const d=dirOf(o.dj),fs=CFG.voce!=='sys'&&AC?seg(t,o.dj?'dj:':'',d):null;if(o.cancel)stop();
    if(!fs){if(!MAN[d])load(d);sys(t,o);return;}const my=++seq;
    Promise.all(fs.map(get)).then(B=>{if(my!==seq)return;if(AC.state==='suspended')AC.resume();let t0=AC.currentTime+0.02;const g=AC.createGain();g.gain.value=(o.vol||1)*(CFG.voceVol??0.8);g.connect(ACOUT());
      if(o.duck)RADIO.duck(true);B.forEach((b,i)=>{const s=AC.createBufferSource();s.buffer=b;s.connect(g);s.start(t0);cur.push(s);t0+=b.duration+(i<B.length-1?0.04:0);});
      const last=cur[cur.length-1];if(last)last.onended=()=>{if(my===seq){cur=[];if(o.duck)RADIO.duck(false);}};}).catch(()=>{if(my===seq)sys(t,o);});}
  const pre=t=>{const fs=seg(t,'',dirOf());if(fs&&AC)fs.forEach(get);};
  return{speak,stop,pre,load:()=>load(dirOf()),has:t=>!!seg(t,'',dirOf())};})();
function say(t){VOCE.speak(t,{cancel:true,duck:true});pl.navMsg=t;pl.navMsgT=4;}
let navT=0,offRouteT=0;
function updateNav(dt){if(!route)return;navT-=dt;if(navT>0)return;navT=0.2;
  const q=route.P.proj(pl.x,pl.z);route.ps=q.s;route.left=route.P.len-q.s;
  if(q.dist>28){offRouteT+=0.2;if(offRouteT>2.5){offRouteT=0;const r=buildRoute(route.dst);if(r){r.started=true;route=r;say('Ricalcolo del percorso');}return;}}else offRouteT=0;
  const nm=route.man.find(m=>m.s>q.s+3);route.next=nm;
  if(nm){const d=nm.s-q.s,k=route.man.indexOf(nm);
    if(!route.said.pre){route.said.pre=1;VOCE.pre('Ora');for(let n=40;n<=90;n+=10)VOCE.pre('Tra '+n+' metri');route.man.forEach(m=>VOCE.pre('Tra 250 metri, '+manText(m)));VOCE.pre('Tra 300 metri');}
    if(d<320&&d>230&&!route.said[k+'a']){route.said[k+'a']=1;say('Tra '+(Math.round(d/50)*50)+' metri, '+manText(nm));}
    if(d<90&&!route.said[k+'b']){route.said[k+'b']=1;say((d<40?'Ora ':'Tra '+Math.round(d/10)*10+' metri, ')+manText(nm));}}
  else if(route.left<300&&!route.said.fin){route.said.fin=1;say('La destinazione è tra '+Math.round(route.left/10)*10+' metri');}
  if(Math.hypot(pl.x-route.dest.x,pl.z-route.dest.z)<25&&!route.arrived){route.arrived=true;if(chArrive())return;if(NW&&NW.places[+String(route.dest.id||'').slice(4)]&&NW.places[+String(route.dest.id).slice(4)].home){say('Sei a casa: parcheggia in garage');pl.navMsg='🏠 Sei a casa: entra in garage e fermati';pl.navMsgT=5;destMark.visible=false;return;}say('Sei arrivato a destinazione');setTimeout(()=>endRun('arrivo'),1500);}}
function drawNavScreen(ck){const g=ck.scv.getContext('2d'),W=512,H=256;g.fillStyle='#0d1a12';g.fillRect(0,0,W,H);
  const sc=0.55,cx=170,cy=170,h=pl.h,ch=Math.cos(h),sh=Math.sin(h);const tp=(x,z)=>{const dx=x-pl.x,dz=z-pl.z;const f=dx*ch-dz*sh,r=dx*sh+dz*ch;return[cx+r*sc,cy-f*sc];};
  g.lineCap='round';g.strokeStyle='#2e4436';g.lineWidth=7;G2.edges.forEach(e=>{if(NWT)return;g.beginPath();e.pts.forEach((p,i)=>{const[a,b]=tp(p[0],p[1]);i?g.lineTo(a,b):g.moveTo(a,b);});g.stroke();});if(NWT)NWT.drawRoads(g,tp,560,1.0);
  g.strokeStyle='#3b9cff';g.lineWidth=7;g.beginPath();const P=route.P;let first=true;for(let i=0;i<P.pts.length;i++){if(P.cum[i]<route.ps-5)continue;const[a,b]=tp(P.pts[i][0],P.pts[i][1]);first?g.moveTo(...tp(pl.x,pl.z)):g.lineTo(a,b);if(first){g.lineTo(a,b);first=false;}}g.stroke();
  const[dx,dz]=tp(route.dest.x,route.dest.z);g.fillStyle='#e23c3c';g.beginPath();g.arc(dx,dz,8,0,7);g.fill();
  g.fillStyle='#fff';g.beginPath();g.moveTo(cx,cy-12);g.lineTo(cx+8,cy+8);g.lineTo(cx,cy+3);g.lineTo(cx-8,cy+8);g.closePath();g.fill();
  g.fillStyle='rgba(0,0,0,.65)';g.fillRect(330,0,182,256);g.fillStyle='#fff';g.textAlign='left';
  const nm=route.next;if(nm){const d=Math.max(0,nm.s-route.ps),a=nm.ang*57.3;g.save();g.translate(420,70);g.rotate(Math.abs(a)<25?0:(a>0?Math.PI/2:-Math.PI/2)*Math.min(1,Math.abs(a)/90));g.fillStyle='#3b9cff';g.beginPath();g.moveTo(0,-36);g.lineTo(22,-8);g.lineTo(8,-8);g.lineTo(8,30);g.lineTo(-8,30);g.lineTo(-8,-8);g.lineTo(-22,-8);g.closePath();g.fill();g.restore();
    g.fillStyle='#fff';g.font='bold 34px system-ui';g.textAlign='center';g.fillText(d>950?(d/1000).toFixed(1)+' km':Math.round(d/10)*10+' m',420,150);g.font='17px system-ui';wrapText(g,manText(nm),420,178,170);}
  else{g.font='bold 22px system-ui';g.textAlign='center';g.fillText('Destinazione',420,80);g.font='bold 34px system-ui';g.fillText(Math.round(route.left)+' m',420,130);}
  g.font='16px system-ui';g.fillStyle='#9fc2a8';g.textAlign='center';g.fillText('Arrivo: '+(route.left/1000).toFixed(1)+' km',420,236);
  ck.stex.needsUpdate=true;}
function wrapText(g,t,x,y,w){const ws=t.split(' ');let line='',yy=y;ws.forEach(wd=>{const tl=line?line+' '+wd:wd;if(g.measureText(tl).width>w){g.fillText(line,x,yy);line=wd;yy+=20;}else line=tl;});g.fillText(line,x,yy);}
// colonna luminosa sulla destinazione
const destMark=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.5,60,20,1,true),new THREE.MeshBasicMaterial({color:0x3b9cff,transparent:true,opacity:0.28,depthWrite:false,side:THREE.DoubleSide}));destMark.visible=false;scene.add(destMark);

// ---- avversario in gara: segue il percorso con profilo di velocità da curvatura ----
let opp=null;
function makeOpponent(){const P=route.P,N=P.pts.length,vt=new Float32Array(N);
  for(let i=0;i<N;i++){const a=P.pts[Math.max(0,i-1)],b=P.pts[i],c=P.pts[Math.min(N-1,i+1)];const d1=[b[0]-a[0],b[1]-a[1]],d2=[c[0]-b[0],c[1]-b[1]],l=(Math.hypot(...d1)+Math.hypot(...d2))/2||1;
    const ang=Math.abs(Math.atan2(d1[0]*d2[1]-d1[1]*d2[0],d1[0]*d2[0]+d1[1]*d2[1]));const R_=ang>1e-4?l/ang:1e4;vt[i]=Math.min(limitAt(b[0],b[1])/3.6*1.12,Math.sqrt(6.2*R_));}
  for(let i=N-2;i>=0;i--){const ds=P.cum[i+1]-P.cum[i];vt[i]=Math.min(vt[i],Math.sqrt(vt[i+1]**2+2*5.5*ds));}
  const mesh=makeCar('berlina',0x1f4fa8);scene.add(mesh);
  const o={P,vt,s:-12,v:0,mesh,T:TYPES.berlina,dx:1,dz:0,a:0,hold:0,honkCd:0,flashT:0,horn:{f:420,ratio:1.26,wave:'square',cut:2400,single:false,det:0},opp:true,lo:0};
  cars.push(o);return o;}
function updateOpp(dt){const o=opp;if(!o||!route)return;const P=o.P;const i=Math.max(0,Math.min(P.pts.length-1,P.cum.findIndex(c=>c>o.s)));
  let vT=o.s<0?6:o.vt[i]||8;
  // traffico davanti
  cars.forEach(c=>{if(c===o)return;const p=c.mesh.position,dx=p.x-o.mesh.position.x,dz=p.z-o.mesh.position.z,al=dx*o.dx+dz*o.dz,lt=Math.abs(-dx*o.dz+dz*o.dx);if(al>2&&al<28&&lt<2.4)vT=Math.min(vT,Math.max(0,c.v-1+(al-9)*0.4));});
  {const dx=pl.x-o.mesh.position.x,dz=pl.z-o.mesh.position.z,al=dx*o.dx+dz*o.dz,lt=Math.abs(-dx*o.dz+dz*o.dx);if(al>2&&al<22&&lt<2.4)vT=Math.min(vT,Math.max(0,Math.hypot(pl.vx,pl.vy)-1+(al-9)*0.4));}
  // semafori in città
  ints.forEach(I=>{const dx=I.x-o.mesh.position.x,dz=I.z-o.mesh.position.z,al=dx*o.dx+dz*o.dz,lt=Math.abs(-dx*o.dz+dz*o.dx);if(al>9&&al<30&&lt<6){const ax=Math.abs(o.dx)>Math.abs(o.dz)?'X':'Z';if(I.state[ax]!=='G')vT=Math.min(vT,Math.max(0,(al-10.5)*0.5));}});
  if(raceT<0)vT=0;
  const acc=Math.max(-7,Math.min(2.6,(vT-o.v)*1.5));o.a=acc;o.v=Math.max(0,o.v+acc*dt);o.s+=o.v*dt;
  const q=P.at(Math.max(0,o.s)),off=Math.abs(ringSDF(q.x,q.z))<10?2.7:1.8;o.dx=q.dx;o.dz=q.dz;const x=q.x-q.dz*off,z=q.z+q.dx*off;
  o.mesh.position.set(x,x>L?TH(x,z):0,z);o.mesh.rotation.y=Math.atan2(-q.dz,q.dx);o.mesh.userData.tailM.emissiveIntensity=acc<-0.8?2.2:0.12;
  if(!o.finished&&Math.hypot(x-route.dest.x,z-route.dest.z)<25){o.finished=simT;if(!pl.finished)say('L\'avversario è arrivato per primo');}}
let raceT=0;

// ---- riepilogo a fine corsa ----
let MODE='free',runStart=0;
const miniC=document.getElementById('mini'),miniG=miniC.getContext('2d');let miniT=0;
function drawMini(dt){const show=started&&!paused&&view==='chase';miniC.style.display=show?'block':'none';if(!show)return;miniT-=dt;if(miniT>0)return;miniT=0.15;
  const g=miniG,W=200,c=100,sc=0.32,ch=Math.cos(pl.h),sh=Math.sin(pl.h);const tp=(x,z)=>{const dx=x-pl.x,dz=z-pl.z;return[c+(dx*sh+dz*ch)*sc,c-(dx*ch-dz*sh)*sc];};
  g.save();g.clearRect(0,0,W,W);g.beginPath();g.arc(c,c,c,0,7);g.clip();g.fillStyle='rgba(18,28,22,.85)';g.fillRect(0,0,W,W);
  g.lineCap='round';g.strokeStyle='#5d6b62';g.lineWidth=5;G2.edges.forEach(e=>{if(NWT)return;g.beginPath();e.pts.forEach((p,i)=>{const[a,b]=tp(p[0],p[1]);i?g.lineTo(a,b):g.moveTo(a,b);});g.stroke();});if(NWT)NWT.drawRoads(g,tp,380,0.85);
  if(route){g.strokeStyle='#3b9cff';g.lineWidth=5;g.beginPath();route.P.pts.forEach((p,i)=>{const[a,b]=tp(p[0],p[1]);i?g.lineTo(a,b):g.moveTo(a,b);});g.stroke();const[dx,dz]=tp(route.dest.x,route.dest.z);g.fillStyle='#e23c3c';g.beginPath();g.arc(dx,dz,6,0,7);g.fill();}
  EMS.forEach(e=>{const[a,b]=tp(e.mesh.position.x,e.mesh.position.z);g.fillStyle=(simT*4|0)%2?'#2a5cff':'#ff3030';g.beginPath();g.arc(a,b,3.5,0,7);g.fill();});
  if(opp){const[a,b]=tp(opp.mesh.position.x,opp.mesh.position.z);g.fillStyle='#ffb000';g.beginPath();g.arc(a,b,4.5,0,7);g.fill();}
  g.fillStyle='#fff';g.beginPath();g.moveTo(c,c-9);g.lineTo(c+6,c+6);g.lineTo(c,c+2);g.lineTo(c-6,c+6);g.closePath();g.fill();g.restore();}

// ================= RECORD E AUTO FANTASMA =================
const recKey=()=>'sim_rec_'+SEED+'_'+(route?route.dst:'');
let ghost=null,recSamples=[],recT=0;
const ghostM=new THREE.MeshBasicMaterial({color:0x7fd6ff,transparent:true,opacity:0.33,depthWrite:false});
function loadRecord(){try{return JSON.parse(localStorage.getItem(recKey())||'null');}catch(e){return null;}}
function startGhost(){if(ghost){scene.remove(ghost.mesh);ghost=null;}recSamples=[];recT=0;if(!route)return;const rec=loadRecord();if(!rec||!rec.s)return;
  const mesh=makeCar(rec.veh||'berlina',0x7fd6ff,false);CARLOD.list=CARLOD.list.filter(e=>e.g!==mesh);mesh.traverse(o=>{if(o.isMesh)o.material=ghostM;});scene.add(mesh);ghost={rec,mesh};}
function updateGhost(){if(!route||pl.ended)return;const t=simT-runStart;
  if(t>=recT){recSamples.push([Math.round(pl.x*10)/10,Math.round(pl.z*10)/10,Math.round(pl.h*100)/100]);recT+=0.25;}
  if(ghost){const S=ghost.rec.s,f=t/0.25,i=Math.min(S.length-2,Math.floor(f)),k=Math.min(1,f-i);if(i<0)return;const a=S[i],b=S[i+1]||a;
    const x=a[0]+(b[0]-a[0])*k,z=a[1]+(b[1]-a[1])*k;ghost.mesh.position.set(x,x>L?TH(x,z):0,z);ghost.mesh.rotation.y=a[2]+(b[2]-a[2])*k;}}
function saveRecordIfBetter(t){const old=loadRecord();if(old&&old.t<=t)return{best:false,old};try{localStorage.setItem(recKey(),JSON.stringify({t,veh:selKey,s:recSamples}));}catch(e){}return{best:true,old};}
window.endRun=function endRun(reason){if(pl.ended)return;pl.ended=true;paused=true;if(AC)AC.suspend();setHorn(false);
  const t=simT-runStart,km=pl.km,avg=t>0?km/(t/3600):0;
  if(REC.on)recToggle();let esito={arrivo:'Destinazione raggiunta',pedone:'Incidente grave: pedone investito',fine:'Corsa terminata',tempo:'Tempo scaduto',giro:'Giro completato',casa:'Sei tornato a casa: Gatto ti stava aspettando',patente:'Patente ritirata: punti esauriti'}[reason]||reason;
  if(MODE==='race'&&reason==='arrivo')esito=(opp&&opp.finished&&opp.finished<simT-1.4)?'Gara persa: l\'avversario è arrivato prima':'Gara vinta!';
  let recRow=null;if(route&&reason==='arrivo'){const r=saveRecordIfBetter(t);const fm=x=>Math.floor(x/60)+':'+String(Math.floor(x%60)).padStart(2,'0');recRow=r.best?['Record','Nuovo record! '+fm(t)+(r.old?' (prima '+fm(r.old.t)+')':'')]:['Record',fm(r.old.t)+' con '+(PHYS[r.old.veh]?PHYS[r.old.veh].label:'')];}
  const rows=[['Esito',esito],['Mezzo',pl.P.label],['Tempo',Math.floor(t/60)+' min '+String(Math.floor(t%60)).padStart(2,'0')+' s'],['Distanza',km.toFixed(2)+' km'],['Velocità media',avg.toFixed(0)+' km/h'],['Velocità massima',Math.round(pl.vmax*3.6)+' km/h'],
    ['Urti',pl.hits],['Semafori rossi',pl.infr.rosso],['Contromano',pl.infr.contromano],['Superamenti del limite',pl.overN||0],['Ribaltamenti',pl.flips||0],['Pedoni investiti',pl.pedHits||0],['Punti patente',(pl.lic??20)+'/20'],['Multe',(pl.fines||0)+' €']];if(recRow)rows.splice(1,0,recRow);
  {const ex=chSummary(reason,rows);if(ex)rows.find(r=>r[0]==='Esito')[1]=ex;}
  document.getElementById('sumT').textContent={free:'Guida libera',nav:'Da A a B',race:'Gara',deliv:'Consegne a tempo',ring:'Giro dell\'anello'}[MODE];
  document.getElementById('sumTab').innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');document.getElementById('sum').style.display='flex';};
const endRun=window.endRun;
document.getElementById('sumAgain').onclick=()=>{document.getElementById('sum').style.display='none';startRun();};
document.getElementById('sumMenu').onclick=()=>{document.getElementById('sum').style.display='none';showMenu();};

// ================= MENU / CICLO =================
let started=false,paused=true,simT=0;
const menu=document.getElementById('menu');
function showMenu(){paused=true;RADIO.pause(true);if(window.SIGLA)SIGLA.play();menu.style.display='flex';document.getElementById('go').textContent=started?'Riparti con questo mezzo':'Si parte!';if(AC)AC.suspend();setHorn(false);}
function togglePause(){if(!started||pl.ended||menu.style.display==='flex')return;paused=!paused;RADIO.pause(paused);document.getElementById('pauseOv').style.display=paused?'flex':'none';if(AC){paused?AC.suspend():AC.resume();}setHorn(false);}
document.getElementById('pauseBtn').onclick=()=>togglePause();
document.getElementById('carBtn').onclick=e=>{cycleCar(1);e.currentTarget.blur();};
document.getElementById('radioBtn').onclick=e=>{RADIO.next();e.currentTarget.blur();};
document.getElementById('jobBtn').onclick=e=>{e.currentTarget.blur();const ov=document.getElementById('jobOv');if(ov.style.display==='flex')JOB.close();else JOB.open();};
function radioVol(v){CFG.vol=Math.max(0,Math.min(1,v));RADIO.setVol(CFG.vol);try{localStorage.setItem('sim_cfg',JSON.stringify(CFG));}catch(e){}if(window.SIGLA)SIGLA.vol();const h=document.getElementById('radioVolHud'),c=document.getElementById('cfgVol');if(h)h.value=CFG.vol;if(c)c.value=CFG.vol;try{savePrefs();}catch(e){}pl.navMsg='Volume radio '+Math.round(CFG.vol*100)+'%';pl.navMsgT=1.5;}

function savePrefs(){try{localStorage.setItem('sim_cfg',JSON.stringify(CFG));localStorage.setItem('sim_pref',JSON.stringify({mode:selMode.value,dest:selDest.value,time:selTime.value,wx:selWx.value,veh:selKey}));}catch(e){}}
const selMode=document.getElementById('selMode'),selDest=document.getElementById('selDest'),selTime=document.getElementById('selTime'),selWx=document.getElementById('selWx');
tuneUI();document.getElementById('tuneSave').onclick=()=>{try{localStorage.setItem('sim_tune',JSON.stringify(TUNES));document.getElementById('tuneNote').textContent='Assetto salvato ✓';}catch(e){}};
document.getElementById('tuneReset').onclick=()=>{delete TUNES[selKey];applyTune(selKey);tuneUI();try{localStorage.setItem('sim_tune',JSON.stringify(TUNES));}catch(e){}document.getElementById('tuneNote').textContent='Valori originali ripristinati';};
{const a=document.getElementById('selAids');a.value=String(CFG.aids??1);a.onchange=()=>{CFG.aids=+a.value;savePrefs();};}
{const si=document.getElementById('selIntro');si.value=CFG.intro===false?'0':'1';si.onchange=()=>{CFG.intro=si.value==='1';savePrefs();};document.getElementById('homeSkip').onclick=e=>{e.currentTarget.blur();if(HOME.mode==='return')HOME.finish();else HOME.enter(selKey);};}
{const f=document.getElementById('selFuel');f.value=String(CFG.fuel??1);f.onchange=()=>{CFG.fuel=+f.value;savePrefs();};
 const c=document.getElementById('selCyc');c.value=String(CFG.cycSp??1);c.onchange=()=>{CFG.cycSp=+c.value;savePrefs();};
 const c2=document.getElementById('selCycS');c2.value=String(CFG.cycStart??5.5);if(!c2.value)c2.value='5.5';CFG.cycStart=+c2.value;c2.onchange=()=>{CFG.cycStart=+c2.value;savePrefs();};
 document.getElementById('mapBtn').onclick=e=>{e.currentTarget.blur();mapToggle();};document.getElementById('photoBtn').onclick=e=>{e.currentTarget.blur();photoToggle();};document.getElementById('recBtn').onclick=e=>{e.currentTarget.blur();recToggle();};
 document.getElementById('photoShot').onclick=()=>photoShot();document.getElementById('photoExit').onclick=()=>photoToggle();}
{const t=document.getElementById('selTraf');t.value=String(CFG.traf??1);if(!t.value)t.value='1';t.onchange=()=>{CFG.traf=+t.value;savePrefs();};}
{const box=document.getElementById('radioList');const save=l=>{try{localStorage.setItem('sim_radio',JSON.stringify(l));}catch(e){}RADIO.reload();};
  const draw=()=>{const l=RADIO.user();box.innerHTML='';l.forEach((st,k)=>{const r=document.createElement('div');r.className='row';const n=document.createElement('input');n.value=st.n||'';n.placeholder='Nome';n.size=14;
    const u=document.createElement('input');u.value=st.u||'';u.placeholder='https://…';u.size=34;const x=document.createElement('button');x.className='sm';x.textContent='Togli';
    const up=()=>{const L=RADIO.user();L[k]={n:n.value.trim(),u:u.value.trim()};save(L);};n.onchange=up;u.onchange=up;x.onclick=()=>{const L=RADIO.user();L.splice(k,1);save(L);draw();};r.append(n,u,x);box.appendChild(r);});};
  draw();document.getElementById('radioAdd').onclick=()=>{const L=RADIO.user();L.push({n:'Nuova stazione',u:''});save(L);draw();};document.getElementById('radioDef').onclick=()=>{save(RADIO.DEF.slice());draw();};}
{const e=document.getElementById('cfgTouch');e.value=CFG.touchCtl||'volante';e.onchange=()=>{CFG.touchCtl=e.value;savePrefs();mobCtl();if(e.value==='tilt')tiltAsk();};}
{const e=document.getElementById('cfgHd');if(e){e.checked=!!window.HDON;e.onchange=()=>{CFG.hd=e.checked;savePrefs();if(confirm('I modelli dettagliati si applicano ricaricando la pagina. Ricaricare adesso?'))location.reload();};}}
{const e=document.getElementById('cfgQ');e.value=QG.q;e.onchange=()=>{CFG.q=e.value;savePrefs();if(confirm('La qualità grafica si applica ricaricando la pagina. Ricaricare adesso?'))location.reload();};}
{const e=document.getElementById('cfgEng');e.value=CFG.engVol??1;e.oninput=()=>{CFG.engVol=+e.value;};e.onchange=()=>savePrefs();}
{const v=document.getElementById('cfgVol');v.value=CFG.vol??0.6;v.oninput=()=>{CFG.vol=+v.value;RADIO.setVol(CFG.vol);const h=document.getElementById('radioVolHud');if(h)h.value=CFG.vol;};v.onchange=()=>savePrefs();
  document.getElementById('radioNote').textContent=RADIO.web?'Tasto M: Radio Guido, Rai Radio 1-2-3, Radio 105, Virgin Radio, R101':'Tasto M: Radio Guido. Le radio vere funzionano nella versione su GitHub.';}
{const a=document.getElementById('cfgBlur'),b=document.getElementById('cfgShake');if(a){a.checked=CFG.blur??!document.body.classList.contains('mob');a.onchange=()=>{CFG.blur=a.checked;savePrefs();};}if(b){b.checked=CFG.shake!==false;b.onchange=()=>{CFG.shake=b.checked;savePrefs();};}}
{const w=document.getElementById('cfgWg');if(w){w.checked=CFG.wg!==false;w.onchange=()=>{CFG.wg=w.checked?null:false;window.__wgOff=false;savePrefs();try{if(AC)initAudio();}catch(e){}};}}
{const e=document.getElementById('cfgVoce');if(e){e.value=CFG.voce||'nat';e.onchange=()=>{CFG.voce=e.value;savePrefs();VOCE.load();};}const b=document.getElementById('voceTest');if(b)b.onclick=()=>{if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(x){}}VOCE.load().then(()=>VOCE.speak('Tra 300 metri, alla rotatoria prendi la seconda uscita',{cancel:true}));};}
{const el=document.getElementById('cfgMir');el.checked=CFG.mir!==false;el.onchange=()=>{CFG.mir=el.checked;savePrefs();};}
document.getElementById('ctrlBtn').onclick=()=>{document.getElementById('ctrlOv').style.display='flex';ctrlUI();};
document.getElementById('ctrlClose').onclick=()=>{ctrlWait=null;document.getElementById('ctrlOv').style.display='none';};
document.getElementById('ctrlReset').onclick=()=>{CTRL=JSON.parse(JSON.stringify(CTRL_DEF));Object.keys(KEYMAP).forEach(k=>delete KEYMAP[k]);Object.assign(KEYMAP,CTRL.keys);CTRL.keys=KEYMAP;saveCtrl();ctrlUI();};
[['cfgRap','rap'],['cfgPrec','prec'],['cfgRit','rit'],['cfgJdz','jdz',0.08],['cfgJgain','jgain',1]].forEach(([id,k,d])=>{const el=document.getElementById(id);el.value=CFG[k]??d;el.oninput=()=>{CFG[k]=+el.value;savePrefs();};});
if(PREF.mode)selMode.value=PREF.mode;if(PREF.dest&&[...selDest.options].some(o=>o.value===PREF.dest))selDest.value=PREF.dest;if(PREF.time)selTime.value=PREF.time;if(PREF.wx)selWx.value=PREF.wx;selMode.onchange&&selMode.onchange();
document.getElementById('seedLbl').textContent=SEED;{if(NW){const ss=document.getElementById('selStart');ss.innerHTML='';NW.cities.filter(c=>!c.v).forEach(c=>{const o=document.createElement('option');o.textContent=c.n;ss.appendChild(o);});}document.getElementById('seedRow').style.display=WORLD_NW?'none':'';
if(WORLD_NW){document.getElementById('lblStart').style.display='';const ss=document.getElementById('selStart');try{const v=localStorage.getItem('sim_start');if(v)ss.value=v;}catch(e){}ss.onchange=()=>{try{localStorage.setItem('sim_start',ss.value);}catch(e){}fillVia();};
    const sv=document.getElementById('selVia'),vr=document.getElementById('viaRes');document.getElementById('lblVia').style.display='';try{sv.value=localStorage.getItem('sim_via')||'';}catch(e){}
    const norm=t=>t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/['’.]/g,' ').replace(/\s+/g,' ').trim();
    const setVia=v=>{sv.value=v;try{localStorage.setItem('sim_via',v);}catch(e){}};
    const showOk=()=>{vr.innerHTML=sv.value?'<span class="note">✓ Partenza da <b>'+sv.value.replace(/</g,'&lt;')+'</b>, '+ss.value+'</span>':'<span class="note">Partenza dal centro di '+ss.value+'</span>';};
    // ricerca su richiesta: scrivi, premi Cerca (o Invio), scegli tra le vie trovate
    const search=()=>{const q=norm(sv.value);if(!q){setVia('');showOk();return;}const all=NWT?NWT.streets(ss.value):[];
      const words=q.split(' ').filter(w=>w.length>1&&!['via','viale','corso','piazza','piazzale','largo','vicolo','della','delle','dei','del','di'].includes(w));
      const hits=all.filter(n=>{const m=norm(n);return m===q||(words.length?words.every(w=>m.includes(w)):m.includes(q));}).slice(0,12);
      if(!hits.length){vr.innerHTML='<span class="note">Nessuna via trovata a '+ss.value+'. Prova con una parte del nome.</span>';return;}
      if(hits.length===1&&norm(hits[0])===q){setVia(hits[0]);showOk();return;}
      vr.innerHTML='';const lab=document.createElement('span');lab.className='note';lab.textContent='Scegli: ';vr.appendChild(lab);
      hits.forEach(n=>{const b=document.createElement('button');b.className='sm';b.textContent=n;b.onclick=()=>{setVia(n);showOk();};vr.appendChild(b);});};
    document.getElementById('viaBtn').onclick=search;sv.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search();}});
    window.fillVia=()=>{if(sv.value&&NWT&&!NWT.streets(ss.value).includes(sv.value))setVia('');showOk();};}}
function goWorld(n){try{localStorage.setItem('sim_seed',n);}catch(e){}location.hash='#w'+n;location.reload();}
document.getElementById('newWorld').onclick=()=>goWorld(1+Math.floor(_rnd()*99999));
document.getElementById('loadWorld').onclick=()=>{const n=parseInt(document.getElementById('seedIn').value,10);if(n>0)goWorld(n);};
function startRun(){if(window.SIGLA)SIGLA.stop();endBtn.style.display='block';document.getElementById('sideBtns').style.display='flex';document.getElementById('pauseBtn').style.display='block';document.getElementById('carBtn').style.display='block';document.getElementById('radioBtn').style.display='block';savePrefs();document.getElementById('pauseOv').style.display='none';
  MODE=document.getElementById('selMode').value;TIME=document.getElementById('selTime').value;WX=document.getElementById('selWx').value;
  document.getElementById('jobBtn').style.display=MODE==='career'?'block':'none';CAR.on=false;JOB.drop(true);if(POL.c)POL.end(false);POL.trail=[];EVT.list.forEach(e=>EVT.remove(e));EVT.list=[];if(MODE==='career'){CAR.load();CAR.on=true;if(!CAR.s.own[selKey])selKey='utilitaria';}
  peds.forEach(p=>{if(p.down){p.down=false;p.m.rotation.z=0;}});
  if(opp){scene.remove(opp.mesh);cars.splice(cars.indexOf(opp),1);opp=null;}
  HOME.reset();RADIO.pause(false);resetPlayer();if(NWT){const cn=document.getElementById('selStart').value;NWT.spawn(cn,document.getElementById('selVia').value);}lastNight=null;if(TIME==='cycle')CLOCK=+(CFG.cycStart??7);applyEnv();applyView();started=true;paused=false;menu.style.display='none';AC&&AC.resume();
  pl.ended=false;pl.vmax=0;pl.overN=0;pl.lic=20;pl.fines=0;pl.cleanKm=0;pl.spT=0;pl.spArm=true;runStart=simT;route=null;destMark.visible=false;
  if(HOME.wants()){HOME.begin();return;}
  startDrive();}
function startDrive(){runStart=simT;CINE.startIntro();
  if(!FUEL.st.length)fuelInit();pl.fuel=tankOf(pl.P)*(MODE==='free'||MODE==='nav'?0.6:1);pl.fuelFor=selKey;pl.dry=false;FUEL.low=false;ORB.yaw=ORB.pitch=0;ORB.w=0;
  if(MODE==='nav'||MODE==='race'){route=buildRoute(document.getElementById('selDest').value);if(route){destMark.position.set(route.dest.x,TH(route.dest.x,route.dest.z)+30,route.dest.z);destMark.visible=true;
    say(MODE==='race'?'Gara verso '+document.getElementById('selDest').selectedOptions[0].textContent+'. Pronti...':'Percorso calcolato verso '+document.getElementById('selDest').selectedOptions[0].textContent);}}
  if(MODE==='race'&&route){opp=makeOpponent();raceT=-3.5;}else raceT=0;
  if(MODE==='deliv'||MODE==='ring')chStart();
  if(MODE==='career')setTimeout(()=>say('Carriera: hai '+CAR.fmt(CAR.s.money)+'. Premi K, o il tasto Lavori, per vedere le offerte.'),1500);
  startGhost();if(ghost)setTimeout(()=>{pl.navMsg='Auto fantasma: il tuo record';pl.navMsgT=3;},2500);
}
document.getElementById('go').onclick=()=>{if(MOB&&CFG.touchCtl==='tilt'){tiltAsk();TL.z=null;}startRun();
  if(isTouch){[['pauseBtn',12],['carBtn',104],['radioBtn',242]].forEach(([id,x])=>{const b=document.getElementById(id);b.style.left=x+'px';b.style.top='58px';});document.getElementById('tbtn').style.display='flex';const h=document.getElementById('hint');h.style.display='block';setTimeout(()=>h.style.display='none',5000);}};

let last=performance.now(),clusterT=0,physAcc=0,frameN=0,screenT=0;const PH=1/240;
// polvere su sterrato ed erba
const dustTex=canvasTex(64,(g,n)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(190,165,125,0.8)');gr.addColorStop(1,'rgba(190,165,125,0)');g.fillStyle=gr;g.fillRect(0,0,n,n);});
const dust=[];for(let i=0;i<70;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:dustTex,transparent:true,depthWrite:false,opacity:0}));sp.visible=false;scene.add(sp);dust.push({sp,life:0});}
let dustI=0,dustAcc=0;
function updateDust(dt){const v=Math.abs(pl.vx),sf=pl.surfR;
  if((sf==='dirt'||(sf==='grass'&&v>7))&&v>3){dustAcc+=dt*Math.min(40,v*2.2)*(sf==='dirt'?1:0.5);
    while(dustAcc>1){dustAcc-=1;const d=dust[dustI++%dust.length],ch=Math.cos(pl.h),sh=Math.sin(pl.h),side=(Math.random()<0.5?-1:1)*pl.T.W*0.4;
      d.sp.position.set(pl.x-ch*pl.T.L*0.5+sh*side,pl.terrH+0.4,pl.z+sh*pl.T.L*0.5+ch*side);d.life=1;d.max=1.2+Math.random()*1;d.sz=1+Math.random();d.sp.visible=true;}}
  dust.forEach(d=>{if(d.life<=0)return;d.life-=dt/d.max;const k=1-d.life;d.sp.scale.setScalar(d.sz+k*5);d.sp.position.y+=dt*0.6;d.sp.material.opacity=Math.max(0,d.life)*0.45;if(d.life<=0)d.sp.visible=false;});}
let lodT=0;
const SKN=900,skPos=new Float32Array(SKN*4*3),skIdx=[];for(let i=0;i<SKN;i++){const a=i*4;skIdx.push(a,a+1,a+2,a+1,a+3,a+2);}
const skGeo=new THREE.BufferGeometry();skGeo.setAttribute('position',new THREE.BufferAttribute(skPos,3));skGeo.setIndex(skIdx);
const skMesh=new THREE.Mesh(skGeo,new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:0.55,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3}));skMesh.frustumCulled=false;scene.add(skMesh);
let skI=0;const skLast=[null,null,null,null];
function updateSkids(){const T=pl.T;if(!T||pl.flip)return;const ch=Math.cos(pl.h),sh=Math.sin(pl.h),wx=T.L/2-(T.van?0.85:0.75),tw=T.W/2-0.14;
  const wheels=[[wx,-tw],[wx,tw],[-wx,-tw],[-wx,tw]];
  wheels.forEach(([fx,rz],k)=>{const x=pl.x+ch*fx+sh*rz,z=pl.z-sh*fx+ch*rz;
    if(!pl.skid){skLast[k]=null;return;}const L0=skLast[k];if(L0&&Math.hypot(x-L0[0],z-L0[1])<0.35)return;
    if(L0&&Math.hypot(x-L0[0],z-L0[1])<3){const dx=x-L0[0],dz=z-L0[1],l=Math.hypot(dx,dz),nx=-dz/l*0.1,nz=dx/l*0.1,y0=TH(L0[0],L0[1])+0.035,y1=TH(x,z)+0.035,a=skI*12;
      skPos.set([L0[0]+nx,y0,L0[1]+nz,L0[0]-nx,y0,L0[1]-nz,x+nx,y1,z+nz,x-nx,y1,z-nz],a);skI=(skI+1)%SKN;skGeo.attributes.position.needsUpdate=true;}
    skLast[k]=[x,z];});}
