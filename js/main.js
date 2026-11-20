/* Harp Bench: start-up */
"use strict";
i18nStart();
document.querySelectorAll('#langSeg [data-lang]').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang)));
document.querySelectorAll('#themeSeg [data-theme-pick]').forEach(b=>b.addEventListener('click',()=>setTheme(b.dataset.themePick)));
render();
updatePocket();
