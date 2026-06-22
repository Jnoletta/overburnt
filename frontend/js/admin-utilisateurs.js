document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  requireAdmin();
  await loadUsers();
});

// ── Chargement des utilisateurs ───────────────────────────────────────────────

const loadUsers = async () => {
  const container = document.getElementById('users-list');
  const loading   = document.getElementById('users-loading');

  try {
    const res   = await authFetch('/users');
    const users = await res.json();

    loading.style.display = 'none';

    if (!users.length) {
      container.innerHTML = '<p>Aucun utilisateur.</p>';
      return;
    }

    const currentUser = getUser();

    container.innerHTML = `
      <table class="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Inscrit le</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map((user) => renderRow(user, currentUser.id)).join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('.btn-delete-user').forEach((btn) => {
      btn.addEventListener('click', () => deleteUser(parseInt(btn.dataset.id)));
    });

    container.querySelectorAll('.btn-toggle-role').forEach((btn) => {
      btn.addEventListener('click', () => toggleRole(parseInt(btn.dataset.id), btn.dataset.role));
    });

  } catch (err) {
    loading.textContent = 'Erreur lors du chargement.';
    console.error(err);
  }
};

// ── Rendu d'une ligne ─────────────────────────────────────────────────────────

const renderRow = (user, currentUserId) => {
  const date   = new Date(user.created_at).toLocaleDateString('fr-FR');
  const isSelf = user.id === currentUserId;

  return `
    <tr class="${isSelf ? 'current-user' : ''}">
      <td>${user.id}</td>
      <td>${user.email}</td>
      <td><span class="role-badge role-${user.role}">${user.role}</span></td>
      <td>${date}</td>
      <td class="actions-cell">
        ${isSelf
          ? '<span class="self-label">Vous</span>'
          : `
            <button class="btn-toggle-role" data-id="${user.id}" data-role="${user.role}">
              ${user.role === 'admin' ? 'Rétrograder' : 'Promouvoir admin'}
            </button>
            <button class="btn-delete-user" data-id="${user.id}">Supprimer</button>
          `
        }
      </td>
    </tr>
  `;
};

// ── Changer le rôle ────────────────────────────────────────────────────────────

const toggleRole = async (id, currentRole) => {
  const newRole = currentRole === 'admin' ? 'customer' : 'admin';
  const action   = newRole === 'admin' ? 'promouvoir cet utilisateur en admin' : 'rétrograder cet admin en utilisateur classique';

  if (!confirm(`Confirmer : ${action} ?`)) return;

  try {
    const res = await authFetch(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole }),
    });

    if (res.ok) {
      await loadUsers();
    } else {
      const data = await res.json();
      alert(data.message || 'Erreur lors du changement de rôle');
    }
  } catch (err) {
    console.error('Erreur changement de rôle :', err);
  }
};

// ── Supprimer un utilisateur ──────────────────────────────────────────────────

const deleteUser = async (id) => {
  if (!confirm('Supprimer ce compte et toutes ses données ?')) return;

  try {
    const res = await authFetch(`/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadUsers();
    } else {
      const data = await res.json();
      alert(data.message || 'Erreur lors de la suppression');
    }
  } catch (err) {
    console.error('Erreur suppression :', err);
  }
};