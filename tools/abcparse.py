import re
from fractions import Fraction as F
NOTE_PC={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
SHARPS='FCGDAEB'
# semitones from the relative major's tonic up to the mode's tonic (D Dorian: 2 above C)
MODES={'':0,'maj':0,'major':0,'ion':0,'m':9,'min':9,'minor':9,'aeo':9,'dor':2,'phr':4,'lyd':5,'mix':7,'loc':11}
MAJ_SHARPS={'C':0,'G':1,'D':2,'A':3,'E':4,'B':5,'F#':6,'C#':7,'F':-1,'Bb':-2,'Eb':-3,'Ab':-4,'Db':-5,'Gb':-6,'Cb':-7}
FIFTHS=['Cb','Gb','Db','Ab','Eb','Bb','F','C','G','D','A','E','B','F#','C#']
def keysig(k):
    # the mode may follow the root directly (Am, Dmix) or after a space (A minor, D Dorian); later words are clefs etc.
    k=k.strip() or 'C'
    m=re.match(r'([A-G])([#b]?)\s*([A-Za-z]*)',k)
    if not m: return {},0,'maj'
    root=m.group(1)+m.group(2); mode=m.group(3).lower()[:3] if m.group(3) else ''
    if mode=='m' or m.group(3).lower() in('m','min','minor'): mode='m'
    off=MODES.get(mode,MODES.get(m.group(3).lower(),0))
    rootpc=(NOTE_PC[m.group(1)]+(1 if m.group(2)=='#' else -1 if m.group(2)=='b' else 0))%12
    # find number of sharps: major key a minor-third up etc.
    majpc=(rootpc-off)%12
    n=None
    for name,ns in MAJ_SHARPS.items():
        pc=(NOTE_PC[name[0]]+(1 if '#' in name else -1 if 'b' in name[1:] else 0))%12
        if pc==majpc and abs(ns)<=6: n=ns if n is None or abs(ns)<abs(n) else n
    sig={}
    if n>0:
        for l in SHARPS[:n]: sig[l]=1
    elif n<0:
        for l in SHARPS[::-1][:(-n)]: sig[l]=-1
    return sig,rootpc,('min' if off==9 else 'maj' if off==0 else mode)
def parse(abc, voice=None):
    """Parse one voice of an ABC tune (the first voice by default).
    Returns notes with midi, length in quarter notes, verse syllables and bar/line flags."""
    head={};body=[];words=[]
    voice_seen=voice; skipping=False
    lines=abc.replace('\r','').split('\n')
    started=False; cur_line_idx=-1; blocks=[]  # blocks: [music_text, [wlines]]
    for ln in lines:
        s=re.sub(r'(?<!\\)%.*$','',ln).rstrip()
        if not s or s.startswith('%'): continue
        m=re.match(r'^([A-Za-z]):(.*)$',s)
        if m and m.group(1)!='|':
            f,v=m.group(1),m.group(2).strip()
            if f=='K' and not started: head['K']=v; started=True; continue
            if not started: head.setdefault(f,v); continue
            if f=='V':
                vid=v.split()[0]
                if voice_seen is None: voice_seen=vid
                skipping = vid!=voice_seen
                continue
            if f=='w' and not skipping and blocks: blocks[-1][1].append(v); continue
            continue
        if not started: continue
        if s.startswith('[V:'):
            vid=s[3:].split(']')[0].split()[0]
            if voice_seen is None: voice_seen=vid
            skipping = vid!=voice_seen; s=s.split(']',1)[1]
        if skipping: continue
        blocks.append([s,[]])
    L=F(head.get('L','1/8')) if 'L' in head else None
    M=head.get('M','4/4')
    if M in('C',): M='4/4'
    if M=='C|': M='2/2'
    if L is None:
        try: L=F(1,16) if float(F(M))<0.75 else F(1,8)
        except: L=F(1,8)
    sig,rootpc,mode=keysig(head.get('K','C'))
    notes=[]; 
    for text,wl in blocks:
        text=re.sub(r'"[^"]*"','',text); text=re.sub(r'![^!]*!','',text); text=re.sub(r'\+[^+]*\+','',text)
        text=re.sub(r'\{[^}]*\}','',text); text=re.sub(r'\[[A-Za-z]:[^\]]*\]','',text)
        i=0; acc={}; tup=None; tie=False; pending_broken=None; line_notes=[]; skip_end=False
        while i<len(text):
            c=text[i]
            if c=='[' and i+1<len(text) and text[i+1] in '12':
                skip_end = text[i+1]=='1'; i+=2; continue
            if c in '|:':
                acc={}; j=i
                while j<len(text) and text[j] in '|:]': j+=1
                if j<len(text) and text[j] in '12' and text[j-1]=='|':
                    skip_end = text[j]=='1'; j+=1
                elif ':' in text[i:j] or text[i:j] in ('||','|]'):
                    if text[i:j].startswith(':') or text[i:j] in('||','|]'): skip_end=False
                if line_notes: line_notes[-1]['bar']=True
                i=j; continue
            if c=='(' and i+1<len(text) and text[i+1].isdigit():
                n=int(text[i+1]); tup=[n, F(2,3) if n==3 else F(3,2) if n==2 else F(n-1,n)]; i+=2; continue
            if c in '<>':
                pending_broken=c*1; 
                k=1
                while i+k<len(text) and text[i+k]==c: k+=1
                pending_broken=(c,k); i+=k; continue
            if c=='-': 
                if line_notes: line_notes[-1]['tie']=True
                i+=1; continue
            m=re.match(r"(\^\^|\^|__|_|=)?([A-Ga-gzx])([',]*)(\d*)(/*)(\d*)",text[i:])
            chord=False
            if c=='[':
                j=text.find(']',i)
                inner=text[i+1:j]; ms=list(re.finditer(r"(\^\^|\^|__|_|=)?([A-Ga-g])([',]*)(\d*)(/*)(\d*)",inner))
                # choose highest
                best=None
                for mm in ms:
                    p=pitch(mm,acc,sig)
                    if best is None or p>best[0]: best=(p,mm)
                rest=re.match(r"(\d*)(/*)(\d*)",text[j+1:])
                if best is None: i=j+1; continue
                # chord length = the first inner note's length times the length written after ']'
                d=dur(ms[0].group(4),ms[0].group(5),ms[0].group(6))*dur(rest.group(1),rest.group(2),rest.group(3))
                for mm in ms:
                    if mm.group(1): acc[(mm.group(2).upper(),octv(mm))]= {'^':1,'^^':2,'_':-1,'__':-2,'=':0}[mm.group(1)]
                note={'midi':best[0],'d':d*L*4}
                i=j+1+len(rest.group(0))
            elif m and m.group(0):
                if m.group(2) in 'zx':
                    note={'midi':None,'d':dur(m.group(4),m.group(5),m.group(6))*L*4}
                else:
                    p=pitch(m,acc,sig)
                    if m.group(1): acc[(m.group(2).upper(),octv(m))]={'^':1,'^^':2,'_':-1,'__':-2,'=':0}[m.group(1)]
                    note={'midi':p,'d':dur(m.group(4),m.group(5),m.group(6))*L*4}
                i+=len(m.group(0))
            else:
                i+=1; continue
            if tup:
                note['d']*=tup[1]; tup[0]-=1
                if tup[0]==0: tup=None
            if pending_broken and line_notes:
                ch,k=pending_broken; prev=line_notes[-1]; f=F(1,2**k)
                if ch=='>': prev['d']*=2-f; note['d']*=f
                else: prev['d']*=f; note['d']*=2-f
                pending_broken=None
            if skip_end: continue
            line_notes.append(note)
        # attach lyrics
        for vi,w in enumerate(wl):
            syl=lyr_tokens(w)
            k=0
            for n in line_notes:
                if n['midi'] is None: continue
                while k<len(syl) and syl[k]=='|': k+=1
                if k<len(syl):
                    t=syl[k]; k+=1
                    n.setdefault('vs',{})[vi]='' if t in('_','*') else t
                    if vi==0: n['syl']=n['vs'][0]
        if line_notes: line_notes[-1]['line']=True
        notes+=line_notes
    # merge ties
    out=[]
    for n in notes:
        if out and out[-1].get('tie') and n['midi']==out[-1]['midi']:
            out[-1]['d']+=n['d']; out[-1]['tie']=n.get('tie',False)
            for k in ('bar','line'): 
                if n.get(k): out[-1][k]=True
            continue
        out.append(dict(n))
    return {'head':head,'rootpc':rootpc,'mode':mode,'meter':M,'notes':out}
def octv(m):
    o=0 if m.group(2).isupper() else 1
    for ch in m.group(3): o+= 1 if ch=="'" else -1
    return o
def pitch(m,acc,sig):
    L_=m.group(2).upper(); o=octv(m)
    base=60+NOTE_PC[L_]+12*o
    a=m.group(1)
    if a: return base+{'^':1,'^^':2,'_':-1,'__':-2,'=':0}[a]
    if (L_,o) in acc: return base+acc[(L_,o)]
    return base+sig.get(L_,0)
def dur(n1,sl,n2):
    d=F(int(n1)) if n1 else F(1)
    if sl:
        if n2: d/= int(n2)
        else: d/= 2**len(sl)
    return d
def lyr_tokens(w):
    w=re.sub(r'^\s*\d+\.\s*~?','',w)
    w=w.replace('\\-','\u2011')
    out=[]
    for tok in re.findall(r'[^\s\-_*|]+-?|_|\*|\||-',w):
        if tok=='-': continue
        out.append(tok.replace('~',' ').replace('\u2011','-'))
    return out
JP=['1','#1','2','#2','3','4','#4','5','#5','6','b7','7']
def jianpu(rel):
    o,pc=divmod(rel,12); s=JP[pc]
    return s+("'"*o if o>0 else ","*(-o))


def voices(abc):
    """Voice ids in the order they first appear in the tune body."""
    out=[]
    for m in re.finditer(r'^(?:\[V:|V:)\s*([^\]\s]+)',abc,re.M):
        if m.group(1) not in out: out.append(m.group(1))
    return out
