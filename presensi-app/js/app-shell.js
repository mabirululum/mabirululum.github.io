// ---- Service Worker ----
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(console.error);
}

// ---- Tombol Install PWA ----
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('btn-install-pwa');
  if (btn) btn.style.display = 'inline-block';
});

function initTombolInstallPwa() {
  const btn = document.getElementById('btn-install-pwa');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btn.style.display = 'none';
  });
}

// ---- Overlay Mulai (unlock audio autoplay) ----
function initOverlayMulai() {
  const overlay = document.getElementById('overlay-mulai');
  if (!overlay) return;
  overlay.addEventListener('click', function () {
    const u = new SpeechSynthesisUtterance(' ');
    speechSynthesis.speak(u);
    this.remove();
  });
}

// ---- Overlay Offline (deteksi + auto reload) ----
function initOverlayOffline() {
  const overlay = document.getElementById('overlay-offline');
  if (!overlay) return;

  function tampilkanStatusKoneksi() {
    overlay.style.display = navigator.onLine ? 'none' : 'flex';
  }

  window.addEventListener('offline', tampilkanStatusKoneksi);
  window.addEventListener('online', () => window.location.reload());

  tampilkanStatusKoneksi();
}

document.addEventListener('DOMContentLoaded', () => {
  initTombolInstallPwa();
  initOverlayMulai();
  initOverlayOffline();
});