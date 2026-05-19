// Streaming responses + cancellation across REST.
const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
const BASE = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

const active = new Map();

router.post('/start', auth, async (req, res) => {
  if (!OPENROUTER_API_KEY) return res.status(503).json({ error: 'OPENROUTER_API_KEY not configured' });
  const { messages, model = OPENROUTER_MODEL, temperature = 0.5 } = req.body;
  if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages[] required' });

  const streamId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const controller = new AbortController();
  active.set(streamId, controller);

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write(`event: meta\ndata: ${JSON.stringify({ streamId })}\n\n`);

  try {
    const r = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature, stream: true }),
      signal: controller.signal
    });
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = dec.decode(value);
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') { res.write('event: done\ndata: {}\n\n'); break; }
          res.write(`data: ${data}\n\n`);
        }
      }
    }
    res.end();
  } catch (e) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  } finally {
    active.delete(streamId);
  }
});

router.post('/cancel', auth, (req, res) => {
  const c = active.get(req.body.streamId);
  if (!c) return res.status(404).json({ error: 'stream not active' });
  c.abort();
  active.delete(req.body.streamId);
  res.json({ ok: true });
});

module.exports = router;
