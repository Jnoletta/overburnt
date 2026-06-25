document.addEventListener('DOMContentLoaded', async () => {
  await loadFavoris();
});

const loadFavoris = async () => {
  const grid    = document.getElementById('favoris-grid');
  const loading = document.getElementById('favoris-loading');
  const empty   = document.getElementById('favoris-empty');

  try {
    let favorites;

    if (isLoggedIn()) {
      const res = await authFetch('/favorites');
      favorites = await res.json();
    } else {
      // Favoris invite stockes en localStorage (donnees produit completes)
      favorites = getLocalFavorites();
    }

    loading.style.display = 'none';

    if (!favorites.length) {
      empty.style.display = 'block';
      return;
    }

    grid.innerHTML = favorites.map((product) => renderCard(product)).join('');

    grid.querySelectorAll('.btn-remove-fav').forEach((btn) => {
      const productId = parseInt(btn.dataset.id);
      const product    = favorites.find((p) => p.id === productId);
      btn.addEventListener('click', () => removeFavori(product, btn));
    });

  } catch (err) {
    loading.textContent = 'Erreur lors du chargement.';
    console.error(err);
  }
};

// Rendu carte

const renderCard = (product) => {
  const imageUrl = product.image_url
    ? `http://localhost:3000${product.image_url}`
    : '../images/placeholder.png';

  const prixTTC = (product.price * (1 + product.taux_tva / 100)).toFixed(2);

  return `
    <article class="product-card" data-id="${product.id}">
      <a href="produit-detail.html?id=${product.id}">
        <img src="${imageUrl}" alt="${product.name}" />
        <h3>${product.name}</h3>
        <p class="product-price">${prixTTC} €</p>
      </a>
      <button class="btn-remove-fav" data-id="${product.id}">
        ✕ Retirer des favoris
      </button>
    </article>
  `;
};

// Supprimer un favori (connecte ou invite)

const removeFavori = async (product, btn) => {
  try {
    await toggleFavorite(product, true); // true = actuellement favori -> on retire

    const card = btn.closest('.product-card');
    card.remove();

    if (typeof setFavoriteIconState === 'function' && !isLoggedIn()) {
      setFavoriteIconState(getLocalFavorites().length > 0);
    }

    if (!document.querySelectorAll('.product-card').length) {
      document.getElementById('favoris-empty').style.display = 'block';
    }
  } catch (err) {
    console.error('Erreur suppression favori :', err);
  }
};