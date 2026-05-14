// Per-tenant cost budgets with alerts and hard stops.
const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

async function ensure() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS tenant_budgets (
      id SERIAL PRIMARY KEY,
      tenant_id TEXT UNIQUE,
      monthly_usd NUMERIC,
      hard_stop BOOLEAN DEFAULT FALSE,
      alert_threshold REAL DEFAULT 0.8
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS tenant_spend (
      id SERIAL PRIMARY KEY,
      tenant_id TEXT,
      cost_usd NUMERIC,
      tokens INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) {
    console.warn('[costBudgets] ensure:', e.message);
  }
}
ensure();

router.post('/budget', auth, async (req, res) => {
  const { tenantId, monthlyUSD, hardStop = false, alertThreshold = 0.8 } = req.body;
  if (!tenantId || monthlyUSD == null) return res.status(400).json({ error: 'tenantId and monthlyUSD required' });
  const r = await pool.query(`
    INSERT INTO tenant_budgets (tenant_id, monthly_usd, hard_stop, alert_threshold)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (tenant_id) DO UPDATE SET monthly_usd=EXCLUDED.monthly_usd, hard_stop=EXCLUDED.hard_stop, alert_threshold=EXCLUDED.alert_threshold
    RETURNING *
  `, [tenantId, monthlyUSD, hardStop, alertThreshold]);
  res.json(r.rows[0]);
});

router.get('/budget/:tenantId', auth, async (req, res) => {
  const b = await pool.query('SELECT * FROM tenant_budgets WHERE tenant_id = $1', [req.params.tenantId]);
  const s = await pool.query(`
    SELECT COALESCE(SUM(cost_usd), 0)::float AS spent
    FROM tenant_spend
    WHERE tenant_id = $1 AND created_at >= date_trunc('month', NOW())
  `, [req.params.tenantId]);
  const budget = b.rows[0];
  const spent = s.rows[0].spent || 0;
  if (!budget) return res.status(404).json({ error: 'no budget' });
  const pct = budget.monthly_usd ? spent / Number(budget.monthly_usd) : 0;
  res.json({
    ...budget,
    spent,
    pct,
    alert: pct >= Number(budget.alert_threshold),
    blocked: budget.hard_stop && pct >= 1
  });
});

router.post('/spend', auth, async (req, res) => {
  const { tenantId, costUSD, tokens = 0 } = req.body;
  if (!tenantId || costUSD == null) return res.status(400).json({ error: 'tenantId and costUSD required' });
  await pool.query('INSERT INTO tenant_spend (tenant_id, cost_usd, tokens) VALUES ($1,$2,$3)', [tenantId, costUSD, tokens]);
  res.json({ ok: true });
});

module.exports = router;
