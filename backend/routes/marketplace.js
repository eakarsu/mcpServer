// Plugin marketplace with publish / discover / rate.
const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

async function ensure() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS marketplace_plugins (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      author TEXT,
      manifest JSONB DEFAULT '{}'::jsonb,
      avg_stars REAL DEFAULT 0,
      ratings_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS marketplace_ratings (
      id SERIAL PRIMARY KEY,
      plugin_slug TEXT REFERENCES marketplace_plugins(slug),
      user_id INTEGER,
      stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
      review TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) {
    console.warn('[marketplace] ensure:', e.message);
  }
}
ensure();

router.post('/publish', auth, async (req, res) => {
  try {
    const { slug, name, description, manifest } = req.body;
    if (!slug || !name) return res.status(400).json({ error: 'slug and name required' });
    const r = await pool.query(
      `INSERT INTO marketplace_plugins (slug, name, description, author, manifest)
       VALUES ($1,$2,$3,$4,$5::jsonb)
       ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, manifest=EXCLUDED.manifest
       RETURNING *`,
      [slug, name, description || '', req.user?.email || 'anon', JSON.stringify(manifest || {})]
    );
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/discover', auth, async (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const r = await pool.query(
    "SELECT * FROM marketplace_plugins WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1 ORDER BY avg_stars DESC, ratings_count DESC LIMIT 50",
    [`%${q}%`]
  ).catch(() => ({ rows: [] }));
  res.json({ count: r.rows.length, plugins: r.rows });
});

router.post('/rate', auth, async (req, res) => {
  try {
    const { slug, stars, review } = req.body;
    if (!slug || stars == null) return res.status(400).json({ error: 'slug and stars required' });
    await pool.query('INSERT INTO marketplace_ratings (plugin_slug, user_id, stars, review) VALUES ($1, $2, $3, $4)',
      [slug, req.user?.id || null, Math.max(1, Math.min(5, parseInt(stars))), review || null]);
    const avg = await pool.query('SELECT AVG(stars)::float as avg, COUNT(*) as c FROM marketplace_ratings WHERE plugin_slug = $1', [slug]);
    await pool.query('UPDATE marketplace_plugins SET avg_stars = $1, ratings_count = $2 WHERE slug = $3',
      [avg.rows[0].avg || 0, avg.rows[0].c, slug]);
    res.json({ ok: true, avgStars: avg.rows[0].avg, count: avg.rows[0].c });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
