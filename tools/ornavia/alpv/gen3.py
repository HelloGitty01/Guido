import json,math,numpy as np,random
exec(open('/tmp/alp/gen.py').read().split('import random')[0])
def grad(x,z):
    e=6;return ((Hg(x+e,z)-Hg(x-e,z))/(2*e),(Hg(x,z+e)-Hg(x,z-e))/(2*e))
def onRoad(x,z):
    i=int(round((x-GX0)/GS));j=int(round((z-GZ0)/GS));return RM[j,i]
def switchback(S,V,hv,seed):
    rnd=random.Random(seed);x,z=S;ax,az=V[0]-S[0],V[1]-S[1];AL=math.hypot(ax,az);ax/=AL;az/=AL;px,pz=-az,ax
    P=[(x,z)];side=rnd.choice([1,-1]);W=110+rnd.random()*70;legs=0;st=8
    for it in range(2000):
        h=Hg(x,z)
        if math.hypot(V[0]-x,V[1]-z)<45 or h>hv-12: break
        gx,gz=grad(x,z);g=math.hypot(gx,gz)
        # direzione verso il paese
        vx,vz=V[0]-x,V[1]-z;vl=math.hypot(vx,vz);vx/=vl;vz/=vl
        if g<0.075:dx,dz=vx,vz
        else:
            ux,uz=gx/g,gz/g;th=math.acos(min(1,0.045/g))
            c,s=math.cos(th*side),math.sin(th*side);dx,dz=ux*c-uz*s,ux*s+uz*c
            # leggera spinta verso il paese
            dx,dz=dx*0.85+vx*0.15,dz*0.85+vz*0.15;l=math.hypot(dx,dz);dx/=l;dz/=l
        nx,nz=x+dx*st,z+dz*st;lat=(nx-S[0])*px+(nz-S[1])*pz
        if g>=0.075 and abs(lat)>W and lat*(dx*px+dz*pz)>0:
            # tornante: semicerchio verso monte
            if g<0.075: break
            ux,uz=gx/g,gz/g;r=10.5;cx,cz=x+ux*r,z+uz*r;a0=math.atan2(x-cx,z-cz) if False else math.atan2(z-cz,x-cx)
            # verso di rotazione: dalla direzione attuale verso quella opposta passando a monte
            cr=dx*uz-dz*ux;sg=1 if cr<0 else -1
            for k in range(1,9):a=a0+sg*math.pi*k/8;P.append((cx+math.cos(a)*r,cz+math.sin(a)*r))
            x,z=P[-1];side=-side;legs+=1;continue
        x,z=nx,nz;P.append((x,z))
    if math.hypot(V[0]-x,V[1]-z)>450 or abs(Hg(x,z)-hv)>45: return None
    n=max(1,int(math.hypot(V[0]-x,V[1]-z)/st))
    for k in range(1,n+1):P.append((x+(V[0]-x)*k/n,z+(V[1]-z)*k/n))
    return P,legs
def check(P):
    A=np.array(P)
    for k in range(6,len(A)):
        if onRoad(*A[k]):return 'strada'
    d=np.hypot(A[:,None,0]-A[None,:,0],A[:,None,1]-A[None,:,1])
    for i in range(len(A)):
        for j in range(i+14,len(A)):
            if d[i,j]<15:return 'incrocio'
    return None
cand.sort(key=lambda c:-c[2])
out=[]
for (x,z,h) in cand:
    if not far2(x,z,700) or any(math.hypot(o["x"]-x,o["z"]-z)<1800 for o in out):continue
    best=None
    for nd,(ri,pi,nh) in nodeRoad.items():
        nx,nz=nodes[nd];d=math.hypot(nx-x,nz-z)
        if 280<d<1100 and h-260<nh<h-80:
            for seed in range(6):
                r=switchback((nx,nz),(x,z),h,seed)
                if not r:continue
                P,legs=r
                if legs<3:continue
                e=check(P)
                if e:continue
                L=sum(math.hypot(P[k+1][0]-P[k][0],P[k+1][1]-P[k][1]) for k in range(len(P)-1))
                sc=legs*1.0-L/2000
                if not best or sc>best[0]:best=(sc,nd,P,legs,L,nh)
    if best:
        sc,nd,P,legs,L,nh=best;print('paese',int(x),int(z),int(h),'nodo',nd,'tornanti',legs,'L',int(L));out.append({'x':x,'z':z,'h':h,'nd':nd,'P':P,'nh':nh})
    if len(out)>=2:break
json.dump(out,open('/tmp/alp/sw.json','w'))
