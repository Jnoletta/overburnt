document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  requireAdmin();
  await loadProducts();

  document.getElementById('form-produit').addEventListener('submit', handleSubmit);
  document.getElementById('btn-cancel').addEventListener('click', resetForm);
  document.getElementById('image').addEventListener('change', previewImage);
});

// ── Chargement des produits ───────────────────────────────────────────────────

const loadProducts = async () => {
  const container = document.getElementById('products-list');
  const loading   = document.getElementById('products-loading');

  try {
    const res      = await authFetch('/products/admin/all');
    const products = await res.json();

    loading.style.display = 'none';

    if (!products.length) {
      container.innerHTML = '<p>Aucun produit.</p>';
      return;
    }

    container.innerHTML = products.map((p) => renderRow(p)).join('');

    container.querySelectorAll('.btn-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const product = products.find((p) => p.id === parseInt(btn.dataset.id));
        fillForm(product);
      });
    });

    container.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', () => deleteProduct(parseInt(btn.dataset.id)));
    });

    container.querySelectorAll('.btn-toggle').forEach((btn) => {
      btn.addEventListener('click', () => toggleActive(parseInt(btn.dataset.id), parseInt(btn.dataset.active)));
    });

  } catch (err) {
    loading.textContent = 'Erreur lors du chargement.';
    console.error(err);
  }
};

// ── Rendu d'une ligne produit ─────────────────────────────────────────────────

const renderRow = (p) => {
  const imageUrl = p.image_url
    ? `http://localhost:3000${p.image_url}`
    : '../../images/placeholder.png';

  return `
    <div class="admin-product-row ${!p.is_active ? 'inactive' : ''}">
      <img src="${imageUrl}" alt="${p.name}" />
      <div class="admin-product-info">
        <strong>${p.name}</strong>
        <span>${parseFloat(p.price).toFixed(2)} € HT · Stock : ${p.stock}</span>
        <span class="status-badge">${p.is_active ? 'Actif' : 'Inactif'}</span>
      </div>
      <div class="admin-product-actions">
        <button class="btn-edit"   data-id="${p.id}">Modifier</button>
        <button class="btn-toggle" data-id="${p.id}" data-active="${p.is_active}">${p.is_active ? 'Désactiver' : 'Activer'}</button>
        <button class="btn-delete" data-id="${p.id}">Supprimer</button>
      </div>
    </div>
  `;
};

// ── Aperçu image ──────────────────────────────────────────────────────────────

const previewImage = (e) => {
  const file    = e.target.files[0];
  const preview = document.getElementById('image-preview');
  if (!file) { preview.innerHTML = ''; return; }
  const url = URL.createObjectURL(file);
  preview.innerHTML = `<img src="${url}" alt="Aperçu" style="max-width:200px;margin-top:8px;" />`;
};

// ── Soumission formulaire ─────────────────────────────────────────────────────

const handleSubmit = async (e) => {
  e.preventDefault();
  const message   = document.getElementById('form-message');
  const btn       = document.getElementById('btn-submit');
  const productId = document.getElementById('product-id').value;
  message.textContent = '';
  btn.disabled        = true;

  try {
    let imageUrl = null;
    const imageFile = document.getElementById('image').files[0];

    // Upload image si une nouvelle est sélectionnée
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);

      const token    = getToken();
      const uploadRes = await fetch('http://localhost:3000/api/upload/produit', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });

      if (!uploadRes.ok) {
        message.textContent  = "Erreur lors de l'upload de l'image";
        message.style.color  = 'red';
        btn.disabled = false;
        return;
      }

      const uploadData = await uploadRes.json();
      imageUrl = uploadData.image_url;
    }

    const productData = {
      name:        document.getElementById('name').value.trim(),
      slug:        document.getElementById('slug').value.trim(),
      category:    document.getElementById('category').value.trim(),
      price:       parseFloat(document.getElementById('price').value),
      taux_tva:    parseFloat(document.getElementById('taux_tva').value),
      stock:       parseInt(document.getElementById('stock').value),
      description: document.getElementById('description').value.trim(),
      ...(imageUrl && { image_url: imageUrl }),
    };

    const method   = productId ? 'PUT' : 'POST';
    const endpoint = productId ? `/products/${productId}` : '/products';

    const res    = await authFetch(endpoint, {
      method,
      body: JSON.stringify(productData),
    });
    const result = await res.json();

    if (!res.ok) {
      message.textContent = result.message || 'Erreur';
      message.style.color = 'red';
      btn.disabled = false;
      return;
    }

    message.textContent = result.message;
    message.style.color = 'green';
    resetForm();
    await loadProducts();

  } catch (err) {
    message.textContent = 'Erreur serveur';
    message.style.color = 'red';
    console.error(err);
  } finally {
    btn.disabled = false;
  }
};

// ── Remplir le formulaire pour modification ───────────────────────────────────

const fillForm = (product) => {
  document.getElementById('product-id').value   = product.id;
  document.getElementById('name').value         = product.name || '';
  document.getElementById('slug').value         = product.slug || '';
  document.getElementById('category').value     = product.category || '';
  document.getElementById('price').value        = product.price || '';
  document.getElementById('taux_tva').value     = product.taux_tva || 20;
  document.getElementById('stock').value        = product.stock || '';
  document.getElementById('description').value  = product.description || '';
  document.getElementById('form-title').textContent  = 'Modifier le produit';
  document.getElementById('btn-submit').textContent  = 'Enregistrer';
  document.getElementById('btn-cancel').style.display = 'inline-block';

  if (product.image_url) {
    document.getElementById('image-preview').innerHTML =
      `<img src="http://localhost:3000${product.image_url}" style="max-width:200px;margin-top:8px;" />`;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── Réinitialiser le formulaire ───────────────────────────────────────────────

const resetForm = () => {
  document.getElementById('form-produit').reset();
  document.getElementById('product-id').value             = '';
  document.getElementById('image-preview').innerHTML       = '';
  document.getElementById('form-title').textContent        = 'Ajouter un produit';
  document.getElementById('btn-submit').textContent        = 'Ajouter';
  document.getElementById('btn-cancel').style.display      = 'none';
  document.getElementById('form-message').textContent      = '';
};

// ── Supprimer ─────────────────────────────────────────────────────────────────

const deleteProduct = async (id) => {
  if (!confirm('Supprimer ce produit définitivement ?')) return;

  try {
    const res = await authFetch(`/products/${id}`, { method: 'DELETE' });
    if (res.ok) await loadProducts();
  } catch (err) {
    console.error('Erreur suppression :', err);
  }
};

// ── Activer / Désactiver ──────────────────────────────────────────────────────

const toggleActive = async (id, currentActive) => {
  try {
    // Récupérer les données actuelles du produit
    const resGet  = await authFetch(`/products/${id}`);
    const product = await resGet.json();

    // Envoyer le produit complet avec is_active modifié
    const res = await authFetch(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name:        product.name,
        slug:        product.slug,
        category:    product.category,
        price:       product.price,
        taux_tva:    product.taux_tva,
        stock:       product.stock,
        description: product.description,
        image_url:   product.image_url,
        is_active:   currentActive ? 0 : 1,
      }),
    });
    if (res.ok) await loadProducts();
  } catch (err) {
    console.error('Erreur toggle :', err);
  }
};