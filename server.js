/*
  Robust server entrypoint for bookly-hybrid
  - Connects to PostgreSQL using config/db.postgres (exports { pool, initTables })
  - Connects to MongoDB using config/db.mongo (exports { connectMongo })
  - Starts server even if one DB fails
  - Provides /api/status and /api/test-db endpoints
  - Mounts routes if they exist
*/

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Early global error handlers so the process doesn't crash silently
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception (caught):', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection (caught):', reason);
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Safe require helper
function safeRequire(path) {
  try {
    return require(path);
  } catch (err) {
    console.error(`Failed to require ${path}:`, err && err.message ? err.message : err);
    return null;
  }
}

// Load DB helpers (these files exist in the project)
const dbPostgres = safeRequire('./config/db.postgres'); // { pool, initTables }
const dbMongo = safeRequire('./config/db.mongo'); // { connectMongo }

// Mount routes if present
const userRoutes = safeRequire('./routes/userRoutes');
const bookRoutes = safeRequire('./routes/bookRoutes');
const profileRoutes = safeRequire('./routes/profileRoutes');
const userFullRoutes = safeRequire('./routes/userFullRoutes');

function mountIfRouter(path, router) {
  if (!router) return;
  if (typeof router === 'function') return app.use(path, router);
  if (router && (Array.isArray(router.stack) || typeof router.handle === 'function')) return app.use(path, router);
  console.error(`Skipping mount ${path}: exported value is not a router (type=${typeof router})`);
}

mountIfRouter('/api/users', userRoutes);
mountIfRouter('/api/books', bookRoutes);
mountIfRouter('/api/profiles', profileRoutes);
mountIfRouter('/api/user-full', userFullRoutes);

// Health check
app.get('/api/status', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Test DB connections endpoint
app.get('/api/test-db', async (req, res) => {
  let pgStatus = 'not-tested';
  let mongoStatus = 'not-tested';
  let timestamp = null;

  // Test Postgres
  try {
    if (dbPostgres && dbPostgres.pool) {
      const { rows } = await dbPostgres.pool.query('SELECT NOW()');
      pgStatus = 'connected';
      timestamp = rows && rows[0] && rows[0].now ? rows[0].now : null;
    } else {
      pgStatus = 'pg helper not available';
    }
  } catch (err) {
    pgStatus = `error: ${err && err.message ? err.message : err}`;
  }

  // Test Mongo
  try {
    if (dbMongo && typeof dbMongo.connectMongo === 'function') {
      await dbMongo.connectMongo();
      mongoStatus = 'connected via db.mongo';
    } else if (process.env.MONGO_URI) {
      // If user supplied MONGO_URI directly, try a mongoose connect
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.MONGO_URI);
      mongoStatus = `connected via mongoose (readyState=${mongoose.connection.readyState})`;
    } else {
      mongoStatus = 'mongo helper not available and MONGO_URI not set';
    }
  } catch (err) {
    mongoStatus = `error: ${err && err.message ? err.message : err}`;
  }

  res.json({ status: 'ok', postgresql: pgStatus, mongodb: mongoStatus, timestamp });
});

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route inconnue' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err && err.message ? err.message : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Erreur interne serveur' });
});

// Start sequence: init PG tables (if helper available) and connect Mongo (if helper), but never crash on DB failures
async function startServer() {
  // Postgres init
  if (dbPostgres && typeof dbPostgres.initTables === 'function') {
    try {
      await dbPostgres.initTables();
      console.log('PostgreSQL tables initialized');
    } catch (err) {
      console.error('Postgres initTables failed:', err && err.message ? err.message : err);
    }
  } else {
    console.log('Postgres initTables helper not available; skipping');
  }

  // Mongo connect
  if (dbMongo && typeof dbMongo.connectMongo === 'function') {
    try {
      await dbMongo.connectMongo();
      console.log('MongoDB connected via db.mongo');
    } catch (err) {
      console.error('MongoDB connect failed:', err && err.message ? err.message : err);
    }
  } else if (process.env.MONGO_URI) {
    try {
      const mongoose = require('mongoose');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB connected via MONGO_URI (mongoose)');
    } catch (err) {
      console.error('MongoDB mongoose connect failed:', err && err.message ? err.message : err);
    }
  } else {
    console.log('No MongoDB configuration found; skipping');
  }

  app.listen(PORT, () => console.log(`API ready at http://localhost:${PORT}`));
}

startServer();
