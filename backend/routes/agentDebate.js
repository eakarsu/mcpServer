// Agent debate / vote framework with explainable arbitration.
const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
const BASE = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

async function ai(messages, max = 700) {
  if (!OPENROUTER_API_KEY) {
    const e = new Error('OPENROUTER_API_KEY not configured'); e.statusCode = 503; throw e;
  }
  const r = await axios.post(`${BASE}/chat/completions`, {
    model: OPENROUTER_MODEL,
    messages,
    max_tokens: max,
    temperature: 0.5
  }, { headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' } });
  return r.data.choices?.[0]?.message?.content || '';
}

router.post('/run', auth, async (req, res) => {
  try {
    const { question, personas = ['optimist', 'pessimist', 'realist'] } = req.body;
    if (!question) return res.status(400).json({ error: 'question required' });
    const proposals = [];
    for (const role of personas.slice(0, 5)) {
      const content = await ai([
        { role: 'system', content: `You are a ${role} agent. Answer in <=120 words.` },
        { role: 'user', content: question }
      ]);
      proposals.push({ role, content });
    }
    const verdict = await ai([
      { role: 'system', content: 'You are an arbiter. Return JSON {"winner":string,"score":0-100,"reasoning":string,"per_agent":[{"role":string,"score":number}]}.' },
      { role: 'user', content: `Question: ${question}\n\n${proposals.map(p => `[${p.role}]\n${p.content}`).join('\n\n')}` }
    ], 800);
    let parsed;
    try { parsed = JSON.parse(verdict.match(/\{[\s\S]*\}/)[0]); } catch { parsed = { raw: verdict }; }
    res.json({ proposals, verdict: parsed });
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});

module.exports = router;
