/* Harp Bench: share the app itself. A dialog with a QR code of the public address, a WhatsApp link,
   copy to clipboard and the system share sheet. The QR code is drawn into index.html by tools/build_qr.py. */
"use strict";
const SHARE_URL='https://stanleywoosweeleong.github.io/HarpBench/';
const shareText=()=>tr('Play the harmonica on your phone or computer with Harp Bench:',i18nLang());
let shareOpener=null;

function shareOpen(){
  shareOpener=document.activeElement;
  $('shareUrl').textContent=SHARE_URL; $('shareMsg').textContent='';
  $('shareWa').href='https://wa.me/?text='+encodeURIComponent(shareText()+' '+SHARE_URL);   // in the language on screen
  $('shareMore').hidden=!navigator.share;
  $('shareDialog').hidden=false; $('shareCopy').focus();
}
function shareClose(){
  $('shareDialog').hidden=true;
  if(shareOpener&&shareOpener.focus) shareOpener.focus(); shareOpener=null;
}
async function shareCopy(){
  let ok=false;
  try{ await navigator.clipboard.writeText(SHARE_URL); ok=true; }
  catch(e){
    // no clipboard permission (older browsers, some embedded pages): copy from a selected field instead
    const ta=document.createElement('textarea'); ta.value=SHARE_URL; ta.setAttribute('readonly','');
    ta.style.cssText='position:fixed;top:0;left:0;opacity:0'; $('shareDialog').appendChild(ta); ta.select();
    try{ ok=document.execCommand('copy'); }catch(e2){}
    ta.remove(); $('shareCopy').focus();
  }
  $('shareMsg').textContent=ok?'Link copied.':'Could not copy the link here. Select the address above and copy it.';
}
async function shareMore(){
  try{ await navigator.share({title:'Harp Bench',text:shareText(),url:SHARE_URL}); }
  catch(e){}                                                  // the player closed the share sheet
}

$('shareBtn').addEventListener('click',shareOpen);
$('shareClose').addEventListener('click',shareClose);
$('shareCopy').addEventListener('click',shareCopy);
$('shareMore').addEventListener('click',shareMore);
$('shareDialog').addEventListener('click',e=>{ if(e.target.id==='shareDialog') shareClose(); });
// capture, so Escape and the note keys do not reach the harp while the dialog is open
document.addEventListener('keydown',e=>{
  if($('shareDialog').hidden) return;
  if(e.key==='Escape'){ e.preventDefault(); shareClose(); }
  if(e.key!=='Tab'&&e.key!=='Enter'&&!e.metaKey&&!e.ctrlKey) e.stopPropagation();
},true);
