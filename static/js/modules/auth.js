export function initAuth() {
  initLogin();
  initLogout();
  initSessionCleanup();
}

function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) { console.warn('[auth] login form not found'); return; }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username')?.value ?? '';
    const password = document.getElementById('password')?.value ?? '';
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'same-origin'
      });
      if (response.ok || response.redirected || response.status === 303) {
        const modalEl = document.getElementById('staticBackdrop');
        if (modalEl && window.bootstrap) {
          (window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl)).hide();
        }
        window.location.replace('/');
      } else {
        const t = await response.text().catch(() => '');
        alert(t || '登入失敗');
      }
    } catch (err) {
      alert('登入時發生錯誤：' + err);
    }
  });
}

function initLogout() {
  document.addEventListener('click', async (e) => {
    const target = e.target;
    if (target && target.id === 'logoutBtn') {
  console.log('[auth] logout click');
      try {
        await fetch('/api/logout', { method: 'GET', credentials: 'same-origin', redirect: 'manual' });
      } finally {
        window.location.replace('/');
      }
    }
  });
}

function initSessionCleanup() {
  function sendLogoutBeacon() {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/logout-beacon');
    } else {
      fetch('/api/logout-beacon', { method: 'POST', keepalive: true, credentials: 'same-origin' }).catch(() => {});
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendLogoutBeacon();
  });
  console.log('[auth] session cleanup listeners added');
  window.addEventListener('pagehide', () => { sendLogoutBeacon(); });
  window.addEventListener('load', () => {
    fetch('/api/logout-beacon', { method: 'POST', keepalive: true, credentials: 'same-origin' }).catch(() => {});
  });
}
