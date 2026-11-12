/* Harp Bench: service worker registration, install button and update prompt */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);

  // Offline support
  let userAskedUpdate = false;
  function showUpdate(worker) {
    if (document.getElementById('updateToast')) return;
    const t = document.createElement('div');
    t.className = 'toast'; t.id = 'updateToast'; t.setAttribute('role', 'status');
    t.innerHTML = '<span>A new version of Harp Bench is ready.</span><button type="button">Update</button>';
    t.querySelector('button').addEventListener('click', () => { userAskedUpdate = true; worker.postMessage('skipWaiting'); });
    document.body.appendChild(t);
  }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(reg => {
        navigator.serviceWorker.ready.then(() => { $('offlinePill').hidden = false; });
        if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const w = reg.installing; if (!w) return;
          w.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdate(w);
          });
        });
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      }).catch(() => {});
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (userAskedUpdate) location.reload();
      });
    });
  }

  // Install button (Chrome, Edge, Android)
  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferred = e; $('installBtn').hidden = false; $('deskHint').hidden = true;
  });
  $('installBtn').addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch (e) {}
    deferred = null; $('installBtn').hidden = true;
  });
  window.addEventListener('appinstalled', () => { $('installBtn').hidden = true; });

  // iPhone / iPad: Safari has no install prompt, so explain the Share menu route
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  let dismissed = false;
  try { dismissed = localStorage.getItem('harpbench-ioshint') === '1'; } catch (e) {}
  if (isIOS && !standalone && !dismissed) {
    $('iosHint').hidden = false;
    // Safari's user agent says "Safari"; built-in browsers inside other apps usually do not (Chrome and Firefox on iOS say CriOS / FxiOS and can add to the Home Screen from their share menu)
    const ua = navigator.userAgent;
    if (!/Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)) $('iosInApp').hidden = false;
  }
  // Computers: Chrome and Edge only offer the install button after the page has been used for a while,
  // so if it has not appeared after a few seconds, show where install lives in the browser menu.
  const desktop = !isIOS && !/Android/i.test(navigator.userAgent) && !standalone;
  let deskDismissed = false;
  try { deskDismissed = localStorage.getItem('harpbench-deskhint') === '1'; } catch (e) {}
  if (desktop && !deskDismissed && location.protocol !== 'file:') setTimeout(() => {
    if (deferred || standalone) return;
    const ua = navigator.userAgent, edge = /Edg\//.test(ua), chrome = /Chrome\//.test(ua) && !edge && !/OPR\//.test(ua);
    const steps = edge
      ? ['Click <b>…</b> (Settings and more) at the top right.', 'Choose <b>Apps</b>, then <b>Install this site as an app</b>.', 'Click <b>Install</b>.']
      : chrome
        ? ['Look for the install icon at the right end of the address bar, or click <b>⋮</b> and open <b>Cast, save, and share</b>.', 'Choose <b>Install Harp Bench…</b> (or <b>Install page as app…</b>), then <b>Install</b>.', 'If neither appears, Chrome is not offering an install for this page on this computer; the page still works offline in this tab.']
        : ['Installing works in Chrome and Edge, from the browser menu.', 'In this browser, bookmark the page; it still works offline once loaded.'];
    $('deskSteps').innerHTML = steps.map(s => '<li data-i18n-html>' + s + '</li>').join('');
    $('deskHint').hidden = false;
  }, 4000);
  $('deskHintClose').addEventListener('click', () => {
    $('deskHint').hidden = true;
    try { localStorage.setItem('harpbench-deskhint', '1'); } catch (e) {}
  });
  $('iosHintClose').addEventListener('click', () => {
    $('iosHint').hidden = true;
    try { localStorage.setItem('harpbench-ioshint', '1'); } catch (e) {}
  });
})();
