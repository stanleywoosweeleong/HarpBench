/* Harp Bench: light / dark. styles.css follows the device unless <html data-theme> says otherwise, and state.theme
   stays 'auto' until the player taps the sun / moon button, which flips to the other theme and keeps it.
   A page that hosts the app (the single-file build) may set data-theme itself, so 'auto' leaves that in place. */
"use strict";
const THEME_BAR={light:'#E3E7ED',dark:'#0E1219'};
const themeRoot=document.documentElement;
const themeHost=themeRoot.dataset.themeSet?null:(themeRoot.dataset.theme||null);
const themeMetas=[...document.querySelectorAll('meta[name="theme-color"]')].map(m=>[m,m.content]);
const themeDevice=window.matchMedia('(prefers-color-scheme: dark)');
const themePick=()=>state.theme==='light'||state.theme==='dark'?state.theme:'auto';
const themeNow=()=>{ const t=themePick(); return t!=='auto'?t:themeHost||(themeDevice.matches?'dark':'light'); };   // what is on screen
function applyTheme(){
  const t=themePick();
  if(t!=='auto') themeRoot.dataset.theme=t; else if(themeHost) themeRoot.dataset.theme=themeHost; else delete themeRoot.dataset.theme;
  for(const [m,was] of themeMetas) m.content=t==='auto'?was:THEME_BAR[t];        // browser toolbar / status bar colour
  const b=document.getElementById('themeBtn'), to=themeNow()==='dark'?'light':'dark';   // the button shows where a tap goes
  const label=to==='dark'?'Switch to dark mode':'Switch to light mode';
  b.setAttribute('aria-label',label); b.title=label;
  b.querySelectorAll('[data-to]').forEach(i=>{ i.toggleAttribute('hidden',i.dataset.to!==to); });
}
function setTheme(t){ state.theme=t; save(); applyTheme(); }
document.getElementById('themeBtn').addEventListener('click',()=>setTheme(themeNow()==='dark'?'light':'dark'));
themeDevice.addEventListener('change',applyTheme);
applyTheme();
