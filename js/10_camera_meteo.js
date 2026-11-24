// Guido · 10 camera meteo — parte del codice del gioco (i file in js/ condividono lo stesso spazio globale e vengono eseguiti in ordine)
// ================= TRAFFICO (con il giocatore come ostacolo) =================
function limitAt(x,z){if(NW&&x>6000&&NW.inside(x,z))return NW.limit(x,z);if(Math.abs(x)<=L+3&&Math.abs(z)<=L+3)return 50;if(x>L&&x<RX0+2&&Math.abs(z)<ROAD_HALF+1)return 70;if(Math.abs(ringSDF(x,z))<10)return 110;{const q=mRoad(x,z);if(q&&q.dist<6)return 50;}{const q2=lRoad(x,z);if(q2&&q2.dist<6)return (lPath.endPt&&Math.hypot(x-lPath.endPt.x,z-lPath.endPt.z)<150)?50:70;}return 90;}
function checkInfractions(){
  if(!pl.P)return;
  const box=ints.find(I=>Math.abs(pl.x-I.x)<ROAD_HALF&&Math.abs(pl.z-I.z)<ROAD_HALF)||null;
  if(box&&box!==pl.inBox&&Math.abs(pl.vx)>1.5){
    const ax=Math.abs(Math.cos(pl.h))>Math.abs(Math.sin(pl.h))?'X':'Z';
    if(box.state[ax]==='R'){pl.infr.rosso++;penalty('rosso');pl.infrMsg='Semaforo rosso!';pl.infrT=2.5;
      cars.forEach(c=>{const p=c.mesh.position;if(Math.hypot(p.x-box.x,p.z-box.z)<40)aiAngry(c,0.7);});}}
  pl.inBox=box;
  let wrong=false;const fx=Math.cos(pl.h),fz=-Math.sin(pl.h);
  lanes.forEach(ln=>{if(wrong||!ln.near(pl.x,pl.z))return;const q=ln.proj(pl.x,pl.z);
    if(Math.abs(q.lat-ln.off)<1.6&&(ln.loop||(q.s>ln.smin&&q.s<ln.smax))){const fdot=fx*q.dx+fz*q.dz;if(fdot<-0.6&&pl.vx>2&&!ints.some(I=>Math.abs(pl.x-I.x)<ROAD_HALF+2&&Math.abs(pl.z-I.z)<ROAD_HALF+2))wrong=true;}});
  if(wrong&&!pl.wrongNow){pl.infr.contromano++;pl.infrMsg='Contromano!';pl.infrT=2.5;penalty('contromano');}
  pl.wrongNow=wrong;
}
function updateTraffic(dt){
  const transfers=[];
  const pw=pl.P?getWorldVel():[0,0],pfx=Math.cos(pl.h||0),pfz=-Math.sin(pl.h||0);
  const cam=camera.position;
  lanes.forEach(ln=>{
    const cs=ln.cars,n=cs.length;if(!n)return;cs.sort((a,b)=>b.s-a.s);
    let pS=null;
    if(pl.P&&ln.near(pl.x,pl.z)){const q=ln.proj(pl.x,pl.z);
      if(Math.abs(q.lat-ln.off)<2.3){const fdot=pfx*q.dx+pfz*q.dz;pS={s:q.s-pl.T.L/2,v:Math.max(0,pw[0]*q.dx+pw[1]*q.dz),wrong:fdot<-0.5&&Math.abs(pl.vx)>1};
        // il giocatore è fermo "per buoni motivi": semaforo non verde davanti, auto ferma davanti, pedone che attraversa
        const pf=q.s+pl.T.L/2,stp=ln.stops.find(o=>o.s-STOP_D-pf>-1);
        pS.legit=(stp&&stp.s-STOP_D-pf<25&&stp.I.state[ln.axis]!=='G')||cs.some(o=>{const d=o.s-o.T.L/2-pf;return d>-0.5&&d<14&&o.v<1;})||peds.some(pd=>pd.edge.cross&&!pd.waitCross&&!pd.down&&Math.hypot(pd.m.position.x-pl.x,pd.m.position.z-pl.z)<16);}}
    cs.forEach((c,i)=>{
      const front=c.s+c.T.L/2;let acc=idm(c,1e4,0);
      let lead=cs[i-1],lgap=1e9;
      if(lead)lgap=(lead.s-lead.T.L/2)-front;else if(ln.loop&&n>1){lead=cs[n-1];lgap=(lead.s+ln.len-lead.T.L/2)-front;}
      if(lead)acc=Math.min(acc,idm(c,lgap,c.v-lead.v));
      let gap=null;
      if(pS){gap=pS.s-front;if(ln.loop){gap=((gap%ln.len)+ln.len)%ln.len;if(gap>ln.len-pl.T.L-2)gap-=ln.len;}}
      if(pS&&gap>-pl.T.L-1&&gap<lgap){const ap=idm(c,Math.max(gap,0.05),c.v-pS.v);acc=Math.min(acc,ap);
        if(gap<45&&gap>-2){
          if(pS.wrong&&gap<40)aiAngry(c,0.9);
          else if(ap<-3.5&&c.v>3)aiAngry(c,0.35);
          else if(pS.v<0.5&&c.v<0.5&&gap<12&&!pS.legit){c.waitT+=dt;if(c.waitT>6){aiHonk(c,0.3);c.waitT=2;}}
        }}
      else if(c.v>0.5)c.waitT=0;
      const st=ln.stops.find(o=>o.s-STOP_D-front>-0.5);
      if(!ln.ring&&st&&st.I.round&&!c.turn){const dI=st.s-c.s;if(dI<28)acc=Math.min(acc,0.8*(7.5-c.v));
        if(dI<16&&dI>9&&st.I.inside.some(o=>o!==c&&o.ln.axis!==ln.axis))acc=Math.min(acc,idm(c,Math.max(0.3,dI-10.5-c.T.L/2),c.v));}
      if(!ln.ring&&st&&!c.turn&&!st.I.round){if(c.planI!==st.I){c.planI=st.I;c.turnPlan=undefined;}const dI=st.s-c.s;
        if(c.turnPlan===undefined&&dI<40&&dI>15){c.turnPlan=null;const rnd=Math.random();if(rnd<0.42&&!c.em){const left=rnd<0.14;const r=left?{x:ln.d.z,z:-ln.d.x}:{x:-ln.d.z,z:ln.d.x},rd=ln.axis==='X'?st.I.x:st.I.z;
          const to=lanes.find(l=>!l.ring&&l.axis!==ln.axis&&l.d.x===r.x&&l.d.z===r.z&&l.road===rd);if(to)c.turnPlan={to,I:st.I,left};}}
        if(c.turnPlan&&dI<40){const dd=Math.max(1,dI-5.75);acc=Math.min(acc,(36-c.v*c.v)/(2*dd));
          // svolta a sinistra: precedenza ai veicoli che arrivano di fronte
          if(c.turnPlan.left&&dI<8){const opp=lanes.find(l=>!l.ring&&l.axis===ln.axis&&l.road===ln.road&&l!==ln);c.waitLeft=false;
            if(opp&&opp.cars.some(o=>{const so=opp.stops.find(z=>z.I===st.I);if(!so)return false;const dd2=so.s-o.s;return dd2>-7&&dd2<38&&o.v>1.5&&!o.turnPlan;}))c.waitLeft=true;
            if(c.waitLeft)acc=Math.min(acc,idm(c,Math.max(0.3,dI-5.75-c.T.L/2+0.5),c.v));}}}
      if(c.turn)acc=Math.min(acc,0.8*(6-c.v));
      if(!ln.ring){for(const pd of peds){if(!pd.edge.cross||pd.down||pd.waitCross||pd.t<=0||pd.t>=1)continue;const q=pedPos(pd),qq=ln.proj(q.x,q.z);
        if(Math.abs(qq.lat-ln.off)<3&&qq.s-front>-0.5&&qq.s-front<40)acc=Math.min(acc,idm(c,Math.max(0.3,qq.s-front-1.5),c.v));}}
      if(st){const ls=st.I.state[ln.axis];const dist=st.s-STOP_D-front;
        if(c.em){if(ls!=='G'&&dist<30&&dist>-8)acc=Math.min(acc,0.9*(7-c.v));}
        else if(ls!=='G'&&(ls==='R'||dist>c.v*c.v/6))acc=Math.min(acc,idm(c,Math.max(dist,0.05),c.v));}
      if(!c.em){const em=cs.find(o=>o.em&&o.s<c.s&&c.s-o.s<55);if(em){c.yieldT=1.5;acc=Math.min(acc,0.8*(3-c.v));}}
      if(c.yieldT>0){c.yieldT-=dt;if(!c.avSide)c.loT=Math.max(c.loT,1.5);}
      // rotta di collisione con il giocatore: sceglie un lato e lo mantiene, poi rientra con calma
      if(pl.P){const pp=lanePos(ln,c.s,ln.off+c.lo),dx=pl.x-pp.x,dz=pl.z-pp.z,along=dx*pp.dx+dz*pp.dz,lat=dx*(-pp.dz)+dz*pp.dx;
        let threat=false;
        if(along>1&&along<40&&Math.abs(lat)<3.4){const pv=pw[0]*pp.dx+pw[1]*pp.dz,clos=c.v-pv;
          if(clos>0.5){const ttc=(along-c.T.L/2-pl.T.L/2)/clos;
            if(ttc<3.8){threat=true;
              if(!c.avSide){c.avSide=lat>0?-1:1;const room=ln.ring?(ln.kind==='slow'?(c.avSide>0?2.6:2.2):(c.avSide>0?0.7:2.2)):1.3;c.avMag=Math.min(room,Math.max(0.8,3.4-Math.abs(lat)));}
              if(ttc<2.4)acc=Math.min(acc,-6.5*(1-ttc/2.4)-1.5);if(ttc<3)aiAngry(c,0.5);}}}
        if(threat)c.avT=1.6;else c.avT=(c.avT||0)-dt;
        if(c.avT>0&&c.avSide)c.loT=c.avSide*c.avMag;else{c.loT=c.yieldT>0?1.5:0;if(Math.abs(c.lo)<0.05)c.avSide=0;}}
      if(c.yieldPl>simT){const stp=st&&!st.I.round&&st.I.state[ln.axis]!=='G'&&(st.s-STOP_D-front)<30,
          ahead=cs.some(o=>o!==c&&o.s>c.s&&o.s-c.s<c.T.L+8&&o.v<2.5);
        if(stp||ahead||c.turn||c.em)c.yieldPl=0;   // fermo al semaforo, in coda o in manovra: non può spostarsi
        else{if(!c.avSide)c.loT=ln.ring?(ln.kind==='slow'?2.3:0):1.05;if(ln.ring&&ln.kind==='fast'){c.overtaking=true;c.lcT=0;}
          acc=Math.min(acc,c.v>3?-2.2:0.6*(1-c.v));c.lcBlink=Math.max(c.lcBlink||0,0.6);c.lcSide=1;}}
      if(c.hold>0){c.hold-=dt;acc=-8;}
      acc=Math.max(-8,acc);c.a=(c.a||0)+Math.max(-14*dt,Math.min(9*dt,acc-(c.a||0)));if(c.hold>0)c.a=acc;   // strappi limitati
      c.brk=c.a<-0.6||c.v<0.3;
    });
    cs.forEach(c=>{c.v=Math.max(0,c.v+c.a*dt);c.s+=c.v*dt;c.lv=(c.lv||0);{const al=Math.max(-2.2,Math.min(2.2,3.2*(c.loT-c.lo)-3.4*c.lv));c.lv=Math.max(-1.7,Math.min(1.7,c.lv+al*dt));c.lo+=c.lv*dt;}
      const yT=c.v>1.5?Math.atan2(c.lv,c.v):0;c.yawOff=(c.yawOff||0)+(yT-(c.yawOff||0))*Math.min(1,dt*6);
      if(ln.loop){if(c.s>=ln.len)c.s-=ln.len;}
      else if(c.s>ln.smax-3){const e=lanePos(ln,ln.smax,ln.off),b=lanePos(ln,ln.smin,ln.off);
        const far=!pl.P||!(ln.axis==='X'&&ln.road===0)||(Math.hypot(e.x-pl.x,e.z-pl.z)>110&&Math.hypot(b.x-pl.x,b.z-pl.z)>110);
        const last=cs.reduce((m,o)=>o!==c&&o.s<m?o.s:m,1e9);
        if(far&&last>ln.smin+18){c.s=ln.smin+2;c.v=c.v0*0.7;}else{c.s=ln.smax-3;c.v=0;}}
      if(c.turnPlan&&!c.turn&&!c.waitLeft){const st2=ln.stops.find(o=>o.I===c.turnPlan.I);if(st2&&c.s>=st2.s-5.75&&c.s<st2.s){const d=ln.d,r={x:-d.z,z:d.x},I=c.turnPlan.I;
          if(!c.turnPlan.left){const R0=1.75+4;c.turn={cx:I.x+r.x*R0-d.x*R0,cz:I.z+r.z*R0-d.z*R0,a0:Math.atan2(-r.z,-r.x),sg:1,rad:4,t:0,to:c.turnPlan.to,ex:I.x+r.x*R0-d.x*1.75,ez:I.z+r.z*R0-d.z*1.75};}
          else{const Rl=7.5;c.turn={cx:I.x-r.x*5.75-d.x*5.75,cz:I.z-r.z*5.75-d.z*5.75,a0:Math.atan2(r.z,r.x),sg:-1,rad:Rl,t:0,to:c.turnPlan.to,ex:I.x-r.x*5.75+d.x*1.75,ez:I.z-r.z*5.75+d.z*1.75};}}}
      let p;
      if(c.turn){const Tn=c.turn,rad=Tn.rad||4,sg=Tn.sg||1;Tn.t+=c.v*dt/(Math.PI/2*rad);const a=Tn.a0+sg*Math.min(1,Tn.t)*Math.PI/2;
        p={x:Tn.cx+Math.cos(a)*rad,z:Tn.cz+Math.sin(a)*rad,dx:-Math.sin(a)*sg,dz:Math.cos(a)*sg};
        if(Tn.t>=1){transfers.push([c,ln,Tn.to,Tn.to.proj(Tn.ex,Tn.ez).s]);}}
      else{let ro=0;if(!ln.ring&&RB){for(const o of ln.stops){if(!o.I.round)continue;const ds=c.s-o.s;if(Math.abs(ds)<12){ro=6.4*Math.cos(Math.PI*ds/24)**2;if(!o.I.inside.includes(c))o.I.inside.push(c);}else{const k=o.I.inside.indexOf(c);if(k>=0)o.I.inside.splice(k,1);}}}
        p=lanePos(ln,c.s,ln.off+c.lo+ro);}
      c.dx=p.dx;c.dz=p.dz;
      const hy=p.x>L?TH(p.x,p.z):0;c.mesh.position.set(p.x,hy,p.z);c.mesh.rotation.y=Math.atan2(-p.dz,p.dx)-(c.yawOff||0);knock(c,dt);
      const vis=Math.abs(p.x-cam.x)+Math.abs(p.z-cam.z)<650;c.mesh.visible=vis;if(!vis)return;
      c.slope=p.x>L?Math.atan2(TH(p.x+p.dx*2,p.z+p.dz*2)-TH(p.x-p.dx*2,p.z-p.dz*2),4):0;
      c.pv=(c.pv||0)+(78*(c.a*0.006-(c.pp||0))-5.5*(c.pv||0))*dt;c.pp=(c.pp||0)+c.pv*dt;c.mesh.rotation.z=c.pp+(c.slope||0);c.mesh.userData.tailM.emissiveIntensity=c.brk?2.2:(NIGHT||WX!=='clear'?0.8:0.12);
      c.honkCd-=dt;if(c.flashT>0){c.flashT-=dt;c.mesh.userData.headM.emissiveIntensity=((c.flashT*7)|0)%2?4:0.15;}else c.mesh.userData.headM.emissiveIntensity=NIGHT||WX!=='clear'?2.4:0.15;
      if(c.em){c.em.ph+=dt*7.5;const on=Math.sin(c.em.ph)>0;c.em.bM.emissiveIntensity=on?4:0;c.em.bM2.emissiveIntensity=on?0:4;}
      // frecce delle auto del traffico (svolte e cambi corsia)
      const bl=c.turnPlan?(c.turnPlan.left?-1:1):(c.lcBlink>0?c.lcSide:0);if(c.lcBlink>0)c.lcBlink-=dt;const on=bl&&((simT*1.45)%1<0.5),ud=c.mesh.userData;if(ud.indL){ud.indL.emissiveIntensity=on&&bl<0?3:0;ud.indR.emissiveIntensity=on&&bl>0?3:0;}});
  });
  // cambi di corsia completati / svolte completate
  transfers.forEach(([c,from,to,s2])=>{ints.forEach(I=>{const k=I.inside.indexOf(c);if(k>=0)I.inside.splice(k,1);});from.cars.splice(from.cars.indexOf(c),1);to.cars.push(c);c.ln=to;c.s=s2;c.turn=null;c.turnPlan=undefined;c.lo=0;c.lv=0;});
  // sorpassi sull'anello: dalla corsia lenta a quella veloce e ritorno
  lcTimer-=dt;if(lcTimer<=0){lcTimer=0.5;
    [[ringPath,lanes.filter(l=>l.ring&&l.at===ringPath.at)],[ringPathR,lanes.filter(l=>l.ring&&l.at===ringPathR.at)]].forEach(([P,pair])=>{
      const slow=pair.find(l=>l.kind==='slow'),fast=pair.find(l=>l.kind==='fast');if(!slow||!fast)return;
      const gapIn=(ln,s,self)=>{let ah=1e9,bh=1e9,vb=0;ln.cars.forEach(o=>{if(o===self)return;let d=o.s-s;if(d>ln.len/2)d-=ln.len;if(d<-ln.len/2)d+=ln.len;if(d>=0&&d<ah)ah=d;if(d<0&&-d<bh){bh=-d;vb=o.v;}});return{ah,bh,vb};};
      slow.cars.slice().forEach(c=>{if(c.T.truck||(c.lcT||0)>simT||Math.abs(c.lo)>0.3||c.avSide)return;const me=gapIn(slow,c.s,c);const lead=slow.cars.find(o=>{let d=o.s-c.s;if(d<0)d+=slow.len;return o!==c&&d<45&&d>0&&o.v<c.v0b-2.5;});
        if(!lead)return;const g2=gapIn(fast,c.s,c);if(g2.ah>30&&g2.bh>22+Math.max(0,g2.vb-c.v)*2.5){slow.cars.splice(slow.cars.indexOf(c),1);fast.cars.push(c);c.ln=fast;c.lo=slow.off-fast.off;c.v0=Math.min(33,c.v0b+5);c.lcT=simT+8;c.lcBlink=2.5;c.lcSide=-1;c.overtaking=true;}});
      fast.cars.slice().forEach(c=>{if(!c.overtaking||(c.lcT||0)>simT||Math.abs(c.lo)>0.3||c.avSide)return;const g2=gapIn(slow,c.s,c);
        if(g2.ah>60&&g2.bh>28+Math.max(0,g2.vb-c.v)*2){fast.cars.splice(fast.cars.indexOf(c),1);slow.cars.push(c);c.ln=slow;c.lo=fast.off-slow.off;c.v0=c.v0b;c.lcT=simT+10;c.lcBlink=2.5;c.lcSide=1;c.overtaking=false;}});});}
}
let lcTimer=1;

// ================= CAMERA / VISTE =================
let view='cockpit';
let headSpot=null;
function toggleLights(){pl.lights=!pl.lights;
  if(!headSpot){headSpot=new THREE.SpotLight(0xfff2d6,0,60,0.45,0.5,1.2);scene.add(headSpot);scene.add(headSpot.target);}
  headSpot.intensity=pl.lights?2.2:0;}
function tick(hi){if(!AC)return;const t=AC.currentTime,o=AC.createOscillator(),gg=AC.createGain(),f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=hi?2600:1900;f.Q.value=3;
  o.type='square';o.frequency.value=hi?1300:950;gg.gain.setValueAtTime(0.18,t);gg.gain.exponentialRampToValueAtTime(0.001,t+0.035);o.connect(f).connect(gg).connect(ACOUT());o.start(t);o.stop(t+0.05);}
function manualBlink(dir){if(pl.blink===dir){pl.blink=0;}else{pl.blink=dir;pl.blinkMan=true;pl.blinkArmed=false;}}
function updateBlinker(dt){const wa=pl.delta*pl.P.ratio*57.3,v=Math.abs(pl.vx);
  {const gi=document.getElementById('gripInd');if(gi){const u=Math.max((pl.slip||0)/(pl.alPk||0.2)*(Math.abs(pl.vx)>4?1:0),pl.spinW>0?1.05:0,(pl.lockF||pl.lockR)&&Math.abs(pl.vx)>3?1.1:0,pl.absOn?0.97:0);pl.gripU=(pl.gripU||0)+(u-(pl.gripU||0))*0.25;const g=pl.gripU,on=started&&!pl.ended&&!CINE.intro&&g>0.6;gi.style.display=on?'block':'none';gi.classList.toggle('ck',view==='cockpit');if(on){const c=gi.querySelector('circle');c.setAttribute('stroke',g>0.93?'#ff3b30':'#ffb020');gi.style.opacity=Math.min(1,(g-0.6)/0.25).toFixed(2);}}}
  {const e=document.getElementById('steerInd');if(e){const on=started&&!pl.ended&&view!=='cockpit'&&CFG.steerInd!==false;e.style.display=on?'block':'none';if(on){e.firstElementChild.style.transform='rotate('+wa.toFixed(1)+'deg)';e.lastElementChild.textContent=Math.abs(wa)<4?'0°':Math.round(Math.abs(wa))+'°'+(wa<0?' ◀':' ▶');}}}
  // automatica: solo svolte vere (volante oltre 100° sotto i 35 km/h); si spegne quando il volante torna dritto
  if(!pl.blink&&Math.abs(wa)>100&&v<9.7&&v>0.5){pl.blink=Math.sign(wa);pl.blinkMan=false;pl.blinkArmed=true;}
  if(pl.blink&&Math.abs(wa)>100&&Math.sign(wa)===pl.blink)pl.blinkArmed=true;
  if(pl.blink&&pl.blinkArmed&&Math.abs(wa)<20)pl.blink=0;
  const any=pl.blink!==0||pl.hazard;pl.blinkT=(pl.blinkT||0)+dt;const on=any&&((pl.blinkT%0.7)<0.35);
  if(on!==pl.blinkOn){pl.blinkOn=on;if(any)tick(on);}
  if(!any)pl.blinkT=0;
  const ud=pl.mesh.userData;ud.indL.emissiveIntensity=(on&&(pl.blink<0||pl.hazard))?3:0;ud.indR.emissiveIntensity=(on&&(pl.blink>0||pl.hazard))?3:0;}
function toggleView(){pl.autoOut=false;view=view==='cockpit'?'chase':'cockpit';applyView();}
function ckRestore(){if(pl.mesh)pl.mesh.children.forEach(c=>{if(c.userData._ckH){c.visible=true;delete c.userData._ckH;}});}
function applyView(){if(!pl.ck)return;ckRestore();pl.camInit=false;pl.ck.g.visible=view==='cockpit';pl.mesh.userData.body.visible=view!=='cockpit';pl.bodyClip.visible=view==='cockpit';if(pl.mesh.userData.cabx){pl.mesh.userData.cabx.visible=view!=='cockpit';pl.mesh.userData.ckx.visible=view==='cockpit';pl.bodyClip.visible=false;}if(pl.mesh.userData.glb){const ck=view==='cockpit';(pl.mesh.userData.cage||[]).forEach(o=>o.visible=!ck);pl.mesh.userData.allMats.forEach(m=>{const G=m.userData.glass;if(G){m.transparent=true;m.opacity=ck?Math.min(G.op,0.14):G.op;}});pl.mesh.userData.body.visible=true;pl.mesh.userData.allMats.forEach(m=>{m.clippingPlanes=view==='cockpit'?pl.clipPlanes:null;m.clipIntersection=true;m.needsUpdate=true;});}(pl.mesh.userData.mir||[]).forEach(m=>m.visible=view!=='cockpit');document.getElementById('ext').style.display=view==='chase'?'block':'none';
  camera.fov=view==='cockpit'?72:58;camera.updateProjectionMatrix();ckOverlay();}
const tmpV=new THREE.Vector3(),camLook=new THREE.Vector3(),CAMS={y:0,vy:0,ax:0,ay:0};
// abitacoli disegnati (immagini scelte da Giorgio): i vetri sono trasparenti e mostrano il mondo vero, gli specchi mostrano la vista dietro
// schermo del navigatore negli abitacoli disegnati: centro e larghezza nell'immagine (sulla Challenger è lo schermo di bordo)
const CKNAV={volvo:[712,328,170],utilitaria:[660,292,150],wagoneer:[700,352,140],taxi:[831,343,150],hellcat:[706,302,92],zil:[735,312,150],daily:[735,318,150]};
const CKIMG={volvo:{g:[[480,357,16,'s',180,'#ff8a2a'],[435,356,14,'r',0,'#ff8a2a']],man:true,wheel:{src:'cockpit/volvo_w.webp',c:[475,436],a:123,b:136,box:[348,296,603,572]},src:'cockpit/volvo.webp',size:[1024,572],glass:{C:[647,73,815,121],L:[143,296,240,348]},spd:[481,366],fs:9,turnL:[447,342],turnR:[515,342],beam:[481,343]},
  utilitaria:{man:true,wheel:{src:'cockpit/panda_w.webp',c:[472,381],a:120,b:111,box:[348,266,597,497]},src:'cockpit/panda.webp',size:[1024,503],glass:{C:[592,64,743,115],L:[172,272,244,304]},spd:[519,322],fs:9,turnL:[405,305],turnR:[552,305],beam:[466,305]},
  wagoneer:{g:[[488,348,17,'s',180,'#f2f2ec'],[436,351,16,'r',0,'#f2f2ec']],zoom:1.16,wheel:{src:'cockpit/jeep_w.webp',c:[462,420],a:135,b:135,box:[323,281,602,560]},src:'cockpit/jeep.webp',size:[1024,572],glass:{C:[626,83,796,118],L:[123,287,229,333]},spd:[490,361],fs:8,gear:[490,371],turnL:[466,331],turnR:[514,331],beam:[490,331]},
  taxi:{g:[[472,346,19,'s',200,'#ff3b20'],[527,345,13,'r',0,'#ff3b20']],wheel:{src:'cockpit/taxi_w.webp',c:[456,418],a:112,b:129,box:[340,285,573,552]},src:'cockpit/taxi.webp',size:[1024,572],glass:{C:[620,114,790,153],L:[121,290,216,346]},spd:[475,353],fs:7,gear:[445,353],turnL:[455,325],turnR:[497,325],beam:[476,325]},
  hellcat:{g:[[476,344,19,'s',240,'#ff4a1c'],[421,345,14,'r',0,'#ff4a1c']],wheel:{src:'cockpit/hellcat_w.webp',c:[469,421],a:129,b:134,box:[336,283,603,560]},src:'cockpit/hellcat.webp',size:[1024,572],glass:{C:[612,142,773,177],L:[76,309,172,349]},spd:[473,357],fs:7,gear:[424,357],turnL:[447,323],turnR:[499,323],beam:[473,323]},
  zil:{g:[[478,343,14,'s',120,'#ff9a3a'],[558,344,14,'r',0,'#ff9a3a']],wheel:{src:'cockpit/zil_w.webp',c:[524,384],a:112,b:103,box:[408,277,641,492]},man:true,src:'cockpit/zil.webp',size:[1024,503],glass:{C:[681,80,815,116],L:[30,112,190,298]},spd:[472,352],fs:7,gear:[472,361],turnL:[503,330],turnR:[538,330],beam:[520,330]},
  daily:{g:[[466,367,18,'s',140,'#ffa040'],[550,367,15,'r',0,'#ffa040']],wheel:{src:'cockpit/daily_w.webp',c:[507,423],a:130,b:126,box:[373,293,642,554]},man:true,src:'cockpit/daily.webp',size:[1024,572],glass:{C:[668,76,806,112],L:[103,222,193,358]},spd:[463,378],fs:7,gear:[507,372],turnL:[482,345],turnR:[532,345],beam:[507,344]}};
const CKO={on:false,cfg:null,s:1,l:0,t:0,hud:new THREE.Scene(),cam:new THREE.OrthographicCamera(0,1,1,0,-1,1),q:{}};
function ckQuad(k,u0,u1,v0,v1){const g=new THREE.PlaneGeometry(1,1),uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i);uv.setXY(i,u1-(u1-u0)*u,v0+(v1-v0)*v);}const m=new THREE.Mesh(g,mirrorM);CKO.hud.add(m);CKO.q[k]=m;return m;}
ckQuad('C',0.32,0.68,0.12,0.92);ckQuad('L',0.66,1.0,0.08,0.92);ckQuad('R',0.0,0.34,0.08,0.92);
// lancette vere sui quadranti dell'abitacolo (tachimetro e contagiri), sopra la foto e sotto il volante
function ckNeedles(){const C=CKO.cfg,kmh=Math.abs(pl.vx)*3.6,rpm=pl.rpm||0,key=Math.round(kmh*2)+'|'+Math.round(rpm/25);if(key===CKO.nv)return;CKO.nv=key;
  const c=document.getElementById('ckNdl'),g=c.getContext('2d'),k=CKO.nk||1;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);g.setTransform(k,0,0,k,0,0);g.lineCap='round';
  for(const[x,y,r,t,max,col]of C.g){const f=t==='s'?Math.min(1.04,kmh/max):Math.min(1.04,rpm/(pl.P.red*1.2)),a=(135+270*f)*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a);
    g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=1.9;g.beginPath();g.moveTo(x-ca*r*0.22+0.5,y-sa*r*0.22+0.6);g.lineTo(x+ca*r*0.92+0.5,y+sa*r*0.92+0.6);g.stroke();
    g.strokeStyle=col;g.lineWidth=1.3;g.beginPath();g.moveTo(x-ca*r*0.22,y-sa*r*0.22);g.lineTo(x+ca*r*0.92,y+sa*r*0.92);g.stroke();
    g.fillStyle='#1a1a1c';g.beginPath();g.arc(x,y,Math.max(1.4,r*0.12),0,7);g.fill();}}
function ckLayout(){const C=CKO.cfg;if(!C){camera.clearViewOffset();camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();return;}
  const W=innerWidth,H=innerHeight,[iw,ih]=C.size,s0=Math.max(W/iw,H/ih),w0=iw*s0,h0=ih*s0,l0=(W-w0)/2,t0=H-h0;
  // zoom: l'immagine dell'abitacolo si ingrandisce ancorata in alto, il cofano scende e si vede più strada (la scena resta dov'è)
  const s=s0*(C.zoom||1),w=iw*s,h=ih*s,l=(W-w)/2,t=t0;Object.assign(CKO,{s,l,t});
  const img=document.getElementById('ckImg');img.style.width=w+'px';img.style.height=h+'px';img.style.left=l+'px';img.style.top=t+'px';{const c=document.getElementById('ckNdl');c.style.display=C.g?'block':'none';if(C.g){const k=Math.min(2.5,(window.devicePixelRatio||1)*s);c.width=Math.round(iw*k);c.height=Math.round(ih*k);c.style.width=w+'px';c.style.height=h+'px';c.style.left=l+'px';c.style.top=t+'px';CKO.nk=k;CKO.nv=null;}}
  const at=(id,p,fs)=>{const e=document.getElementById(id);e.style.left=(l+p[0]*s)+'px';e.style.top=(t+p[1]*s)+'px';if(fs)e.style.fontSize=(fs*s)+'px';};
  if(C.wheel){const B=C.wheel.box,wi=document.getElementById('ckWheel');wi.style.left=(l+B[0]*s)+'px';wi.style.top=(t+B[1]*s)+'px';wi.style.width=((B[2]-B[0])*s)+'px';wi.style.height=((B[3]-B[1])*s)+'px';wi.style.transformOrigin=((C.wheel.c[0]-B[0])*s)+'px '+((C.wheel.c[1]-B[1])*s)+'px';}
  {const N=CKNAV[selKey];if(N&&pl.ck){const e=pl.ck.scv;e.style.left=(l+N[0]*s)+'px';e.style.top=(t+N[1]*s)+'px';e.style.width=(N[2]*s)+'px';e.style.height=(N[2]*s/2)+'px';}}
  at('ckSpd',C.spd,C.fs);at('ckGear',C.gear||[C.spd[0],C.spd[1]+C.fs*1.05],C.fs*0.7);at('ckTL',C.turnL,7);at('ckTR',C.turnR,7);at('ckBeam',C.beam,6);
  // la telecamera inquadra come nella foto: stesso campo visivo riferito all'immagine intera, poi ritagliato come lo schermo
  camera.aspect=w0/h0;camera.setViewOffset(w0,h0,-l0,-t0,W,H);camera.updateProjectionMatrix();
  CKO.cam.left=0;CKO.cam.right=W;CKO.cam.top=H;CKO.cam.bottom=0;CKO.cam.updateProjectionMatrix();
  ['C','L','R'].forEach(k=>{const q=CKO.q[k],g=C.glass[k];q.visible=!!g;if(!g)return;const x0=l+g[0]*s,x1=l+g[2]*s,y0=t+g[1]*s,y1=t+g[3]*s;q.position.set((x0+x1)/2,H-(y0+y1)/2,0);q.scale.set(x1-x0,y1-y0,1);});}
function ckOverlay(){CKO.th=null;const C=(view==='cockpit'&&pl.P&&!PHOTO.on&&!HOME.mode)?CKIMG[selKey]:null;CKO.on=!!C;CKO.cfg=C||null;const ov=document.getElementById('ckOv');ov.style.display=C?'block':'none';
  if(C){const img=document.getElementById('ckImg');if(img.dataset.src!==C.src){img.src=C.src;img.dataset.src=C.src;}
    ov.querySelectorAll('canvas.ckNav').forEach(c=>{if(!pl.ck||c!==pl.ck.scv)c.remove();});if(pl.ck&&CKNAV[selKey]&&pl.ck.scv.parentNode!==ov){pl.ck.scv.className='ckNav';ov.insertBefore(pl.ck.scv,document.getElementById('ckWheel'));}
    const wi=document.getElementById('ckWheel');wi.style.display=C.wheel?'block':'none';if(C.wheel&&wi.dataset.src!==C.wheel.src){wi.src=C.wheel.src;wi.dataset.src=C.wheel.src;}}
  if(pl.mesh&&C)pl.mesh.children.forEach(c=>{if(c===rearCam)return;if(c.visible){c.visible=false;c.userData._ckH=1;}});
  ckLayout();}
addEventListener('resize',()=>setTimeout(ckLayout,0));
// qualità automatica: se i fotogrammi scendono sotto i ~45 al secondo si abbassa la risoluzione di disegno (fino al 60%),
// e se non basta si accorcia la distanza degli alberi 3D; quando torna fluido si risale piano piano
const AUTOQ={n:0,acc:0,sc:1,lvl:0,base:QG.pr,cool:0,
  tick(dt){if(CFG.autoQ===false||paused||!started)return;this.acc+=dt;this.n++;if(this.acc<2)return;const fps=this.n/this.acc;this.acc=0;this.n=0;if(this.cool>0){this.cool--;return;}
    let sc=this.sc;if(fps<44&&sc>0.6)sc=Math.max(0.6,sc-0.1);else if(fps>57&&sc<1)sc=Math.min(1,sc+0.05);
    if(sc!==this.sc){this.sc=sc;renderer.setPixelRatio(this.base*sc);renderer.setSize(innerWidth,innerHeight);this.cool=1;}
    if(fps<38&&this.sc<=0.6&&this.lvl<2&&window.HDTQ){this.lvl++;HDTQ(this.lvl);this.cool=2;}else if(fps>58&&this.sc>=1&&this.lvl>0&&window.HDTQ){this.lvl--;HDTQ(this.lvl);this.cool=3;}}};
// pioggia sul parabrezza (abitacoli fotografici): gocce che si posano, scorrono col vento della corsa e il tergicristallo che le spazza.
// Il disegno sta sotto la foto dell'abitacolo, quindi si vede solo attraverso i vetri
const RAINW={cv:null,g:null,spr:null,d:[],a:-1.3,dir:1,
  tick(dt){const on=CKO.on&&WX==='rain'&&started&&!pl.ended&&!PHOTO.on;
    if(!this.cv){if(!on)return;const c=document.createElement('canvas');c.id='ckRain';c.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none';const ov=document.getElementById('ckOv');ov.insertBefore(c,ov.firstChild);this.cv=c;this.g=c.getContext('2d');
      const sp=document.createElement('canvas');sp.width=sp.height=32;const q=sp.getContext('2d'),gr=q.createRadialGradient(13,12,1,16,16,15);gr.addColorStop(0,'rgba(255,255,255,.72)');gr.addColorStop(0.45,'rgba(210,220,230,.26)');gr.addColorStop(0.85,'rgba(20,25,30,.4)');gr.addColorStop(1,'rgba(20,25,30,0)');q.fillStyle=gr;q.beginPath();q.arc(16,16,15,0,7);q.fill();this.spr=sp;}
    const c=this.cv;if(!on){if(c.style.display!=='none'){c.style.display='none';this.d.length=0;}return;}if(c.style.display==='none')c.style.display='block';
    const W=Math.round(innerWidth/2),H=Math.round(innerHeight/2);if(c.width!==W||c.height!==H){c.width=W;c.height=H;}
    const v=Math.abs(pl.vx),D=this.d;for(let i=0,n=Math.min(40,dt*(70+v*2));i<n;i++)if(D.length<380)D.push({x:Math.random()*W,y:Math.random()*H*0.8,r:1.2+Math.random()*3.2,s:0});
    const cx=W/2;for(const p of D){if(v>7){p.x+=(p.x-cx)/W*v*1.6*dt*10;p.y-=v*dt*(2.2+p.r*0.6);}else{p.s+=dt;if(p.r>3)p.y+=dt*(6+p.r*4);}}
    // tergicristallo: va avanti e indietro (più veloce con la pioggia forte), pulisce lo spicchio che attraversa
    const a0=this.a;this.a+=this.dir*dt*3.1;if(this.a>1.3){this.a=1.3;this.dir=-1;}if(this.a<-1.3){this.a=-1.3;this.dir=1;}
    const px=W*0.5,py=H*1.08,lo=Math.min(a0,this.a),hi=Math.max(a0,this.a),L=H*1.0;
    for(let i=D.length-1;i>=0;i--){const p=D[i],ang=Math.atan2(p.x-px,py-p.y),dd=Math.hypot(p.x-px,py-p.y);if((ang>=lo-0.03&&ang<=hi+0.03&&dd<L)||p.y<-10||p.x<-10||p.x>W+10||p.y>H+10)D.splice(i,1);}
    const g=this.g;g.clearRect(0,0,W,H);for(const p of D){const r=p.r*(v>7?1:1);g.drawImage(this.spr,p.x-r,p.y-r*(v>7?1.25:1),r*2,r*2*(v>7?1.25:1));}
    g.strokeStyle='rgba(12,12,14,.92)';g.lineWidth=Math.max(3,H*0.012);g.lineCap='round';g.beginPath();g.moveTo(px+Math.sin(this.a)*H*0.15,py-Math.cos(this.a)*H*0.15);g.lineTo(px+Math.sin(this.a)*L,py-Math.cos(this.a)*L);g.stroke();}};
// sensazione di velocità: tremolio della visuale e sfocatura ai bordi, entrambi crescono oltre i 90 km/h
const SFX={b:-1,el:null,ox:0,oy:0};
function speedFx(dt){const v=Math.abs(pl.vx),on=started&&!PHOTO.on&&!pl.ended&&!CINE.intro&&!document.body.classList.contains('cine')&&!HOME.mode;
  const k=on?Math.max(0,Math.min(1,(v-25)/20)):0;
  if(CFG.shake!==false&&k>0&&!pl.air){const t=simT,a=k*(view==='cockpit'?0.0026:0.0018)*(pl.surfR==='asphalt'||!pl.surfR?1:1.8);
    const nx=Math.sin(t*9.3)*0.6+Math.sin(t*15.7+1.1)*0.4,ny=Math.sin(t*11.1+0.4)*0.6+Math.sin(t*19.3)*0.4;camera.rotateX(a*ny);camera.rotateY(a*nx*0.7);
    const ov=document.getElementById('ckOv');if(ov&&CKO.on){const px=Math.round(nx*k*1.6*10)/10,py=Math.round(ny*k*1.6*10)/10;if(px!==SFX.ox||py!==SFX.oy){SFX.ox=px;SFX.oy=py;ov.style.transform='translate('+px+'px,'+py+'px)';}}}
  else if(SFX.ox||SFX.oy){SFX.ox=SFX.oy=0;const ov=document.getElementById('ckOv');if(ov)ov.style.transform='';}
  const bl=(CFG.blur??!document.body.classList.contains('mob'))?Math.round(k*k*4):0;
  if(bl!==SFX.b){SFX.b=bl;const e=SFX.el||(SFX.el=document.getElementById('spdBlur'));if(e){e.style.display=bl?'block':'none';e.style.backdropFilter=e.style.webkitBackdropFilter=bl?'blur('+bl+'px)':'';}}}
function camKick(v){CAMS.vy-=v*2.2;}
function updateCamera(dt){
  const m=pl.mesh,S=pl.susp;if(pl.wat){const W=pl.wat;m.position.set(pl.x,W.y,pl.z);m.rotation.set(W.roll,pl.h,W.pitch);m.updateMatrixWorld();}else if(pl.flip){const F=pl.flip;m.position.set(pl.x,pl.terrH+Math.abs(Math.sin(F.phi))*pl.T.W*0.45+(Math.abs(F.phi)>2?pl.T.H*0.85:0)*Math.min(1,(Math.abs(F.phi)-2)/1.1),pl.z);m.rotation.set(F.phi,pl.h,0);}else{m.position.set(pl.x,(pl.yb??pl.terrH)+S.h,pl.z);m.rotation.set(S.r+pl.slopeR,pl.h,S.p+pl.slopeP+(pl.air?Math.max(-0.12,Math.min(0.12,-(pl.vb||0)*0.012)):0));}m.updateMatrixWorld();
  pl.ck.spin.rotation.x=pl.delta*pl.P.ratio;
  if(CKO.on&&CKO.cfg.g)ckNeedles();
  if(CKO.on&&CKO.cfg.wheel){const Wh=CKO.cfg.wheel,th=pl.delta*pl.P.ratio,c=Math.cos(th),sn=Math.sin(th),k=Wh.a/Wh.b;if(Math.abs(th-(CKO.th??99))>0.002){CKO.th=th;document.getElementById('ckWheel').style.transform='matrix('+c+','+sn/k+','+(-sn*k)+','+c+',0,0)';}}
  if(pl.ck.wipers.length){const on=WX==='rain';pl.wipT=(pl.wipT||0)+(on?dt:0);const th=on?(1-Math.cos(pl.wipT*Math.PI*1.25))/2*1.35:0;
    pl.ck.wipers.forEach(w=>{const dir=new THREE.Vector3(0,0,1).multiplyScalar(Math.cos(th)).add(w.u.clone().multiplyScalar(Math.sin(th)));w.bl.position.copy(w.piv).addScaledVector(dir,0.29);w.bl.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),dir);w.bl.visible=on||true;});}
  {const f=new THREE.Vector3(Math.cos(pl.h),0,-Math.sin(pl.h)),pf=new THREE.Vector3(pl.clipXf,0,0),pr=new THREE.Vector3(pl.clipXr,0,0);m.localToWorld(pf);m.localToWorld(pr);
   pl.clipPlanes[0].setFromNormalAndCoplanarPoint(f,pf);pl.clipPlanes[1].setFromNormalAndCoplanarPoint(f.clone().negate(),pr);}
  {const v=Math.abs(pl.vx),base=view==='cockpit'?72:58,tf=base+Math.min(view==='cockpit'?12:15,v*0.12+Math.max(0,v-14)*0.26);if(Math.abs(camera.fov-tf)>0.05){camera.fov+=(tf-camera.fov)*Math.min(1,dt*2);camera.updateProjectionMatrix();}}
  // ruote anteriori sterzanti
  const w=m.userData.wheels;w[0].rotation.y=w[1].rotation.y=-pl.delta;
  if(m.userData.glb){const rel=Math.max(-0.06,Math.min(pl.P.truck?0.17:0.13,(pl.yb??pl.terrH)-pl.terrH));for(const q of w){if(q.userData.y0==null)q.userData.y0=q.position.y;q.position.y=q.userData.y0-rel;}}
  if(m.userData.glb){const a=(pl.lockF?0:pl.vx+(pl.spinW||0)*Math.sign(pl.vx||1)*3)*dt/(pl.T.wr||0.31);for(let i=0;i<w.length;i++){const sp=w[i].children[0];if(sp&&sp.name==='WSPIN')sp.rotation.z-=a;}}
  // auto ribaltata: l'abitacolo-foto non può capovolgersi, quindi si passa alla vista esterna e si rientra quando l'auto è di nuovo sulle ruote
  {const up=m.matrixWorld.elements[5]-(pl.wat&&pl.wat.y<pl.wat.lv-0.8?1:0);if(view==='cockpit'&&up<0.82&&!PHOTO.on){pl.autoOut=true;pl.autoOutT=0;view='chase';applyView();}
   else if(pl.autoOut&&view==='chase'){if(up>0.96){pl.autoOutT=(pl.autoOutT||0)+dt;if(pl.autoOutT>1.2){pl.autoOut=false;view='cockpit';applyView();}}else pl.autoOutT=0;}}
  if(view==='cockpit'){
    tmpV.copy(pl.ck.eye);m.localToWorld(tmpV);camera.position.copy(tmpV);
    const look=new THREE.Vector3(pl.ck.eye.x+10,pl.ck.eye.y-1.5,pl.ck.eye.z);m.localToWorld(look);
    const q0=camera.quaternion.clone();camera.lookAt(look);
    if(pl.camInit)camera.quaternion.copy(q0.slerp(camera.quaternion,1-Math.exp(-dt*18)));pl.camInit=true;
    {const v=Math.abs(pl.vx);if(v>5&&!pl.air){const amp=Math.min(0.0032,v*v*0.0000032)*(pl.surfR==='asphalt'||!pl.surfR?1:2.6),t=simT;camera.rotateZ(amp*(Math.sin(t*37)+Math.sin(t*61+1.3))*0.5);camera.rotateX(amp*0.6*(Math.sin(t*43+0.7)+Math.sin(t*71))*0.5);}}
  } else {
    // in retromarcia la telecamera gira attorno all'auto e la inquadra dal davanti
    pl.camRev=(pl.camRev||0)+((pl.sel==='R'&&!pl.flip?1:0)-(pl.camRev||0))*Math.min(1,dt*2.2);orbUpdate(dt);{const tg=pl.vx>3&&!pl.flip?Math.max(-0.3,Math.min(0.3,(pl.r||0)*0.42)):0;pl.camLead=(pl.camLead||0)+(tg-(pl.camLead||0))*Math.min(1,dt*1.6);}
    const ang=pl.h+Math.PI*(pl.camRev<0.5?2*pl.camRev*pl.camRev:1-2*(1-pl.camRev)**2)+ORB.yaw*ORB.w+pl.camLead*(1-ORB.w)*(1-pl.camRev);
    const ch=Math.cos(ang),sh=Math.sin(ang);
    let cd=((pl.T.camL||pl.T.L)+4.5)*ORB.zoom;const cd0=cd;if(NWT&&pl.x>6000){// la telecamera non entra nei palazzi: si avvicina all'auto
      for(let d=1.5;d<=cd;d+=0.75){const x=pl.x-ch*d,z=pl.z+sh*d;let hit=false;for(const o of NWT.segQ(x,z)){const ex=o[2]-o[0],ez=o[3]-o[1],l2=ex*ex+ez*ez;if(l2<1)continue;let t=((x-o[0])*ex+(z-o[1])*ez)/l2;t=t<0?0:t>1?1:t;if(Math.hypot(x-o[0]-ex*t,z-o[1]-ez*t)<0.6){hit=true;break;}}if(hit){cd=Math.max(1.5,d-0.8);break;}}}
    const el=ORB.pitch*ORB.w,ce=Math.cos(el),hz=cd*ce,hy=(pl.T.camH||(2.6+pl.T.H*0.5))*Math.min(1.6,Math.max(0.7,ORB.zoom))*(1-0.6*Math.min(1,Math.abs(el)*2))+cd*Math.sin(el);
    // telecamera "con peso": arretra quando l'auto spinge, si avvicina in frenata, scivola verso l'esterno in curva e molleggia sui colpi
    {const C=CAMS,k=Math.min(1,dt*2.2);C.ax+=((pl.ax||0)-C.ax)*k;C.ay+=((pl.ay||0)-C.ay)*Math.min(1,dt*1.6);C.vy+=(-38*C.y-4.2*C.vy)*dt;C.y+=C.vy*dt;}
    const hz2=hz*(1+Math.max(-0.08,Math.min(0.1,CAMS.ax*0.011))),lat=-Math.max(-0.9,Math.min(0.9,CAMS.ay*0.07))*(1-ORB.w);
    tmpV.set(pl.x-ch*hz2+sh*lat,Math.max(pl.terrH+0.6,(pl.yb??pl.terrH)+hy+CAMS.y,pl.wat?pl.wat.lv+1.6:-1e9),pl.z+sh*hz2+ch*lat);camera.position.lerp(tmpV,cd<cd0-0.1||ORB.w>0.05?1-Math.exp(-dt*14):1-Math.exp(-dt*6));
    {const lx=pl.x+ch*5,ly=(pl.yb??pl.terrH)+1.1+Math.sin(pl.slopeP)*5,lz=pl.z-sh*5,w=ORB.w;camLook.set(lx+(pl.x-lx)*w,ly+(pl.terrH+0.9-ly)*w,lz+(pl.z-lz)*w);}camera.lookAt(camLook);
  }
  speedFx(dt);
  const ud=m.userData;ud.tailM.emissiveIntensity=pl.brkIn>0.08?2.2:(pl.lights?0.7:0.12);ud.revM.emissiveIntensity=pl.sel==='R'?2.6:0;ud.headM.emissiveIntensity=pl.flash?7:pl.lights?2.5:0.15;if(pl.flash&&!headSpot){toggleLights();toggleLights();}if(headSpot){headSpot.intensity=pl.flash?7:pl.lights?2.2:0;headSpot.distance=pl.flash?170:60;headSpot.angle=pl.flash?0.32:0.45;}
  if(headSpot){const ch=Math.cos(pl.h),sh=Math.sin(pl.h);headSpot.position.set(pl.x+ch*pl.T.L/2,pl.terrH+0.8,pl.z-sh*pl.T.L/2);headSpot.target.position.set(pl.x+ch*25,TH(pl.x+ch*25,pl.z-sh*25),pl.z-sh*25);}
  if(CINE.intro)CINE.introCam(dt);else if(CINE.used){CINE.used=false;if(view!=='cockpit')camera.position.copy(tmpV);}
  if(window.__camFix){const f=window.__camFix;camera.position.set(pl.x+f[0],pl.terrH+f[1],pl.z+f[2]);camera.lookAt(pl.x,pl.terrH+0.7,pl.z);}
  sun.position.set(pl.x+SUNOFF.x,pl.terrH+SUNOFF.y,pl.z+SUNOFF.z);sun.target.position.set(pl.x,pl.terrH,pl.z);
}


// ================= RIPRESE: sfondo del menu (voli sulle città) e ripresa dall'alto all'inizio della guida =================
const CINE={shot:null,t:0,list:null,i:0,intro:null,used:false,env:false,
  shots(){if(this.list)return this.list;const L=[];if(NW&&NW.cities)NW.cities.forEach(c=>{if(c.wx!=null)L.push({cx:c.wx,cz:c.wz,r:Math.max(220,Math.min(560,(c.r1||300)*0.28)),big:(c.r1||0)>1500,n:c.n});});
    L.sort((a,b)=>b.r-a.r);this.list=L.slice(0,8).sort(()=>Math.random()-0.5);return this.list;},
  next(){const L=this.shots();if(!L.length){this.shot=null;return;}const s=L[this.i++%L.length],types=s.big?['orbit','orbitLow']:['orbit','fly','orbitLow'];this.shot=Object.assign({},s,{type:types[(Math.random()*types.length)|0],a0:Math.random()*6.283,dir:Math.random()<0.5?1:-1,dur:14});this.t=0;},
  // filmato iniziale (e sfondo del menu): Valdorna, la città più grande, con il tempo che corre dal giorno alla notte e tagli rapidi
  mkFilm(){if(!NW||!NW.cities||!NW.cities.length)return null;const C=NW.cities.find(c=>c.n==='Valdorna')||NW.cities.slice().sort((a,b)=>(b.r1||0)-(a.r1||0))[0];if(!C||C.wx==null)return null;
    const R0=Math.min(900,(C.r1||800)*0.55),S=[];for(const R of NW.roads){if(R.t||R.b||R.priv||R.c<4||R.c>7)continue;for(let i=2;i<R.N-3;i+=9){const x=R.X[i],z=R.Z[i];if(Math.hypot(x-C.wx,z-C.wz)>R0)continue;const dx=R.X[i+2]-x,dz=R.Z[i+2]-z,l=Math.hypot(dx,dz)||1;if(NW.nearJ(x,z,25))continue;S.push({x,z,dx:dx/l,dz:dz/l,w:R.w});}}
    for(let i=S.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[S[i],S[j]]=[S[j],S[i]];}
    return{C,S,i:0,k:0,shot:null,t:0,clk:6.2,envT:0};},
  menu(dt){if(!NW)return;const F=this.film||(this.film=this.mkFilm());if(!F)return;dt=Math.min(dt,0.05);
    // tempo accelerato: un giorno intero in circa 20 secondi
    if(!started){F.clk=(F.clk+dt*1.25)%24;if(TIME!=='cycle'||!this.env){this.env=true;TIME='cycle';CLOCK=F.clk;applyEnv();}F.envT-=dt;if(F.envT<=0){F.envT=0.08;CLOCK=F.clk;applyEnv(true);}}
    if(!F.shot||F.t>F.shot.dur){const T=['track','crane','side','orbit','push','track','flyover','side','orbit'],ty=T[F.k++%T.length],road=F.S.length?F.S[F.i++%F.S.length]:null;
      F.shot={ty:(ty==='track'||ty==='side')&&!road?'orbit':ty,r:road,a0:Math.random()*6.283,dir:Math.random()<0.5?1:-1,dur:ty==='flyover'?3.6:2.6+Math.random()*0.9};F.t=0;}
    const S=F.shot,C=F.C;F.t+=dt;this.used=true;const u=Math.min(1,F.t/S.dur),e=u*u*(3-2*u),H=(x,z)=>NW.H(x,z),cx=C.wx,cz=C.wz,g0=H(cx,cz);let x,y,z,lx,ly,lz,fov=50;
    if(S.ty==='track'){const r=S.r,d=-25+u*100;x=r.x+r.dx*d;z=r.z+r.dz*d;y=H(x,z)+2.6;lx=x+r.dx*40;lz=z+r.dz*40;ly=H(lx,lz)+2.2;fov=58;}
    else if(S.ty==='side'){const r=S.r,nx=-r.dz,nz=r.dx,d=-35+u*70,o=r.w/2-0.8;x=r.x+r.dx*d+nx*o;z=r.z+r.dz*d+nz*o;y=H(x,z)+4;lx=x+r.dx*30+nx*13;lz=z+r.dz*30+nz*13;ly=y+3;fov=60;}
    else if(S.ty==='crane'){const a=S.a0+S.dir*u*0.5,r=140-e*20;x=cx+Math.cos(a)*r;z=cz+Math.sin(a)*r;y=Math.max(H(x,z)+6,g0+6+e*150);lx=cx;lz=cz;ly=g0+20+e*10;}
    else if(S.ty==='orbit'){const a=S.a0+S.dir*u*1.3,r=230;x=cx+Math.cos(a)*r;z=cz+Math.sin(a)*r;y=Math.max(H(x,z),g0)+75;lx=cx;lz=cz;ly=g0+30;}
    else if(S.ty==='push'){const a=S.a0,r=560-e*400;x=cx+Math.cos(a)*r;z=cz+Math.sin(a)*r;y=Math.max(H(x,z)+30,g0+60-e*25);lx=cx;lz=cz;ly=g0+25;fov=46;}
    else{const dx=Math.cos(S.a0),dz=Math.sin(S.a0),d=-380+u*760;x=cx+dx*d;z=cz+dz*d;y=g0+170;lx=x+dx*220;lz=z+dz*220;ly=g0+20;fov=55;}
    y=Math.max(y,H(x,z)+2);camera.position.set(x,y,z);camera.lookAt(lx,ly,lz);if(Math.abs(camera.fov-fov)>0.1){camera.fov=fov;camera.updateProjectionMatrix();}
    sun.position.set(lx+SUNOFF.x,ly+SUNOFF.y,lz+SUNOFF.z);sun.target.position.set(lx,ly,lz);
    const f=Math.max(0,Math.min(1,F.t/0.22,(S.dur-F.t)/0.18));const fe=document.getElementById('cineFade');if(fe)fe.style.opacity=(1-f).toFixed(3);},
  startIntro(){if(CFG.intro===false||!pl.mesh)return;const ck=view==='cockpit';if(ck){view='chase';applyView();}
    this.intro={t:0,dur:6.4,ck,side:Math.random()<0.5?1:-1};document.body.classList.add('cine');
    // Guido e Gatto salgono in auto mentre la ripresa scende
    if(DRV&&DRV.board())this.intro.brd=true;
    const tt=document.getElementById('cineTitle');if(tt){const st=document.getElementById('selStart'),wx=document.getElementById('selWx'),tm=document.getElementById('selTime');
      tt.innerHTML='<div class="c1">'+pl.P.label+'</div><div class="c2">'+((NWT&&st&&st.value)?st.value+' · ':'')+'Repubblica di Valdonia</div><div class="c3">'+(tm?tm.selectedOptions[0].textContent:'')+(wx?' · '+wx.selectedOptions[0].textContent:'')+'</div>';}},
  introCam(dt){const I=this.intro;if(I.bt!=null)return this.boardCam(dt);I.t+=dt;const u=Math.min(1,I.t/I.dur),e=u<0.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2,cx=pl.x,cz=pl.z,cy=(pl.yb??pl.terrH);
    const a1=Math.atan2(tmpV.z-cz,tmpV.x-cx),r1=Math.hypot(tmpV.x-cx,tmpV.z-cz),h1=tmpV.y-cy,a0=a1+I.side*2.5,r0=110,h0=88;
    const a=a0+(a1-a0)*e,r=r0+(r1-r0)*e,h=h0+(h1-h0)*Math.pow(e,0.85);camera.position.set(cx+Math.cos(a)*r,cy+h,cz+Math.sin(a)*r);
    _cl.set(cx,cy+1,cz).lerp(camLook,e);camera.lookAt(_cl);if(u>=1){if(I.brd&&DRV&&DRV.go()){I.bt=0;I.cv=0;I.lk=_cl.clone();}else this.endIntro();}},
  // salita a bordo: la telecamera resta alle spalle dell'auto, un po' più alta, e segue Guido da un lato all'altro
  boardCam(dt){const I=this.intro;I.bt+=dt;const m=pl.mesh,G=DRV.g,hl=pl.T.L/2,k=1-Math.exp(-dt*1.8);
    I.cv+=(Math.max(-3.2,Math.min(3.2,G.v*1.1))-I.cv)*Math.min(1,dt*1.2);
    tmpV.set(-hl-4.1,2.35,I.cv);m.localToWorld(tmpV);tmpV.y=Math.max(tmpV.y,NW.H(tmpV.x,tmpV.z)+1.5);camera.position.lerp(tmpV,k);
    const L=new THREE.Vector3((G.u+0.3)*0.5,0.9,G.v*0.55);m.localToWorld(L);I.lk.lerp(L,k);camera.lookAt(I.lk);
    if(DRV.done||I.bt>30){I.hold=(I.hold||0)+dt;if(I.hold>0.3)this.endIntro();}},
  endIntro(){const I=this.intro;this.intro=null;if(DRV)DRV.hideAll();document.body.classList.remove('cine');if(I&&I.ck){view='cockpit';applyView();}}};
const _cl=new THREE.Vector3();
['keydown','pointerdown','touchstart'].forEach(ev=>addEventListener(ev,()=>{if(CINE.intro&&CINE.intro.t>0.5)CINE.endIntro();},{passive:true}));
// ================= ORA DEL GIORNO E METEO =================
let TIME='day',WX='clear',WET=1;
const litTex=canvasTex(256,(g,n)=>{g.fillStyle='#000';g.fillRect(0,0,n,n);for(let r=0;r<4;r++)for(let k=0;k<4;k++){if(Math.random()<0.45){g.fillStyle=Math.random()<0.5?'#ffd58a':'#ffe9c0';g.fillRect(k*64+20,r*64+12,24,38);}}});
const poolTex=canvasTex(64,(g,n)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,214,150,0.55)');gr.addColorStop(1,'rgba(255,214,150,0)');g.fillStyle=gr;g.fillRect(0,0,n,n);});
const poolM=new THREE.MeshBasicMaterial({map:poolTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-4});
let pools=null;
function nightCube(){const f=(top)=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');g.fillStyle=top?'#0b1426':'#06080c';g.fillRect(0,0,32,32);return c;};
  const t=new THREE.CubeTexture([f(1),f(1),f(1),f(0),f(1),f(1)]);t.needsUpdate=true;return t;}
const dayEnv=scene.environment,nightEnv=nightCube();
// riflessi di vernici e vetri presi dal cielo del momento (colori del cielo, sole, terreno), rifatti quando cambia l'ora
const ENVGEN=(()=>{if(QG.lo)return null;let cur=null,last='';const hex=c=>'#'+c.getHexString();
  const face=(k,sunOn)=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),U=skyMat.uniforms,gc=scene.fog.color.clone().multiplyScalar(0.42);
    if(k==='up'){g.fillStyle=hex(U.top.value);g.fillRect(0,0,64,64);}else if(k==='down'){g.fillStyle=hex(gc);g.fillRect(0,0,64,64);}
    else{const gr=g.createLinearGradient(0,0,0,64);gr.addColorStop(0,hex(U.top.value));gr.addColorStop(0.3,hex(U.mid.value));gr.addColorStop(0.49,hex(U.bot.value));gr.addColorStop(0.51,hex(gc.clone().multiplyScalar(1.3)));gr.addColorStop(1,hex(gc));g.fillStyle=gr;g.fillRect(0,0,64,64);}
    if(sunOn){const y=32-Math.max(-0.2,SUNOFF.clone().normalize().y)*30,sg=g.createRadialGradient(32,y,0,32,y,30),sc=sun.color;sg.addColorStop(0,'rgba('+(sc.r*255|0)+','+(sc.g*255|0)+','+(sc.b*255|0)+',1)');sg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=sg;g.fillRect(0,0,64,64);}
    return c;};
  return{make(force){const key=SUNOFF.x.toFixed(0)+SUNOFF.y.toFixed(0)+WX+TIME;if(!force&&key===last&&cur)return cur;last=key;const d=SUNOFF.clone().normalize(),ax=Math.abs(d.x)>Math.abs(d.z)?(d.x>0?0:1):(d.z>0?4:5);
    const F=['px','nx','up','down','pz','nz'].map((k,i)=>face(k==='px'||k==='nx'||k==='pz'||k==='nz'?'side':k,i===ax));const cb=new THREE.CubeTexture(F);cb.encoding=THREE.sRGBEncoding;cb.needsUpdate=true;
    if(cur&&cur!==dayEnv)setTimeout((o=>()=>o.dispose())(cur),2000);cur=cb;return cb;}};})();
// pioggia
const RN=MOBILE?900:2200,rainPos=new Float32Array(RN*6);for(let i=0;i<RN;i++){const x=(Math.random()-0.5)*50,y=Math.random()*25,z=(Math.random()-0.5)*50;rainPos.set([x,y,z,x,y-0.5,z],i*6);}
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xaab4c0,transparent:true,opacity:0.45}));rain.frustumCulled=false;rain.visible=false;scene.add(rain);
function updateRain(dt){if(!rain.visible)return;const c=camera.position;rain.position.set(c.x,c.y-6,c.z);for(let i=0;i<RN;i++){let y=rainPos[i*6+1]-dt*17;if(y<0)y+=25;rainPos[i*6+1]=y;rainPos[i*6+4]=y-0.5;}rainGeo.attributes.position.needsUpdate=true;}
let rainSnd=null;
const ENVK={night:{top:0x03060f,mid:0x0a1428,bot:0x141d30,sunI:0.16,sunC:0x8fa6d8,hemiI:0.1,fogC:0x0e1524,fogF:900,cl:0x2a3242,exp:1.0,day:0.12},
  dawn:{top:0x2f4a80,mid:0xc59aa6,bot:0xf2c6a0,sunI:1.0,sunC:0xffc79e,hemiI:0.3,fogC:0xdcbcab,fogF:1500,cl:0xffd8cc,exp:0.95,day:0.7},
  day:{top:0x5b8acb,mid:0xa6c4e2,bot:HORIZON,sunI:1.75,sunC:0xfff0d8,hemiI:0.45,fogC:HORIZON,fogF:1500,cl:0xffffff,exp:0.88,day:1},
  sunset:{top:0x2b4a86,mid:0xd9906a,bot:0xf3b47e,sunI:1.25,sunC:0xffa566,hemiI:0.35,fogC:0xe9b48a,fogF:1500,cl:0xffc9a0,exp:0.95,day:0.75}};
const ENVSEQ=[[0,'night'],[5.1,'night'],[6.4,'dawn'],[8.3,'day'],[17.2,'day'],[19,'sunset'],[20.4,'night'],[24,'night']];
let CLOCK=7,NIGHT=false,DUSK=false,envAcc=0,lastNight=null;const SUNOFF=new THREE.Vector3(-60,90,40);
function envAt(h){h=((h%24)+24)%24;let i=0;while(i<ENVSEQ.length-2&&ENVSEQ[i+1][0]<=h)i++;const[a0,ka]=ENVSEQ[i],[a1,kb]=ENVSEQ[i+1],A=ENVK[ka],B=ENVK[kb];let t=(h-a0)/(a1-a0);t=t*t*(3-2*t);
  const o={};for(const k in A){o[k]=(k==='top'||k==='mid'||k==='bot'||k==='sunC'||k==='fogC'||k==='cl')?new THREE.Color(A[k]).lerp(new THREE.Color(B[k]),t):A[k]+(B[k]-A[k])*t;}return o;}
function sunFor(h){const ang=Math.PI*(h-5.8)/14.2;if(ang<0.05||ang>Math.PI-0.05){SUNOFF.set(-40,85,-50);return;}SUNOFF.set(115*Math.cos(ang),Math.max(26,8+92*Math.sin(ang)),45);}
function envTick(dt){const cl=document.getElementById('clockHud');if(TIME!=='cycle'||!started){if(cl)cl.style.display='none';return;}if(!paused)CLOCK=(CLOCK+dt*(CFG.cycSp||1)/60)%24;envAcc+=dt;
  if(cl){cl.style.display='block';const hh=Math.floor(CLOCK),mm=Math.floor((CLOCK-hh)*60);cl.textContent=(NIGHT?'🌙 ':'☀️ ')+String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');}
  if(envAcc>0.4){envAcc=0;applyEnv(true);}}
const ENVB={sun:1.75,hemi:0.45,exp:0.88},TUNL={k:0,auto:false,t:0};
// in galleria: il sole non arriva, restano le lampade; i fari si accendono da soli e il motore rimbomba
function tunnelUpdate(dt){if(!NW||!pl.P)return;TUNL.t-=dt;if(TUNL.t<=0){TUNL.t=0.2;let inT=false;for(const q of NW.near(pl.x,pl.z,0.5)){if(q.R.t&&Math.abs(q.h-pl.terrH)<2&&NW.Hg(pl.x,pl.z)-q.h>3.5){inT=true;break;}}TUNL.in=inT;
    if(inT&&!pl.lights){toggleLights();TUNL.auto=true;}else if(!inT&&TUNL.auto&&TUNL.k<0.2){if(pl.lights)toggleLights();TUNL.auto=false;}}
  TUNL.k+=((TUNL.in?1:0)-TUNL.k)*Math.min(1,dt*2.5);const k=TUNL.k;if(k<0.002&&!TUNL.in)return;sun.intensity=ENVB.sun*(1-0.93*k);hemiL.intensity=ENVB.hemi*(1-0.7*k);renderer.toneMappingExposure=ENVB.exp*(1+0.35*k);
  if(eng&&eng.rvg)eng.rvg.gain.setTargetAtTime(0.55*k,AC.currentTime,0.1);}
function applyEnv(tick){
  const H=TIME==='cycle'?CLOCK:TIME==='night'?0:TIME==='sunset'?19:12,K=envAt(H);
  NIGHT=TIME==='night'||(TIME==='cycle'&&(CLOCK<5.8||CLOCK>19.95));DUSK=TIME==='sunset'||(TIME==='cycle'&&((CLOCK>18.4&&CLOCK<20.4)||(CLOCK>5&&CLOCK<6.6)));
  if(TIME==='cycle')sunFor(CLOCK);else if(TIME==='sunset')SUNOFF.set(-110,30,30);else SUNOFF.set(-60,90,40);
  skyMat.uniforms.uCov.value=WX==='rain'?0.3:WX==='fog'?0.35:0.56;skyMat.uniforms.uDay.value=K.day;const chg=!tick||lastNight!==NIGHT;if(NWT&&NWT.setNight&&chg)NWT.setNight(NIGHT);
  const U=skyMat.uniforms,fog=scene.fog;let sunI=K.sunI,sunC=K.sunC,hemiI=K.hemiI,fogC=K.fogC,fogN=260,fogF=K.fogF,exp=K.exp,clouds_c=K.cl;
  U.top.value.copy(K.top);U.mid.value.copy(K.mid);U.bot.value.copy(K.bot);if(NIGHT||!ENVGEN){const en=NIGHT?nightEnv:dayEnv;if(scene.environment!==en)scene.environment=en;}
  if(WX==='rain'){U.top.value.multiplyScalar(0.55).add(new THREE.Color(0x30353c));U.mid.value.lerp(new THREE.Color(0x6f7782),0.7);U.bot.value.lerp(new THREE.Color(0x8a9199),0.7);sunI*=0.4;hemiI*=1.1;fogC=new THREE.Color(0x0c1016).lerp(new THREE.Color(0x8a9199),Math.min(1,K.day*1.15));fogN=60;fogF=650;clouds_c=new THREE.Color(0x222831).lerp(new THREE.Color(0x8f969e),Math.min(1,K.day*1.15));}
  if(WX==='fog'){U.mid.value.lerp(new THREE.Color(0xc3c8cc),0.8);U.bot.value.lerp(new THREE.Color(0xc3c8cc),0.9);sunI*=0.5;fogC=new THREE.Color(0x10151d).lerp(new THREE.Color(0xc3c8cc),Math.min(1,K.day*1.15));fogN=8;fogF=170;}
  if(NW&&WX!=='fog'){if(WX==='rain'){fogN*=2.5;fogF*=2.5;}else{fogN=30;fogF*=NIGHT?4.4:3.9;}}
  // nebbia serale (e del primo mattino) che sale in montagna
  {const eve=(H>17.2&&H<22)?Math.min(1,(H-17.2)/0.9,(22-H)/0.9):(H>4.6&&H<8.2)?Math.min(1,(H-4.6)/0.6,(8.2-H)/0.9)*0.85:0,alt=(NW&&pl.P)?sstep(150,330,pl.terrH||0):0,k=eve*alt*(WX==='fog'?0:1);
   if(k>0.02){fogN=fogN*(1-k)+10*k;fogF=fogF*(1-k)+140*k;fogC=new THREE.Color(fogC).lerp(new THREE.Color(0xa4abb3).multiplyScalar(0.25+0.75*(K.day||0)),0.75*k);sunI*=1-0.5*k;}}
  sun.intensity=sunI;sun.color.set(sunC);hemiL.intensity=hemiI;U.uSun.value.copy(SUNOFF).normalize();U.uSunC.value.set(sunC).multiplyScalar(WX==='clear'?1:0.35);if(!NIGHT&&ENVGEN&&(!tick||(frameN%600===0))){const t=ENVGEN.make(!tick);if(t&&scene.environment!==t)scene.environment=t;}ENVB.sun=sunI;ENVB.hemi=hemiI;ENVB.exp=exp;fog.color.set(fogC);fog.near=fogN*QG.fog;fog.far=fogF*QG.fog;scene.background.set(fogC);renderer.toneMappingExposure=exp;
  clouds.forEach(c=>{c.material.color.set(clouds_c);c.visible=WX!=='fog';});
  HZN.color(fog.color,K.day||0);
  const night=NIGHT;if(chg)facadeMats.forEach(m=>{m.emissive.set(0xffffff);m.emissiveMap=night?litTex:null;m.emissiveIntensity=night?0.85:0;m.needsUpdate=true;});
  headM.emissive.set(0xffd9a0);headM.emissiveIntensity=night?2.5:0;lastNight=NIGHT;
  if(!pools){pools=new THREE.InstancedMesh(new THREE.PlaneGeometry(11,11).rotateX(-Math.PI/2),poolM,lampPos.length);const o=new THREE.Object3D();lampPos.forEach(([x,z],i)=>{o.position.set(x,CURB+0.04,z);o.updateMatrix();pools.setMatrixAt(i,o.matrix);});scene.add(pools);}
  pools.visible=night||(DUSK&&WX!=='clear');
  WET=WX==='rain'?0.7:1;roadMat.roughness=WX==='rain'?0.35:0.95;roadMat.color.set(WX==='rain'?0xb8b8b8:0xffffff);if(!tick)roadMat.needsUpdate=true;
  rain.visible=WX==='rain';
  if(tick){if(night&&pl.P&&!pl.lights){toggleLights();pl.autoL=1;}else if(!night&&!DUSK&&pl.autoL&&pl.lights){toggleLights();pl.autoL=0;}return;}
  cars.forEach(c=>{c.v0b=c.v0b||c.v0;c.v0=c.v0b*(WX==='clear'?1:0.88);});
  if(AC){if(rainSnd){try{rainSnd.stop();}catch(e){}rainSnd=null;}if(WX==='rain'){const b=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    rainSnd=AC.createBufferSource();rainSnd.buffer=b;rainSnd.loop=true;const f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=1800;const g=AC.createGain();g.gain.value=0.07;rainSnd.connect(f).connect(g).connect(ACOUT());rainSnd.start();}}
  if(night&&pl.P&&!pl.lights){toggleLights();pl.autoL=1;}
}



/* ---------- orizzonte a strati: tre catene di colline lontane, sempre più velate ----------
   seguono il giocatore, si abbassano verso il mare e prendono il colore della foschia */
const HZN={L:[],cx:null,cz:null,N:200,
  init(){if(this.L.length||!NW)return;const N=this.N;
    [[5500,0.56,680,11],[4500,0.4,500,23],[3600,0.26,340,37]].forEach(([R,hz,amp,sd],i)=>{const g=new THREE.BufferGeometry(),pos=new Float32Array((N+1)*2*3);g.setAttribute('position',new THREE.BufferAttribute(pos,3));
      const idx=[];for(let k=0;k<N;k++){const a=k*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}g.setIndex(idx);
      const me=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x8899aa,fog:false,side:THREE.DoubleSide,depthWrite:false}));me.frustumCulled=false;me.renderOrder=-0.9+i*0.1;me.visible=false;scene.add(me);
      this.L.push({me,R,hz,amp,sd});});},
  ridge(a,sd){let r=0,am=1,f=3,t=0;for(let k=0;k<6;k++){r+=am*Math.sin(a*f+sd*(k+1)*2.3+Math.sin(a*f*0.5+sd)*1.3);t+=am;am*=0.55;f*=2.1;}r=0.5+0.5*r/t;return Math.max(0,Math.min(1,r))**1.6;},
  build(px,pz){const N=this.N,gy=(pl.terrH||NW.Hg(px,pz)||0);
    for(const Ly of this.L){const P=Ly.me.geometry.attributes.position.array;
      for(let k=0;k<=N;k++){const a=k/N*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);let land=0,hm=-1e9,n=0;
        for(let d=1200;d<=Ly.R;d+=700){const x=px+ca*d,z=pz+sa*d;n++;let w=null;try{w=waterLv(x,z);}catch(e){}const h=NW.Hg(x,z);if(w==null&&h>2){land++;hm=Math.max(hm,h);}}
        const lf=land/n,base=Math.max(gy-30,hm*0.85),top=base+Ly.amp*(0.12+0.88*this.ridge(a,Ly.sd))*(0.12+0.88*lf);
        P.set([ca*Ly.R,gy-600,sa*Ly.R,ca*Ly.R,Math.max(top,gy+25+Ly.amp*0.05),sa*Ly.R],k*6);}
      Ly.me.geometry.attributes.position.needsUpdate=true;Ly.me.position.set(px,0,pz);}
    this.cx=px;this.cz=pz;this.color();},
  tick(){if(!NW||!started)return;this.init();if(!this.L.length)return;const x=camera.position.x,z=camera.position.z;
    if(this.cx==null||Math.hypot(x-this.cx,z-this.cz)>350)this.build(x,z);else for(const Ly of this.L)Ly.me.position.set(this.cx,0,this.cz);},
  color(fc,day){if(fc){this.fc=fc.clone();this.day=day;}if(!this.L.length||!this.fc)return;fc=this.fc;day=this.day;const base=fc.clone().multiplyScalar(0.42+0.06*day).lerp(new THREE.Color(DUSK?0x4d4a72:0x35506a),(DUSK?0.6:0.45)*day);
    for(const Ly of this.L){Ly.me.material.color.copy(base).lerp(fc,Ly.hz);Ly.me.visible=WX!=='fog'&&this.cx!=null;}}};
