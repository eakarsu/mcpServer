const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, key_prefix, permissions, status, expires_at, created_at, last_used_at FROM api_keys ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, key_prefix, permissions, status, expires_at, created_at, last_used_at FROM api_keys WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, permissions, expires_at } = req.body;
    const key = 'mcp_' + crypto.randomBytes(32).toString('hex');
    const keyPrefix = key.substring(0, 12) + '...';
    const result = await pool.query(
      'INSERT INTO api_keys (name, api_key, key_prefix, permissions, status, expires_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, key_prefix, permissions, status, expires_at, created_at',
      [name, key, keyPrefix, JSON.stringify(permissions || ['read']), 'active', expires_at]
    );
    res.status(201).json({ ...result.rows[0], api_key: key });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, permissions, status, expires_at } = req.body;
    const result = await pool.query(
      'UPDATE api_keys SET name=$1, permissions=$2, status=$3, expires_at=$4 WHERE id=$5 RETURNING id, name, key_prefix, permissions, status, expires_at, created_at',
      [name, JSON.stringify(permissions || ['read']), status, expires_at, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM api_keys WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
