/* Harp Bench: record what you play and share it as a WAV file (Files, GarageBand, AUM, AudioShare, AirDrop…).
   Takes live in memory until the app is closed; sharing or saving is how you keep one. */
"use strict";
const REC_MAX_SEC=600;                      // 10 minutes of 48 kHz stereo is about 115 MB of samples
const rec={on:false,node:null,bus:null,mute:null,micGain:null,chunks:[],frames:0,sr:48000,start:0,timer:null,takes:[],stopNote:''};

function recFmt(sec){ sec=Math.max(0,Math.floor(sec)); return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'); }
function recName(){
  const d=new Date(), p=x=>String(x).padStart(2,'0');
  const what=song.cur&&(tp.on||song.mode==='practice')?song.cur.title:'Harp Bench take';
  return `${what} ${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`
    .replace(/[\\/:*?"<>|]/g,'')+'.wav';
}

function recStart(){
  initAudio(); if(!ctx||rec.on) return;
  if(ctx.state!=='running') ctx.resume();
  rec.bus=ctx.createGain();
  out.connect(rec.bus);                                   // the harmonica, harmony and room, after the limiter
  if(state.recClicks) clickBus.connect(rec.bus);         // metronome clicks only if asked for
  if(state.recMic&&mic.on&&mic.src){ rec.micGain=ctx.createGain(); mic.src.connect(rec.micGain).connect(rec.bus); }
  rec.node=ctx.createScriptProcessor(4096,2,2); rec.mute=ctx.createGain(); rec.mute.gain.value=0;
  rec.bus.connect(rec.node); rec.node.connect(rec.mute).connect(ctx.destination);
  rec.chunks=[]; rec.frames=0; rec.sr=ctx.sampleRate; rec.stopNote='';
  rec.node.onaudioprocess=e=>{
    if(!rec.on) return;
    const b=e.inputBuffer, L=b.getChannelData(0), R=b.numberOfChannels>1?b.getChannelData(1):L, n=L.length, a=new Int16Array(n*2);
    for(let i=0;i<n;i++){ a[2*i]=floatToInt16(L[i]); a[2*i+1]=floatToInt16(R[i]); }
    rec.chunks.push(a); rec.frames+=n;
    if(rec.frames>=REC_MAX_SEC*rec.sr){ rec.stopNote='Recording stopped at the 10-minute limit.'; setTimeout(recStop,0); }
  };
  rec.on=true; rec.start=performance.now(); markAudio();
  rec.timer=setInterval(recUi,250); recUi();
}

function recStop(){
  if(!rec.on) return;
  rec.on=false; clearInterval(rec.timer);
  try{ out.disconnect(rec.bus); }catch(e){} try{ clickBus.disconnect(rec.bus); }catch(e){}
  try{ if(rec.micGain){ mic.src&&mic.src.disconnect(rec.micGain); rec.micGain.disconnect(); } }catch(e){}
  try{ rec.bus.disconnect(); rec.node.disconnect(); rec.mute.disconnect(); }catch(e){}
  rec.node.onaudioprocess=null; rec.micGain=null;
  const frames=rec.frames, sr=rec.sr;
  if(frames<sr*.3){ rec.chunks=[]; recUi(); return; }     // too short to be a take
  const blob=new Blob([encodeWav(rec.chunks,sr,2)],{type:'audio/wav'}); rec.chunks=[];
  const take={blob,url:URL.createObjectURL(blob),name:recName(),dur:frames/sr,date:Date.now()};
  rec.takes.unshift(take);
  while(rec.takes.length>5){ URL.revokeObjectURL(rec.takes.pop().url); }   // keep the five latest in memory
  recUi(); recRenderTakes(); recShowDialog(take);
}
function recToggle(){ rec.on?recStop():recStart(); }

/* ---------- sharing and saving ---------- */
async function recShare(take){
  const file=new File([take.blob],take.name,{type:'audio/wav'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file],title:take.name}); return; }
    catch(e){ if(e&&e.name==='AbortError') return; }     // the player closed the share sheet
  }
  const a=document.createElement('a'); a.href=take.url; a.download=take.name; document.body.appendChild(a); a.click(); a.remove();
}
function recDelete(take){
  URL.revokeObjectURL(take.url); rec.takes=rec.takes.filter(t=>t!==take); recRenderTakes();
}

/* ---------- interface ---------- */
function recUi(){
  const sec=rec.on?(performance.now()-rec.start)/1000:0, t=recFmt(sec);
  const b=$('recBtn'); b.setAttribute('aria-pressed',rec.on);
  b.innerHTML=rec.on?`<span class="rec-dot"></span><span>Stop recording</span> <span class="rec-time">${t}</span>`:'<span class="rec-dot"></span><span>Record</span>';
  const pb=document.getElementById('pkRec');
  if(pb){ pb.setAttribute('aria-pressed',rec.on); pb.innerHTML=rec.on?`<span class="rec-dot"></span><span class="rec-time">${t}</span>`:'<span class="rec-dot"></span>'; }
  document.documentElement.classList.toggle('recording',rec.on);
  if(rec.stopNote){ $('recMsg').textContent=rec.stopNote; }
}
function recRenderTakes(){
  const list=$('recList'); list.innerHTML='';
  $('recEmpty').hidden=rec.takes.length>0;
  for(const take of rec.takes){
    const row=document.createElement('div'); row.className='rec-take';
    row.innerHTML=`<div class="rec-meta"><b data-i18n-skip>${esc(take.name)}</b><span>${recFmt(take.dur)}</span></div>`;
    const au=document.createElement('audio'); au.controls=true; au.preload='metadata'; au.src=take.url; row.appendChild(au);
    const share=document.createElement('button'); share.className='btn'; share.textContent='Share or save'; share.addEventListener('click',()=>recShare(take));
    const del=document.createElement('button'); del.className='btn'; del.textContent='Delete'; del.addEventListener('click',()=>recDelete(take));
    const acts=document.createElement('div'); acts.className='rec-acts'; acts.append(share,del); row.appendChild(acts);
    list.appendChild(row);
  }
}
function recShowDialog(take){
  const d=$('recDialog'); d.hidden=false;
  $('recDlgName').textContent=take.name; $('recDlgDur').textContent=recFmt(take.dur);
  const au=$('recDlgAudio'); au.src=take.url;
  $('recDlgShare').onclick=()=>recShare(take);
  $('recDlgDelete').onclick=()=>{ recDelete(take); recCloseDialog(); };
  $('recDlgShare').focus();
}
function recCloseDialog(){ const au=$('recDlgAudio'); au.pause(); $('recDialog').hidden=true; }

$('recBtn').addEventListener('click',recToggle);
$('pkRec').addEventListener('click',recToggle);
$('recDlgClose').addEventListener('click',recCloseDialog);
$('recDialog').addEventListener('click',e=>{ if(e.target.id==='recDialog') recCloseDialog(); });
for(const [id,key] of [['recClicks','recClicks'],['recMic','recMic']]){
  $(id).setAttribute('aria-pressed',!!state[key]);
  $(id).addEventListener('click',()=>{ state[key]=!state[key]; save(); $(id).setAttribute('aria-pressed',state[key]); });
}
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&rec.on){ rec.stopNote='Recording stopped because the app went to the background.'; recStop(); } });
recUi(); recRenderTakes();
