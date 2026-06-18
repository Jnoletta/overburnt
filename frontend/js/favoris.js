document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  await loadFavoris();
});

const loadFavoris = async () => {
  const grid    = document.getElementById('favoris-grid');
  const loading = document.getElementById('favoris-loading');
  const empty   = document.getElementById('favoris-empty');

  try {
    const res       = await authFetch('/favorites');
    const favorites = await res.json();
    console.log('statut:', res.status);
    console.log('favoris reçus:', favorites);

    loading.style.display = 'none';

    if (!favorites.length) {
      empty.style.display = 'block';
      return;
    }

    grid.innerHTML = favorites.map((product) => renderCard(product)).join('');

    grid.querySelectorAll('.btn-remove-fav').forEach((btn) => {
      btn.addEventListener('click', () => removeFavori(parseInt(btn.dataset.id), btn));
    });

  } catch (err) {
    loading.textContent = 'Erreur lors du chargement.';
    console.error(err);
  }
};

// ── Rendu carte ───────────────────────────────────────────────────────────────

const renderCard = (product) => {
  const imageUrl = product.image_url
    ? `http://localhost:3000${product.image_url}`
    : '../images/placeholder.png';

  return `
    <article class="product-card" data-id="${product.id}">
      <a href="produit-detail.html?id=${product.id}">
        <img src="${imageUrl}" alt="${product.name}" />
        <h3>${product.name}</h3>
        <p class="product-price">${parseFloat(product.price).toFixed(2)} €</p>
      </a>
      <button class="btn-remove-fav" data-id="${product.id}">
        ✕ Retirer des favoris
      </button>
    </article>
  `;
};

// ── Supprimer un favori ───────────────────────────────────────────────────────

const removeFavori = async (productId, btn) => {
  try {
    const res = await authFetch(`/favorites/${productId}`, { method: 'DELETE' });
    if (res.ok) {
      const card = btn.closest('.product-card');
      card.remove();

      // Afficher message vide si plus aucun favori
      if (!document.querySelectorAll('.product-card').length) {
        document.getElementById('favoris-empty').style.display = 'block';
      }
    }
  } catch (err) {
    console.error('Erreur suppression favori :', err);
  }
};