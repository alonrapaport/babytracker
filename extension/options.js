const input = document.getElementById('base');
const button = document.getElementById('save');

chrome.storage.sync.get({ baseUrl: 'http://localhost:5173/' }).then(({ baseUrl }) => {
  input.value = baseUrl;
});

button.addEventListener('click', async () => {
  await chrome.storage.sync.set({ baseUrl: input.value.trim() || 'http://localhost:5173/' });
  button.textContent = 'Saved ✓';
  setTimeout(() => (button.textContent = 'Save'), 1200);
});
