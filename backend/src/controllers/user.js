const bcrypt = require('bcryptjs');
const User   = require('../models/user');

// ── Mon compte ────────────────────────────────────────────────────────────────

const getMyAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Compte introuvable' });
    }
    res.json(user);
  } catch (err) {
    console.error('Erreur getMyAccount :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau requis' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit faire au moins 6 caractères' });
    }

    // Récupérer le hash actuel pour vérification
    const user = await User.findByEmail(req.user.email);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(req.user.id, hashedPassword);

    res.json({ message: 'Mot de passe mis à jour' });
  } catch (err) {
    console.error('Erreur updatePassword :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    console.error('Erreur getAllUsers :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'Impossible de supprimer son propre compte' });
    }

    const affected = await User.remove(req.params.id);
    if (!affected) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    res.json({ message: 'Compte supprimé' });
  } catch (err) {
    console.error('Erreur remove user :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId    = parseInt(req.params.id);

    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide. Valeurs acceptées : customer, admin' });
    }
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Impossible de modifier son propre rôle' });
    }

    const affected = await User.updateRole(userId, role);
    if (!affected) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    res.json({ message: 'Rôle mis à jour' });
  } catch (err) {
    console.error('Erreur updateRole :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getMyAccount, updatePassword, getAllUsers, remove, updateRole };