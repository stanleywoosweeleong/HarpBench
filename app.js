(() => {
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
  vol:.72,tone:.5,room:.28,vibrato:false,breathMode:'split',pocket:'auto',voice:'sweet',keys:'numbers',bpm:90,beats:4,feel:'straight',click:.6};
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
let ctx=null,bus,hand,handGain,wetGain,vibAmp,vibPitch,drift,noiseBuf,out,sat,eqHi,eqShelf,conv;
/* Voice presets. Each reed is one oscillator: det = tuning offset in cents, pan = stereo position, g = level.
   exp = harmonic roll-off (more negative = rounder), comb = reed-slot coloration, drive = saturation,
   bright = filter opening, breath = air noise, hi = presence EQ in dB. */
const VOICES={
  blues:  {label:'Blues',   exp:-.82, comb:.5,  drive:1.6, bright:1,   breath:1,   hi:3.5, reeds:[{det:0,pan:0,g:1}]},
  sweet:  {label:'Sweet',   exp:-1.3, comb:.22, drive:.7,  bright:.62, breath:.55, hi:.5,  reeds:[{det:-2.2,pan:-.3,g:.72},{det:2.2,pan:.3,g:.72}]},
  tremolo:{label:'Tremolo', exp:-1.08,comb:.32, drive:.9,  bright:.78, breath:.7,  hi:1.5, reeds:[{det:-9,pan:-.6,g:.72},{det:9,pan:.6,g:.72}]},
  octave: {label:'Octave',  exp:-1.0, comb:.35, drive:1,   bright:.8,  breath:.75, hi:2,   reeds:[{det:0,pan:-.25,g:.85},{det:1200,pan:.3,g:.42}]}
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
  const t0=ctx.currentTime+.004+(delay||0), f=mtof(s.midi);
  const vp=voice(), wv=waveFor(vp);
  const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.Q.value=.8;
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
  lp.connect(env).connect(trem).connect(bus);
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
      env.gain.setTargetAtTime(levelFor(s2,v.count),Math.max(now,t0)+.001,.04);
      ng.gain.setTargetAtTime(levelFor(s2,v.count)*air*(.05+.06*s2.bend),Math.max(now,t0)+.02,.05);
      v.s=s2;},
    stop(){const now=ctx.currentTime; hold(env.gain,now); env.gain.setTargetAtTime(0,now,.038);
      hold(ng.gain,now); ng.gain.setTargetAtTime(0,now,.025);
      oscs.forEach(o=>o.stop(now+.45)); ns.stop(now+.45);
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

/* ---------- DOM ---------- */
const $=id=>document.getElementById(id);
let chipEls=new Map(), holeEls=[];
function rowsNeeded(){
  let top=1,bot=1;
  for(const h of L.holes){
    top=Math.max(top,1+Math.max(h.blowBend,altMidi(h,'blow')!=null&&!h.blowBend?1:0));
    bot=Math.max(bot,1+Math.max(h.drawBend,altMidi(h,'draw')!=null&&!h.drawBend?1:0));
  }
  return {top,bot};
}
function chipSpecsFor(hi,breath){
  const h=L.holes[hi], list=[resolve(hi,breath,0,false)];
  const d=depth(h,breath);
  for(let b=1;b<=d;b++) list.push(resolve(hi,breath,b,false));
  if(!d&&altMidi(h,breath)!=null) list.push(resolve(hi,breath,0,true));
  return list;
}
function render(){
  L=buildLayout();
  const N=L.N, app=$('app'), stage=$('stage');
  app.classList.toggle('chromatic',L.chrom); app.classList.toggle('tabmode',state.labels==='tab');
  const narrow=window.innerWidth<640;
  stage.style.setProperty('--n',N);
  stage.style.setProperty('--capL',(narrow?20:34)+'px');
  stage.style.setProperty('--capR',(L.chrom?(narrow?52:66):(narrow?20:34))+'px');
  const {top,bot}=rowsNeeded();
  const tg=$('topGrid'), bg=$('botGrid'); tg.innerHTML=''; bg.innerHTML='';
  tg.style.gridTemplateRows=`repeat(${top},var(--chip-h))`; bg.style.gridTemplateRows=`repeat(${bot},var(--chip-h))`;
  chipEls=new Map();
  const scale=SCALES[state.scale], root=(state.key+state.rootOff)%12;
  for(let hi=0;hi<N;hi++){
    for(const breath of ['blow','draw']){
      chipSpecsFor(hi,breath).forEach((s,j)=>{
        const el=document.createElement('div'); el.className='chip';
        if(j>0) el.classList.add(s.alt?'alt':'bend');
        const p=pc(s.midi);
        if(scale){ if(p===root) el.classList.add('root'); else if(!scale.includes((p-root+12)%12)) el.classList.add('out'); }
        el.innerHTML=state.labels==='tab'?s.tab:nName(s.midi)+(j===0?'':'');
        el.title=`${s.tab}  ·  ${nName(s.midi)}${nOct(s.midi)}`;
        el.style.gridColumn=hi+1;
        el.style.gridRow=breath==='blow'?(top-j):(j+1);
        (breath==='blow'?tg:bg).appendChild(el);
        chipEls.set(chipKey(s),el);
      });
    }
  }
  // plates + comb
  const pt=$('plateTop'), pb=$('plateBot'), comb=$('comb');
  pt.innerHTML=''; pb.innerHTML='';
  for(let i=0;i<N;i++){const n=document.createElement('div'); n.className='num'; n.textContent=i+1; pt.appendChild(n);}
  const ks=document.createElement('span'); ks.className='keystamp'; ks.textContent=KEY_LABEL[state.key];
  ks.style.right=L.chrom?'78px':(narrow?'4px':'10px'); if(narrow&&L.chrom) ks.style.right='56px';
  pt.appendChild(ks);
  const eg=document.createElement('div'); eg.className='engrave';
  eg.innerHTML=L.chrom?`<span>Harp Bench</span><span>·</span><span>Solo 12</span><span>·</span><span>${KEY_LABEL[state.key]}</span>`
    :`<span>Harp Bench</span><span>·</span><span>Richter</span><span>·</span><span>${KEY_LABEL[state.key]}</span>`;
  pb.appendChild(eg);
  comb.querySelectorAll('.hole,.slide').forEach(e=>e.remove());
  holeEls=[];
  for(let i=0;i<N;i++){const h=document.createElement('div'); h.className='hole'; h.innerHTML='<div class="slot"></div>'; comb.appendChild(h); holeEls.push(h);}
  const harp=$('harp'); harp.querySelector('.slide')?.remove();
  if(L.chrom){
    const sb=document.createElement('button'); sb.className='slide'; sb.id='slideBtn'; sb.textContent='SLIDE'; sb.setAttribute('aria-label','Slide button (hold, or hold Shift)');
    sb.addEventListener('pointerdown',e=>{e.stopPropagation(); e.preventDefault(); sb.setPointerCapture(e.pointerId); slideHeld=true; updateSlideBtn(); refreshAll();});
    const up=e=>{e.stopPropagation(); slideHeld=false; updateSlideBtn(); refreshAll();};
    sb.addEventListener('pointerup',up); sb.addEventListener('pointercancel',up);
    harp.appendChild(sb);
  }
  // header text
  const posN=posNumber();
  $('benchInfo').innerHTML=L.chrom
    ? `<b>${KEY_LABEL[state.key]} chromatic</b> · solo tuning, ${nName(L.base)}${nOct(L.base)}–${nName(L.base+36)}${nOct(L.base+36)} · playing in <b>${nName(root)}</b>`
    : `<b>${KEY_LABEL[state.key]} diatonic</b> · Richter tuning · <b>${nName(root)}</b>, ${ORD[posN-1]} position${POS_NICK[posN]?' ('+POS_NICK[posN]+')':''}`;
  $('benchHint').textContent=L.chrom?'Upper half blows, lower half draws. Hold the slide (or Shift) for sharps.':'Upper half blows, lower half draws. Drag away from the harp to bend.';
  $('lgBend').hidden=L.chrom;
  $('lgAlt').hidden=!L.chrom&&!state.overblows;
  $('lgAltTxt').textContent=L.chrom?'Slide in (a semitone up)':'Overblow / overdraw';
  $('legend').querySelectorAll(':scope > span:nth-child(-n+3)').forEach(e=>e.hidden=!scale);
  $('obBtn').hidden=L.chrom; $('snapBtn').hidden=L.chrom;
  $('modShift').innerHTML=L.chrom?'<kbd>Shift</kbd> push the slide in':'<kbd>Shift</kbd> overblow / overdraw (when on)';
  renderControls(); renderPads(); renderKeymap(); renderPocket(); refreshLights();
}
function posNumber(){for(let n=1;n<=12;n++) if((7*(n-1))%12===state.rootOff) return n; return 1;}
function renderControls(){
  $('tDia').setAttribute('aria-pressed',state.type==='diatonic'); $('tChr').setAttribute('aria-pressed',state.type==='chromatic');
  const kr=$('keyRow'); if(!kr.children.length){KEY_LABEL.forEach((k,i)=>{const b=document.createElement('button'); b.id='key'+i; b.textContent=k; b.addEventListener('click',()=>{state.key=i; changed();}); kr.appendChild(b);});}
  [...kr.children].forEach((b,i)=>b.setAttribute('aria-pressed',i===state.key));
  const ps=$('posSel'); ps.innerHTML='';
  for(let n=1;n<=12;n++){const off=(7*(n-1))%12, o=document.createElement('option'); o.value=off;
    const nm=names()[(state.key+off)%12];
    o.textContent=L.chrom?nm:`${nm} · ${ORD[n-1]} position${POS_NICK[n]?' ('+POS_NICK[n]+')':''}`; ps.appendChild(o);}
  if(L.chrom){[...ps.options].sort((a,b)=>a.value-b.value).forEach(o=>ps.appendChild(o));}
  ps.value=state.rootOff;
  $('scaleSel').value=state.scale;
  document.querySelectorAll('#mouthSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===state.mouth));
  document.querySelectorAll('#labelSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.l===state.labels));
  document.querySelectorAll('#voiceSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===state.voice));
  $('obBtn').setAttribute('aria-pressed',state.overblows); $('snapBtn').setAttribute('aria-pressed',state.snap);
  $('vibBtn').setAttribute('aria-pressed',state.vibrato);
  const cr=$('cRoot'); const keep=cr.value; cr.innerHTML=''; names().forEach((n,i)=>{const o=document.createElement('option'); o.value=i; o.textContent=n; cr.appendChild(o);}); cr.value=keep||'2';
  $('vol').value=state.vol; $('tone').value=state.tone; $('room').value=state.room;
}
function refreshLights(){
  const on=new Set(), holesOn=new Map(); let mouthLo=null,mouthHi=null,tongue=new Set();
  for(const t of touches.values()){
    for(const s of t.specs||[]){on.add(chipKey(s)); holesOn.set(s.hi,s.breath);}
    if(t.mouthShow&&t.specs&&t.specs.length){
      const his=t.specs.map(s=>s.hi); const lo=Math.min(...his), hi=Math.max(...his);
      mouthLo=mouthLo==null?lo:Math.min(mouthLo,lo); mouthHi=mouthHi==null?hi:Math.max(mouthHi,hi);
      if(state.mouth==='oct'&&his.length===2) for(let i=lo+1;i<hi;i++) tongue.add(i);
    }
  }
  for(const [k,el] of chipEls) el.classList.toggle('on',on.has(k));
  holeEls.forEach((el,i)=>{const b=holesOn.get(i); el.classList.toggle('on-blow',b==='blow'); el.classList.toggle('on-draw',b==='draw'); el.classList.toggle('tongue',tongue.has(i));});
  pocketLights(on,holesOn,tongue);
  const m=$('mouth');
  if(mouthLo!=null&&holeEls[mouthLo]){
    const a=holeEls[mouthLo], b=holeEls[mouthHi];
    m.style.left=(a.offsetLeft-3)+'px'; m.style.width=(b.offsetLeft+b.offsetWidth-a.offsetLeft+6)+'px'; m.classList.add('show');
  } else m.classList.remove('show');
}

/* ---------- mouth / mapping ---------- */
function mouthHoles(hi){
  const N=L.N, m=state.mouth;
  if(m==='oct') return hi+3<N?[hi,hi+3]:[hi-3,hi];
  const w=+m; let s=hi-Math.floor((w-1)/2); s=Math.max(0,Math.min(N-w,s));
  return Array.from({length:w},(_,i)=>s+i);
}
let shiftHeld=false, slideHeld=false;
function snapBend(b){ if(!state.snap) return b; return Math.round(b); }
function specsFrom(hi,breath,k,keyBend){
  return mouthHoles(hi).map(h=>{
    const hole=L.holes[h];
    if(L.chrom) return resolve(h,breath,0,slideHeld||shiftHeld||altHeld||k>.5);
    const d=depth(hole,breath), altOK=altMidi(hole,breath)!=null;
    if(keyBend!=null){ if((shiftHeld||altHeld)&&altOK) return resolve(h,breath,0,true); return resolve(h,breath,keyBend,false); }
    if((shiftHeld||altHeld)&&altOK) return resolve(h,breath,0,true);
    if(d>0) return resolve(h,breath,snapBend(Math.min(k,d+.49)),false);
    return resolve(h,breath,0,altOK&&k>.5);
  });
}
let geom=null;
function measure(){
  const comb=$('comb').getBoundingClientRect(), harp=$('harp').getBoundingClientRect();
  const tg=$('topGrid').getBoundingClientRect(), bg=$('botGrid').getBoundingClientRect();
  const first=holeEls[0].getBoundingClientRect(), last=holeEls[L.N-1].getBoundingClientRect();
  const cs=getComputedStyle($('stage')); const ch=parseFloat(cs.getPropertyValue('--chip-h'))||30, gap=parseFloat(cs.getPropertyValue('--chip-gap'))||4;
  geom={left:first.left,width:last.right-first.left,harpTop:harp.top,harpBot:harp.bottom,mid:(comb.top+comb.bottom)/2,
    blowCY:tg.bottom-ch/2,drawCY:bg.top+ch/2,pitch:ch+gap};
}
function locate(x,y){
  const g=geom; let hi=Math.floor((x-g.left)/(g.width/L.N)); hi=Math.max(0,Math.min(L.N-1,hi));
  let breath,k;
  if(y<g.harpTop){breath='blow'; k=(g.blowCY-y)/g.pitch;}
  else if(y>g.harpBot){breath='draw'; k=(y-g.drawCY)/g.pitch;}
  else{breath=y<g.mid?'blow':'draw'; k=0;}
  return {hi,breath,k:Math.max(0,k)};
}
const stage=$('stage');
stage.addEventListener('pointerdown',e=>{
  if(e.button>0) return; e.preventDefault(); initAudio(); measure();
  try{stage.setPointerCapture(e.pointerId)}catch(_){}
  const p=locate(e.clientX,e.clientY), id='p'+e.pointerId;
  setTouch(id,specsFrom(p.hi,p.breath,p.k),{mouth:true});
  touches.get(id).meta=p;
});
stage.addEventListener('pointermove',e=>{
  const id='p'+e.pointerId, t=touches.get(id); if(!t) return;
  const p=locate(e.clientX,e.clientY), prev=t.meta;
  const moved=prev&&(p.hi!==prev.hi||p.breath!==prev.breath);
  t.meta=p;
  setTouch(id,specsFrom(p.hi,p.breath,p.k),{mouth:true,legato:moved&&p.breath===prev.breath});
});
const endP=e=>endTouch('p'+e.pointerId);
stage.addEventListener('pointerup',endP); stage.addEventListener('pointercancel',endP); stage.addEventListener('lostpointercapture',endP);
stage.addEventListener('contextmenu',e=>e.preventDefault());

function updateSlideBtn(){const sb=$('slideBtn'); if(sb) sb.classList.toggle('in',slideHeld||(L.chrom&&shiftHeld));}
function refreshAll(){
  for(const [id,t] of touches){
    if(id[0]==='p'&&t.meta) setTouch(id,specsFrom(t.meta.hi,t.meta.breath,t.meta.k),{mouth:true});
    if(id[0]==='k'&&t.meta) setTouch(id,specsFrom(t.meta.hi,t.meta.breath,0,currentKeyBend()),{mouth:true});
    if(id[0]==='q'&&t.meta) setTouch(id,pocketSpecs(t.meta),{mouth:true});
  }
}

/* ---------- keyboard ---------- */
const keysDown=new Set(), bendHeld=new Set();
function currentKeyBend(){let b=0; for(const c of bendHeld) b=Math.max(b,BEND_CODES[c]); return b;}
function holeForCode(code){
  const k=KL(); let i=k.blow.indexOf(code); if(i>=0&&i<L.N) return {hi:i,breath:'blow'};
  i=k.draw.indexOf(code); if(i>=0&&i<L.N) return {hi:i,breath:'draw'};
  return null;
}
window.addEventListener('keydown',e=>{
  const tg=e.target; if(tg&&(tg.tagName==='SELECT'||(tg.tagName==='INPUT'&&(tg.type!=='range'||/^Arrow/.test(e.code))))) return;
  if(e.metaKey||e.ctrlKey||e.altKey) return;
  const code=e.code;
  if(code==='ShiftLeft'||code==='ShiftRight'){ if(!shiftHeld){shiftHeld=true; updateSlideBtn(); refreshAll();} return; }
  const hb=holeForCode(code);
  const kl=KL(), padIdx=kl.chords.indexOf(code), keyStep=code===kl.keyDown||code==='ArrowLeft'?-1:code===kl.keyUp||code==='ArrowRight'?1:0;
  if(hb||BEND_CODES[code]||code==='Space'||code==='KeyM'||padIdx>=0||keyStep) e.preventDefault();
  if(e.repeat) return;
  if(hb){ initAudio(); keysDown.add(code); const id='k'+code;
    setTouch(id,specsFrom(hb.hi,hb.breath,0,currentKeyBend()),{mouth:true}); touches.get(id).meta={...hb,k:0}; return; }
  if(BEND_CODES[code]){bendHeld.add(code); refreshAll(); return;}
  if(code==='Space'){initAudio(); setVibrato(true); $('vibBtn').setAttribute('aria-pressed','true'); return;}
  if(code==='KeyM'){setCup(true); return;}
  if(padIdx>=0){const pad=document.querySelector(`.pad[data-idx="${padIdx}"]`); if(pad) padDown(pad); return;}
  if(code==='KeyB'){e.preventDefault(); metroToggle(); return;}
  if(keyStep){state.key=(state.key+12+keyStep)%12; changed(); return;}
});
window.addEventListener('keyup',e=>{
  const code=e.code;
  if(code==='ShiftLeft'||code==='ShiftRight'){shiftHeld=false; updateSlideBtn(); refreshAll(); return;}
  if(keysDown.has(code)){keysDown.delete(code); endTouch('k'+code); return;}
  if(BEND_CODES[code]){bendHeld.delete(code); refreshAll(); return;}
  if(code==='Space'){setVibrato(state.vibrato); $('vibBtn').setAttribute('aria-pressed',state.vibrato); return;}
  if(code==='KeyM'){setCup(false); return;}
  const padIdx=KL().chords.indexOf(code); if(padIdx>=0){const pad=document.querySelector(`.pad[data-idx="${padIdx}"]`); if(pad) padUp(pad);}
});
window.addEventListener('blur',endAll);
document.addEventListener('visibilitychange',()=>{if(document.hidden) endAll();});

/* ---------- reeds / chords ---------- */
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
let padData=[];
function makePad(idx,rootPc,q,rn){
  const v=voiceChord(rootPc,QUAL[q].iv);
  const b=document.createElement('button'); b.className='pad'; b.dataset.idx=idx;
  const nm=chordName(rootPc,q);
  b.innerHTML=`<span class="rn">${rn}</span><span class="nm">${nm}</span><span class="vt">${v.specs.map(s=>s.tab).join(' ')||'not available'}</span><span class="kind">${v.kind==='block'?'Block chord':v.kind==='roll'?'Rolled':'—'}</span><kbd>${codeLabel(KL().chords[idx])}</kbd>`;
  b.setAttribute('aria-label',`${nm} chord, ${v.kind==='block'?'block':'rolled'}: ${v.specs.map(s=>s.tab).join(' ')}`);
  padData[idx]={v,nm};
  b.addEventListener('pointerdown',e=>{e.preventDefault(); try{b.setPointerCapture(e.pointerId)}catch(_){} padDown(b);});
  const up=()=>padUp(b); b.addEventListener('pointerup',up); b.addEventListener('pointercancel',up);
  b.addEventListener('keydown',e=>{if((e.code==='Enter')&&!e.repeat) padDown(b);});
  b.addEventListener('keyup',e=>{if(e.code==='Enter') padUp(b);});
  return b;
}
function padDown(b){
  const d=padData[+b.dataset.idx]; if(!d||!d.v.specs.length) return; initAudio();
  b.classList.add('down');
  setTouch('c'+b.dataset.idx,d.v.specs,{indexKeys:true,stagger:d.v.kind==='roll'?.075:.006,label:d.nm,mouth:d.v.kind==='block'});
}
function padUp(b){b.classList.remove('down'); endTouch('c'+b.dataset.idx);}
function renderPads(){
  const pads=$('pads'); pads.innerHTML=''; padData=[];
  $('chordTitle').textContent=`Chords in ${KEY_LABEL[state.key]}`;
  DIA_CHORDS.forEach((c,i)=>pads.appendChild(makePad(i,(state.key+c.d)%12,c.q,c.r)));
  renderCustomPad();
}
function renderCustomPad(){
  const w=$('customPadWrap'); w.innerHTML='';
  w.appendChild(makePad(9,+$('cRoot').value,$('cQual').value,'Custom'));
}

/* ---------- scale demo ---------- */
let demoTimer=null;
function playScale(){
  clearTimeout(demoTimer); endTouch('demo');
  const iv=SCALES[state.scale]||SCALES.major, root=(state.key+state.rootOff)%12, reeds=allReeds();
  let r=L.base+((root-pc(L.base)+12)%12); if(!L.chrom&&r<L.base+4&&state.rootOff===0) r+=12;
  const up=[...iv.map(x=>r+x),r+12], seq=[...up,...up.slice(0,-1).reverse()].map(m=>reeds.get(m)).filter(Boolean).map(e=>e.s);
  let i=0; const step=()=>{ if(i>=seq.length){endTouch('demo'); return;} setTouch('demo',[seq[i]],{mouth:true}); i++; demoTimer=setTimeout(step,i===up.length?520:300); };
  initAudio(); step();
}

/* ---------- key map ---------- */
function renderKeymap(){
  const N=L.N; let h='<table class="km"><tr><th>Hole</th>';
  for(let i=0;i<N;i++) h+=`<td>${i+1}</td>`;
  const k=KL();
  h+='</tr><tr><th>Blow</th>'; for(let i=0;i<N;i++) h+=`<td><kbd>${codeLabel(k.blow[i])}</kbd></td>`;
  h+='</tr><tr><th>Draw</th>'; for(let i=0;i<N;i++) h+=`<td><kbd>${codeLabel(k.draw[i])}</kbd></td>`;
  h+='</tr></table>'; $('keymap').innerHTML=h;
  $('kbIntro').textContent=state.keys==='letters'?'Top letter row blows, home row draws. Hold modifiers while a note sounds.'
    :'Number keys blow, the letter right below each number draws the same hole. Hold modifiers while a note sounds.';
  $('modChords').innerHTML=`<kbd>${codeLabel(k.chords[0])}</kbd>–<kbd>${codeLabel(k.chords[9])}</kbd> chord pads`;
  $('modKey').innerHTML=state.keys==='letters'?'<kbd>-</kbd> <kbd>=</kbd> or <kbd>←</kbd> <kbd>→</kbd> change harp key':'<kbd>←</kbd> <kbd>→</kbd> change harp key';
  document.querySelectorAll('#kbSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===state.keys));
}

/* ---------- controls wiring ---------- */
function changed(){endAll(); save(); render();}
document.querySelectorAll('#typeSeg button').forEach(b=>b.addEventListener('click',()=>{
  if(state.type===b.dataset.type) return; state.type=b.dataset.type;
  if(state.type==='chromatic'){state.rootOff=0; state.scale='major';} else {state.rootOff=7; state.scale='blues';}
  if(state.mouth!=='1'&&state.type==='chromatic'&&state.mouth==='oct') state.mouth='1';
  changed();}));
$('posSel').addEventListener('change',e=>{state.rootOff=+e.target.value; changed();});
$('scaleSel').addEventListener('change',e=>{state.scale=e.target.value; changed();});
document.querySelectorAll('#mouthSeg button').forEach(b=>b.addEventListener('click',()=>{state.mouth=b.dataset.m; save(); renderControls();}));
document.querySelectorAll('#labelSeg button').forEach(b=>b.addEventListener('click',()=>{state.labels=b.dataset.l; changed();}));
function setVoice(v){state.voice=v; save(); applyVoice(); renderControls(); if(pocketOpen()) renderPocketSheet(); playPreview();}
function playPreview(){ if(touches.size) return; const hi=Math.min(3,L.N-1); setTouch('preview',[resolve(hi,'blow',0,false),resolve(hi+1,'blow',0,false),resolve(hi+2,'blow',0,false)],{indexKeys:true,stagger:.09,label:VOICES[state.voice].label}); setTimeout(()=>endTouch('preview'),650); }
document.querySelectorAll('#voiceSeg button').forEach(b=>b.addEventListener('click',()=>{initAudio(); setVoice(b.dataset.v);}));
document.querySelectorAll('#kbSeg button').forEach(b=>b.addEventListener('click',()=>{state.keys=b.dataset.k; b.blur(); changed();}));
$('obBtn').addEventListener('click',()=>{state.overblows=!state.overblows; changed();});
$('snapBtn').addEventListener('click',()=>{state.snap=!state.snap; save(); renderControls();});
$('vibBtn').addEventListener('click',()=>{state.vibrato=!state.vibrato; initAudio(); setVibrato(state.vibrato); save(); renderControls();});
const cup=$('cupBtn');
cup.addEventListener('pointerdown',e=>{e.preventDefault(); try{cup.setPointerCapture(e.pointerId)}catch(_){} setCup(true);});
cup.addEventListener('pointerup',()=>setCup(false)); cup.addEventListener('pointercancel',()=>setCup(false));
$('scaleBtn').addEventListener('click',playScale);
$('vol').addEventListener('input',e=>{state.vol=+e.target.value; save();});
$('tone').addEventListener('input',e=>{state.tone=+e.target.value; save();});
$('room').addEventListener('input',e=>{state.room=+e.target.value; if(ctx) wetGain.gain.setTargetAtTime(state.room*.55,ctx.currentTime,.05); save();});
$('cRoot').addEventListener('change',renderCustomPad); $('cQual').addEventListener('change',renderCustomPad);
let rz, lastW=window.innerWidth; window.addEventListener('resize',()=>{if(window.innerWidth===lastW) return; lastW=window.innerWidth; clearTimeout(rz); rz=setTimeout(()=>{ if(!touches.size) render(); },150);});

/* ---------- pocket harp (phone held sideways) ---------- */
let leftHeld=false, leftK=0, leftY0=0, altHeld=false, wakeLock=null;
const pocketMQ=window.matchMedia('(orientation: landscape) and (max-height: 600px) and (pointer: coarse)');
let pkLbl=new Map(), pkHalves=[], pkHoles=[];
function pocketOpen(){return !$('pocket').hidden}
function updatePocket(){
  const show=state.pocket==='on'||(state.pocket!=='off'&&pocketMQ.matches);
  if(show===pocketOpen()) return;
  endAll(); $('pocket').hidden=!show; document.documentElement.classList.toggle('pocket-open',show);
  if(!show){$('pkSheet').hidden=true; try{wakeLock&&wakeLock.release()}catch(e){} wakeLock=null;}
}
function wake(){ if(wakeLock||!navigator.wakeLock) return; navigator.wakeLock.request('screen').then(w=>{wakeLock=w; w.addEventListener('release',()=>{wakeLock=null});}).catch(()=>{}); }
function renderPocket(){
  const p=$('pocket'), cols=$('pkCols');
  p.classList.toggle('chromatic',L.chrom); p.classList.toggle('tabs',state.labels==='tab');
  cols.style.setProperty('--n',L.N); cols.innerHTML=''; pkLbl=new Map(); pkHalves=[]; pkHoles=[];
  const scale=SCALES[state.scale], root=(state.key+state.rootOff)%12;
  for(let hi=0;hi<L.N;hi++){
    const col=document.createElement('div'); col.className='pk-col';
    const halves={};
    for(const br of ['blow','draw']){
      const half=document.createElement('div'); half.className='pk-half '+br; halves[br]=half;
      chipSpecsFor(hi,br).forEach((s,j)=>{
        const l=document.createElement('span'); l.className='pk-l '+(j===0?'nat':(s.alt?'alt':'bend'));
        const q=pc(s.midi);
        if(scale){ if(q===root) l.classList.add('root'); else if(!scale.includes((q-root+12)%12)) l.classList.add('out'); }
        l.textContent=state.labels==='tab'?s.tab:nName(s.midi);
        half.appendChild(l); pkLbl.set(chipKey(s),l);
      });
      if(br==='blow'){const n=document.createElement('span'); n.className='pk-num'; n.textContent=hi+1; half.appendChild(n);}
    }
    const hole=document.createElement('div'); hole.className='pk-hole'; hole.innerHTML='<div class="slot"></div>';
    col.append(halves.blow,hole,halves.draw); cols.appendChild(col);
    pkHalves.push(halves); pkHoles.push(hole);
  }
  const st=document.createElement('div'); st.className='pk-stamp';
  st.textContent=`Harp Bench · ${L.chrom?'Solo 12':'Richter'} · ${KEY_LABEL[state.key]}`; cols.appendChild(st);
  st.style.gridColumn='1 / -1';
  $('pkKey').textContent=KEY_LABEL[state.key];
  const posN=posNumber();
  $('pkInfo').textContent=(L.chrom?'Chromatic':'Diatonic')+' · in '+nName(root)+(L.chrom?'':' · '+ORD[posN-1]+' pos')+(state.breathMode==='thumb'?' · thumb breath':' · top blows, bottom draws');
  $('pkLeft').innerHTML=state.breathMode==='thumb'
    ?'DRAW<small>hold to inhale<br>slide down to bend</small><span class="pk-meter"><i id="pkMeter"></i></span>'
    :'WAH<small>hold to cup<br>your hands</small>';
  $('pkAlt').innerHTML=L.chrom?'SLIDE<small>hold for sharps</small>':state.overblows?'OVERBLOW<small>hold</small>':'WAH<small>hold to cup</small>';
  $('pkAlt').hidden=!L.chrom&&!state.overblows&&state.breathMode!=='thumb';
  renderPocketSheet();
}
function seg(label,opts,cur,on){
  const w=document.createElement('div'); w.className='ctl';
  w.innerHTML=`<span class="lbl">${label}</span>`; const s=document.createElement('div'); s.className='seg';
  opts.forEach(([v,t])=>{const b=document.createElement('button'); b.textContent=t; b.setAttribute('aria-pressed',String(v)===String(cur)); b.addEventListener('click',()=>on(v)); s.appendChild(b);});
  w.appendChild(s); return w;
}
function renderPocketSheet(){
  const c=$('pkCtl'); c.innerHTML='';
  c.appendChild(seg('Instrument',[['diatonic','Diatonic 10'],['chromatic','Chromatic 12']],state.type,v=>{if(v!==state.type){state.type=v; if(v==='chromatic'){state.rootOff=0;state.scale='major';}else{state.rootOff=7;state.scale='blues';} changed();}}));
  c.appendChild(seg('Harp key',KEY_LABEL.map((k,i)=>[i,k]),state.key,v=>{state.key=+v; changed();}));
  c.appendChild(seg('Voice',Object.entries(VOICES).map(([k,v])=>[k,v.label]),state.voice,v=>{initAudio(); setVoice(v);}));
  c.appendChild(seg('Breath control',[['split','Top / bottom half'],['thumb','Left thumb pad']],state.breathMode,v=>{state.breathMode=v; changed();}));
  c.appendChild(seg('Mouth',[['1','Single'],['2','2'],['3','3'],['4','4'],['oct','Octave split']],state.mouth,v=>{state.mouth=v; save(); renderPocketSheet();}));
  const ps=document.createElement('div'); ps.className='ctl'; ps.innerHTML='<label class="lbl" for="pkPos">Play in</label>';
  const sel=$('posSel').cloneNode(true); sel.id='pkPos'; sel.value=state.rootOff; sel.addEventListener('change',e=>{state.rootOff=+e.target.value; changed();}); ps.appendChild(sel); c.appendChild(ps);
  const sc=document.createElement('div'); sc.className='ctl'; sc.innerHTML='<label class="lbl" for="pkScale">Highlight scale</label>';
  const ss=$('scaleSel').cloneNode(true); ss.id='pkScale'; ss.value=state.scale; ss.addEventListener('change',e=>{state.scale=e.target.value; changed();}); sc.appendChild(ss); c.appendChild(sc);
  c.appendChild(seg('Labels',[['notes','Notes'],['tab','Tab']],state.labels,v=>{state.labels=v; changed();}));
  if(!L.chrom) c.appendChild(seg('Overblows',[['off','Off'],['on','On']],state.overblows?'on':'off',v=>{state.overblows=v==='on'; changed();}));
  c.appendChild(seg('Bends',[['snap','Snap to pitch'],['free','Free']],state.snap?'snap':'free',v=>{state.snap=v==='snap'; save(); renderPocketSheet();}));
  for(const [id,lab,key] of [['pkVol','Breath','vol'],['pkTone','Tone','tone'],['pkRoom','Room','room']]){
    const r=document.createElement('label'); r.className='range'; r.htmlFor=id;
    r.innerHTML=`<span class="lbl">${lab}</span><input id="${id}" type="range" min="${key==='vol'?.15:0}" max="1" step="0.01" value="${state[key]}">`;
    r.querySelector('input').addEventListener('input',e=>{state[key]=+e.target.value; $(key).value=state[key]; if(key==='room'&&ctx) wetGain.gain.setTargetAtTime(state.room*.55,ctx.currentTime,.05); save();});
    c.appendChild(r);
  }
  const pads=$('pkPads'); pads.innerHTML='';
  DIA_CHORDS.forEach((ch,i)=>{
    const rp=(state.key+ch.d)%12, v=voiceChord(rp,QUAL[ch.q].iv), nm=chordName(rp,ch.q);
    const b=document.createElement('button'); b.className='pad';
    b.innerHTML=`<span class="rn">${ch.r}</span><span class="nm">${nm}</span><span class="vt">${v.specs.map(s=>s.tab).join(' ')}</span>`;
    b.addEventListener('pointerdown',e=>{e.preventDefault(); try{b.setPointerCapture(e.pointerId)}catch(_){} if(!v.specs.length) return; initAudio(); b.classList.add('down');
      setTouch('pc'+i,v.specs,{indexKeys:true,stagger:v.kind==='roll'?.075:.006,label:nm,mouth:v.kind==='block'});});
    const up=()=>{b.classList.remove('down'); endTouch('pc'+i);}; b.addEventListener('pointerup',up); b.addEventListener('pointercancel',up);
    pads.appendChild(b);
  });
}
function pocketSpecs(m){
  if(state.breathMode==='thumb') return specsFrom(m.hi,leftHeld?'draw':'blow',leftHeld?leftK:m.kUp);
  return specsFrom(m.hi,m.breath,m.k);
}
function pocketLights(on,holesOn,tongue){
  if(!pkHalves.length) return;
  for(const [k,el] of pkLbl) el.classList.toggle('on',on.has(k));
  pkHalves.forEach((h,i)=>{const b=holesOn.get(i); h.blow.classList.toggle('on',b==='blow'); h.draw.classList.toggle('on',b==='draw');});
  pkHoles.forEach((el,i)=>{const b=holesOn.get(i); el.classList.toggle('on-blow',b==='blow'); el.classList.toggle('on-draw',b==='draw'); el.classList.toggle('tongue',tongue.has(i));});
}
const BEND_PX=38;
(function wirePocket(){
  const cols=$('pkCols');
  const loc=(e,m)=>{const r=cols.getBoundingClientRect(); let hi=Math.floor((e.clientX-r.left)/(r.width/L.N)); return Math.max(0,Math.min(L.N-1,hi));};
  cols.addEventListener('pointerdown',e=>{
    e.preventDefault(); initAudio(); wake();
    try{cols.setPointerCapture(e.pointerId)}catch(_){}
    const r=cols.getBoundingClientRect();
    const m={hi:loc(e),breath:e.clientY<r.top+r.height/2?'blow':'draw',y0:e.clientY,k:0,kUp:0};
    const id='q'+e.pointerId; setTouch(id,pocketSpecs(m),{mouth:true}); touches.get(id).meta=m;
  });
  cols.addEventListener('pointermove',e=>{
    const id='q'+e.pointerId, t=touches.get(id); if(!t||!t.meta) return;
    const m=t.meta, hi=loc(e), moved=hi!==m.hi; m.hi=hi;
    const dy=e.clientY-m.y0;
    m.k=Math.max(0,(m.breath==='draw'?dy:-dy)/BEND_PX); m.kUp=Math.max(0,-dy/BEND_PX);
    setTouch(id,pocketSpecs(m),{mouth:true,legato:moved});
  });
  const end=e=>endTouch('q'+e.pointerId);
  cols.addEventListener('pointerup',end); cols.addEventListener('pointercancel',end); cols.addEventListener('lostpointercapture',end);
  $('pocket').addEventListener('contextmenu',e=>e.preventDefault());
  const hold=(el,down,move,up)=>{
    el.addEventListener('pointerdown',e=>{e.preventDefault(); initAudio(); try{el.setPointerCapture(e.pointerId)}catch(_){} el.classList.add('held'); down(e);});
    if(move) el.addEventListener('pointermove',e=>{if(el.classList.contains('held')) move(e);});
    const u=()=>{if(!el.classList.contains('held')) return; el.classList.remove('held'); up();};
    el.addEventListener('pointerup',u); el.addEventListener('pointercancel',u); el.addEventListener('lostpointercapture',u);
  };
  const meter=()=>{const m=document.getElementById('pkMeter'); if(m) m.style.width=Math.min(100,leftK/3*100)+'%';};
  hold($('pkLeft'),
    e=>{ if(state.breathMode==='thumb'){leftHeld=true; leftK=0; leftY0=e.clientY; meter(); refreshAll();} else setCup(true); },
    e=>{ if(state.breathMode==='thumb'){leftK=Math.max(0,(e.clientY-leftY0)/BEND_PX); if(state.snap) leftK=Math.round(leftK); meter(); refreshAll();} },
    ()=>{ if(state.breathMode==='thumb'){leftHeld=false; leftK=0; meter(); refreshAll();} else setCup(false); });
  hold($('pkAlt'),
    ()=>{ if(L.chrom||state.overblows){altHeld=true; refreshAll();} else setCup(true); },null,
    ()=>{ if(altHeld){altHeld=false; refreshAll();} else setCup(false); });
  hold($('pkVib'),()=>setVibrato(true),null,()=>setVibrato(state.vibrato));
  $('pkGear').addEventListener('click',()=>{endAll(); $('pkSheet').hidden=false;});
  $('pkDone').addEventListener('click',()=>{endAll(); $('pkSheet').hidden=true;});
  const exit=()=>{state.pocket='off'; save(); updatePocket();};
  $('pkExit').addEventListener('click',exit); $('pkExit2').addEventListener('click',exit);
  $('pocketBtn').addEventListener('click',()=>{state.pocket='on'; save(); updatePocket();});
  $('pocketBtn2').addEventListener('click',()=>{state.pocket='on'; save(); updatePocket();});
  const mqh=()=>{ if(state.pocket==='on'&&!pocketMQ.matches&&!window.matchMedia('(pointer: coarse)').matches){} updatePocket(); };
  if(pocketMQ.addEventListener) pocketMQ.addEventListener('change',mqh); else pocketMQ.addListener(mqh);
  document.addEventListener('touchend',()=>{ if(ctx&&ctx.state!=='running') ctx.resume(); },{passive:true});
})();


/* ---------- metronome ---------- */
const metro={on:false,next:0,beat:0,timer:null,taps:[]};
const TEMPO_NAMES=[[60,'Largo'],[76,'Adagio'],[108,'Andante'],[120,'Moderato'],[156,'Allegro'],[176,'Vivace'],[999,'Presto']];
const tempoName=b=>TEMPO_NAMES.find(([m])=>b<m)[1];
function clickAt(t,kind){
  const o=ctx.createOscillator(), g=ctx.createGain(), f=ctx.createBiquadFilter();
  o.type='triangle'; o.frequency.setValueAtTime(kind==='accent'?1760:kind==='beat'?1180:900,t);
  f.type='bandpass'; f.frequency.value=kind==='accent'?2200:1500; f.Q.value=1.4;
  const v=state.click*(kind==='accent'?.9:kind==='beat'?.6:.32);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+.001); g.gain.exponentialRampToValueAtTime(.0005,t+(kind==='sub'?.03:.05));
  o.connect(f).connect(g).connect(ctx.destination); o.start(t); o.stop(t+.08);
}
function metroTick(){
  if(!ctx) return; const spb=60/state.bpm;
  while(metro.next<ctx.currentTime+.12){
    const t=metro.next, b=metro.beat;
    clickAt(t,b===0&&state.beats>1?'accent':'beat');
    if(state.feel==='eighths') clickAt(t+spb/2,'sub');
    if(state.feel==='shuffle') clickAt(t+spb*2/3,'sub');
    const delay=Math.max(0,(t-ctx.currentTime)*1000);
    setTimeout(()=>{ if(metro.on) litBeat(b); },delay);
    metro.next+=spb; metro.beat=(b+1)%state.beats;
  }
}
function litBeat(b){
  document.querySelectorAll('.mt-dots').forEach(d=>[...d.children].forEach((el,i)=>el.classList.toggle('lit',i===b)));
  const pd=document.querySelector('#pkMetroBtn .mt-dot'); if(pd){pd.classList.add('lit'); setTimeout(()=>pd.classList.remove('lit'),90);}
}
function metroToggle(force){
  const on=force!=null?force:!metro.on;
  if(on===metro.on) return;
  if(on){ initAudio(); if(!ctx) return; metro.on=true; metro.beat=0; metro.next=ctx.currentTime+.08; metroTick(); metro.timer=setInterval(metroTick,25); }
  else { metro.on=false; clearInterval(metro.timer); litBeat(-1); }
  renderMetroState();
}
function setBpm(v){ state.bpm=Math.max(30,Math.min(260,Math.round(v))); save(); renderMetroState(); }
function tap(){
  const now=performance.now(); metro.taps=metro.taps.filter(t=>now-t<2500); metro.taps.push(now);
  if(metro.taps.length>=2){ const d=metro.taps.slice(1).map((t,i)=>t-metro.taps[i]); setBpm(60000/(d.reduce((a,b)=>a+b,0)/d.length)); }
}
function buildMetro(box,pre){
  box.innerHTML=`<h2>Metronome</h2>
    <button class="btn mt-go" id="${pre}Go" aria-pressed="false">Start</button>
    <div class="mt-bpm"><button class="mt-step" id="${pre}Dn" aria-label="Slower">−</button>
      <div style="display:flex;flex-direction:column;align-items:center"><output id="${pre}Bpm">90</output><span class="unit">BPM</span></div>
      <button class="mt-step" id="${pre}Up" aria-label="Faster">+</button></div>
    <input class="mt-slider" id="${pre}Sl" type="range" min="30" max="260" step="1" aria-label="Tempo">
    <span class="mt-tempo" id="${pre}Nm"></span>
    <button class="btn" id="${pre}Tap">Tap tempo</button>
    <div class="ctl"><span class="lbl">Beats</span><div class="seg" id="${pre}Beats"></div></div>
    <div class="ctl"><span class="lbl">Feel</span><div class="seg" id="${pre}Feel"></div></div>
    <label class="range" for="${pre}Vol"><span class="lbl">Click</span><input id="${pre}Vol" type="range" min="0" max="1" step="0.01"></label>
    <div class="mt-dots" id="${pre}Dots" aria-hidden="true"></div>`;
  const q=id=>document.getElementById(pre+id);
  q('Go').addEventListener('click',()=>metroToggle());
  q('Dn').addEventListener('click',()=>setBpm(state.bpm-1)); q('Up').addEventListener('click',()=>setBpm(state.bpm+1));
  q('Sl').addEventListener('input',e=>setBpm(+e.target.value));
  q('Tap').addEventListener('pointerdown',e=>{e.preventDefault(); tap();});
  q('Vol').addEventListener('input',e=>{state.click=+e.target.value; save();});
  [2,3,4,6].forEach(n=>{const b=document.createElement('button'); b.textContent=n; b.dataset.v=n; b.addEventListener('click',()=>{state.beats=n; metro.beat=0; save(); renderMetroState();}); q('Beats').appendChild(b);});
  [['straight','Quarters'],['eighths','Eighths'],['shuffle','Shuffle']].forEach(([v,t])=>{const b=document.createElement('button'); b.textContent=t; b.dataset.v=v; b.addEventListener('click',()=>{state.feel=v; save(); renderMetroState();}); q('Feel').appendChild(b);});
}
function renderMetroState(){
  for(const pre of ['mt','pkmt']){
    const q=id=>document.getElementById(pre+id); if(!q('Go')) continue;
    q('Go').textContent=metro.on?'Stop':'Start'; q('Go').setAttribute('aria-pressed',metro.on);
    q('Bpm').textContent=state.bpm; q('Sl').value=state.bpm; q('Nm').textContent=tempoName(state.bpm); q('Vol').value=state.click;
    [...q('Beats').children].forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===state.beats));
    [...q('Feel').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===state.feel));
    const d=q('Dots'); if(d.children.length!==state.beats){ d.innerHTML=''; for(let i=0;i<state.beats;i++){const s=document.createElement('span'); s.className='mt-dot'+(i===0?' first':''); d.appendChild(s);} }
  }
  $('pkMetroTxt').textContent='♩ '+state.bpm; $('pkMetroBtn').setAttribute('aria-pressed',metro.on);
}
buildMetro($('metroBox'),'mt'); buildMetro($('pkMetroBox'),'pkmt');
$('pkMetroBtn').addEventListener('click',()=>metroToggle());
renderMetroState();

render();
updatePocket();
})();
