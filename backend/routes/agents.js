const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agents ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, model, system_prompt, temperature, max_tokens, tools, status } = req.body;
    const result = await pool.query(
      'INSERT INTO agents (name, description, model, system_prompt, temperature, max_tokens, tools, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, description, model, system_prompt, temperature || 0.7, max_tokens || 4096, JSON.stringify(tools || []), status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, model, system_prompt, temperature, max_tokens, tools, status } = req.body;
    const result = await pool.query(
      'UPDATE agents SET name=$1, description=$2, model=$3, system_prompt=$4, temperature=$5, max_tokens=$6, tools=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
      [name, description, model, system_prompt, temperature, max_tokens, JSON.stringify(tools || []), status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM agents WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
