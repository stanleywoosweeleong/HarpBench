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
    e.preventDefault(); deferred = e; $('installBtn').hidden = false;
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
  $('iosHintClose').addEventListener('click', () => {
    $('iosHint').hidden = true;
    try { localStorage.setItem('harpbench-ioshint', '1'); } catch (e) {}
  });
})();
