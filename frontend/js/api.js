const API_URL = 'http://localhost:3000/api';

// ── Token JWT ─────────────────────────────────────────────────────────────────

const getToken  = ()          => localStorage.getItem('token');
const setToken  = (token)     => localStorage.setItem('token', token);
const removeToken = ()        => localStorage.removeItem('token');

// ── Utilisateur connecté ──────────────────────────────────────────────────────

// Décode le payload du JWT sans librairie externe
const getUser = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const isLoggedIn = () => !!getToken();

const isAdmin = () => getUser()?.role === 'admin';

const logout = () => {
  removeToken();
  window.location.href = 'connexion.html';
};

// ── Fetch authentifié ─────────────────────────────────────────────────────────

const authFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  return response;
};

// ── Protection de page ────────────────────────────────────────────────────────

// Redirige vers connexion si non connecté
const requireAuth = () => {
  if (!isLoggedIn()) {
    window.location.href = 'connexion.html';
  }
};

// Redirige vers accueil si non admin
const requireAdmin = () => {
  if (!isAdmin()) {
    window.location.href = 'index.html';
  }
};