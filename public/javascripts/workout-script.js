const planForm = document.getElementById('planForm');
if (planForm) {
  planForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('planFormError');
    const output = document.getElementById('workoutPlanOutput');
    errorBox.style.display = 'none';
    output.style.display = 'block';
    output.textContent = 'Generating your plan...';

    const body = Object.fromEntries(new FormData(planForm));

    try {
      const res = await fetch('/api/gemini/workout-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        output.style.display = 'none';
        errorBox.textContent = data.error || 'Could not generate a plan.';
        errorBox.style.display = 'block';
        return;
      }
      output.textContent = data.plan;
    } catch (err) {
      output.style.display = 'none';
      errorBox.textContent = 'Connection error - try again.';
      errorBox.style.display = 'block';
    }
  });
}

const activityForm = document.getElementById('activityForm');
if (activityForm) {
  activityForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('activityFormError');
    errorBox.style.display = 'none';
    const body = Object.fromEntries(new FormData(activityForm));

    const res = await fetch('/api/activity', {
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

const workoutForm = document.getElementById('workoutForm');
if (workoutForm) {
  workoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('workoutFormError');
    errorBox.style.display = 'none';
    const body = Object.fromEntries(new FormData(workoutForm));

    const res = await fetch('/api/workout', {
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
