/* Harp Bench: hymn songbook */
"use strict";
// songs the player imported live in their browser and join the bundled hymns
(state.userSongs||[]).forEach(u=>{ if(u&&u.id&&!SONGS.some(x=>x.id===u.id)) SONGS.push(u); });

/* ---------- hymn songbook ---------- */
const song={cur:null,specs:[],pos:0,mode:'idle',timer:null,shift:0};
function songById(id){return SONGS.find(s=>s.id===id)||SONGS[0];}
function syncOverblows(s,off){
  // Turn overblows on when this hymn needs them in this position. Turn them back off later only if the songbook turned them on.
  if(L.chrom) return;
  const need=needsOverblows(s,off);
  if(need&&!state.overblows){state.overblows=true; state.obAuto=true;}
  else if(!need&&state.overblows&&state.obAuto){state.overblows=false; state.obAuto=false;}
}
function selectSong(id){
  songStop(); state.song=id; song.pos=0;
  // Sync "Play in" to the easiest position for this hymn and highlight its major scale.
  const s=songById(id); state.rootOff=bestPosition(s).off; state.scale='major';
  syncOverblows(s,state.rootOff);
  save(); changed();
}
function noteLabel(n,spec){
  if(n[0]==null) return '–';
  return state.notation==='numbers'?jp(n[0]+song.shift):nName(spec?spec.midi:L.base+state.rootOff+n[0]);
}
function renderSongList(){
  const list=$('sbList'); if(list.children.length&&list.children.length!==SONGS.length) list.innerHTML='';
  if(list.children.length) {[...list.children].forEach(b=>{b.setAttribute('aria-current',b.dataset.id===state.song);
    const pr=state.progress[b.dataset.id]; b.querySelector('.sb-best').textContent=pr?`Best ${pr.best}% · played ${pr.plays}×`:'';}); return;}
  SONGS.forEach(s=>{const b=document.createElement('button'); b.className='sb-item'; b.dataset.id=s.id; b.setAttribute('role','listitem');
    b.innerHTML=`<b>${s.title}${s.user?' <small class="sb-mine">Yours</small>':''}</b><span>${s.first}</span><em class="sb-diff"></em><em class="sb-best"></em>`;
    b.addEventListener('click',()=>selectSong(s.id));
    list.appendChild(b);});
  renderSongList();
}
function renderSongbook(){
  if(!L) return;
  const s=songById(state.song); song.cur=s; state.song=s.id;
  const m=mapSong(s); song.specs=m.specs; song.shift=m.o; song.tonic=m.tonic;
  if(state.verse>=s.verses.length) state.verse=0;
  if(song.pos>=s.notes.length) song.pos=0;
  renderSongList();
  [...$('sbList').children].forEach(b=>{const bp=bestPosition(songById(b.dataset.id)), e=b.querySelector('.sb-diff');
    e.textContent=bp.h.label+(L.chrom?'':' · '+SONG_POS.find(p=>p[0]===bp.off)[1]+' position'); e.dataset.level=bp.h.level;});
  const pb=$('sbPos'); pb.innerHTML='';
  SONG_POS.forEach(([off,ord])=>{const h=songHardness(s,mapSong(s,off)), b=document.createElement('button');
    b.innerHTML=`${L.chrom?'Key of '+nName(L.base+off):ord+' · '+nName(L.base+off)}<small>${h.label}</small>`;
    b.setAttribute('aria-pressed',off===state.rootOff);
    b.addEventListener('click',()=>{songStop(); state.rootOff=off; syncOverblows(s,off); save(); changed();}); pb.appendChild(b);});
  $('sbTitle').textContent=s.title;
  $('sbCredits').innerHTML=s.user?`Added by you${s.music?' · '+s.music.replace(/</g,'&lt;'):''} · <button class="linkbtn" id="sbRemove">Remove from songbook</button>`:`Words: ${s.words} · Music: ${s.music}`;
  if(s.user) $('sbRemove').addEventListener('click',()=>{ songStop(); state.userSongs=state.userSongs.filter(u=>u.id!==s.id);
    SONGS.splice(SONGS.findIndex(x=>x.id===s.id),1); state.song=SONGS[0].id; song.pos=0; save(); renderSongbook(); if(pocketOpen()) renderPocketSheet(); });
  const used=m.specs.filter(Boolean), bends=used.filter(x=>x.bend>0).length, alts=used.filter(x=>x.alt).length, miss=s.notes.filter((n,i)=>n[0]!=null&&!m.specs[i]).length;
  const holes=used.map(x=>x.hi+1);
  const pn=posNumber();
  $('sbInfo').innerHTML=`Key of <b>${nName(m.tonic)}</b> on your ${KEY_LABEL[state.key]} ${L.chrom?'chromatic':'diatonic'}${L.chrom?'':' ('+ORD[pn-1]+' position'+(POS_NICK[pn]?', '+POS_NICK[pn]:'')+')'} · ${s.meter} time · holes <b>${Math.min(...holes)}–${Math.max(...holes)}</b>`
    +(bends?` · <b>${bends}</b> bent note${bends>1?'s':''}`:' · no bends')+(alts?` · <b>${alts}</b> ${L.chrom?'slide':'overblown'} note${alts>1?'s':''}`+(!L.chrom&&state.obAuto?' (overblows turned on for this hymn)':''):'')
    +(miss?` · <b>${miss}</b> note${miss>1?'s':''} not on this harp (turn on overblows)`:'');
  [...$('sbSpeed').children].forEach(b=>b.setAttribute('aria-pressed',+b.dataset.r===state.songRate));
  [...$('sbNotation').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.n===state.notation));
  const sc=$('sbScore'); sc.innerHTML=''; let ph=document.createElement('div'); ph.className='phrase';
  s.notes.forEach((n,i)=>{
    const spec=m.specs[i], c=document.createElement('button'); c.className='nc'+(n[0]==null?' rest':'')+(n[3].includes('b')?' bar':''); c.dataset.i=i;
    c.style.setProperty('--d',Math.min(3,n[1]));
    c.innerHTML=`<span class="t">${n[0]==null?'rest':spec?spec.tab:'?'}</span><span class="n">${noteLabel(n,spec)}</span><span class="s">${sylAt(s,i)}</span>`;
    c.title=n[0]==null?'Rest':`${spec?spec.tab:'?'} · ${spec?nName(spec.midi)+nOct(spec.midi):''}`;
    c.addEventListener('click',()=>{songStop(); song.pos=i; songMark(); if(spec) {setTouch('song',[spec],{mouth:true}); setTimeout(()=>endTouch('song'),Math.min(900,songSecs(n)*1000));}});
    ph.appendChild(c);
    if(n[3].includes('l')||i===s.notes.length-1){sc.appendChild(ph); ph=document.createElement('div'); ph.className='phrase';}
  });
  const vs=$('sbVerse'); vs.innerHTML=''; s.verses.forEach((v,i)=>vs.add(new Option('Verse '+(i+1),i))); vs.value=state.verse; vs.disabled=s.verses.length<2;
  for(const [id,key] of [['sbClick','songClick'],['sbCount','countIn'],['sbHarm','backing'],['sbGuide','guide'],['sbLoop','loopLine']]) $(id).setAttribute('aria-pressed',!!state[key]);
  $('sbHarm').disabled=!s.parts.length; $('sbHarm').title=s.parts.length?'Alto, tenor and bass from the hymnal':'This hymn has no harmony parts';
  $('sbBackVol').value=state.backVol;
  songMark(); updateSongButtons();
}
function sylAt(s,i){ const v=s.verses[state.verse]; return (v&&v[i]!=null?v[i]:s.notes[i][2])||''; }
const songSecs=n=>n[1]*60/(song.cur.bpm*state.songRate);
function songMark(scroll){
  const cells=$('sbScore').children; let k=0;
  document.querySelectorAll('#sbScore .nc').forEach(c=>{const i=+c.dataset.i; c.classList.toggle('now',i===song.pos&&song.mode!=='idle'); c.classList.toggle('done',i<song.pos&&song.mode!=='idle');});
  if(scroll!==false){const c=document.querySelector(`#sbScore .nc[data-i="${song.pos}"]`), sc=$('sbScore');
    if(c&&song.mode!=='idle'){const top=c.offsetTop-sc.offsetTop; if(top<sc.scrollTop||top>sc.scrollTop+sc.clientHeight-60) sc.scrollTop=Math.max(0,top-40);}}
  // next-note hint
  const s=song.cur, nx=$('sbNext'); if(!s) return;
  const upcoming=[]; for(let i=song.pos;i<s.notes.length&&upcoming.length<5;i++) if(song.specs[i]) upcoming.push(song.specs[i]);
  if(song.mode==='practice'&&upcoming.length){
    const how=techHint(upcoming[0]);
    nx.innerHTML=`<span class="lbl">Play</span><span class="big">${upcoming[0].tab}</span><span class="msg">${nName(upcoming[0].midi)}${s.notes[song.pos][2]?' · “'+s.notes[song.pos][2]+'”':''}</span><span class="then">then ${upcoming.slice(1).map(x=>x.tab).join('  ')}</span>${how?`<span class="how">${how}</span>`:''}`;
  } else if(song.mode==='done'){
    nx.innerHTML='<span class="msg">Well played. Press Practice to go again, or try Play along to keep time.</span>';
  } else if(song.mode==='listen'){
    nx.innerHTML=`<span class="msg">Listening… watch the lit holes on the harp.</span>`;
  } else if(song.mode==='along'){
    const t=tpTally(), sp=song.specs[song.pos];
    nx.innerHTML=`<span class="lbl">Now</span><span class="big">${sp?sp.tab:'–'}</span><span class="then">${upcoming.slice(1).map(x=>x.tab).join('  ')}</span>`
      +`<span class="tally"><b class="good">${t.good}</b> on time · <b class="off">${t.off}</b> early or late · <b class="bad">${t.miss}</b> missed${tp.loop?' · looping this line':''}</span>`;
  } else if(song.mode==='result'){
    const r=song.result, pr=state.progress[s.id];
    nx.innerHTML=`<span class="lbl">Score</span><span class="big">${r.score}%</span><span class="tally"><b class="good">${r.good}</b> on time · <b class="off">${r.off}</b> early or late · <b class="bad">${r.miss}</b> missed${pr&&pr.best>r.score?` · your best is ${pr.best}%`:pr&&pr.plays>1?' · new best':''}</span>`;
  } else nx.innerHTML=`<span class="msg">Listen to hear it with the hymnal harmony, Play along to play it in time with a score, or Practice to go one note at a time. Tap any note to hear it.</span>`;
  // target highlights on the harp
  const tgt=song.mode==='practice'||song.mode==='along'?song.specs[song.pos]:null;
  for(const [k,el] of chipEls) el.classList.toggle('target',!!tgt&&k===chipKey(tgt));
  holeEls.forEach((el,i)=>el.classList.toggle('target',!!tgt&&i===tgt.hi));
  for(const [k,el] of pkLbl) el.classList.toggle('target',!!tgt&&k===chipKey(tgt));
  pkHoles.forEach((el,i)=>el.classList.toggle('target',!!tgt&&i===tgt.hi));
  updatePocketSong();
}
function techHint(sp){
  // How to play a bend, overblow or slide note, on screen and on the keyboard.
  const k=KL(), hole=sp.hi+1, draw=sp.breath==='draw', key=codeLabel((draw?k.draw:k.blow)[sp.hi]);
  if(sp.alt&&L.chrom) return `Slide in: hold the slide button (or Shift) and ${draw?'draw':'blow'} hole ${hole}. Keyboard: Shift + ${key}.`;
  if(sp.alt) return `${draw?'Overdraw':'Overblow'}: tap the round chip ${draw?'below':'above'} hole ${hole}, or hold Shift and press ${key}.`;
  if(sp.bend>0){const b=Math.round(sp.bend), amt=['','a half step','a whole step','a step and a half'][b];
    return `Bend: ${draw?'draw':'blow'} hole ${hole} and bend it down ${amt}. Drag ${draw?'down':'up'} from the ${draw?'draw':'blow'} note, or hold ${['','Z','X','C'][b]} and press ${key}.`;}
  return '';
}
function skipRests(){while(song.pos<song.cur.notes.length&&!song.specs[song.pos]) song.pos++;}
function songStop(){clearTimeout(song.timer); if(tp.on) tpStop(true); song.mode='idle'; updateSongButtons(); songMark(false);}
function updateSongButtons(){$('sbListen').setAttribute('aria-pressed',song.mode==='listen'); $('sbListen').textContent=song.mode==='listen'?'Stop':'Listen';
  $('sbAlong').setAttribute('aria-pressed',song.mode==='along'); $('sbAlong').textContent=song.mode==='along'?'Stop':'Play along';
  $('sbPractice').setAttribute('aria-pressed',song.mode==='practice'); $('sbPractice').textContent=song.mode==='practice'?'Stop practice':'Practice';}
function songListen(){ if(song.mode==='listen'){songStop(); return;} songStop(); tpStart('listen'); }
function songAlong(){ if(song.mode==='along'){songStop(); return;} songStop(); tpStart('along'); }
function songPractice(){
  if(song.mode==='practice'){songStop(); return;}
  songStop(); if(song.pos>=song.cur.notes.length-1) song.pos=0; skipRests(); song.mode='practice'; updateSongButtons(); songMark();
}
function songHeard(id,t,specs){
  // called from setTouch: advance when the player sounds the target pitch (a fresh note or a bend arriving on it)
  if(id==='song'||id==='preview'||id==='demo') return;
  if(song.mode==='along'){
    // record each newly sounding pitch (a new note, or a bend arriving) for timing grades
    const now=new Set(specs.map(x=>Math.round(x.midi))), prev=t.prevPitches||new Set();
    for(const m of now) if(!prev.has(m)) tpNoteOn(m);
    t.prevPitches=now; return;
  }
  if(song.mode!=='practice') return;
  const tgt=song.specs[song.pos]; if(!tgt) return;
  const hit=specs.some(s=>Math.round(s.midi)===Math.round(tgt.midi));
  if(hit&&!t.hitTarget){ song.pos++; skipRests(); if(song.pos>=song.cur.notes.length){song.mode='done'; updateSongButtons();} songMark(); }
  t.hitTarget=hit;
}
function updatePocketSong(){
  const p=$('pocket'); if(!p||!song.cur) return;
  const on=song.mode!=='idle'; p.classList.toggle('has-song',on); $('pkSongStop').hidden=!on;
  if(!on) return;
  const up=[]; for(let i=song.pos;i<song.cur.notes.length&&up.length<5;i++) if(song.specs[i]) up.push(song.specs[i]);
  const syl=song.pos<song.cur.notes.length?sylAt(song.cur,song.pos):'';
  $('pkSong').innerHTML=song.mode==='done'?'Well played!':song.mode==='result'?`Score ${song.result.score}%`:`<span>${song.mode==='listen'?'Listen':song.mode==='along'?'Now':'Play'}</span><b>${up[0]?up[0].tab:''}</b><i>${up.slice(1).map(x=>x.tab).join(' ')}</i><span>${syl?'“'+syl+'”':''}</span>`;
}
$('sbListen').addEventListener('click',songListen);
$('sbAlong').addEventListener('click',songAlong);
for(const [id,key] of [['sbClick','songClick'],['sbCount','countIn'],['sbHarm','backing'],['sbGuide','guide'],['sbLoop','loopLine']])
  $(id).addEventListener('click',()=>{state[key]=!state[key]; save(); $(id).setAttribute('aria-pressed',state[key]);});
$('sbBackVol').addEventListener('input',e=>{state.backVol=+e.target.value; save();});
$('sbVerse').addEventListener('change',e=>{state.verse=+e.target.value; save(); renderSongbook();});
$('sbPractice').addEventListener('click',songPractice);
$('sbRestart').addEventListener('click',()=>{const m=song.mode; songStop(); song.pos=0; if(m==='practice') songPractice(); else if(m==='listen') tpStart('listen'); else if(m==='along') tpStart('along'); else songMark();});
[...$('sbSpeed').children].forEach(b=>b.addEventListener('click',()=>{state.songRate=+b.dataset.r; save(); renderSongbook();}));
[...$('sbNotation').children].forEach(b=>b.addEventListener('click',()=>{state.notation=b.dataset.n; save(); renderSongbook();}));
$('pkSongStop').addEventListener('click',()=>songStop());
/* ---------- importing your own songs (ABC notation) ---------- */
function sbAddSong(text){
  const msg=$('sbAbcMsg');
  try{
    const s=abcToSong(text);
    const h=bestPosition(s);
    if(h.h.miss>0&&!L.chrom) msg.textContent=`Added. ${h.h.miss} note${h.h.miss>1?'s are':' is'} out of this harp's range in every position; try another harp key.`;
    else msg.textContent=`Added “${s.title}”.`;
    state.userSongs.push(s); SONGS.push(s); save();
    $('sbAbc').value=''; selectSong(s.id);
  }catch(e){ msg.textContent=e.message||'That text could not be read as ABC notation.'; }
}
$('sbAddBtn').addEventListener('click',()=>{const p=$('sbAdd'); p.hidden=!p.hidden; $('sbAddBtn').setAttribute('aria-expanded',!p.hidden); if(!p.hidden) $('sbAbc').focus();});
$('sbAbcAdd').addEventListener('click',()=>{const t=$('sbAbc').value.trim(); if(t) sbAddSong(t); else $('sbAbcMsg').textContent='Paste a tune first, or open a file.';});
$('sbAbcFile').addEventListener('change',e=>{const f=e.target.files[0]; if(!f) return; const r=new FileReader();
  r.onload=()=>{$('sbAbc').value=r.result; sbAddSong(r.result);}; r.readAsText(f); e.target.value='';});
