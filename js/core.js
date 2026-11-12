/* Harp Bench: music data, harp layouts, sound engine and voice handling */
"use strict";
/* ---------- music data ---------- */
const SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLAT =['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const MIX  =['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
const KEY_LABEL=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
const ORD=['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
const POS_NICK={1:'straight harp',2:'cross harp',3:'slant harp'};
const SCALES={blues:[0,3,5,6,7,10],minpent:[0,3,5,7,10],majpent:[0,2,4,7,9],major:[0,2,4,5,7,9,11],
  mixolydian:[0,2,4,5,7,9,10],dorian:[0,2,3,5,7,9,10],minor:[0,2,3,5,7,8,10],off:null};
const QUAL={maj:{iv:[0,4,7],s:''},min:{iv:[0,3,7],s:'m'},dim:{iv:[0,3,6],s:'dim'},'7':{iv:[0,4,7,10],s:'7'},
  m7:{iv:[0,3,7,10],s:'m7'},maj7:{iv:[0,4,7,11],s:'maj7'},'6':{iv:[0,4,7,9],s:'6'},sus4:{iv:[0,5,7],s:'sus4'},m7b5:{iv:[0,3,6,10],s:'m7♭5'}};
const DIA_CHORDS=[{d:0,q:'maj',r:'I'},{d:2,q:'min',r:'ii'},{d:4,q:'min',r:'iii'},{d:5,q:'maj',r:'IV'},{d:7,q:'maj',r:'V'},
  {d:9,q:'min',r:'vi'},{d:11,q:'dim',r:'vii°'},{d:7,q:'7',r:'V7'},{d:2,q:'m7',r:'ii7'}];
const ROW_NUM=['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0','Minus','Equal'];
const ROW_Q=['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight'];
const ROW_A=['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote','Backslash'];
/* Keyboard layouts. "numbers": hole n is the number key n (blow) and the letter right below it (draw). */
const LAYOUTS={
  numbers:{label:'Numbers 1–0',blow:ROW_NUM,draw:ROW_Q,chords:ROW_A.slice(0,10),keyDown:'ArrowLeft',keyUp:'ArrowRight'},
  letters:{label:'Letters Q–P',blow:ROW_Q,draw:ROW_A,chords:ROW_NUM.slice(0,10),keyDown:'Minus',keyUp:'Equal'}
};
const KL=()=>LAYOUTS[state.keys]||LAYOUTS.numbers;
const CODE_LABEL={BracketLeft:'[',BracketRight:']',Semicolon:';',Quote:"'",Backslash:'\\',Minus:'-',Equal:'=',ArrowLeft:'←',ArrowRight:'→'};
const codeLabel=c=>CODE_LABEL[c]||c.replace(/^(Key|Digit)/,'');
const BEND_CODES={KeyZ:1,KeyX:2,KeyC:3};

const state={type:'diatonic',key:0,rootOff:7,scale:'blues',mouth:'1',labels:'notes',overblows:false,snap:true,
  vol:.72,tone:.5,room:.28,vibrato:false,breathMode:'split',pocket:'auto',voice:'sweet',keys:'numbers',song:'amazing',songRate:1,notation:'letters',verse:0,songClick:true,countIn:true,backing:true,guide:false,loopLine:false,backVol:.6,progress:{},micGate:.01,userSongs:[],bpm:90,beats:4,feel:'straight',click:.6};
try{const s=JSON.parse(localStorage.getItem('harpbench')||'null'); if(s) Object.assign(state,s,{vibrato:false});}catch(e){}
function save(){try{localStorage.setItem('harpbench',JSON.stringify(state))}catch(e){}}

const names=()=>[7,2,9,4,11,6].includes(state.key)?SHARP:[5,10,3,8,1].includes(state.key)?FLAT:MIX;
const pc=m=>((Math.round(m)%12)+12)%12;
const nName=m=>names()[pc(m)];
const nOct=m=>Math.floor(Math.round(m)/12)-1;
const mtof=m=>440*Math.pow(2,(m-69)/12);

/* ---------- layout ---------- */
let L=null;
function buildLayout(){
  const off=((state.key+5)%12)-5, base=60+off, holes=[];
  if(state.type==='diatonic'){
    const B=[0,4,7,12,16,19,24,28,31,36], D=[2,7,11,14,17,21,23,26,29,33];
    for(let i=0;i<10;i++){
      const h={n:i+1,blow:base+B[i],draw:base+D[i],blowBend:0,drawBend:0,ob:null,od:null};
      if(h.draw>h.blow){h.drawBend=h.draw-h.blow-1; if([1,4,5,6].includes(h.n)) h.ob=h.draw+1;}
      else{h.blowBend=h.blow-h.draw-1; if([7,9,10].includes(h.n)) h.od=h.blow+1;}
      holes.push(h);
    }
  }else{
    for(let i=0;i<12;i++){const o=Math.floor(i/4);
      holes.push({n:i+1,blow:base+[0,4,7,12][i%4]+12*o,draw:base+[2,5,9,11][i%4]+12*o,blowBend:0,drawBend:0});}
  }
  return {holes,base,N:holes.length,chrom:state.type==='chromatic'};
}
function altMidi(h,breath){
  if(L.chrom) return h[breath]+1;
  if(!state.overblows) return null;
  return breath==='blow'?h.ob:h.od;
}
function depth(h,breath){return breath==='blow'?h.blowBend:h.drawBend}
function resolve(hi,breath,bend,alt){
  const h=L.holes[hi], pre=breath==='draw'?'-':'';
  if(alt){const m=altMidi(h,breath); if(m!=null) return {hi,breath,bend:0,alt:true,midi:m,tab:pre+h.n+(L.chrom?'<':'o')};}
  const b=Math.max(0,Math.min(bend,depth(h,breath)));
  return {hi,breath,bend:b,alt:false,midi:h[breath]-b,tab:pre+h.n+"'".repeat(Math.round(b))};
}
function chipKey(s){return s.hi+'|'+s.breath+'|'+Math.round(s.bend)+'|'+(s.alt?1:0)}

/* ---------- audio ---------- */
let ctx=null,bus,hand,handGain,wetGain,vibAmp,vibPitch,drift,noiseBuf,out,sat,eqHi,eqShelf,conv,backBus;
/* Voice presets. Each reed is one oscillator: det = tuning offset in cents, pan = stereo position, g = level.
   exp = harmonic roll-off (more negative = rounder), comb = reed-slot coloration, drive = saturation,
   bright = filter opening, breath = air noise, hi = presence EQ in dB. */
const VOICES={
  blues:  {label:'Blues',   exp:-.82, comb:.5,  drive:1.6, bright:1,   breath:1,   hi:3.5, reeds:[{det:0,pan:0,g:1}]},
  sweet:  {label:'Sweet',   exp:-1.3, comb:.22, drive:.7,  bright:.62, breath:.55, hi:.5,  reeds:[{det:-2.2,pan:-.3,g:.72},{det:2.2,pan:.3,g:.72}]},
  tremolo:{label:'Tremolo', exp:-1.08,comb:.32, drive:.9,  bright:.78, breath:.7,  hi:1.5, reeds:[{det:-9,pan:-.6,g:.72},{det:9,pan:.6,g:.72}]},
  octave: {label:'Octave',  exp:-1.0, comb:.35, drive:1,   bright:.8,  breath:.75, hi:2,   reeds:[{det:0,pan:-.25,g:.85},{det:1200,pan:.3,g:.42}]},
  // your own recordings (js/sampler.js); notes you have not recorded use the Sweet sound
  mine:   {label:'My harp', exp:-1.3, comb:.22, drive:.7,  bright:.62, breath:.55, hi:.5,  reeds:[{det:-2.2,pan:-.3,g:.72},{det:2.2,pan:.3,g:.72}]}
};
const waves={};
const voice=()=>VOICES[state.voice]||VOICES.blues;
function waveFor(v){
  const key=v.exp+'|'+v.comb; if(waves[key]) return waves[key];
  const N=64, re=new Float32Array(N), im=new Float32Array(N);
  for(let n=1;n<N;n++){let a=Math.pow(n,v.exp)*((1-v.comb)+v.comb*Math.abs(Math.sin(n*Math.PI*0.29)));
    if(n===2)a*=1.2; if(n===3)a*=1.1; im[n]=a*(n%2?1:-1); re[n]=a*0.12*(n%3?1:-1);}
  return waves[key]=ctx.createPeriodicWave(re,im);
}
function satCurve(drive){
  const c=new Float32Array(2048);
  for(let i=0;i<2048;i++){const x=i/1023.5-1; c[i]=drive<.05?x:Math.tanh(drive*x)/Math.tanh(drive);}
  return c;
}
function applyVoice(){
  if(!ctx) return; const v=voice(), now=ctx.currentTime;
  sat.curve=satCurve(v.drive);
  eqHi.gain.setTargetAtTime(v.hi,now,.05);
  eqShelf.gain.setTargetAtTime(v===VOICES.blues?-9:-12,now,.05);
}
function makeImpulse(sec){
  // Stereo room: short pre-delay, early reflections, then a tail that gets darker as it decays (air absorption).
  const sr=ctx.sampleRate, len=Math.floor(sr*sec), pre=Math.floor(sr*.014), buf=ctx.createBuffer(2,len,sr);
  for(let c=0;c<2;c++){const d=buf.getChannelData(c); let lp=0;
    for(let i=pre;i<len;i++){const t=(i-pre)/(len-pre);
      const k=.55-.47*t;                       // one-pole low-pass that closes over time
      lp+=k*((Math.random()*2-1)-lp);
      const fadeIn=Math.min(1,(i-pre)/(sr*.03));
      d[i]=lp*Math.exp(-5.2*t)*fadeIn*1.6;}
    for(const [ms,a] of [[9,.42],[17,.3],[23,.26],[31,.2],[44,.14],[57,.1]]){
      const j=pre+Math.floor(ms/1000*sr)+(c?Math.floor(sr*.0023):0); if(j<len) d[j]+=a*(c?-1:1)*((ms%2)?1:-1);}
  }
  return buf;
}
function initAudio(){
  if(ctx){ if(ctx.state!=='running') ctx.resume(); return; }
  const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
  try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(e){}
  ctx=new AC({latencyHint:'interactive'});
  noiseBuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
  {const d=noiseBuf.getChannelData(0); let b=0; for(let i=0;i<d.length;i++){const w=Math.random()*2-1; b=.6*b+.4*w; d[i]=w*.7+b*.3;}}
  bus=ctx.createGain(); bus.gain.value=1;
  const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=95;
  const p1=ctx.createBiquadFilter(); p1.type='peaking'; p1.frequency.value=1350; p1.Q.value=1.1; p1.gain.value=5;
  const p2=ctx.createBiquadFilter(); p2.type='peaking'; p2.frequency.value=3100; p2.Q.value=1.6; p2.gain.value=3.5; eqHi=p2;
  const p0=ctx.createBiquadFilter(); p0.type='peaking'; p0.frequency.value=520; p0.Q.value=.9; p0.gain.value=-2.5;
  const hs=ctx.createBiquadFilter(); hs.type='highshelf'; hs.frequency.value=7000; hs.gain.value=-9; eqShelf=hs;
  sat=ctx.createWaveShaper(); sat.curve=satCurve(1.6); sat.oversample='4x';
  hand=ctx.createBiquadFilter(); hand.type='lowpass'; hand.frequency.value=18000; hand.Q.value=.7;
  handGain=ctx.createGain(); handGain.gain.value=1;
  const comp=ctx.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=3; comp.attack.value=.004; comp.release.value=.18;
  conv=ctx.createConvolver(); conv.buffer=makeImpulse(2.1);
  wetGain=ctx.createGain(); wetGain.gain.value=state.room*.55;
  out=ctx.createGain(); out.gain.value=.9;
  bus.connect(hp).connect(p0).connect(p1).connect(p2).connect(hs).connect(sat).connect(hand).connect(handGain);
  handGain.connect(comp); handGain.connect(conv).connect(wetGain).connect(comp); comp.connect(out).connect(ctx.destination);
  // backing harmony skips the harmonica's tone shaping but shares the room and the limiter
  backBus=ctx.createGain(); backBus.gain.value=1; backBus.connect(comp); backBus.connect(conv);
  const lfo=ctx.createOscillator(); lfo.frequency.value=5.3;
  vibAmp=ctx.createGain(); vibAmp.gain.value=0; vibPitch=ctx.createGain(); vibPitch.gain.value=0;
  lfo.connect(vibAmp); lfo.connect(vibPitch); lfo.start();
  const dl=ctx.createOscillator(); dl.frequency.value=.37; drift=ctx.createGain(); drift.gain.value=2.5; dl.connect(drift); dl.start();
  setVibrato(state.vibrato); applyVoice();
}
function cutoffFor(f,bend){let c=f*(3+9*state.tone)*(.7+.6*state.vol)*(1-.17*bend)*voice().bright; return Math.max(380,Math.min(16000,c));}
function levelFor(s,count){
  let g=state.vol*.30/Math.sqrt(count);
  g*=1-.07*s.bend; if(s.alt&&!L.chrom) g*=.82;
  if(s.midi<57) g*=.85;
  return g;
}
function hold(p,now){ if(p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(now); else {const v=p.value; p.cancelScheduledValues(now); p.setValueAtTime(v,now);} }
function startVoice(s,count,delay,legato){
  initAudio(); if(!ctx) return null;
  if(state.voice==='mine'&&typeof samplerVoice==='function'){ const sv=samplerVoice(s,count,delay,legato); if(sv) return sv; }
  const t0=ctx.currentTime+.004+(delay||0), f=mtof(s.midi);
  const vp=voice(), wv=waveFor(vp);
  const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.Q.value=.8;
  // a bend is shaped by the throat: the tone turns darker and more "oo" the deeper it goes
  const bf=ctx.createBiquadFilter(); bf.type='peaking'; bf.Q.value=1.1; bf.frequency.setValueAtTime(f,t0); bf.gain.setValueAtTime(3.5*s.bend,t0);
  const bh=ctx.createBiquadFilter(); bh.type='highshelf'; bh.frequency.setValueAtTime(Math.min(8000,f*3),t0); bh.gain.setValueAtTime(-4*s.bend,t0);
  const oscs=vp.reeds.map(r=>{
    const o=ctx.createOscillator(); o.setPeriodicWave(wv); o.frequency.setValueAtTime(f,t0);
    if(!legato){o.detune.setValueAtTime(r.det-28,t0); o.detune.setTargetAtTime(r.det,t0,.028);} else o.detune.setValueAtTime(r.det,t0);
    const g=ctx.createGain(); g.gain.value=r.g; o.connect(g);
    if(ctx.createStereoPanner&&r.pan){const p=ctx.createStereoPanner(); p.pan.value=r.pan; g.connect(p).connect(lp);} else g.connect(lp);
    return o;
  });
  const cut=cutoffFor(f,s.bend); lp.frequency.setValueAtTime(cut*(legato?.7:.33),t0); lp.frequency.setTargetAtTime(cut,t0,legato?.02:.05);
  const env=ctx.createGain(), peak=levelFor(s,count); env.gain.setValueAtTime(0,t0); env.gain.setTargetAtTime(peak,t0,legato?.012:.024);
  const trem=ctx.createGain(); trem.gain.value=1;
  vibAmp.connect(trem.gain); oscs.forEach(o=>{vibPitch.connect(o.detune); drift.connect(o.detune);});
  lp.connect(bf).connect(bh).connect(env).connect(trem).connect(bus);
  const ns=ctx.createBufferSource(); ns.buffer=noiseBuf; ns.loop=true;
  const nb=ctx.createBiquadFilter(); nb.type='bandpass'; nb.frequency.value=Math.min(7000,Math.max(1600,f*3.4)); nb.Q.value=.9;
  const ng=ctx.createGain(); ng.gain.setValueAtTime(0,t0);
  const air=vp.breath;
  ng.gain.linearRampToValueAtTime(peak*air*(legato?.08:.32),t0+.012); ng.gain.setTargetAtTime(peak*air*(.05+.05*s.bend),t0+.016,.05);
  ns.connect(nb).connect(ng).connect(bus);
  oscs.forEach(o=>o.start(t0)); ns.start(t0,Math.random()*1.5);
  const v={s,count,
    set(s2){const now=ctx.currentTime, tau=s2.alt!==v.s.alt?.007:(state.snap?.035:.012);
      oscs.forEach(o=>o.frequency.setTargetAtTime(mtof(s2.midi),Math.max(now,t0),tau));
      lp.frequency.setTargetAtTime(cutoffFor(mtof(s2.midi),s2.bend),Math.max(now,t0),.04);
      bf.frequency.setTargetAtTime(mtof(s2.midi),Math.max(now,t0),.04); bf.gain.setTargetAtTime(3.5*s2.bend,Math.max(now,t0),.05);
      bh.frequency.setTargetAtTime(Math.min(8000,mtof(s2.midi)*3),Math.max(now,t0),.04); bh.gain.setTargetAtTime(-4*s2.bend,Math.max(now,t0),.05);
      env.gain.setTargetAtTime(levelFor(s2,v.count),Math.max(now,t0)+.001,.04);
      ng.gain.setTargetAtTime(levelFor(s2,v.count)*air*(.05+.06*s2.bend),Math.max(now,t0)+.02,.05);
      v.s=s2;},
    stop(at){const now=Math.max(ctx.currentTime,at||0); hold(env.gain,now); env.gain.setTargetAtTime(0,now,.038);
      hold(ng.gain,now); ng.gain.setTargetAtTime(0,now,.025);
      // a note may be stopped twice (scheduled release, then the player stops the song); some browsers reject a second stop()
      oscs.forEach(o=>{try{o.stop(now+.45)}catch(e){}}); try{ns.stop(now+.45)}catch(e){}
      oscs[0].onended=()=>{try{vibAmp.disconnect(trem.gain)}catch(e){} oscs.forEach(o=>{try{vibPitch.disconnect(o.detune)}catch(e){} try{drift.disconnect(o.detune)}catch(e){}});};}
  };
  return v;
}
function setVibrato(on){
  if(!ctx) return; const now=ctx.currentTime;
  vibAmp.gain.setTargetAtTime(on?.32:0,now,on?.12:.06);
  vibPitch.gain.setTargetAtTime(on?9:0,now,on?.15:.06);
}
let cupHeld=false;
function setCup(on){
  cupHeld=on; $('cupBtn').setAttribute('aria-pressed',on);
  initAudio(); if(!ctx) return; const now=ctx.currentTime;
  hand.frequency.setTargetAtTime(on?650:18000,now,on?.05:.09);
  hand.Q.setTargetAtTime(on?4.5:.7,now,.05);
  handGain.gain.setTargetAtTime(on?.72:1,now,.06);
}

/* ---------- touches / voices ---------- */
const touches=new Map();
let lastReadout=null;
function setTouch(id,specs,opts={}){
  let t=touches.get(id); if(!t){t={voices:new Map(),meta:null}; touches.set(id,t);}
  const keep=new Set();
  specs.forEach((s,i)=>{
    const key=opts.indexKeys?'i'+i:s.hi+s.breath; keep.add(key);
    const v=t.voices.get(key);
    if(v){v.count=specs.length; v.set(s);}
    else{const nv=startVoice(s,specs.length,opts.stagger?i*opts.stagger:0,opts.legato); if(nv) t.voices.set(key,nv);}
  });
  for(const [k,v] of t.voices) if(!keep.has(k)){v.stop(); t.voices.delete(k);}
  songHeard(id,t,specs);
  t.specs=specs; t.label=opts.label||null; t.mouthShow=!!opts.mouth;
  refreshLights(); showReadout(specs,opts.label);
}
function endTouch(id){const t=touches.get(id); if(!t) return; t.voices.forEach(v=>v.stop()); touches.delete(id); refreshLights();}
function endAll(){for(const id of [...touches.keys()]) endTouch(id); keysDown.clear(); bendHeld.clear(); shiftHeld=false; slideHeld=false; altHeld=false; leftHeld=false; leftK=0; updateSlideBtn(); document.querySelectorAll('.pk-btn.held').forEach(b=>b.classList.remove('held'));
  document.querySelectorAll('.pad.down').forEach(p=>p.classList.remove('down'));}

function showReadout(specs,label){
  if(!specs.length) return;
  const nEl=$('npNote'), tEl=$('npTab'), hEl=$('npHz');
  if(specs.length===1&&!label){
    const s=specs[0], m=s.midi, r=Math.round(m), cents=Math.round((m-r)*100);
    nEl.classList.remove('long'); nEl.innerHTML=nName(r)+'<sub>'+nOct(r)+'</sub>';
    tEl.textContent=s.tab+(s.alt?(L.chrom?'  slide in':(s.breath==='blow'?'  overblow':'  overdraw')):s.bend>0?'  bend':'');
    hEl.textContent=mtof(m).toFixed(1)+' Hz'+(cents?'  ('+(cents>0?'+':'')+cents+'¢)':'');
  }else{
    nEl.textContent=label||specs.map(s=>nName(s.midi)).join(' '); nEl.classList.toggle('long',nEl.textContent.length>4);
    tEl.textContent=specs.map(s=>s.tab).join(' ');
    hEl.textContent=specs.map(s=>nName(s.midi)+nOct(s.midi)).join(' · ');
  }
  if(pocketOpen()){ const r=Math.round(specs[0].midi); $('pkNote').innerHTML=label||(specs.length===1?nName(r)+'<sub style="font-size:.55em">'+nOct(r)+'</sub>':specs.map(s=>nName(s.midi)).join(' '));
    $('pkTab').textContent=specs.map(s=>s.tab).join(' '); }
}

