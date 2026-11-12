/* Harp Bench: the on-screen harmonica, keyboard, chords and controls */
"use strict";
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
        const el=document.createElement('div'); el.className='chip'; el.setAttribute('aria-hidden','true');
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
  renderControls(); renderPads(); renderKeymap(); renderPocket(); renderSongbook(); refreshLights();
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
$('obBtn').addEventListener('click',()=>{state.overblows=!state.overblows; state.obAuto=false; changed();});
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

