document.addEventListener('DOMContentLoaded', async () => {
  const grid            = document.getElementById('products-grid');
  const loadingMessage  = document.getElementById('loading-message');
  const emptyMessage    = document.getElementById('empty-message');

  let userFavorites = [];

  // Récupérer les favoris de l'utilisateur connecté
  if (isLoggedIn()) {
    try {
      const res = await authFetch('/favorites');
      if (res.ok) {
        const data  = await res.json();
        userFavorites = data.map((f) => f.id);
      }
    } catch {
      // Non bloquant — les favoris resteront non marqués
    }
  }

  // Récupérer les produits
  try {
    const res = await authFetch('/products');
    const products = await res.json();

    loadingMessage.style.display = 'none';

    if (!products.length) {
      emptyMessage.style.display = 'block';
      return;
    }

    grid.innerHTML = products.map((p) => renderCard(p, userFavorites)).join('');

    // Boutons panier
    grid.querySelectorAll('.btn-cart').forEach((btn) => {
      btn.addEventListener('click', () => {
        const productId = parseInt(btn.dataset.id);
        const product   = products.find((p) => p.id === productId);
        addToCart(product);
        btn.textContent = 'Ajouté ✓';
        setTimeout(() => (btn.textContent = 'Ajouter au panier'), 1500);
      });
    });

    // Boutons favoris
    grid.querySelectorAll('.btn-favorite').forEach((btn) => {
      btn.addEventListener('click', () => handleFavorite(btn));
    });

  } catch (err) {
    loadingMessage.textContent = 'Erreur lors du chargement des produits.';
    console.error(err);
  }
});

// ── Rendu d'une carte produit ─────────────────────────────────────────────────

const renderCard = (product, favorites) => {
  const isFav      = favorites.includes(product.id);
  const imageUrl   = product.image_url ? `http://localhost:3000${product.image_url}` : '../images/placeholder.png';

  return `
    <article class="product-card" data-id="${product.id}">
      <a href="produit-detail.html?id=${product.id}">
        <img src="${imageUrl}" alt="${product.name}" />
        <h3>${product.name}</h3>
        <p class="product-price">${parseFloat(product.price).toFixed(2)} €</p>
      </a>
      <button class="btn-cart" data-id="${product.id}">
        Ajouter au panier
      </button>
      <button class="btn-favorite ${isFav ? 'active' : ''}" data-id="${product.id}" data-fav="${isFav}">
        ${isFav ? '♥' : '♡'}
      </button>
    </article>
  `;
};

// ── Gestion des favoris ───────────────────────────────────────────────────────

const handleFavorite = async (btn) => {
  if (!isLoggedIn()) {
    window.location.href = 'connexion.html';
    return;
  }

  const productId = parseInt(btn.dataset.id);
  const isFav     = btn.dataset.fav === 'true';
  const method    = isFav ? 'DELETE' : 'POST';

  try {
    const res = await authFetch(`/favorites/${productId}`, { method });
    if (res.ok) {
      const newFav      = !isFav;
      btn.dataset.fav   = newFav;
      btn.textContent   = newFav ? '♥' : '♡';
      btn.classList.toggle('active', newFav);
    }
  } catch (err) {
    console.error('Erreur favori :', err);
  }
};