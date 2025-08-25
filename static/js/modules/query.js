import { restoreButton } from './shared.js';

export function initQuery() {
  const form = document.getElementById('queryQuestionForm');
  if (!form) { console.warn('[query] form not found'); return; }
  form.addEventListener('submit', onQuerySubmit);
  console.log('[query] bound submit');
}

async function onQuerySubmit(e) {
  e.preventDefault();
  const button = e.target.querySelector('button');
  const restore = restoreButton(button, '⏳ 查找中...');
  const keyword = document.getElementById('queryQuestion').value;
  let response;
  try {
    response = await fetch(`/query?keyword=` + encodeURIComponent(keyword));
  } catch {
    setResultsHtml('<p>查找失敗，請稍後再試。</p>');
    restore();
    return;
  }
  if (!response.ok) {
    setResultsHtml('<p>查找失敗，請稍後再試。</p>');
    restore();
    return;
  }
  const results = await response.json();
  renderResults(results);
  restore();
}

function setResultsHtml(html) {
  const container = document.getElementById('queryResults');
  if (container) container.innerHTML = html;
}

function renderResults(results) {
  const container = document.getElementById('queryResults');
  if (!container) return;
  container.innerHTML = '';
  if (!Array.isArray(results) || results.length === 0) {
    container.innerHTML = '<p>🔍 沒有找到相關問題。</p>';
    return;
  }
  const ul = document.createElement('ul');
  ul.classList.add('list-group');
  results.forEach(item => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'bg-dark', 'text-light', 'border-secondary');
    const question = typeof item.data?.question === 'string' ? item.data.question : JSON.stringify(item.data.question);
    const answer = typeof item.data?.answer === 'string' ? item.data.answer : JSON.stringify(item.data.answer);
    li.innerHTML = `
      <div><strong>問題：</strong> ${question}</div>
      <div><strong>答案：</strong> ${answer}</div>
      <div class="text-muted"><small>相似度：${item.score.toFixed(3)}</small></div>
    `;
    ul.appendChild(li);
  });
  container.appendChild(ul);
}
