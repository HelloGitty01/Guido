import json,base64,gzip,numpy as np
def dec(a,st):
    a=np.array(a,dtype=np.float64).reshape(-1,st);return (np.cumsum(a,0)/10).ravel().tolist()
def load():
    D=json.load(open('/home/claude/guido/models/ornavia.json'))
    J=json.loads(gzip.decompress(base64.b64decode(D['gz'])))
    if J['meta'].get('enc'):
        for r in J['roads']: r[8]=dec(r[8],3)
        J['nodes']=dec(J['nodes'],2)
    d=np.frombuffer(gzip.decompress(base64.b64decode(D['hm'])),dtype=np.int16)
    GX0,GZ0,GS,NX,NZ=J['meta']['grid']
    hm=(np.cumsum(d.reshape(NZ,NX).astype(np.float64),1)/10)
    lm=np.frombuffer(gzip.decompress(base64.b64decode(D['lm'])),dtype=np.uint8).reshape(NZ,NX)
    return J,hm,lm,(GX0,GZ0,GS,NX,NZ)
