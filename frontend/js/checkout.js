document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();

  const cart = getCart();

  // Panier vide → retour au panier
  if (cart.length === 0) {
    window.location.href = 'panier.html';
    return;
  }

  renderSummary(cart);
  await prefillForm();

  document.getElementById('form-checkout').addEventListener('submit', handleSubmit);
});

// Récapitulatif commande

const renderSummary = (cart) => {
  const container = document.getElementById('checkout-items');

  container.innerHTML = cart.map((item) => `
    <div class="checkout-item">
      <span>${item.name} × ${item.quantity}</span>
      <span>${(item.price * item.quantity).toFixed(2)} €</span>
    </div>
  `).join('');

  const totalHT  = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalTVA = cart.reduce((sum, item) => {
    const tva = item.taux_tva || 20;
    return sum + (item.price * item.quantity * tva / 100);
  }, 0);

  document.getElementById('summary-ht').textContent  = totalHT.toFixed(2);
  document.getElementById('summary-tva').textContent = totalTVA.toFixed(2);
  document.getElementById('summary-ttc').textContent = (totalHT + totalTVA).toFixed(2);
};

// Pré-remplissage si profil existant

const prefillForm = async () => {
  try {
    const res = await authFetch('/customers/mon-profil');
    if (!res.ok) return;

    const customer = await res.json();
    const fields   = ['name', 'surname', 'street', 'city', 'postal_code', 'country', 'phone'];

    fields.forEach((field) => {
      const el = document.getElementById(field);
      if (el && customer[field]) el.value = customer[field];
    });
  } catch {
    // Pas de profil — formulaire vide
  }
};

// Soumission

const handleSubmit = async (e) => {
  e.preventDefault();

  const errorMessage = document.getElementById('error-message');
  const btn          = document.getElementById('btn-pay');
  errorMessage.textContent = '';
  btn.disabled             = true;
  btn.textContent          = 'Traitement...';

  const profileData = {
    name:        document.getElementById('name').value.trim(),
    surname:     document.getElementById('surname').value.trim(),
    street:      document.getElementById('street').value.trim(),
    city:        document.getElementById('city').value.trim(),
    postal_code: document.getElementById('postal_code').value.trim(),
    country:     document.getElementById('country').value.trim(),
    phone:       document.getElementById('phone').value.trim(),
  };

  try {
    // 1. Créer ou mettre à jour le profil client
    const profileRes = await authFetch('/customers/mon-profil');
    const method     = profileRes.ok ? 'PUT' : 'POST';

    const saveProfile = await authFetch('/customers/mon-profil', {
      method,
      body: JSON.stringify(profileData),
    });

    if (!saveProfile.ok) {
      const data = await saveProfile.json();
      errorMessage.textContent = data.message || 'Erreur lors de la sauvegarde du profil';
      btn.disabled    = false;
      btn.textContent = 'Payer';
      return;
    }

    // 2. Créer la commande
    const cart     = getCart();
    const orderRes = await authFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: cart.map((item) => ({
          product_id: item.id,
          quantity:   item.quantity,
        })),
      }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      errorMessage.textContent = orderData.message || 'Erreur lors de la commande';
      btn.disabled    = false;
      btn.textContent = 'Payer';
      return;
    }

    // 3. Créer la session Stripe
    const paymentRes  = await authFetch('/payment/checkout', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderData.order.id }),
    });

    const paymentData = await paymentRes.json();

    if (!paymentRes.ok) {
      errorMessage.textContent = paymentData.message || 'Erreur lors du paiement';
      btn.disabled    = false;
      btn.textContent = 'Payer';
      return;
    }

    // 4. Sauvegarder l'order_id et rediriger vers Stripe
    // Le panier est vidé sur la page succès, pas ici
    // Si l'utilisateur revient en arrière, son panier est préservé
console.log('order data:', orderData);
console.log('pending_order_id à sauvegarder:', orderData.order.id);
localStorage.setItem('pending_order_id', orderData.order.id);
window.location.href = paymentData.url;

  } catch (err) {
    console.error('Erreur checkout :', err);
    errorMessage.textContent = 'Impossible de contacter le serveur';
    btn.disabled    = false;
    btn.textContent = 'Payer';
  }
};