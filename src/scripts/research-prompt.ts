const copyButton = document.querySelector<HTMLButtonElement>('#copy-research-prompt');
const promptStatus = document.querySelector<HTMLElement>('#prompt-status');
const preview = document.querySelector<HTMLDetailsElement>('#prompt-preview');
const promptText = document.querySelector<HTMLTextAreaElement>('#research-prompt');
let cachedPrompt = '';
copyButton?.addEventListener('click', async () => {
  if (!promptStatus || !preview || !promptText) return;
  copyButton.disabled = true; promptStatus.dataset.state = ''; promptStatus.textContent = 'Preparing the source prompt…';
  try {
    if (!cachedPrompt) {
      const response = await fetch(copyButton.dataset.url!);
      const payload = await response.json();
      if (!response.ok || typeof payload.prompt !== 'string') throw new Error('The case prompt could not be loaded. Try again.');
      cachedPrompt = payload.prompt;
    }
    promptText.value = cachedPrompt; preview.hidden = false;
    try {
      await navigator.clipboard.writeText(cachedPrompt);
      promptStatus.dataset.state = 'ok'; promptStatus.textContent = 'Prompt copied. Open ChatGPT or Claude and paste it into a new chat.';
    } catch {
      preview.open = true; promptText.focus(); promptText.select();
      promptStatus.textContent = 'Clipboard access is unavailable. Copy the selected prompt below, then paste it into your AI app.';
    }
  } catch {
    promptStatus.dataset.state = 'error'; promptStatus.textContent = 'The case prompt could not be loaded. Try again.';
  } finally { copyButton.disabled = false; }
});
