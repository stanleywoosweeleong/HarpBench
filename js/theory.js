/* Harp Bench: music logic with no page access (reeds, chord voicings, hymn tabbing), so it can be tested in Node. */
"use strict";
function allReeds(){
  const map=new Map();
  const add=(s,cost)=>{const m=Math.round(s.midi), cur=map.get(m); if(!cur||cost<cur.cost) map.set(m,{s,cost});};
  L.holes.forEach((h,hi)=>{for(const br of ['blow','draw']){
    add(resolve(hi,br,0,false),0);
    for(let b=1;b<=depth(h,br);b++) add(resolve(hi,br,b,false),1.1*b);
    if(altMidi(h,br)!=null) add(resolve(hi,br,0,true),L.chrom?.6:2.5);
  }});
  return map;
}
function voiceChord(rootPc,iv){
  const pcs=iv.map(x=>(rootPc+x)%12), need=pcs.length;
  const sets=[['blow',false],['draw',false]]; if(L.chrom) sets.push(['blow',true],['draw',true]);
  const pref=L.chrom?4.5:3.5;
  let best=null;
  for(const [br,alt] of sets){
    const row=L.holes.map((h,hi)=>resolve(hi,br,0,alt));
    for(let a=0;a<L.N;a++) for(let len=2;len<=4&&a+len<=L.N;len++){
      const w=row.slice(a,a+len); if(!w.every(s=>pcs.includes(pc(s.midi)))) continue;
      const distinct=new Set(w.map(s=>pc(s.midi))).size; if(distinct<need) continue;
      const score=distinct*10+(pc(w[0].midi)===rootPc?3:0)+len*.8-Math.abs(a+(len-1)/2-pref)*.3-(alt?1.5:0);
      if(!best||score>best.score) best={score,specs:w};
    }
  }
  if(best) return {kind:'block',specs:best.specs};
  // roll across holes
  const reeds=allReeds(); const basePc=pc(L.base); let roll=null;
  for(let o=0;o<3;o++){
    const r=L.base+((rootPc-basePc+12)%12)+12*o; let cost=0, specs=[];
    for(const x of iv){const m=r+x, e=reeds.get(m); if(!e){cost=1e9;break;} cost+=e.cost; specs.push(e.s);}
    if(new Set(specs.map(s=>s.hi+s.breath)).size<specs.length) cost+=3;
    cost+=Math.abs(r-(L.base+14))*.08;
    if(cost<1e9&&(!roll||cost<roll.cost)) roll={cost,specs};
  }
  return roll?{kind:'roll',specs:roll.specs}:{kind:'none',specs:[]};
}
function chordName(rootPc,q){return names()[rootPc]+QUAL[q].s}
const JIANPU=['1','#1','2','b3','3','4','#4','5','#5','6','b7','7'];
/* Positions offered for hymns: the song's home note sits this many semitones above the harp key. */
const SONG_POS=[[0,'1st'],[7,'2nd'],[2,'3rd'],[5,'12th']];
function mapSong(s,rootOff){
  // The hymn's home note follows "Play in" (the position). Pick the octave that needs the fewest bends.
  if(rootOff==null) rootOff=state.rootOff;
  const reeds=allReeds(), tonic=L.base+rootOff; let best=null;
  for(const o of [-24,-12,0,12,24]){
    let cost=0, specs=[];
    for(const n of s.notes){
      if(n[0]==null){specs.push(null); continue;}
      const e=reeds.get(tonic+o+n[0]); if(!e){cost+=100; specs.push(null); continue;}
      cost+=e.cost; specs.push(e.s);
    }
    const mids=s.notes.filter(n=>n[0]!=null).map(n=>tonic+o+n[0]);
    cost+=Math.abs(mids.reduce((a,b)=>a+b,0)/mids.length-(L.base+15))*.04;
    if(!best||cost<best.cost) best={cost,specs,o,tonic};
  }
  return best;
}
function songHardness(s,m){
  const sp=m.specs.filter(Boolean), bends=sp.filter(x=>x.bend>0).length, alts=sp.filter(x=>x.alt).length,
    miss=s.notes.filter((n,i)=>n[0]!=null&&!m.specs[i]).length;
  const hard=L.chrom?miss*5:bends+alts+miss*5;
  return {bends,alts,miss,hard,label:hard===0?'Easy':hard<=5?'Some bends':'Advanced',level:hard===0?'easy':hard<=5?'mid':'hard'};
}
function withOverblows(on,fn){const was=state.overblows; state.overblows=on; try{return fn();}finally{state.overblows=was;}}
function bestPosition(s){
  // Rate positions as if overblows were available, since the songbook switches them on when a hymn needs them.
  return withOverblows(!L.chrom,()=>{
    let best=null;
    for(const [off] of SONG_POS){const h=songHardness(s,mapSong(s,off)); if(!best||h.hard<best.h.hard) best={off,h};}
    return best;
  });
}
function needsOverblows(s,off){
  if(L.chrom) return false;
  const without=withOverblows(false,()=>songHardness(s,mapSong(s,off)).miss);
  const withOb=withOverblows(true,()=>songHardness(s,mapSong(s,off)).miss);
  return without>0&&withOb<without;
}
function jp(rel){const o=Math.floor(rel/12), p=((rel%12)+12)%12; return JIANPU[p]+(o>0?'̇'.repeat(o):o<0?'̣'.repeat(-o):'');}

/* ---------- song timing (all times in quarter notes from the first note) ---------- */
function meterInfo(meter){
  // beat = length of one counted beat; 6/8, 9/8 and 12/8 are counted in dotted quarters
  const [num,den]=String(meter||'4/4').split('/').map(Number);
  const unit=4/(den||4);
  if(den===8&&num%3===0&&num>3) return {beat:1.5,perBar:num/3,barLen:num*unit};
  return {beat:unit,perBar:num||4,barLen:(num||4)*unit};
}
function songGrid(s){
  // Note start times plus the pickup (the notes before the first bar line), so beat 1 lands on the first full bar.
  const mi=meterInfo(s.meter), starts=[]; let t=0, pickup=null;
  for(const n of s.notes){starts.push(t); t+=n[1]; if(pickup==null&&n[3].includes('b')) pickup=t;}
  if(pickup==null||pickup>=mi.barLen-1e-9) pickup=0;
  return {beat:mi.beat,perBar:mi.perBar,barLen:mi.barLen,pickup,starts,total:t};
}
function lineRanges(s){
  // [first, last] note index of each printed line
  const r=[]; let i0=0;
  s.notes.forEach((n,i)=>{if(n[3].includes('l')||i===s.notes.length-1){r.push([i0,i]); i0=i+1;}});
  return r;
}
function beatsBetween(g,a,b){
  // Metronome beats in [a, b): time, whether it is beat 1, and the beat number within the bar (0-based)
  const out=[];
  for(let k=Math.ceil((a-g.pickup)/g.beat-1e-9);;k++){
    const t=g.pickup+k*g.beat; if(t>=b-1e-9) break;
    const inBar=((k%g.perBar)+g.perBar)%g.perBar;
    out.push({t,down:inBar===0,beatInBar:inBar});
  }
  return out;
}
function countInStart(g,a){
  // One full bar of count-in before the bar that contains song time a
  const k=Math.floor((a-g.pickup)/g.barLen+1e-9);
  return g.pickup+k*g.barLen-g.barLen;
}

/* ---------- recorded notes ("My harp") ---------- */
function samplerLoop(len,sampleRate,f0){
  // Loop a whole number of pitch periods from the steady middle of a recorded note, so it can sustain without a click.
  const period=sampleRate/f0, start=Math.round(len*.35);
  const n=Math.max(1,Math.floor((len*.85-start)/period));
  return {start,end:Math.round(start+n*period)};
}
function nearestSample(keys,midi,maxGap){
  // Closest recorded note to play this pitch from (it is pitch-shifted the rest of the way)
  let best=null;
  for(const k of keys){ const d=Math.abs(k-midi); if(d<=maxGap&&(best==null||d<Math.abs(best-midi))) best=k; }
  return best;
}

/* ---------- recording: 16-bit PCM WAV ---------- */
function floatToInt16(x){ x=x>1?1:x<-1?-1:(x||0); return x<0?Math.round(x*32768):Math.round(x*32767); }
function encodeWav(chunks,sampleRate,channels){
  // chunks: Int16Array pieces of interleaved samples. Returns the bytes of a standard WAV file.
  let n=0; for(const c of chunks) n+=c.length;
  const bytes=new Uint8Array(44+n*2), v=new DataView(bytes.buffer);
  const str=(o,s)=>{for(let i=0;i<s.length;i++) bytes[o+i]=s.charCodeAt(i);};
  str(0,'RIFF'); v.setUint32(4,36+n*2,true); str(8,'WAVE');
  str(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,channels,true);
  v.setUint32(24,sampleRate,true); v.setUint32(28,sampleRate*channels*2,true); v.setUint16(32,channels*2,true); v.setUint16(34,16,true);
  str(36,'data'); v.setUint32(40,n*2,true);
  let o=44; for(const c of chunks) for(let i=0;i<c.length;i++,o+=2) v.setInt16(o,c[i],true);
  return bytes;
}
