const Customer = require('../models/customer');

// Profil de l'utilisateur connecté

const getMyProfile = async (req, res) => {
  try {
    const customer = await Customer.findByUserId(req.user.id);
    if (!customer) {
      return res.status(404).json({ message: 'Profil client non trouvé' });
    }
    res.json(customer);
  } catch (err) {
    console.error('Erreur getMyProfile :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const createMyProfile = async (req, res) => {
  try {
    const { name, surname, street, city, postal_code, country, phone } = req.body;

    if (!name || !surname) {
      return res.status(400).json({ message: 'Nom et prénom requis' });
    }

    // Un utilisateur ne peut avoir qu'un seul profil client
    const existing = await Customer.findByUserId(req.user.id);
    if (existing) {
      return res.status(409).json({
        message: 'Profil déjà existant. Utilisez PUT pour le modifier.',
      });
    }

    const id       = await Customer.create(req.user.id, { name, surname, street, city, postal_code, country, phone });
    const customer = await Customer.findById(id);

    res.status(201).json({ message: 'Profil créé', customer });
  } catch (err) {
    console.error('Erreur createMyProfile :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const { name, surname, street, city, postal_code, country, phone } = req.body;

    if (!name || !surname) {
      return res.status(400).json({ message: 'Nom et prénom requis' });
    }

    const affected = await Customer.update(req.user.id, { name, surname, street, city, postal_code, country, phone });
    if (!affected) {
      return res.status(404).json({ message: 'Profil non trouvé. Créez-le d\'abord avec POST.' });
    }

    const customer = await Customer.findByUserId(req.user.id);
    res.json({ message: 'Profil mis à jour', customer });
  } catch (err) {
    console.error('Erreur updateMyProfile :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Admin

const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll();
    res.json(customers);
  } catch (err) {
    console.error('Erreur getAllCustomers :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getOne = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Client introuvable' });
    }
    res.json(customer);
  } catch (err) {
    console.error('Erreur getOne customer :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    const affected = await Customer.remove(req.params.id);
    if (!affected) {
      return res.status(404).json({ message: 'Client introuvable' });
    }
    res.json({ message: 'Client supprimé' });
  } catch (err) {
    console.error('Erreur remove customer :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getMyProfile, createMyProfile, updateMyProfile, getAllCustomers, getOne, remove };