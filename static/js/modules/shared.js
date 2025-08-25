export function restoreButton(button, loadingText) {
  if (!button) return () => {};
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = loadingText;
  return () => {
    button.disabled = false;
    button.innerHTML = original;
  };
}
