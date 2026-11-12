/* Harp Bench: song transport. Listen and Play along run on the audio clock, so the melody,
   the metronome clicks, the count-in and the backing harmony stay locked together. */
"use strict";
const tp={on:false,mode:null,timer:null,events:[],idx:0,iter:0,anchor:0,spb:0,a:0,b:0,
  voices:[],ui:[],pending:[],onsets:[],grades:{},grid:null,loop:false};

function backingVoice(midi,at,len){
  // A soft reed-organ tone for the alto, tenor and bass parts
  const f=mtof(midi), o1=ctx.createOscillator(), o2=ctx.createOscillator(), g2=ctx.createGain(), lp=ctx.createBiquadFilter(), g=ctx.createGain();
  o1.type='triangle'; o2.type='sine'; o1.frequency.value=f; o2.frequency.value=f*2; g2.gain.value=.28;
  lp.type='lowpass'; lp.frequency.value=Math.min(3800,f*6); lp.Q.value=.5;
  o1.connect(lp); o2.connect(g2).connect(lp); lp.connect(g).connect(backBus);
  const v=state.backVol*.09, end=at+Math.max(.08,len);
  g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(v,at+.05);
  g.gain.setValueAtTime(v,Math.max(at+.05,end-.07)); g.gain.linearRampToValueAtTime(0,end);
  o1.start(at); o2.start(at); o1.stop(end+.05); o2.stop(end+.05);
  return {stop(){const n=ctx.currentTime; try{g.gain.cancelScheduledValues(n); g.gain.setTargetAtTime(0,n,.03); o1.stop(n+.2); o2.stop(n+.2);}catch(e){}}};
}

function tpUi(at,fn){ tp.ui.push(setTimeout(fn,Math.max(0,(at-ctx.currentTime)*1000))); }
function tpAudioAt(t){ return tp.anchor+(t-tp.a+tp.iter*(tp.b-tp.a))*tp.spb; }
function tpTonic(){ return song.tonic+song.shift; }

function tpBuildEvents(s,g){
  const ev=[];
  if(state.songClick) beatsBetween(g,tp.a,tp.b).forEach(bt=>ev.push({t:bt.t,k:'click',bt}));
  for(let i=tp.i0;i<=tp.i1;i++) ev.push({t:g.starts[i],k:'mel',i,d:s.notes[i][1]});
  if(state.backing) s.parts.forEach(p=>{let t=0;
    for(const [rel,d] of p){ if(rel!=null&&t+d>tp.a+1e-9&&t<tp.b-1e-9){const st=Math.max(t,tp.a); ev.push({t:st,k:'part',rel,d:Math.min(t+d,tp.b)-st});} t+=d; }});
  return ev.sort((x,y)=>x.t-y.t);
}

function tpStart(mode){
  // mode: 'listen' (the app plays the melody) or 'along' (you play, the app keeps time and grades)
  initAudio(); if(!ctx||!song.cur) return;
  tpStop(true);
  const s=song.cur, g=songGrid(s);
  tp.grid=g; tp.spb=60/(s.bpm*state.songRate); tp.mode=mode;
  // start at the line holding the selected note; with Loop on, repeat that line
  const lines=lineRanges(s), line=lines.find(([x,y])=>song.pos>=x&&song.pos<=y)||lines[0];
  if(state.loopLine||song.pos>0){ tp.i0=line[0]; } else tp.i0=0;
  tp.i1=state.loopLine?line[1]:s.notes.length-1;
  tp.a=g.starts[tp.i0]; tp.b=tp.i1+1<s.notes.length?g.starts[tp.i1+1]:g.total; tp.loop=!!state.loopLine;
  if(metro.on) metroToggle(false);                    // the song's own click replaces the free metronome
  state.bpm=Math.round(s.bpm*state.songRate/g.beat); state.beats=[2,3,4,6].includes(g.perBar)?g.perBar:4; state.feel='straight';
  save(); renderMetroState();
  const cs=state.countIn?countInStart(g,tp.a):tp.a;
  tp.anchor=ctx.currentTime+.15+(tp.a-cs)*tp.spb;
  tp.iter=0; tp.idx=0; tp.pending=[]; tp.onsets=[]; tp.grades={};
  if(state.countIn) beatsBetween(g,cs,tp.a).forEach(bt=>{const at=tp.anchor+(bt.t-tp.a)*tp.spb; clickAt(at,bt.down&&g.perBar>1?'accent':'beat'); tpUi(at,()=>litBeat(bt.beatInBar));});
  tp.events=tpBuildEvents(s,g);
  song.mode=mode; song.pos=tp.i0; tp.on=true;
  document.querySelectorAll('#sbScore .nc').forEach(c=>c.classList.remove('g-good','g-early','g-late','g-miss'));
  updateSongButtons(); songMark();
  tpTick(); tp.timer=setInterval(tpTick,25);
}

function tpSchedule(ev,at){
  const s=song.cur;
  if(ev.k==='click'){ clickAt(at,ev.bt.down&&tp.grid.perBar>1?'accent':'beat'); tpUi(at,()=>litBeat(ev.bt.beatInBar)); return; }
  if(ev.k==='part'){ tp.voices.push(backingVoice(tpTonic()+ev.rel,at,ev.d*tp.spb*.97)); return; }
  // melody note
  const sp=song.specs[ev.i], len=ev.d*tp.spb;
  if(sp&&(tp.mode==='listen'||state.guide)){
    const v=startVoice(sp,tp.mode==='listen'?1:5,at-ctx.currentTime,false);
    if(v){ v.stop(at+len*.92); tp.voices.push(v); }
  }
  if(sp&&tp.mode==='along') tp.pending.push({i:ev.i,at,midi:Math.round(sp.midi),end:at+Math.min(.4,Math.max(.18,len*.6))});
  tpUi(at,()=>{
    song.pos=ev.i;
    if(tp.mode==='listen'&&sp){ touches.set('song',{voices:new Map(),specs:[sp],mouthShow:true}); refreshLights(); showReadout([sp]); }
    songMark();
  });
  if(tp.mode==='listen'&&sp) tpUi(at+len*.92,()=>{ if(song.pos===ev.i){touches.delete('song'); refreshLights();} });
}

function tpTick(){
  if(!tp.on) return;
  const horizon=ctx.currentTime+.2;
  while(tp.events.length){
    if(tp.idx>=tp.events.length){ if(!tp.loop) break; tp.iter++; tp.idx=0; }
    const ev=tp.events[tp.idx], at=tpAudioAt(ev.t);
    if(at>horizon) break;
    tpSchedule(ev,at); tp.idx++;
  }
  tpGrade();
  if(!tp.loop&&tp.idx>=tp.events.length&&ctx.currentTime>tpAudioAt(tp.b)+.35) tpFinish();
}

/* ---------- play-along grading ---------- */
function tpNoteOn(midi){
  // Called when the player starts a note (screen, keyboard or microphone)
  if(tp.on&&tp.mode==='along') tp.onsets.push({m:Math.round(midi),t:ctx.currentTime});
}
function tpGrade(){
  if(tp.mode!=='along') return;
  const now=ctx.currentTime;
  tp.pending=tp.pending.filter(p=>{
    if(now<p.end) return true;
    let best=null;
    for(const o of tp.onsets) if(o.m===p.midi&&o.t>=p.at-.22&&o.t<=p.end&&(!best||Math.abs(o.t-p.at)<Math.abs(best.t-p.at))) best=o;
    const g=!best?'miss':Math.abs(best.t-p.at)<=.12?'good':best.t<p.at?'early':'late';
    tp.grades[p.i]=g;
    const c=document.querySelector(`#sbScore .nc[data-i="${p.i}"]`);
    if(c){c.classList.remove('g-good','g-early','g-late','g-miss'); c.classList.add('g-'+g);}
    songMark(false);
    return false;
  });
  tp.onsets=tp.onsets.filter(o=>o.t>now-2);
}
function tpTally(){
  const v=Object.values(tp.grades), good=v.filter(x=>x==='good').length, off=v.filter(x=>x==='early'||x==='late').length, miss=v.filter(x=>x==='miss').length;
  const total=v.length, score=total?Math.round((good+off*.5)/total*100):0;
  return {good,off,miss,total,score};
}

function tpFinish(){
  const mode=tp.mode, tally=tpTally();
  tpStop(true);
  if(mode==='along'&&tally.total){
    const pr=state.progress[song.cur.id]||{best:0,plays:0};
    pr.plays++; pr.last=tally.score; pr.best=Math.max(pr.best,tally.score); pr.date=new Date().toISOString().slice(0,10);
    state.progress[song.cur.id]=pr; save();
    song.result=tally; song.mode='result';
  } else { song.mode='idle'; song.pos=0; }
  updateSongButtons(); songMark(false); renderSongList();
}

function tpStop(quiet){
  tp.on=false; clearInterval(tp.timer); tp.ui.forEach(clearTimeout); tp.ui=[];
  if(ctx) tp.voices.forEach(v=>{try{v.stop()}catch(e){}});
  tp.voices=[]; tp.pending=[];
  if(touches.has('song')&&!touches.get('song').voices.size){touches.delete('song'); refreshLights();}
  litBeat(-1);
  if(!quiet){ song.mode='idle'; updateSongButtons(); songMark(false); }
}
