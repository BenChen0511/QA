import { hideFeedbackButtons, showFeedbackButtons } from './feedback.js';
import { restoreButton } from './shared.js';

export function initSearch() {
  const form = document.getElementById('searchForm');
  if (!form) { console.warn('[search] form not found'); return; }
  form.addEventListener('submit', onSearchSubmit);
  console.log('[search] bound submit');
}

async function onSearchSubmit(e) {
  e.preventDefault();
  hideFeedbackButtons();
  const button = e.target.querySelector('button');
  const restore = restoreButton(button, '⏳ 思考中...');
  const question = document.getElementById('question').value;
  let response;
  try {
    response = await fetch(`/search?question=` + encodeURIComponent(question));
  } catch (err) {
    showError('無法連線到伺服器，請稍後再試。');
    restore();
    return;
  }
  if (!response.ok) {
    handleHttpError(response);
    restore();
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let result = '';
  const streamEl = document.getElementById('stream');
  streamEl.innerHTML = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
    streamEl.innerHTML = result.replace(/\n/g, '<br>');
  }
  restore();
  showFeedbackButtons();
}

function showError(msg) {
  const streamEl = document.getElementById('stream');
  streamEl.innerHTML = `<p>${msg}</p>`;
  alert(msg);
}

function handleHttpError(response) {
  let errorMessage = '查詢失敗，請稍後再試...';
  switch (response.status) {
    case 500: errorMessage = '系統錯誤500可能是記憶體不足或模型錯誤。'; break;
    case 404: errorMessage = '找不到資源404。'; break;
    case 403: errorMessage = '權限不足403。'; break;
    case 400: errorMessage = '錯誤的請求400請檢查輸入內容。'; break;
  }
  showError(errorMessage);
}
