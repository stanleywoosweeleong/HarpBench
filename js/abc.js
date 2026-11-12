/* Harp Bench: ABC notation import (a JavaScript port of tools/abcparse.py, kept in step with it by the tests).
   Turns a tune in ABC into a songbook entry. No page access. */
"use strict";
const ABC_PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const ABC_ACC={'^':1,'^^':2,'_':-1,'__':-2,'=':0};
const ABC_MODES={'':0,maj:0,major:0,ion:0,m:-3,min:-3,minor:-3,aeo:-3,mix:-1,dor:-2,phr:-4,lyd:1,loc:-5};
const ABC_MAJ=[['C',0],['G',1],['D',2],['A',3],['E',4],['B',5],['F#',6],['C#',7],['F',-1],['Bb',-2],['Eb',-3],['Ab',-4],['Db',-5],['Gb',-6],['Cb',-7]];

function abcKeySig(k){
  k=(k||'').trim().split(/\s+/)[0]||'C';
  const m=/^([A-G])([#b]?)(.*)$/.exec(k);
  if(!m) return {sig:{},rootpc:0};
  const rest=m[3].toLowerCase();
  const mode=['m','min','minor'].includes(rest)?'m':rest.slice(0,3);
  const off=mode in ABC_MODES?ABC_MODES[mode]:(rest in ABC_MODES?ABC_MODES[rest]:0);
  const rootpc=(ABC_PC[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0)+12)%12, majpc=((rootpc-off)%12+12)%12;
  let n=null;
  for(const [name,ns] of ABC_MAJ){
    const pc=(ABC_PC[name[0]]+(name.includes('#')?1:name.slice(1).includes('b')?-1:0)+12)%12;
    if(pc===majpc&&Math.abs(ns)<=6&&(n===null||Math.abs(ns)<Math.abs(n))) n=ns;
  }
  const sig={};
  if(n>0) for(const l of 'FCGDAEB'.slice(0,n)) sig[l]=1;
  else if(n<0) for(const l of 'BEADGCF'.slice(0,-n)) sig[l]=-1;
  return {sig,rootpc};
}
function abcDur(n1,sl,n2){ let d=n1?+n1:1; if(sl) d/= n2?+n2:Math.pow(2,sl.length); return d; }
function abcOct(letter,marks){ let o=letter===letter.toUpperCase()?0:1; for(const ch of marks) o+=ch==="'"?1:-1; return o; }
function abcPitch(acc,letter,marks,accs,sig){
  const L_=letter.toUpperCase(), o=abcOct(letter,marks), base=60+ABC_PC[L_]+12*o;
  if(acc) return base+ABC_ACC[acc];
  const k=L_+o; if(k in accs) return base+accs[k];
  return base+(sig[L_]||0);
}
function abcLyrics(w){
  w=w.replace(/^\s*\d+\.\s*~?/,'').replace(/\\-/g,'\u2011');
  const out=[];
  for(const tok of w.match(/[^\s\-_*|]+-?|_|\*|\||-/g)||[]){ if(tok!=='-') out.push(tok.replace(/~/g,' ').replace(/\u2011/g,'-')); }
  return out;
}
function abcVoices(abc){
  const out=[]; const re=/^\[V:\s*([^\]\s]+)/gm; let m;
  while((m=re.exec(abc))) if(!out.includes(m[1])) out.push(m[1]);
  return out;
}

function abcParse(abc,voice){
  // One voice (the first by default): notes with midi (null = rest), length in quarter notes, verse syllables, bar/line flags.
  const head={}, blocks=[]; let voiceSeen=voice==null?null:voice, skipping=false, started=false;
  for(const ln of abc.replace(/\r/g,'').split('\n')){
    let s=ln.replace(/(^|[^\\])%.*$/,'$1').replace(/\s+$/,'');
    if(!s||s.startsWith('%')) continue;
    const m=/^([A-Za-z]):(.*)$/.exec(s);
    if(m){
      const f=m[1], v=m[2].trim();
      if(f==='K'&&!started){head.K=v; started=true; continue;}
      if(!started){ if(!(f in head)) head[f]=v; continue; }
      if(f==='V'){ const vid=v.split(/\s+/)[0]; if(voiceSeen==null) voiceSeen=vid; skipping=vid!==voiceSeen; continue; }
      if(f==='w'&&!skipping&&blocks.length) blocks[blocks.length-1][1].push(v);
      continue;
    }
    if(!started) continue;
    if(s.startsWith('[V:')){
      const vid=s.slice(3).split(']')[0].trim().split(/\s+/)[0];
      if(voiceSeen==null) voiceSeen=vid; skipping=vid!==voiceSeen; s=s.slice(s.indexOf(']')+1);
    }
    if(skipping) continue;
    blocks.push([s,[]]);
  }
  let M=head.M||'4/4'; if(M==='C') M='4/4'; if(M==='C|') M='2/2';
  let L;
  if('L' in head){ const [a,b]=head.L.split('/').map(Number); L=a/(b||1); }
  else { const [a,b]=M.split('/').map(Number); L=(a/b)<.75?1/16:1/8; if(!isFinite(L)) L=1/8; }
  const {sig,rootpc}=abcKeySig(head.K||'C');
  let notes=[];
  for(const [raw,wl] of blocks){
    const text=raw.replace(/"[^"]*"/g,'').replace(/![^!]*!/g,'').replace(/\+[^+]*\+/g,'').replace(/\{[^}]*\}/g,'').replace(/\[[A-Za-z]:[^\]]*\]/g,'');
    let i=0, accs={}, tup=null, broken=null, skipEnd=false; const line=[];
    while(i<text.length){
      const c=text[i];
      if(c==='['&&'12'.includes(text[i+1]||'x')){ skipEnd=text[i+1]==='1'; i+=2; continue; }
      if(c==='|'||c===':'){
        accs={}; let j=i; while(j<text.length&&'|:]'.includes(text[j])) j++;
        const bar=text.slice(i,j);
        if(j<text.length&&'12'.includes(text[j])&&text[j-1]==='|'){ skipEnd=text[j]==='1'; j++; }
        else if(bar.startsWith(':')||bar==='||'||bar==='|]') skipEnd=false;
        if(line.length) line[line.length-1].bar=true;
        i=j; continue;
      }
      if(c==='('&&/\d/.test(text[i+1]||'')){ const n=+text[i+1]; tup={left:n,f:n===3?2/3:n===2?3/2:(n-1)/n}; i+=2; continue; }
      if(c==='<'||c==='>'){ let k=1; while(text[i+k]===c) k++; broken=[c,k]; i+=k; continue; }
      if(c==='-'){ if(line.length) line[line.length-1].tie=true; i++; continue; }
      let note=null;
      if(c==='['){
        const j=text.indexOf(']',i); if(j<0){i++; continue;}
        const inner=text.slice(i+1,j), ms=[...inner.matchAll(/(\^\^|\^|__|_|=)?([A-Ga-g])([',]*)(\d*)(\/*)(\d*)/g)];
        const rest=/^(\d*)(\/*)(\d*)/.exec(text.slice(j+1));
        if(!ms.length){ i=j+1; continue; }
        let best=-1e9; for(const mm of ms) best=Math.max(best,abcPitch(mm[1],mm[2],mm[3],accs,sig));
        const d=abcDur(ms[0][4],ms[0][5],ms[0][6])*abcDur(rest[1],rest[2],rest[3]);
        for(const mm of ms) if(mm[1]) accs[mm[2].toUpperCase()+abcOct(mm[2],mm[3])]=ABC_ACC[mm[1]];
        note={midi:best,d:d*L*4}; i=j+1+rest[0].length;
      }else{
        const m=/^(\^\^|\^|__|_|=)?([A-Ga-gzx])([',]*)(\d*)(\/*)(\d*)/.exec(text.slice(i));
        if(!m||!m[0]){ i++; continue; }
        if('zx'.includes(m[2])) note={midi:null,d:abcDur(m[4],m[5],m[6])*L*4};
        else {
          const p=abcPitch(m[1],m[2],m[3],accs,sig);
          if(m[1]) accs[m[2].toUpperCase()+abcOct(m[2],m[3])]=ABC_ACC[m[1]];
          note={midi:p,d:abcDur(m[4],m[5],m[6])*L*4};
        }
        i+=m[0].length;
      }
      if(tup){ note.d*=tup.f; if(--tup.left===0) tup=null; }
      if(broken&&line.length){ const [ch,k]=broken, prev=line[line.length-1], f=1/Math.pow(2,k);
        if(ch==='>'){prev.d*=2-f; note.d*=f;} else {prev.d*=f; note.d*=2-f;} broken=null; }
      if(skipEnd) continue;
      line.push(note);
    }
    wl.forEach((w,vi)=>{
      const syl=abcLyrics(w); let k=0;
      for(const n of line){
        if(n.midi==null) continue;
        while(k<syl.length&&syl[k]==='|') k++;
        if(k<syl.length){ const t=syl[k++]; (n.vs=n.vs||{})[vi]=(t==='_'||t==='*')?'':t; if(vi===0) n.syl=n.vs[0]; }
      }
    });
    if(line.length) line[line.length-1].line=true;
    notes=notes.concat(line);
  }
  const out=[];
  for(const n of notes){
    const last=out[out.length-1];
    if(last&&last.tie&&n.midi===last.midi){ last.d+=n.d; last.tie=!!n.tie; if(n.bar) last.bar=true; if(n.line) last.line=true; continue; }
    out.push(Object.assign({},n));
  }
  return {head,rootpc,meter:M,notes:out};
}

function abcToSong(abc,id){
  // A songbook entry in the same shape as tools/build_songs.py writes, or throws an Error with a reason.
  const vids=abcVoices(abc), mel=abcParse(abc,vids[0]);
  const notes=mel.notes.slice(); while(notes.length&&notes[0].midi==null) notes.shift();
  const pitched=notes.filter(n=>n.midi!=null).map(n=>n.midi);
  if(pitched.length<4) throw new Error('No tune found. Check that the text is ABC notation with a K: (key) line before the notes.');
  const avg=pitched.reduce((a,b)=>a+b,0)/pitched.length;
  let ref=60+pitched[pitched.length-1]%12;
  while(avg-ref>7) ref+=12;
  while(avg-ref<-5) ref-=12;
  const total=notes.reduce((a,n)=>a+n.d,0), r4=x=>Math.round(x*1e4)/1e4;
  let nv=0; for(const n of notes) if(n.vs) nv=Math.max(nv,Math.max(...Object.keys(n.vs).map(Number))+1);
  const clean=x=>(x||'').replace(/\$\d\w?\$\d\s*/g,'').replace(/\$\d/g,'').trim();
  const verses=[]; for(let v=0;v<nv;v++){ const row=notes.map(n=>n.midi==null?'':clean((n.vs||{})[v])); if(row.some(Boolean)) verses.push(row); }
  const parts=[];
  for(const vid of vids.slice(1)){
    const p=abcParse(abc,vid).notes;
    if(Math.abs(p.reduce((a,n)=>a+n.d,0)-total)>1e-3) continue;
    parts.push(p.map(n=>[n.midi==null?null:n.midi-ref,r4(n.d)]));
  }
  const q=/(\d+)\/(\d+)\s*=\s*(\d+)/.exec(mel.head.Q||'')||/^\s*(\d+)\s*$/.exec(mel.head.Q||'');
  const bpm=q?(q.length>3?Math.round(+q[3]*(+q[1])/(+q[2])*4):+q[1]):100;
  const out=notes.map(n=>[n.midi==null?null:n.midi-ref,r4(n.d),clean(n.syl),(n.bar?'b':'')+(n.line?'l':'')]);
  if(!verses.length) verses.push(out.map(n=>n[2]));
  const title=(mel.head.T||'Untitled tune').trim();
  const comp=(abc.match(/^C:(.*)$/m)||[])[1];
  return {id:id||('user-'+Date.now().toString(36)),title,words:'',music:(comp||'').trim(),
    meter:mel.meter&&mel.meter!=='none'?mel.meter:'4/4',bpm:Math.max(30,Math.min(240,bpm||100)),
    first:out.map(n=>n[2]).filter(Boolean).join(' ').replace(/- /g,'').slice(0,60)||title,
    notes:out,verses,parts,user:true};
}
