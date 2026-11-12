/* Harp Bench: metronome */
"use strict";
/* ---------- metronome ---------- */
const metro={on:false,next:0,beat:0,timer:null,taps:[]};
const TEMPO_NAMES=[[60,'Largo'],[76,'Adagio'],[108,'Andante'],[120,'Moderato'],[156,'Allegro'],[176,'Vivace'],[999,'Presto']];
const tempoName=b=>TEMPO_NAMES.find(([m])=>b<m)[1];
function clickAt(t,kind){
  markAudio();
  const o=ctx.createOscillator(), g=ctx.createGain(), f=ctx.createBiquadFilter();
  o.type='triangle'; o.frequency.setValueAtTime(kind==='accent'?1760:kind==='beat'?1180:900,t);
  f.type='bandpass'; f.frequency.value=kind==='accent'?2200:1500; f.Q.value=1.4;
  const v=state.click*(kind==='accent'?.9:kind==='beat'?.6:.32);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+.001); g.gain.exponentialRampToValueAtTime(.0005,t+(kind==='sub'?.03:.05));
  o.connect(f).connect(g).connect(ctx.destination); o.start(t); o.stop(t+.08);
  // disconnecting silences a click that has not sounded yet (used when a song stops during its count-in)
  return {end:t+.1,stop(){try{g.disconnect()}catch(e){}}};
}
function metroTick(){
  if(!ctx) return; const spb=60/state.bpm;
  while(metro.next<ctx.currentTime+(document.hidden?1.5:.12)){
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
  if(on){ initAudio(); if(!ctx) return; metro.on=true; metro.beat=0; metro.next=ctx.currentTime+(ctx.state==='running'?.08:.4); metroTick(); metro.timer=setInterval(metroTick,25); }
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
