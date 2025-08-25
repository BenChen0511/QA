export function initTabs() {
  const menu = document.querySelector('.dropdown-menu');
  if (!menu) { console.warn('[tabs] dropdown menu not found'); return; }
  menu.addEventListener('click', (e) => {
    const link = e.target.closest('[data-tab]');
    if (!link) return;
    e.preventDefault();
    const tab = link.getAttribute('data-tab');
    showTab(tab);
  });
}

export function showTab(tabName) {
  const titles = { search: '查詢問答', upload: '檔案上傳', query: '問題查找' };
  const titleEl = document.getElementById('mainContentTitle');
  if (titleEl) titleEl.innerText = titles[tabName] || 'Q&A查詢系統';
  toggleDisplay('searchTab', tabName === 'search');
  toggleDisplay('uploadTab', tabName === 'upload');
  toggleDisplay('queryTab', tabName === 'query');
  document.querySelectorAll('.dropdown-item[data-tab]').forEach(a => a.classList.remove('active', 'bg-secondary', 'text-white'));
  const active = document.querySelector(`.dropdown-item[data-tab="${tabName}"]`);
  if (active) active.classList.add('active', 'bg-secondary', 'text-white');
}

function toggleDisplay(id, show) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = show ? 'block' : 'none';
}

export function initDefaultTab() { showTab('search'); }
