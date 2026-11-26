import json,math,random,numpy as np
exec(open('/tmp/alp/gen.py').read().split('import random')[0])
S=json.load(open('/tmp/alp/sw.json'));NAMES=['Pradalto','Vallombra'];out={'roads':[],'blds':[],'alp':[]}
for vi,o in enumerate(S):
    P=np.array(o['P']);d=np.r_[0,np.cumsum(np.hypot(*np.diff(P,axis=0).T))];L=d[-1];s=np.linspace(0,L,int(L/7)+1)
    X=np.interp(s,d,P[:,0]);Z=np.interp(s,d,P[:,1]);X[0],Z[0]=nodes[o['nd']]
    Ht=np.array([Hg(a,b) for a,b in zip(X,Z)])
    for it in range(8):Ht[1:-1]=(Ht[:-2]+Ht[1:-1]*2+Ht[2:])/4
    Hl=o['nh']+(Ht[-1]-o['nh'])*s/L
    H=Hl*0.85+Ht*0.15
    for it in range(30):H[1:-1]=(H[:-2]+H[1:-1]*2+H[2:])/4
    H[0]=o['nh']
    print('dh',int(Ht[-1]-o['nh']))
    gr=np.abs(np.diff(H))/np.hypot(np.diff(X),np.diff(Z));print(NAMES[vi],'L',int(L),'grade max',round(gr.max(),3),'mean',round(gr.mean(),3))
    p=[];[p.extend([round(a,1),round(b,1),round(c,2)]) for a,b,c in zip(X,Z,H)]
    out['roads'].append({'r':[6,0,6.5,0,'Strada per '+NAMES[vi],'',0,0,p],'nd':o['nd'],'n':NAMES[vi]})
    vx,vz=X[-1],Z[-1];out['alp'].append([round(vx,1),round(vz,1),NAMES[vi]])
    rnd=random.Random(vi*7+1);H0=[]
    def roadd(x,z):return np.min(np.hypot(X-x,Z-z))
    for t in range(600):
        if len(H0)>=14:break
        a=rnd.random()*6.28;r=12+rnd.random()*95;x=vx+math.cos(a)*r;z=vz+math.sin(a)*r
        w=8+rnd.random()*4;dd=7+rnd.random()*3;
        if roadd(x,z)<3.25+max(w,dd)/2+3 or roadd(x,z)>45:continue
        if any(math.hypot(x-q[0],z-q[1])<(max(w,dd)+q[2])*0.75+3 for q in H0):continue
        # orientamento: lungo la strada più vicina
        k=int(np.argmin(np.hypot(X-x,Z-z)));k=min(k,len(X)-2);ry=math.atan2(Z[k+1]-Z[k],X[k+1]-X[k])+(math.pi/2 if rnd.random()<0.3 else 0)
        c,sn=math.cos(ry),math.sin(ry);cor=[(x+c*a2-sn*b2,z+sn*a2+c*b2) for a2,b2 in ((-w/2,-dd/2),(w/2,-dd/2),(w/2,dd/2),(-w/2,dd/2))]
        hs=[Hg(*q) for q in cor]
        if max(hs)-min(hs)>3.5:continue
        g=min(hs);h=5.2+rnd.random()*1.4;ring=[round(v,1) for q in cor for v in q]
        col=rnd.choice([0xf2e6d8,0xe8dccb,0xf6efe4,0xe2d2bf])
        out['blds'].append([round(h+max(hs)-g,1),col,round(g,2),ring,0,[],0,7,3]);H0.append((x,z,max(w,dd)))
    # chiesetta col campanile: un edificio di pietra più alto
    print(NAMES[vi],'case',len(H0))
json.dump(out,open('/tmp/alp/alpv.json','w'),separators=(',',':'))
print(len(open('/tmp/alp/alpv.json').read()))
