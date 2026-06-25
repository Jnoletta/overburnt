document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});

// ── Rendu du panier ───────────────────────────────────────────────────────────

const renderCart = () => {
  const cart       = getCart();
  const container  = document.getElementById('cart-items');
  const emptyMsg   = document.getElementById('empty-cart');
  const summary    = document.getElementById('cart-summary');

  if (cart.length === 0) {
    emptyMsg.style.display  = 'block';
    summary.style.display   = 'none';
    container.innerHTML     = '';
    return;
  }

  emptyMsg.style.display = 'none';
  summary.style.display  = 'block';

  container.innerHTML = cart.map((item) => renderItem(item)).join('');

  // Boutons quantité
  container.querySelectorAll('.btn-qty-minus').forEach((btn) => {
    btn.addEventListener('click', () => {
      updateQuantity(parseInt(btn.dataset.id), parseInt(btn.dataset.qty) - 1);
      renderCart();
    });
  });

  container.querySelectorAll('.btn-qty-plus').forEach((btn) => {
    btn.addEventListener('click', () => {
      updateQuantity(parseInt(btn.dataset.id), parseInt(btn.dataset.qty) + 1);
      renderCart();
    });
  });

  // Boutons supprimer
  container.querySelectorAll('.btn-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeFromCart(parseInt(btn.dataset.id));
      renderCart();
    });
  });

  updateSummary(cart);

  // Bouton commander → page checkout
  document.getElementById('btn-checkout').addEventListener('click', () => {
    if (!isLoggedIn()) {
      window.location.href = 'connexion.html';
      return;
    }
    window.location.href = 'checkout.html';
  });
};

// ── Rendu d'un article ────────────────────────────────────────────────────────

const renderItem = (item) => {
  const imageUrl  = item.image_url
    ? `http://localhost:3000${item.image_url}`
    : '../images/placeholder.png';
  const subtotal  = (item.price * item.quantity).toFixed(2);

  return `
    <article class="cart-item">
      <img src="${imageUrl}" alt="${item.name}" />
      <div class="cart-item-info">
        <h3>${item.name}</h3>
        <p class="cart-item-price">${parseFloat(item.price).toFixed(2)} € / unité</p>
      </div>
      <div class="cart-item-qty">
        <button class="btn-qty btn-qty-minus" data-id="${item.id}" data-qty="${item.quantity}" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
        <span>${item.quantity}</span>
        <button class="btn-qty btn-qty-plus" data-id="${item.id}" data-qty="${item.quantity}" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
      </div>
      <p class="cart-item-subtotal">${subtotal} €</p>
      <button class="btn-remove" data-id="${item.id}">✕</button>
    </article>
  `;
};

//  Récapitulatif

const updateSummary = (cart) => {
  const totalHT = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalTVA = cart.reduce((sum, item) => {
    const tva = item.taux_tva || 20;
    return sum + (item.price * item.quantity * tva / 100);
  }, 0);
  const totalTTC = totalHT + totalTVA;

  document.getElementById('total-ht').textContent = totalHT.toFixed(2);
  document.getElementById('total-tva').textContent = totalTVA.toFixed(2);
  document.getElementById('total-ttc').textContent = totalTTC.toFixed(2);
};

// Commander 

const handleCheckout = async () => {
  if (!isLoggedIn()) {
    window.location.href = 'connexion.html';
    return;
  }

  const cart = getCart();
  const btn = document.getElementById('btn-checkout');
  btn.disabled = true;
  btn.textContent = 'Traitement...';

  try {
    // 1. Créer la commande
    const orderRes = await authFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      alert(orderData.message || 'Erreur lors de la commande');
      btn.disabled = false;
      btn.textContent = 'Commander';
      return;
    }

    // 2. Créer la session Stripe
    const paymentRes = await authFetch('/payment/checkout', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderData.order.id }),
    });

    const paymentData = await paymentRes.json();

    if (!paymentRes.ok) {
      alert(paymentData.message || 'Erreur lors du paiement');
      btn.disabled = false;
      btn.textContent = 'Commander';
      return;
    }

    // 3. Vider le panier et rediriger vers Stripe
    clearCart();
    window.location.href = paymentData.url;

  } catch (err) {
    console.error('Erreur checkout :', err);
    alert('Impossible de contacter le serveur');
    btn.disabled = false;
    btn.textContent = 'Commander';
  }
};