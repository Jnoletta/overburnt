document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const form         = document.getElementById('form-inscription');
  const errorMessage = document.getElementById('error-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';

    const email   = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm  = document.getElementById('password-confirm').value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      errorMessage.textContent = 'Adresse email invalide';
      return;
    }

    if (password !== confirm) {
      errorMessage.textContent = 'Les mots de passe ne correspondent pas';
      return;
    }
    if (password.length < 6) {
      errorMessage.textContent = 'Le mot de passe doit faire au moins 6 caractères';
      return;
    }

    try {
      const response = await authFetch('/auth/inscription', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        errorMessage.textContent = data.message || "Erreur lors de l'inscription";
        return;
      }

      setToken(data.token);
      window.location.href = 'index.html';
    } catch (err) {
      errorMessage.textContent = 'Impossible de contacter le serveur';
    }
  });
});