document.getElementById('askGeminiBtn')?.addEventListener('click', async () => {
  const output = document.getElementById('aiCoachOutput');
  const originalText = output.textContent;
  output.textContent = 'Thinking...';

  try {
    const res = await fetch('/api/gemini/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Give me a short, motivating fitness tip for today, one or two sentences.'
      })
    });
    const data = await res.json();
    output.textContent = res.ok ? data.reply : (data.error || 'Something went wrong.');
  } catch (err) {
    output.textContent = originalText;
  }
});
