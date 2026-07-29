const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('loginError');
    errorBox.style.display = 'none';
    const body = Object.fromEntries(new FormData(loginForm));

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      errorBox.textContent = data.error;
      errorBox.style.display = 'block';
      return;
    }
    window.location.href = data.redirect;
  });
}

const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('signupError');
    errorBox.style.display = 'none';
    const body = Object.fromEntries(new FormData(signupForm));

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      errorBox.textContent = data.error;
      errorBox.style.display = 'block';
      return;
    }
    window.location.href = data.redirect;
  });
}
