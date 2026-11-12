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
