// Voice-to-action front door — voice → MCP tool invocation.
// TODO: configure credentials — OPENAI_API_KEY (Whisper) or DEEPGRAM_API_KEY for ASR.
const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
const BASE = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

// In-memory tool catalog (mirrors the project's tools table for a minimal demo).
const TOOLS = [
  { name: 'list_servers', description: 'List MCP servers' },
  { name: 'create_agent', description: 'Create an agent', parameters: { type: 'object', properties: { name: { type: 'string' }, model: { type: 'string' } }, required: ['name'] } },
  { name: 'search_knowledge', description: 'Search knowledge base', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } }
];

router.post('/transcribe-and-route', auth, async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: 'transcript required' });
    if (!OPENROUTER_API_KEY) return res.status(503).json({ error: 'OPENROUTER_API_KEY not configured' });

    const tools = TOOLS.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters || { type: 'object', properties: {} } } }));
    const r = await axios.post(`${BASE}/chat/completions`, {
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: 'You map a user voice transcript to an MCP tool call. Use tool_calls when applicable.' },
        { role: 'user', content: transcript }
      ],
      tools,
      tool_choice: 'auto',
      max_tokens: 400
    }, { headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' } });

    const msg = r.data.choices?.[0]?.message;
    res.json({
      transcript,
      assistant: msg?.content || '',
      tool_calls: msg?.tool_calls || []
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/tools', auth, (_req, res) => res.json({ tools: TOOLS }));

module.exports = router;
