/* Harp Bench: light / dark. styles.css follows the device unless <html data-theme> says otherwise. A page that hosts the app
   (the single-file build) may set data-theme itself, so Auto puts back whatever was there at start-up. */
"use strict";
const THEME_BAR={light:'#E3E7ED',dark:'#0E1219'};
const themeRoot=document.documentElement;
const themeHost=themeRoot.dataset.themeSet?null:(themeRoot.dataset.theme||null);
const themeMetas=[...document.querySelectorAll('meta[name="theme-color"]')].map(m=>[m,m.content]);
function applyTheme(){
  const t=state.theme==='light'||state.theme==='dark'?state.theme:'auto';
  if(t!=='auto') themeRoot.dataset.theme=t; else if(themeHost) themeRoot.dataset.theme=themeHost; else delete themeRoot.dataset.theme;
  for(const [m,was] of themeMetas) m.content=t==='auto'?was:THEME_BAR[t];        // browser toolbar / status bar colour
  document.querySelectorAll('[data-theme-pick]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.themePick===t));
}
function setTheme(t){ state.theme=t; save(); applyTheme(); }
applyTheme();
