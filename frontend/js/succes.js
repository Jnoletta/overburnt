document.addEventListener('DOMContentLoaded', async () => {
  // Vider le panier maintenant que le paiement est confirmé
  clearCart();

  const orderId   = localStorage.getItem('pending_order_id');
  const container = document.getElementById('succes-content');

  localStorage.removeItem('pending_order_id');

  if (!orderId) {
    container.innerHTML = `
      <h1>Merci pour votre commande !</h1>
      <p>Votre paiement a bien été reçu.</p>
      <a href="produits.html">Continuer les achats</a>
    `;
    return;
  }

  // Afficher le détail de la commande
  try {
    const res = await authFetch(`/orders/${orderId}`);

    if (!res.ok) throw new Error();

    const order = await res.json();

    container.innerHTML = `
      <h1>Merci pour votre commande !</h1>
      <p>Votre commande <strong>#${order.id}</strong> a bien été enregistrée.</p>

      <div class="succes-order">
        <h2>Récapitulatif</h2>
        ${order.items.map((item) => `
          <div class="succes-item">
            <span>${item.name} × ${item.quantity}</span>
            <span>${(item.unit_price * item.quantity).toFixed(2)} €</span>
          </div>
        `).join('')}
        <hr />
        <p class="succes-total">Total : <strong>${parseFloat(order.total_cost).toFixed(2)} €</strong></p>
        <p class="succes-address">Livraison à : ${order.shipping_address}</p>
      </div>

      <a href="produits.html" class="btn-continue">Continuer les achats</a>
      <a href="compte.html" class="btn-orders">Voir mes commandes</a>
    `;
  } catch {
    container.innerHTML = `
      <h1>Merci pour votre commande !</h1>
      <p>Votre paiement a bien été reçu.</p>
      <a href="produits.html">Continuer les achats</a>
    `;
  }
});