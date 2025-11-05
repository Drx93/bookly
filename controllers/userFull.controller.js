const User = require('../models/User.model');
const Profile = require('../models/Profile.model');
const dbPostgres = require('../config/db.postgres');

// GET /api/user-full/:id
// Returns combined SQL user + Mongo profile (optionally enrich history with book titles)
async function getUserFull(req, res) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'id requis' });

    // Fetch user from Postgres (numeric id expected in SQL)
    let user = null;
    try {
      user = await User.findById(Number(id));
    } catch (e) {
      console.error('Error fetching SQL user:', e && e.message ? e.message : e);
      // continue, may still return profile
    }

    // Fetch profile from Mongo (profile _id is stored as string of user id)
    let profile = null;
    try {
      profile = await Profile.findById(String(id));
    } catch (e) {
      console.error('Error fetching Mongo profile:', e && e.message ? e.message : e);
    }

    if (!user && !profile) return res.status(404).json({ error: 'Utilisateur et profil introuvables' });

    // Build profile output: preferences and simplified history
    let profileOut = null;
    if (profile) {
      profileOut = {
        preferences: profile.preferences || { favoriteGenres: [], favoriteAuthors: [] },
        history: []
      };

      const history = Array.isArray(profile.history) ? profile.history : [];
      const bookIds = history.map(h => h.bookId).filter(Boolean);

      let titlesById = {};
      // If Postgres pool available, try to fetch book titles to enrich history
      try {
        if (dbPostgres && dbPostgres.pool && bookIds.length) {
          // convert numeric ids where possible
          const numericIds = bookIds.map(id => Number(id)).filter(n => !Number.isNaN(n));
          if (numericIds.length) {
            const { rows } = await dbPostgres.pool.query('SELECT id, title FROM books WHERE id = ANY($1)', [numericIds]);
            titlesById = rows.reduce((acc, r) => { acc[String(r.id)] = r.title; return acc; }, {});
          }
        }
      } catch (e) {
        console.error('Error enriching history with book titles:', e && e.message ? e.message : e);
      }

      profileOut.history = history.map(h => ({
        bookId: h.bookId,
        book: titlesById[h.bookId] || h.bookId,
        rating: h.rating,
        comment: h.comment,
        readDate: h.readDate
      }));
    }

    return res.json({ user, profile: profileOut });
  } catch (err) {
    console.error('getUserFull error:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Erreur interne' });
  }
}

module.exports = { getUserFull };
