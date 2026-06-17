document.addEventListener('DOMContentLoaded', async () => {
  const container      = document.getElementById('product-detail');
  const loadingMessage = document.getElementById('loading-message');

  const params    = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    loadingMessage.textContent = 'Produit introuvable.';
    return;
  }

  let isFav = false;

  if (isLoggedIn()) {
    try {
      const res = await authFetch('/favorites');
      if (res.ok) {
        const favorites = await res.json();
        isFav = favorites.some((f) => f.id === parseInt(productId));
      }
    } catch { }
  }

  try {
    const res = await authFetch(`/products/${productId}`);

    if (!res.ok) {
      loadingMessage.textContent = 'Produit introuvable.';
      return;
    }

    const product = await res.json();
    loadingMessage.style.display = 'none';
    container.innerHTML = renderDetail(product, isFav);

    // ── Sélecteur de quantité ─────────────────────────────────────────────────
    const inCart    = getCart().find((i) => i.id === product.id)?.quantity || 0;
    const maxQty    = product.stock - inCart;
    let   quantity  = 1;

    const display   = document.getElementById('quantity-display');
    const btnMinus  = document.getElementById('btn-minus');
    const btnPlus   = document.getElementById('btn-plus');

    const refreshButtons = () => {
      display.textContent    = quantity;
      btnMinus.disabled      = quantity <= 1;
      btnPlus.disabled       = quantity >= maxQty;
    };

    refreshButtons();

    btnMinus.addEventListener('click', () => {
      if (quantity > 1) { quantity--; refreshButtons(); }
    });

    btnPlus.addEventListener('click', () => {
      if (quantity < maxQty) { quantity++; refreshButtons(); }
    });

    // ── Bouton panier ─────────────────────────────────────────────────────────
    document.getElementById('btn-add-cart').addEventListener('click', () => {
      if (maxQty <= 0) return;
      addToCart(product, quantity);
      const btn = document.getElementById('btn-add-cart');
      btn.textContent = 'Ajouté ✓';
      setTimeout(() => (btn.textContent = 'Ajouter au panier'), 1500);
    });

    // ── Bouton favori ─────────────────────────────────────────────────────────
    document.getElementById('btn-favorite').addEventListener('click', () => {
      handleFavorite(productId, isFav);
    });

  } catch (err) {
    loadingMessage.textContent = 'Erreur lors du chargement.';
    console.error(err);
  }
});

// ── Rendu ─────────────────────────────────────────────────────────────────────

const renderDetail = (product, isFav) => {
  const imageUrl = product.image_url
    ? `http://localhost:3000${product.image_url}`
    : '../images/placeholder.png';

  const prixHT  = parseFloat(product.price).toFixed(2);
  const prixTTC = (product.price * (1 + product.taux_tva / 100)).toFixed(2);

  return `
    <a href="produits.html" class="back-link">← Retour aux produits</a>

    <div class="product-detail-content">
      <div class="product-detail-image">
        <img src="${imageUrl}" alt="${product.name}" />
      </div>

      <div class="product-detail-info">
        <h1>${product.name}</h1>

        <div class="product-detail-price">
          <span class="price-ttc">${prixTTC} €</span>
          <span class="price-ht">soit ${prixHT} € HT (TVA ${product.taux_tva}%)</span>
        </div>

        <p class="product-detail-description">${product.description || ''}</p>

        <p class="product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
          ${product.stock > 0 ? `En stock (${product.stock} disponibles)` : 'Rupture de stock'}
        </p>

        ${product.stock > 0 ? `
          <div class="product-detail-actions">
            <div class="quantity-selector">
              <button class="btn-qty" id="btn-minus">−</button>
              <span id="quantity-display">1</span>
              <button class="btn-qty" id="btn-plus">+</button>
            </div>
            <button id="btn-add-cart" class="btn-cart">Ajouter au panier</button>
          </div>
        ` : ''}

        <button id="btn-favorite" class="btn-favorite ${isFav ? 'active' : ''}">
          ${isFav ? '♥ Retirer des favoris' : '♡ Ajouter aux favoris'}
        </button>
      </div>
    </div>
  `;
};

// ── Favori ────────────────────────────────────────────────────────────────────

const handleFavorite = async (productId, currentState) => {
  if (!isLoggedIn()) {
    window.location.href = 'connexion.html';
    return;
  }
  const method = currentState ? 'DELETE' : 'POST';
  try {
    const res = await authFetch(`/favorites/${productId}`, { method });
    if (res.ok) window.location.reload();
  } catch (err) {
    console.error('Erreur favori :', err);
  }
};