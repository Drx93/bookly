const Book = require("../models/Book.model");

exports.listBooks = async (req, res, next) => {
  try {
    const { q, available, limit = 50, offset = 0 } = req.query;
    let data = await Book.findAll();
    // Petits filtres côté controller (démo simple)
    if (q) data = data.filter(b => 
      b.title.toLowerCase().includes(String(q).toLowerCase()) ||
      b.author.toLowerCase().includes(String(q).toLowerCase())
    );
    if (available !== undefined) {
      data = data.filter(b => b.available === (available === 'true'));
    }
    const start = Number(offset), end = start + Number(limit);
    return res.status(200).json({ total: data.length, data: data.slice(start, end) });
  } catch (e) {
    console.error('listBooks error:', e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur interne serveur' });
  }
};

exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(Number(req.params.id));
    if (!book) return res.status(404).json({ error: "Livre non trouvé" });
    return res.status(200).json(book);
  } catch (e) {
    console.error('getBook error:', e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur interne serveur' });
  }
};

exports.createBook = async (req, res, next) => {
  try {
    const { title, author, available } = req.body;
    if (title === undefined || author === undefined) {
      return res.status(400).json({ error: "title (string) et author (string) sont requis" });
    }
    const created = await Book.createOne({ title, author, available });
    return res.status(201).json(created);
  } catch (e) {
    console.error('createBook error:', e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur interne serveur' });
  }
};

exports.updateBook = async (req, res, next) => {
  try {
    const updated = await Book.updateOne(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Livre non trouvé" });
    return res.status(200).json(updated);
  } catch (e) {
    console.error('updateBook error:', e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur interne serveur' });
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const ok = await Book.deleteOne(Number(req.params.id));
    if (!ok) return res.status(404).json({ error: "Livre non trouvé" });
    return res.status(204).send();
  } catch (e) {
    console.error('deleteBook error:', e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur interne serveur' });
  }
};