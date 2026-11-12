/* Harp Bench: phone mode (a sideways phone becomes the harmonica) */
"use strict";
/* ---------- pocket harp (phone held sideways) ---------- */
let leftHeld=false, leftK=0, leftY0=0, altHeld=false, wakeLock=null;
const pocketMQ=window.matchMedia('(orientation: landscape) and (max-height: 600px) and (pointer: coarse)');
let pkLbl=new Map(), pkHalves=[], pkHoles=[];
function pocketOpen(){return !$('pocket').hidden}
// Harp Bench is an instrument, so its scale is fixed at 100%. iOS can still zoom (a tapped field, rotating, two thumbs
// read as a pinch) and then keeps that zoom; rewriting the viewport with maximum-scale=1 snaps it back to 100%.
let zoomResetAt=0;
function resetZoom(){
  // at most once a second, and never while a finger is down: each reset re-lays out the page, and repeating it
  // (iOS can keep reporting a zoom) would stutter the app and could drop the "finger lifted" event of a note
  const now=performance.now();
  if(now-zoomResetAt<1000||touches.size){ clearTimeout(resetZoom.t); resetZoom.t=setTimeout(resetZoom,1000); return; }
  zoomResetAt=now;
  const m=document.querySelector('meta[name="viewport"]'); if(!m) return;
  const want='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  m.setAttribute('content',want.replace('maximum-scale=1','maximum-scale=1.01')); // a real change forces iOS to re-apply it
  requestAnimationFrame(()=>m.setAttribute('content',want));
}
window.addEventListener('orientationchange',()=>setTimeout(resetZoom,300));
if(window.visualViewport) visualViewport.addEventListener('resize',()=>{ if(visualViewport.scale>1.01) resetZoom(); });
document.addEventListener('change',e=>{ if(e.target&&e.target.tagName==='SELECT') setTimeout(resetZoom,100); });
document.addEventListener('focusout',e=>{ if(e.target&&/^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName)) setTimeout(resetZoom,100); });
// two thumbs on the screen must not pinch-zoom the page
['gesturestart','gesturechange'].forEach(t=>document.addEventListener(t,e=>{ if(pocketOpen()) e.preventDefault(); },{passive:false}));
function updatePocket(){
  const show=state.pocket==='on'||(state.pocket!=='off'&&pocketMQ.matches);
  if(show===pocketOpen()) return;
  endAll(); $('pocket').hidden=!show; document.documentElement.classList.toggle('pocket-open',show); resetZoom();
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
  { const lg=seg('Language',Object.entries(LANGS).map(([k,v])=>[k,v]),i18nLang(),v=>{setLang(v); renderPocketSheet();});
    lg.querySelector('.seg').setAttribute('data-i18n-skip',''); lg.style.order=-2; c.appendChild(lg); }
  c.appendChild(seg('Voice',Object.entries(VOICES).map(([k,v])=>[k,v.label]),state.voice,v=>{initAudio(); setVoice(v);}));
  c.appendChild(seg('Breath control',[['split','Top / bottom half'],['thumb','Left thumb pad']],state.breathMode,v=>{state.breathMode=v; changed();}));
  c.appendChild(seg('Mouth',[['1','Single'],['2','2'],['3','3'],['4','4'],['oct','Octave split']],state.mouth,v=>{state.mouth=v; save(); renderPocketSheet();}));
  const ps=document.createElement('div'); ps.className='ctl'; ps.innerHTML='<label class="lbl" for="pkPos">Play in</label>';
  const sel=$('posSel').cloneNode(true); sel.id='pkPos'; sel.value=state.rootOff; sel.addEventListener('change',e=>{state.rootOff=+e.target.value; changed();}); ps.appendChild(sel); c.appendChild(ps);
  const sc=document.createElement('div'); sc.className='ctl'; sc.innerHTML='<label class="lbl" for="pkScale">Highlight scale</label>';
  const ss=$('scaleSel').cloneNode(true); ss.id='pkScale'; ss.value=state.scale; ss.addEventListener('change',e=>{state.scale=e.target.value; changed();}); sc.appendChild(ss); c.appendChild(sc);
  c.appendChild(seg('Labels',[['notes','Notes'],['tab','Tab']],state.labels,v=>{state.labels=v; changed();}));
  if(!L.chrom) c.appendChild(seg('Overblows',[['off','Off'],['on','On']],state.overblows?'on':'off',v=>{state.overblows=v==='on'; state.obAuto=false; changed();}));
  c.appendChild(seg('Bends',[['snap','Snap to pitch'],['free','Free']],state.snap?'snap':'free',v=>{state.snap=v==='snap'; save(); renderPocketSheet();}));
  for(const [id,lab,key] of [['pkVol','Breath','vol'],['pkTone','Tone','tone'],['pkRoom','Room','room']]){
    const r=document.createElement('label'); r.className='range'; r.htmlFor=id;
    r.innerHTML=`<span class="lbl">${lab}</span><input id="${id}" type="range" min="${key==='vol'?.15:0}" max="1" step="0.01" value="${state[key]}">`;
    r.querySelector('input').addEventListener('input',e=>{state[key]=+e.target.value; $(key).value=state[key]; if(key==='room'&&ctx) wetGain.gain.setTargetAtTime(state.room*.55,ctx.currentTime,.05); save();});
    c.appendChild(r);
  }
  {const w=document.createElement('div'); w.className='ctl'; w.innerHTML='<label class="lbl" for="pkSongSel">Hymn</label>';
   const sel=document.createElement('select'); sel.id='pkSongSel'; SONGS.forEach(x=>sel.add(new Option(x.title,x.id))); sel.value=state.song;
   sel.addEventListener('change',e=>selectSong(e.target.value)); w.appendChild(sel); c.appendChild(w);
   const mk=(t,f)=>{const b=document.createElement('button'); b.className='btn'; b.textContent=t; b.addEventListener('click',f); c.appendChild(b);};
   mk('Listen',()=>{endAll(); $('pkSheet').hidden=true; if(song.mode!=='listen') songListen();});
   mk('Play along',()=>{endAll(); $('pkSheet').hidden=true; if(song.mode!=='along') songAlong();});
   mk('Practice',()=>{endAll(); $('pkSheet').hidden=true; if(song.mode!=='practice') songPractice();});
   mk('Stop song',()=>songStop());
   const opt=document.createElement('div'); opt.className='ctl'; opt.innerHTML='<span class="lbl">Song options</span>';
   const row=document.createElement('div'); row.className='pk-opts';
   for(const [label,key] of [['Click','songClick'],['Count-in','countIn'],['Harmony','backing'],['Guide melody','guide'],['Loop line','loopLine']]){
     const b=document.createElement('button'); b.className='btn'; b.textContent=label; b.setAttribute('aria-pressed',!!state[key]);
     b.addEventListener('click',()=>{state[key]=!state[key]; save(); b.setAttribute('aria-pressed',state[key]); renderSongbook();}); row.appendChild(b);}
   opt.appendChild(row); c.appendChild(opt);
   c.appendChild(seg('Speed',[[0.5,'50%'],[0.75,'75%'],[1,'100%']],state.songRate,v=>{state.songRate=+v; save(); renderSongbook(); renderPocketSheet();}));
   if(song.cur&&song.cur.verses.length>1) c.appendChild(seg('Lyrics',song.cur.verses.map((_,i)=>[i,'Verse '+(i+1)]),state.verse,v=>{state.verse=+v; save(); renderSongbook(); renderPocketSheet();}));
   const mb=document.createElement('button'); mb.className='btn'; mb.id='pkMic'; mb.textContent=mic.on?'Microphone: on':'Microphone: off'; mb.addEventListener('click',micToggle); c.appendChild(mb);
   // songs first: on a phone this is what the sheet is mostly opened for
   const kids=[...c.children]; kids.slice(kids.indexOf(w)).forEach(e=>e.style.order=-1);}
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


