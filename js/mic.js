/* Harp Bench: microphone. A tuner for a real harmonica, and the notes it hears drive Practice and Play along. */
"use strict";
const mic={on:false,stream:null,src:null,an:null,buf:null,timer:null,cur:null,cand:null,stable:0,silent:0,peak:0,low:1,
  touch:{voices:new Map(),specs:[],mouthShow:true},reeds:null,reedsFor:null};

function micMsg(t){ $('micMsg').textContent=t; }
function micReeds(){
  // the reed map depends on the harp; rebuild it when the harp changes
  if(mic.reedsFor!==L){ mic.reeds=allReeds(); mic.reedsFor=L; }
  return mic.reeds;
}
function micSpec(m){
  const e=micReeds().get(Math.round(m));
  return e?Object.assign({},e.s,{midi:m}):{hi:-1,breath:'blow',bend:0,alt:false,midi:m,tab:'not on this harp'};
}

async function micStart(){
  if(!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)){
    micMsg('The microphone is not available here. Open Harp Bench from its installed app or GitHub Pages address to use it.'); return;
  }
  initAudio(); if(!ctx) return;
  try{ if(navigator.audioSession) navigator.audioSession.type='play-and-record'; }catch(e){}
  try{
    mic.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
  }catch(e){
    try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(_){}
    micMsg(e&&e.name==='NotAllowedError'
      ?'Microphone access was refused. Allow it for this site (on iPhone: Settings, Safari, Microphone), then press the button again.'
      :'The microphone could not start'+(e&&e.message?': '+e.message:'.'));
    return;
  }
  if(ctx.state!=='running') ctx.resume();
  mic.src=ctx.createMediaStreamSource(mic.stream);
  mic.an=ctx.createAnalyser(); mic.an.fftSize=2048; mic.src.connect(mic.an);
  mic.buf=new Float32Array(mic.an.fftSize);
  mic.on=true; mic.cur=null; mic.cand=null; mic.silent=0;
  mic.timer=setInterval(micTick,30);
  micMsg('Listening. Play one note at a time. Use headphones when Listen or the harmony is playing, or the microphone will hear the app.');
  micButtons();
}
function micStop(){
  if(typeof mh!=='undefined'&&mh.rec) mhStop('Recording stopped because the microphone was turned off.');
  clearInterval(mic.timer); mic.on=false;
  if(mic.stream) mic.stream.getTracks().forEach(t=>t.stop());
  try{ mic.src&&mic.src.disconnect(); }catch(e){}
  mic.stream=mic.src=mic.an=null;
  try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(e){}
  micRelease(); micTuner(0); micMsg('Microphone off.'); micButtons();
}
function micToggle(){ mic.on?micStop():micStart(); }
function micButtons(){
  $('micBtn').setAttribute('aria-pressed',mic.on); $('micBtn').textContent=mic.on?'Stop microphone':'Use microphone';
  const pk=document.getElementById('pkMic'); if(pk) pk.textContent=mic.on?'Microphone: on':'Microphone: off';
}
function micRelease(){
  if(mic.cur==null) return;
  mic.cur=null; touches.delete('mic'); mic.touch.prevPitches=new Set(); mic.touch.hitTarget=false; refreshLights();
}

function micTick(){
  if(!mic.on||!mic.an) return;
  mic.an.getFloatTimeDomainData(mic.buf);
  const r=detectPitch(mic.buf,ctx.sampleRate,{minRms:state.micGate});
  if(!r.freq||r.clarity<.86){ if(++mic.silent>=3){ micRelease(); micTuner(0); } return; }
  mic.silent=0;
  const m=freqToMidi(r.freq), rm=Math.round(m);
  micTuner(r.freq,m);
  // a note counts once the same semitone is heard in two frames in a row
  if(mic.cand===rm) mic.stable++; else { mic.cand=rm; mic.stable=1; }
  if(mic.stable<2) return;
  // a fresh breath on the same note (a swell after a dip in loudness) counts as a new note
  let onset=mic.cur==null;
  if(mic.cur===rm){
    mic.low=Math.min(mic.low,r.rms); mic.peak=Math.max(mic.peak,r.rms);
    if(r.rms>2*mic.low&&mic.low<.5*mic.peak){ onset=true; }
  }
  if(onset||mic.cur!==rm){ mic.peak=r.rms; mic.low=r.rms; }
  mic.cur=rm;
  if(song.mode==='listen') return;           // the app is playing; do not grade what the speaker plays
  const spec=micSpec(m), t=mic.touch;
  if(onset){ t.prevPitches=new Set(); t.hitTarget=false; }
  t.specs=[spec]; t.mouthShow=spec.hi>=0; touches.set('mic',t);
  songHeard('mic',t,[spec]); refreshLights();
}

function micTuner(freq,m){
  const pt=document.getElementById('pkTune'), pk=document.getElementById('pocket');
  if(pk) pk.classList.toggle('mic-on',mic.on);
  if(pt){
    if(!freq) pt.innerHTML=mic.on?'<span>Microphone on · play a note</span>':'';
    else { const rm=Math.round(m), c=Math.round((m-rm)*100), sp=micSpec(m);
      pt.innerHTML=`<b>${nName(rm)}<small>${nOct(rm)}</small></b><span class="${Math.abs(c)<=10?'ok':''}">${c>0?'+':''}${c}¢</span><i>${sp.hi>=0?sp.tab:'not on this harp'}</i>`; }
  }
  if(!freq){ $('tnNote').textContent='–'; $('tnOct').textContent=''; $('tnCents').textContent=''; $('tnHz').textContent=''; $('tnTab').textContent='';
    $('tnNeedle').style.left='50%'; $('tnNeedle').dataset.ok=''; return; }
  const rm=Math.round(m), c=Math.round((m-rm)*100), sp=micSpec(m);
  $('tnNote').textContent=nName(rm); $('tnOct').textContent=nOct(rm);
  $('tnCents').textContent=(c>0?'+':'')+c+' cents'; $('tnHz').textContent=freq.toFixed(1)+' Hz';
  $('tnTab').textContent=sp.hi>=0?`${sp.tab} on your ${KEY_LABEL[state.key]} harp`:'not on this harp';
  $('tnNeedle').style.left=(50+Math.max(-50,Math.min(50,c)))+'%'; $('tnNeedle').dataset.ok=Math.abs(c)<=10?'1':'';
}

$('micBtn').addEventListener('click',micToggle);
$('micGate').addEventListener('input',e=>{state.micGate=+e.target.value; save();});
$('micGate').value=state.micGate;
