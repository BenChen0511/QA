export function initUpload() {
  const btn = document.querySelector('[data-upload-btn]');
  if (btn) { btn.addEventListener('click', uploadFile); console.log('[upload] bound button'); }
  else { console.warn('[upload] button not found'); }
}

async function uploadFile() {
  const input = document.getElementById('fileInput');
  const file = input?.files?.[0];
  if (!file) { alert('請選擇檔案！'); return; }
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await fetch('http://localhost:8000/upload', { method: 'POST', body: formData });
    const result = await response.json();
    if (!response.ok) alert(result.detail || '上傳失敗！');
    else alert(result.message || '上傳並建立資料庫完成！');
  console.log('[upload] response ok=', response.ok);
  } catch (e) {
    console.error('上傳失敗', e); alert('上傳失敗！');
  }
}
