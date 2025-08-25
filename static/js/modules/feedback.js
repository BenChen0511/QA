export function initFeedback() {
  const likeBtn = document.getElementById('likeBtn');
  const dislikeBtn = document.getElementById('dislikeBtn');
  if (!likeBtn || !dislikeBtn) { console.warn('[feedback] buttons not found'); return; }
  likeBtn.addEventListener('click', async () => {
    await sendFeedback('like');
    alert('感謝您的回饋，我們會持續改進！');
    hideFeedbackButtons();
  });
  dislikeBtn.addEventListener('click', async () => {
    await sendFeedback('dislike');
    alert('感謝您的回饋，我們會持續改進！');
    hideFeedbackButtons();
  });
  console.log('[feedback] bound like/dislike');
}

export function hideFeedbackButtons() {
  const div = document.getElementById('feedbackButtons');
  if (!div) return;
  div.style.display = 'none';
  div.classList.remove('d-flex');
}

export function showFeedbackButtons() {
  const div = document.getElementById('feedbackButtons');
  if (!div) return;
  div.style.display = 'flex';
  div.classList.add('d-flex');
}

export async function sendFeedback(type) {
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: document.getElementById('question').value,
        answer: document.getElementById('stream').innerText,
        feedback: type
      })
    });
    if (!response.ok) console.error('回饋送出失敗', await response.text());
  } catch (e) {
    console.error('回饋送出錯誤', e);
  }
}
