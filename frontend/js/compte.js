document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  initTabs();
  await loadProfil();
  await loadCommandes();
});

document.getElementById('btn-logout').addEventListener('click', logout);

// Onglets

const initTabs = () => {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => (c.style.display = 'none'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).style.display = 'block';
    });
  });
};

// Profil

const loadProfil = async () => {
  try {
    const res = await authFetch('/customers/mon-profil');
    if (!res.ok) return;

    const customer = await res.json();
    const fields   = ['name', 'surname', 'street', 'city', 'postal_code', 'country', 'phone'];
    fields.forEach((field) => {
      const el = document.getElementById(field);
      if (el && customer[field]) el.value = customer[field];
    });
  } catch { }

  document.getElementById('form-profil').addEventListener('submit', saveProfil);
  document.getElementById('form-password').addEventListener('submit', savePassword);
};

const saveProfil = async (e) => {
  e.preventDefault();
  const message = document.getElementById('profil-message');
  const btn     = document.getElementById('btn-save');
  message.textContent = '';
  btn.disabled        = true;

  const data = {
    name:        document.getElementById('name').value.trim(),
    surname:     document.getElementById('surname').value.trim(),
    street:      document.getElementById('street').value.trim(),
    city:        document.getElementById('city').value.trim(),
    postal_code: document.getElementById('postal_code').value.trim(),
    country:     document.getElementById('country').value.trim(),
    phone:       document.getElementById('phone').value.trim(),
  };

  try {
    // Vérifie si profil existant pour choisir POST ou PUT
    const check  = await authFetch('/customers/mon-profil');
    const method = check.ok ? 'PUT' : 'POST';

    const res    = await authFetch('/customers/mon-profil', {
      method,
      body: JSON.stringify(data),
    });

    const result = await res.json();
    message.textContent  = result.message;
    message.style.color  = res.ok ? 'green' : 'red';
  } catch {
    message.textContent = 'Erreur lors de la sauvegarde';
    message.style.color = 'red';
  } finally {
    btn.disabled = false;
  }
};

// Mot de passe

const savePassword = async (e) => {
  e.preventDefault();
  const message         = document.getElementById('password-message');
  message.textContent   = '';

  const currentPassword = document.getElementById('current-password').value;
  const newPassword     = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (newPassword !== confirmPassword) {
    message.textContent = 'Les mots de passe ne correspondent pas';
    message.style.color = 'red';
    return;
  }
  if (newPassword.length < 6) {
    message.textContent = 'Le mot de passe doit faire au moins 6 caractères';
    message.style.color = 'red';
    return;
  }

  try {
    const res    = await authFetch('/users/mon-compte/mot-de-passe', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const result = await res.json();
    message.textContent = result.message;
    message.style.color = res.ok ? 'green' : 'red';

    if (res.ok) {
      document.getElementById('form-password').reset();
    }
  } catch {
    message.textContent = 'Erreur lors de la mise à jour';
    message.style.color = 'red';
  }
};

// Commandes

const STATUTS = {
  en_attente:     'En attente',
  en_preparation: 'En préparation',
  expediee:       'Expédiée',
  livree:         'Livrée',
  annulee:        'Annulée',
};

const loadCommandes = async () => {
  const container = document.getElementById('orders-list');

  try {
    const res = await authFetch('/orders/mes-commandes');
    const orders = await res.json();

    if (!orders.length) {
      container.innerHTML = '<p>Vous n\'avez pas encore de commandes.</p>';
      return;
    }

    container.innerHTML = orders.map((order) => `
      <div class="order-card">
        <div class="order-header">
          <span class="order-id">Commande #${order.id}</span>
          <span class="order-status status-${order.status}">${STATUTS[order.status] || order.status}</span>
          <span class="order-date">${new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
        <div class="order-details">
          <p>Total : <strong>${parseFloat(order.total_cost).toFixed(2)} €</strong></p>
          <p>Livraison : ${order.shipping_address || '—'}</p>
        </div>
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<p>Erreur lors du chargement des commandes.</p>';
  }
};

