const profileForm = document.getElementById('profileForm');
if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('profileFormError');
    errorBox.style.display = 'none';
    const body = Object.fromEntries(new FormData(profileForm));

    const res = await fetch('/users/profile/update', {
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
    window.location.reload();
  });
}

const passwordForm = document.getElementById('passwordForm');
if (passwordForm) {
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('passwordFormError');
    const successBox = document.getElementById('passwordFormSuccess');
    errorBox.style.display = 'none';
    successBox.style.display = 'none';
    const body = Object.fromEntries(new FormData(passwordForm));

    const res = await fetch('/users/profile/change-password', {
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
    successBox.textContent = 'Password updated.';
    successBox.style.display = 'block';
    passwordForm.reset();
  });
}
