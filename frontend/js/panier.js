// ── Panier (localStorage) ─────────────────────────────────────────────────────

const getCart = () => {
  return JSON.parse(localStorage.getItem('cart') || '[]');
};

const saveCart = (cart) => {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
};

const addToCart = (product, quantity = 1) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    alert('La quantité doit être un nombre entier positif.');
    return;
  }

  const cart     = getCart();
  const existing = cart.find((item) => item.id === product.id);
  const currentQty = existing ? existing.quantity : 0;
  const newQty     = currentQty + quantity;

  if (product.stock !== undefined && newQty > product.stock) {
    const remaining = product.stock - currentQty;
    if (remaining <= 0) {
      alert(`"${product.name}" est déjà au maximum du stock disponible dans votre panier.`);
    } else {
      alert(`Stock insuffisant. Vous pouvez encore ajouter ${remaining} article(s).`);
    }
    return;
  }

  if (existing) {
    existing.quantity = newQty;
  } else {
    cart.push({
      id:        product.id,
      name:      product.name,
      price:     product.price,
      image_url: product.image_url || null,
      stock:     product.stock,
      quantity,
    });
  }

  saveCart(cart);
};

const removeFromCart = (productId) => {
  const cart = getCart().filter((item) => item.id !== productId);
  saveCart(cart);
};

const updateQuantity = (productId, quantity) => {
  if (quantity < 1) return removeFromCart(productId);

  const cart = getCart();
  const item = cart.find((i) => i.id === productId);

  if (item) {
    if (item.stock !== undefined && quantity > item.stock) {
      alert(`Stock insuffisant. Maximum disponible : ${item.stock}`);
      return;
    }
    item.quantity = quantity;
  }

  saveCart(cart);
};

const getCartCount = () => {
  return getCart().reduce((total, item) => total + item.quantity, 0);
};

const clearCart = () => {
  localStorage.removeItem('cart');
  updateCartCount();
};

const updateCartCount = () => {
  const counter = document.getElementById('cart-count');
  if (counter) counter.textContent = getCartCount();
};

document.addEventListener('DOMContentLoaded', updateCartCount);

// ── Favoris invité (localStorage) ─────────────────────────────────────────────

const getLocalFavorites = () => {
  return JSON.parse(localStorage.getItem('favorites') || '[]');
};

const saveLocalFavorites = (favorites) => {
  localStorage.setItem('favorites', JSON.stringify(favorites));
};

const isLocalFavorite = (productId) => {
  return getLocalFavorites().some((p) => p.id === productId);
};

const addLocalFavorite = (product) => {
  const favorites = getLocalFavorites();
  if (favorites.some((p) => p.id === product.id)) return;
  favorites.push(product);
  saveLocalFavorites(favorites);
};

const removeLocalFavorite = (productId) => {
  const favorites = getLocalFavorites().filter((p) => p.id !== productId);
  saveLocalFavorites(favorites);
};

const clearLocalFavorites = () => {
  localStorage.removeItem('favorites');
};

// ── Toggle unifié (gere connecte / invite automatiquement) ────────────────────

const toggleFavorite = async (product, currentState) => {
  if (isLoggedIn()) {
    const method = currentState ? 'DELETE' : 'POST';
    const res    = await authFetch(`/favorites/${product.id}`, { method });
    if (!res.ok) throw new Error('Erreur API favoris');
    return !currentState;
  } else {
    if (currentState) {
      removeLocalFavorite(product.id);
    } else {
      addLocalFavorite(product);
    }
    return !currentState;
  }
};

const checkIsFavorite = async (productId) => {
  if (isLoggedIn()) {
    try {
      const res = await authFetch('/favorites');
      if (!res.ok) return false;
      const favorites = await res.json();
      return favorites.some((f) => f.id === productId);
    } catch {
      return false;
    }
  }
  return isLocalFavorite(productId);
};

// ── Synchronisation a la connexion ────────────────────────────────────────────

const syncLocalFavoritesToAccount = async () => {
  const localFavs = getLocalFavorites();
  if (!localFavs.length) return;

  for (const product of localFavs) {
    try {
      await authFetch(`/favorites/${product.id}`, { method: 'POST' });
    } catch {
      // On continue meme si un favori echoue (ex: deja en favori)
    }
  }

  clearLocalFavorites();
};