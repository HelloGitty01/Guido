import json,math,heapq,numpy as np
from load import load
J,hm,lm,(GX0,GZ0,GS,NX,NZ)=load()
def Hg(x,z):
    fx=min(max((x-GX0)/GS,0),NX-1.001);fz=min(max((z-GZ0)/GS,0),NZ-1.001);i=int(fx);j=int(fz);u=fx-i;v=fz-j
    return (hm[j,i]*(1-u)+hm[j,i+1]*u)*(1-v)+(hm[j+1,i]*(1-u)+hm[j+1,i+1]*u)*v
cities=J['meta']['cities'];places=J['places']
nodes=np.array(J['nodes']).reshape(-1,2)
# nodi su strade locali/provinciali
nodeRoad={}
for (ri,i0,i1,a,b,o) in J['edges']:
    c=J['roads'][ri][0];R=J['roads'][ri][8]
    for nd,pi in ((a,i0),(b,i1)):
        if c<=7 and not J['roads'][ri][6] and not J['roads'][ri][7]: nodeRoad[nd]=(ri,pi,R[pi*3+2])
def far_from_towns(x,z,d):
    for c in cities:
        if math.hypot(c['wx']-x,c['wz']-z)<c['r1']+d: return False
    for p in places:
        px,pz=p[1],p[2] if isinstance(p,list) else (0,0)
        if math.hypot(px-x,pz-z)<d: return False
    return True
print('places sample',places[0][:4] if places else None)
# siti candidati
cand=[]
for j in range(10,NZ-10,4):
    for i in range(10,NX-10,4):
        h=hm[j,i]
        if not(1060<h<1240): continue
        patch=hm[j-3:j+4,i-3:i+4]
        if patch.max()-patch.min()>22: continue
        x=GX0+i*GS;z=GZ0+j*GS
        if lm[j,i]: continue
        cand.append((x,z,h))
print('cand',len(cand))
def far2(x,z,d):
    for c in cities:
        if math.hypot(c['wx']-x,c['wz']-z)<c['r1']+d: return False
    for p in places:
        if math.hypot(p[2]-x,p[3]-z)<d: return False
    return True
# strade esistenti sulla griglia
RM=np.zeros((NZ,NX),bool)
for R in J['roads']:
    P=R[8]
    for k in range(0,len(P)-3,3):
        x0,z0,x1,z1=P[k],P[k+1],P[k+3],P[k+4];L=math.hypot(x1-x0,z1-z0);n=max(1,int(L/8))
        for t in range(n+1):
            x=x0+(x1-x0)*t/n;z=z0+(z1-z0)*t/n;i=int(round((x-GX0)/GS));j=int(round((z-GZ0)/GS))
            RM[max(0,j-1):j+2,max(0,i-1):i+2]=True
D16=[(a,b) for a in range(-2,3) for b in range(-2,3) if (a,b)!=(0,0) and math.gcd(abs(a),abs(b))==1]
def plan(x,z,h):
    si=int(round((x-GX0)/GS));sj=int(round((z-GZ0)/GS))
    tg={}
    for nd,(ri,pi,nh) in nodeRoad.items():
        nx,nz=nodes[nd]
        if math.hypot(nx-x,nz-z)<3500 and h-650<nh<h-120: tg[(int(round((nz-GZ0)/GS)),int(round((nx-GX0)/GS)))]=nd
    if not tg: return None
    W=200;dist={(sj,si):0};prev={};pq=[(0,sj,si)]
    while pq:
        d,j,i=heapq.heappop(pq)
        if d>dist.get((j,i),1e18): continue
        for (tj,ti),nd in tg.items():
            if abs(tj-j)<=1 and abs(ti-i)<=1:
                path=[(j,i)];k=(j,i)
                while k in prev: k=prev[k];path.append(k)
                return nd,path[::-1][::-1],d
        if abs(j-sj)>W or abs(i-si)>W: continue
        for a,b in D16:
            jj,ii=j+a,i+b
            if jj<2 or ii<2 or jj>=NZ-2 or ii>=NX-2: continue
            if lm[jj,ii]: continue
            near_t=any(abs(tj-jj)<=2 and abs(ti-ii)<=2 for (tj,ti) in tg)
            if RM[jj,ii] and not near_t: continue
            L=math.hypot(a,b)*GS;dh=hm[jj,ii]-hm[j,i];gr=abs(dh)/L
            if gr>0.095: continue
            # pendenza trasversale: evita le pareti
            sx=(hm[jj,ii+1]-hm[jj,ii-1])/(2*GS);sz=(hm[jj+1,ii]-hm[jj-1,ii])/(2*GS)
            if math.hypot(sx,sz)>0.9: continue
            nd2=d+L*(1+2*gr)
            if nd2<dist.get((jj,ii),1e18): dist[(jj,ii)]=nd2;prev[(jj,ii)]=(j,i);heapq.heappush(pq,(nd2,jj,ii))
    return None
import random
random.seed(3);random.shuffle(cand)
sites=[]
for (x,z,h) in cand:
    if not far2(x,z,1100): continue
    if any(math.hypot(s['x']-x,s['z']-z)<3500 for s in sites): continue
    r=plan(x,z,h)
    if not r: continue
    nd,path,cost=r
    # tortuosità: numero di inversioni
    L=cost
    print('site',int(x),int(z),int(h),'node',nd,'len',int(L),'pts',len(path))
    if L<1200 or L>6500: continue
    sites.append({'x':x,'z':z,'h':h,'nd':nd,'path':path})
    if len(sites)>=2: break
json.dump([{'x':s['x'],'z':s['z'],'h':s['h'],'nd':s['nd'],'path':s['path']} for s in sites],open('/tmp/alp/sites.json','w'))
