const User = require("../models/User.model");

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (e) {
    next(e);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(Number(req.params.id));
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(user);
  } catch (e) {
    next(e);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "name (string) et email (string) sont requis" });
    }
    const created = await User.createOne({ name, email });
    res.status(201).json(created);
  } catch (e) {
    if (e.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }
    next(e);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const updated = await User.updateOne(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(updated);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }
    next(e);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const ok = await User.deleteOne(Number(req.params.id));
    if (!ok) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};