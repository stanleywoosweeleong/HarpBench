/* Harp Bench: "My harp". Record each note of your own harmonica once; the My harp voice plays the recordings.
   Recordings stay in this browser (IndexedDB). */
"use strict";
const mh={samples:new Map(),buffers:new Map(),rec:null,db:null};

/* ---------- storage ---------- */
function mhDb(){
  if(mh.db) return Promise.resolve(mh.db);
  return new Promise((res,rej)=>{
    if(!window.indexedDB) return rej(new Error('no storage'));
    const r=indexedDB.open('harpbench',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('samples');
    r.onsuccess=()=>{mh.db=r.result; res(mh.db);}; r.onerror=()=>rej(r.error);
  });
}
function mhStore(mode,fn){ return mhDb().then(db=>new Promise((res,rej)=>{const tx=db.transaction('samples',mode), st=tx.objectStore('samples'), q=fn(st);
  tx.oncomplete=()=>res(q&&q.result); tx.onerror=()=>rej(tx.error);})); }
function mhKey(type,midi){ return type+':'+midi; }
function mhLoad(){
  return mhStore('readonly',st=>st.getAll()).then(list=>{ (list||[]).forEach(s=>mh.samples.set(mhKey(s.type,s.midi),s)); mhRender(); }).catch(()=>{});
}

/* ---------- playback ---------- */
function mhNearest(midi){
  const keys=[]; for(const s of mh.samples.values()) if(s.type===state.type) keys.push(s.midi);
  const k=nearestSample(keys,Math.round(midi),4);
  return k==null?null:mh.samples.get(mhKey(state.type,k));
}
function mhBuffer(rec){
  const k=mhKey(rec.type,rec.midi); let b=mh.buffers.get(k);
  if(!b){ b=ctx.createBuffer(1,rec.data.length,rec.sr); b.copyToChannel(rec.data,0); mh.buffers.set(k,b); }
  return b;
}
function samplerVoice(s,count,delay,legato){
  // Same interface as the synth voice in core.js: {s,count,set(s2),stop(at)}
  const rec=mhNearest(s.midi); if(!rec) return null;
  const t0=ctx.currentTime+.004+(delay||0), ratio=m=>Math.pow(2,(m-rec.midi)/12);
  const src=ctx.createBufferSource(); src.buffer=mhBuffer(rec); src.loop=true;
  src.loopStart=rec.loop.start/rec.sr; src.loopEnd=rec.loop.end/rec.sr;
  src.playbackRate.setValueAtTime(ratio(s.midi),t0);
  const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.Q.value=.7;
  const cut=b=>b>0?Math.max(900,mtof(s.midi)*(7-1.6*b)):18000;
  lp.frequency.setValueAtTime(cut(s.bend),t0);
  const env=ctx.createGain(), lvl=x=>levelFor(x,count)*2.2;
  env.gain.setValueAtTime(0,t0); env.gain.setTargetAtTime(lvl(s),t0,legato?.012:.006);
  const trem=ctx.createGain(); trem.gain.value=1; vibAmp.connect(trem.gain); vibPitch.connect(src.detune);
  src.connect(lp).connect(env).connect(trem).connect(hand);      // skip the synth's tone shaping; keep wah and room
  src.start(t0,legato?src.loopStart*.6:0);
  const v={s,count,
    set(s2){const now=Math.max(ctx.currentTime,t0), tau=s2.alt!==v.s.alt?.007:(state.snap?.035:.012);
      src.playbackRate.setTargetAtTime(ratio(s2.midi),now,tau); lp.frequency.setTargetAtTime(cut(s2.bend),now,.04);
      env.gain.setTargetAtTime(lvl(s2),now,.04); v.s=s2;},
    stop(at){const now=Math.max(ctx.currentTime,at||0); hold(env.gain,now); env.gain.setTargetAtTime(0,now,.045);
      try{src.stop(now+.4)}catch(e){}
      src.onended=()=>{try{vibAmp.disconnect(trem.gain)}catch(e){} try{vibPitch.disconnect(src.detune)}catch(e){}};}
  };
  return v;
}

/* ---------- recording ---------- */
function mhTargets(){
  // every natural blow and draw note of the selected harp, once each, hole by hole
  const seen=new Set(), out=[];
  L.holes.forEach((h,hi)=>{ for(const br of ['blow','draw']){ const sp=resolve(hi,br,0,false);
    if(!seen.has(sp.midi)){ seen.add(sp.midi); out.push({midi:sp.midi,tab:sp.tab,label:`${br==='blow'?'Blow':'Draw'} hole ${hi+1}`}); } } });
  return out;
}
async function mhStart(){
  if(mh.rec){ mhStop('Recording stopped.'); return; }
  if(!mic.on) await micStart();
  if(!mic.on||!mic.src) return;
  const sr=ctx.sampleRate, node=ctx.createScriptProcessor(2048,1,1), mute=ctx.createGain(); mute.gain.value=0;
  const rec={targets:mhTargets(),idx:0,node,mute,ring:new Float32Array(sr*5),total:0,cap:null,timer:null,sr};
  rec.idx=rec.targets.findIndex(t=>!mh.samples.has(mhKey(state.type,t.midi))); if(rec.idx<0) rec.idx=0;
  node.onaudioprocess=e=>{ const x=e.inputBuffer.getChannelData(0), n=rec.ring.length;
    for(let i=0;i<x.length;i++) rec.ring[(rec.total+i)%n]=x[i]; rec.total+=x.length; };
  mic.src.connect(node); node.connect(mute).connect(ctx.destination);
  rec.timer=setInterval(mhTick,40); mh.rec=rec; mhPrompt(); mhRender();
}
function mhStop(msg){
  const rec=mh.rec; if(!rec) return;
  clearInterval(rec.timer); try{mic.src&&mic.src.disconnect(rec.node); rec.node.disconnect(); rec.mute.disconnect();}catch(e){}
  mh.rec=null; $('mhPrompt').textContent=msg||''; mhRender();
}
function mhPrompt(extra){
  const rec=mh.rec; if(!rec) return; const t=rec.targets[rec.idx];
  $('mhPrompt').innerHTML=`<b>${t.label}</b> <span>${t.tab} · ${nName(t.midi)}${nOct(t.midi)}</span> <span class="mh-step">note ${rec.idx+1} of ${rec.targets.length}</span><br>`
    +(extra||'Play it and hold it steady for about two seconds.');
}
function mhTick(){
  const rec=mh.rec; if(!rec) return; const t=rec.targets[rec.idx], sr=rec.sr;
  const hearing=mic.cur===t.midi&&mic.stable>=2;
  if(!rec.cap){ if(hearing){ rec.cap={start:rec.total-Math.round(.08*sr)}; mhPrompt('Recording… keep holding.'); } return; }
  const got=rec.total-rec.cap.start;
  if(!hearing){
    if(got<1.1*sr){ rec.cap=null; mhPrompt('A little longer, please: hold the note for about two seconds.'); return; }
    mhSave(t,got);
  } else if(got>=1.8*sr) mhSave(t,got);
}
function mhSave(t,len){
  const rec=mh.rec, sr=rec.sr, n=rec.ring.length, data=new Float32Array(len);
  for(let i=0;i<len;i++) data[i]=rec.ring[(rec.cap.start+i)%n];
  // level the note (by the loudness of its steady middle) and soften the edges
  let s=0; const a=Math.floor(len*.3), b=Math.floor(len*.8); for(let i=a;i<b;i++) s+=data[i]*data[i];
  const g=.2/Math.max(1e-4,Math.sqrt(s/(b-a))); for(let i=0;i<len;i++) data[i]=Math.max(-1,Math.min(1,data[i]*g));
  const fi=Math.floor(sr*.004), fo=Math.floor(sr*.03);
  for(let i=0;i<fi;i++) data[i]*=i/fi; for(let i=0;i<fo;i++) data[len-1-i]*=i/fo;
  const item={type:state.type,midi:t.midi,sr,data,loop:samplerLoop(len,sr,mtof(t.midi)),date:Date.now()};
  mh.samples.set(mhKey(item.type,item.midi),item); mh.buffers.delete(mhKey(item.type,item.midi));
  mhStore('readwrite',st=>st.put(item,mhKey(item.type,item.midi))).catch(()=>{});
  rec.cap=null; rec.idx++;
  if(rec.idx>=rec.targets.length){ mhStop('All notes recorded. The My harp voice is now selected.'); setVoice('mine'); return; }
  mhPrompt('Saved. Next note:'); mhRender();
}
function mhSkip(){ const rec=mh.rec; if(!rec) return; rec.cap=null; rec.idx=(rec.idx+1)%rec.targets.length; mhPrompt(); mhRender(); }
function mhClear(){
  mhStop(); for(const k of [...mh.samples.keys()]) if(k.startsWith(state.type+':')){ mh.samples.delete(k); mh.buffers.delete(k); mhStore('readwrite',st=>st.delete(k)).catch(()=>{}); }
  $('mhPrompt').textContent='Recordings for this kind of harp deleted.'; mhRender();
}
function mhRender(){
  const grid=document.getElementById('mhGrid'); if(!grid||!L) return;
  const ts=mhTargets(), done=ts.filter(t=>mh.samples.has(mhKey(state.type,t.midi))).length, cur=mh.rec&&mh.rec.targets[mh.rec.idx];
  grid.innerHTML=ts.map(t=>`<span class="mh-n${mh.samples.has(mhKey(state.type,t.midi))?' done':''}${cur&&cur.midi===t.midi?' now':''}" title="${t.label}">${t.tab}<small>${nName(t.midi)}</small></span>`).join('');
  $('mhStatus').textContent=done?`${done} of ${ts.length} notes recorded`:'no notes recorded yet';
  $('mhRec').textContent=mh.rec?'Stop recording':done?'Record missing notes':'Record my harp';
  $('mhRec').setAttribute('aria-pressed',!!mh.rec); $('mhSkip').hidden=!mh.rec;
}
$('mhRec').addEventListener('click',mhStart);
$('mhSkip').addEventListener('click',mhSkip);
$('mhClear').addEventListener('click',mhClear);
mhLoad();
