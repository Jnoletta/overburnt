document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  requireAdmin();
  await loadCommandes();
});

const STATUTS = {
  en_attente:     'En attente',
  en_preparation: 'En préparation',
  expediee:       'Expédiée',
  livree:         'Livrée',
  annulee:        'Annulée',
};

// ── Chargement des commandes ──────────────────────────────────────────────────

const loadCommandes = async () => {
  const container = document.getElementById('orders-list');
  const loading   = document.getElementById('orders-loading');

  try {
    const res    = await authFetch('/orders');
    const orders = await res.json();

    loading.style.display = 'none';

    if (!orders.length) {
      container.innerHTML = '<p>Aucune commande.</p>';
      return;
    }

    container.innerHTML = orders.map((order) => renderOrder(order)).join('');

    // Boutons détail
    container.querySelectorAll('.btn-toggle-detail').forEach((btn) => {
      btn.addEventListener('click', () => toggleDetail(parseInt(btn.dataset.id)));
    });

    // Sélecteurs de statut
    container.querySelectorAll('.select-status').forEach((select) => {
      select.addEventListener('change', () => {
        updateStatus(parseInt(select.dataset.id), select.value);
      });
    });

  } catch (err) {
    loading.textContent = 'Erreur lors du chargement.';
    console.error(err);
  }
};

// ── Rendu d'une commande ──────────────────────────────────────────────────────

const renderOrder = (order) => {
  const date = new Date(order.created_at).toLocaleDateString('fr-FR');

  const options = Object.entries(STATUTS).map(([value, label]) =>
    `<option value="${value}" ${order.status === value ? 'selected' : ''}>${label}</option>`
  ).join('');

  return `
    <div class="admin-order-card" id="order-${order.id}">
      <div class="admin-order-header">
        <span class="order-id">Commande #${order.id}</span>
        <span>${order.name || ''} ${order.surname || ''}</span>
        <span>${date}</span>
        <span class="order-total">${parseFloat(order.total_cost).toFixed(2)} €</span>
        <select class="select-status status-${order.status}" data-id="${order.id}">
          ${options}
        </select>
        <button class="btn-toggle-detail" data-id="${order.id}">Détails ▾</button>
      </div>
      <div class="order-detail-panel" id="detail-${order.id}" style="display:none">
        <p>Chargement des détails...</p>
      </div>
    </div>
  `;
};

// ── Afficher / Masquer le détail ──────────────────────────────────────────────

const toggleDetail = async (orderId) => {
  const panel = document.getElementById(`detail-${orderId}`);

  if (panel.style.display === 'block') {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';

  // Charger les détails si pas encore fait
  if (panel.dataset.loaded) return;

  try {
    const res   = await authFetch(`/orders/${orderId}`);
    const order = await res.json();
    panel.dataset.loaded = 'true';

    panel.innerHTML = `
      <p><strong>Adresse :</strong> ${order.shipping_address || '—'}</p>
      <table class="order-items-table">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Qté</th>
            <th>Prix unitaire</th>
            <th>Sous-total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${parseFloat(item.unit_price).toFixed(2)} €</td>
              <td>${(item.unit_price * item.quantity).toFixed(2)} €</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p class="order-total-line">Total : <strong>${parseFloat(order.total_cost).toFixed(2)} €</strong></p>
    `;
  } catch (err) {
    panel.innerHTML = '<p>Erreur lors du chargement des détails.</p>';
  }
};

// ── Mettre à jour le statut ───────────────────────────────────────────────────

const updateStatus = async (orderId, status) => {
  try {
    const res = await authFetch(`/orders/${orderId}/statut`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      const select = document.querySelector(`.select-status[data-id="${orderId}"]`);
      select.className = `select-status status-${status}`;
    }
  } catch (err) {
    console.error('Erreur mise à jour statut :', err);
  }
};