const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM models ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM models WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, provider, model_id, description, context_window, max_tokens, pricing_input, pricing_output, status } = req.body;
    const result = await pool.query(
      'INSERT INTO models (name, provider, model_id, description, context_window, max_tokens, pricing_input, pricing_output, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [name, provider, model_id, description, context_window || 128000, max_tokens || 4096, pricing_input, pricing_output, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, provider, model_id, description, context_window, max_tokens, pricing_input, pricing_output, status } = req.body;
    const result = await pool.query(
      'UPDATE models SET name=$1, provider=$2, model_id=$3, description=$4, context_window=$5, max_tokens=$6, pricing_input=$7, pricing_output=$8, status=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [name, provider, model_id, description, context_window, max_tokens, pricing_input, pricing_output, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM models WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
