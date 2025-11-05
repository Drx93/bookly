const Profile = require('../models/Profile.model');

// Controller for Profile (MongoDB via Mongoose)
// All handlers are defensive: if MongoDB is not available or queries fail,
// they return 500 and a helpful message rather than letting the process crash.

async function listProfiles(req, res) {
  try {
    const profiles = await Profile.findAll();
    res.json(profiles);
  } catch (err) {
    console.error('listProfiles error:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Impossible de récupérer les profils' });
  }
}

async function getProfile(req, res) {
  try {
    const id = req.params.id;
    const profile = await Profile.findById(id);
    if (!profile) return res.status(404).json({ error: 'Profil non trouvé' });
    res.json(profile);
  } catch (err) {
    console.error('getProfile error:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Erreur serveur en récupérant le profil' });
  }
}

async function getProfileByUserId(req, res) {
  try {
    const userId = req.params.userId;
    const profile = await Profile.findById(userId);
    if (!profile) return res.status(404).json({ error: 'Profil non trouvé' });
    res.json(profile);
  } catch (err) {
    console.error('getProfileByUserId error:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Erreur serveur en récupérant le profil par userId' });
  }
}

async function createProfile(req, res) {
  try {
    const { userId, preferences } = req.body;
    if (userId === undefined) return res.status(400).json({ error: 'userId requis' });
    const created = await Profile.createOne({ userId, preferences });
    res.status(201).json(created);
  } catch (err) {
    console.error('createProfile error:', err && err.message ? err.message : err);
    // If duplicate userId or validation error, send 400
    if (err && err.name === 'ValidationError') return res.status(400).json({ error: err.message });
    if (err && err.code === 11000) return res.status(409).json({ error: 'Profil pour ce userId existe déjà' });
    res.status(500).json({ error: "Impossible de créer le profil" });
  }
}

async function updateProfileByUserId(req, res) {
  try {
    const userId = req.params.userId;
    const profile = await Profile.findById(userId);
    if (!profile) return res.status(404).json({ error: 'Profil non trouvé' });

    const { preferences } = req.body;
    const updated = await Profile.updateOne(userId, { preferences });
    res.json(updated);
  } catch (err) {
    console.error('updateProfileByUserId error:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Impossible de mettre à jour le profil' });
  }
}

async function deleteProfile(req, res) {
  try {
    const id = req.params.id;
    const ok = await Profile.deleteOne(id);
    if (!ok) return res.status(404).json({ error: 'Profil non trouvé' });
    res.status(204).end();
  } catch (err) {
    console.error('deleteProfile error:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Impossible de supprimer le profil' });
  }
}

async function addFavorite(req, res) {
  try {
    const id = req.params.id;
    const { bookId } = req.body;
    if (bookId === undefined) return res.status(400).json({ error: 'bookId requis' });
    const profile = await Profile.findById(id);
    if (!profile) return res.status(404).json({ error: 'Profil non trouvé' });
    await profile.addFavoriteBook(Number(bookId));
    res.json(profile);
  } catch (err) {
    console.error('addFavorite error:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Impossible d\'ajouter le livre favori' });
  }
}

async function removeFavorite(req, res) {
  try {
    const id = req.params.id;
    const { bookId } = req.body;
    if (bookId === undefined) return res.status(400).json({ error: 'bookId requis' });
    const profile = await Profile.findById(id);
    if (!profile) return res.status(404).json({ error: 'Profil non trouvé' });
    await profile.removeFavoriteBook(Number(bookId));
    res.json(profile);
  } catch (err) {
    console.error('removeFavorite error:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Impossible de supprimer le livre favori' });
  }
}

module.exports = {
  getProfileByUserId,
  createProfile,
  updateProfileByUserId,
};
