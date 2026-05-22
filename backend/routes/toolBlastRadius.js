const express = require('express');
const router = express.Router();

router.post('/review', (req, res) => {
  const tools = Array.isArray(req.body?.tools) ? req.body.tools : [
    { name: 'gmail.send', scopes: ['email.send', 'contacts.read'], tenants: 3, approval: 'auto' },
    { name: 'db.query', scopes: ['database.read'], tenants: 1, approval: 'manual' },
  ];
  const rows = tools.map((tool) => {
    const sensitiveScopes = (tool.scopes || []).filter((scope) => /send|write|delete|admin|contacts|database/i.test(scope));
    const score = Math.min(100, sensitiveScopes.length * 24 + Number(tool.tenants || 1) * 9 + (tool.approval === 'auto' ? 18 : 0));
    return { name: tool.name, score, tier: score >= 70 ? 'restrict' : score >= 45 ? 'approve_per_run' : 'allow', sensitiveScopes };
  }).sort((a, b) => b.score - a.score);
  res.json({ maxScore: rows[0]?.score || 0, tools: rows, policy: rows.some((row) => row.score >= 70) ? 'Require tenant isolation and human approval for high-blast-radius tools.' : 'Current tool permissions are within normal operating guardrails.' });
});

module.exports = router;
