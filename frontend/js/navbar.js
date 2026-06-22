// Detecte si on est sur une page admin (un niveau plus profond) pour adapter les chemins
const isAdminPage = window.location.pathname.includes('/admin/');
const imgBase  = isAdminPage ? '../../images/icons/' : '../images/icons/';
const pageBase = isAdminPage ? '../' : '';

document.addEventListener('DOMContentLoaded', async () => {
  updateAccountIcon();
  updateCartIcon();
  await updateFavoriteIcon();
});

// ── Icone compte ──────────────────────────────────────────────────────────────

const updateAccountIcon = () => {
  const icon  = document.getElementById('nav-account-icon');
  const link  = document.getElementById('nav-account-link');
  const label = document.getElementById('nav-account-label');
  if (!icon || !link) return;

  if (isLoggedIn()) {
    icon.src  = imgBase + 'icon_connected.png';
    link.href = pageBase + 'compte.html';
    if (label) label.textContent = 'Mon compte';
  } else {
    icon.src  = imgBase + 'icon_not_connected.png';
    link.href = pageBase + 'connexion.html';
    if (label) label.textContent = 'Connexion';
  }

  const adminMenu = document.getElementById('admin-menu');
  if (adminMenu) {
    adminMenu.style.display = isAdmin() ? 'flex' : 'none';
  }
};

// ── Icone panier ──────────────────────────────────────────────────────────────

const updateCartIcon = () => {
  const icon    = document.getElementById('nav-cart-icon');
  const counter = document.getElementById('cart-count');
  if (!icon) return;

  const count = getCartCount();

  icon.src = count > 0
    ? imgBase + 'icon_cart_full.png'
    : imgBase + 'icon_cart_empty.png';

  if (counter) {
    counter.textContent = count;
    counter.classList.toggle('hidden', count === 0);
  }
};

// ── Icone favoris (connecte ou invite) ────────────────────────────────────────

const updateFavoriteIcon = async () => {
  const icon = document.getElementById('nav-favorite-icon');
  if (!icon) return;

  let hasFavorites = false;

  if (isLoggedIn()) {
    try {
      const res = await authFetch('/favorites');
      if (res.ok) {
        const favorites = await res.json();
        hasFavorites = favorites.length > 0;
      }
    } catch {
      // Non bloquant
    }
  } else {
    hasFavorites = getLocalFavorites().length > 0;
  }

  setFavoriteIconState(hasFavorites);
};

// Mise a jour directe sans appel API (apres un toggle favori)
const setFavoriteIconState = (hasFavorites) => {
  const icon = document.getElementById('nav-favorite-icon');
  if (!icon) return;
  icon.src = hasFavorites
    ? imgBase + 'icon_favorite_full.png'
    : imgBase + 'icon_favorite_empty.png';
};