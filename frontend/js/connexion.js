document.addEventListener('DOMContentLoaded', () => {
  // Si déjà connecté, rediriger vers l'accueil
  if (isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const form         = document.getElementById('form-connexion');
  const errorMessage = document.getElementById('error-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const response = await authFetch('/auth/connexion', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        errorMessage.textContent = data.message || 'Erreur de connexion';
        return;
      }

      setToken(data.token);
      await syncLocalFavoritesToAccount();
      window.location.href = 'index.html';
    } catch (err) {
      errorMessage.textContent = 'Impossible de contacter le serveur';
    }
  });
});