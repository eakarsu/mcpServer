// Eval harness — replay audited prompts against new models.
const express = require('express');
const axios = require('axios');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const BASE = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

async function ensure() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS eval_runs (
      id SERIAL PRIMARY KEY,
      source_audit_id INTEGER,
      model TEXT,
      input JSONB,
      output TEXT,
      latency_ms INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) {
    console.warn('[evalHarness] ensure:', e.message);
  }
}
ensure();

async function callModel(model, messages, max = 1000) {
  const r = await axios.post(`${BASE}/chat/completions`, {
    model, messages, max_tokens: max, temperature: 0.5
  }, { headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' } });
  return r.data.choices?.[0]?.message?.content || '';
}

router.post('/replay', auth, async (req, res) => {
  if (!OPENROUTER_API_KEY) return res.status(503).json({ error: 'OPENROUTER_API_KEY not configured' });
  try {
    const { auditId, model, messages } = req.body;
    if (!model || !messages) return res.status(400).json({ error: 'model and messages required' });
    const start = Date.now();
    const out = await callModel(model, messages);
    const latency = Date.now() - start;
    const r = await pool.query(
      'INSERT INTO eval_runs (source_audit_id, model, input, output, latency_ms) VALUES ($1,$2,$3::jsonb,$4,$5) RETURNING *',
      [auditId || null, model, JSON.stringify({ messages }), out, latency]
    );
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/runs', auth, async (_req, res) => {
  const r = await pool.query('SELECT id, source_audit_id, model, latency_ms, created_at FROM eval_runs ORDER BY id DESC LIMIT 100').catch(() => ({ rows: [] }));
  res.json(r.rows);
});

router.post('/compare', auth, async (req, res) => {
  try {
    const { runIdA, runIdB } = req.body;
    if (!runIdA || !runIdB) return res.status(400).json({ error: 'runIdA and runIdB required' });
    const a = (await pool.query('SELECT * FROM eval_runs WHERE id = $1', [runIdA])).rows[0];
    const b = (await pool.query('SELECT * FROM eval_runs WHERE id = $1', [runIdB])).rows[0];
    if (!a || !b) return res.status(404).json({ error: 'run not found' });
    if (!OPENROUTER_API_KEY) return res.json({ a, b, note: 'AI compare requires OPENROUTER_API_KEY' });
    const verdict = await callModel(a.model, [
      { role: 'system', content: 'Compare two outputs. JSON {"winner":"A|B|tie","reason"}.' },
      { role: 'user', content: `A:\n${a.output}\n\nB:\n${b.output}` }
    ], 500);
    res.json({ a, b, verdict });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
