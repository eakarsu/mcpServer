const express = require('express');
const axios = require('axios');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// Centralized OpenRouter call with 503-on-no-key behavior.
async function callOpenRouter(messages, { temperature = 0.5, max_tokens = 2000, tools, tool_choice } = {}) {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('AI service unavailable: OPENROUTER_API_KEY not set');
    err.statusCode = 503;
    throw err;
  }
  const body = { model: process.env.OPENROUTER_MODEL, messages, temperature, max_tokens };
  if (tools) body.tools = tools;
  if (tool_choice) body.tool_choice = tool_choice;
  const r = await axios.post(`${process.env.OPENROUTER_BASE_URL}/chat/completions`, body, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'MCP Server Platform',
    }
  });
  return r.data;
}

function parseAIJson(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch (_) {}
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) { try { return JSON.parse(fenced[1].trim()); } catch (_) {} }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(trimmed.slice(start, end + 1)); } catch (_) {}
  }
  return null;
}

router.post('/chat', auth, async (req, res) => {
  try {
    const { message, agent_id, conversation_id } = req.body;

    let systemPrompt = 'You are a helpful AI assistant integrated into an MCP Server management platform. Help users manage their MCP servers, tools, agents, and workflows.';
    let agentName = 'Default Assistant';

    if (agent_id) {
      const agentResult = await pool.query('SELECT * FROM agents WHERE id = $1', [agent_id]);
      if (agentResult.rows.length > 0) {
        const agent = agentResult.rows[0];
        systemPrompt = agent.system_prompt || systemPrompt;
        agentName = agent.name;
      }
    }

    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 4096,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'MCP Server Platform',
        }
      }
    );

    const aiResponse = response.data;
    const assistantMessage = aiResponse.choices?.[0]?.message?.content || 'No response generated';

    // Save conversation
    let convId = conversation_id;
    if (!convId) {
      const convResult = await pool.query(
        'INSERT INTO conversations (title, agent_name, model, status) VALUES ($1, $2, $3, $4) RETURNING id',
        [message.substring(0, 100), agentName, process.env.OPENROUTER_MODEL, 'active']
      );
      convId = convResult.rows[0].id;
    }

    await pool.query(
      'INSERT INTO conversation_messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [convId, 'user', message]
    );
    await pool.query(
      'INSERT INTO conversation_messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [convId, 'assistant', assistantMessage]
    );

    res.json({
      conversation_id: convId,
      message: assistantMessage,
      model: aiResponse.model,
      usage: aiResponse.usage,
      raw_response: aiResponse,
    });
  } catch (err) {
    console.error('AI Error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

router.post('/tool-use', auth, async (req, res) => {
  try {
    const { message, tools } = req.body;

    const toolDefs = tools || [
      {
        type: 'function',
        function: {
          name: 'get_server_status',
          description: 'Get the status of an MCP server',
          parameters: { type: 'object', properties: { server_name: { type: 'string', description: 'Name of the server' } }, required: ['server_name'] }
        }
      },
      {
        type: 'function',
        function: {
          name: 'list_tools',
          description: 'List all available tools on a server',
          parameters: { type: 'object', properties: { server_name: { type: 'string', description: 'Name of the server' } }, required: ['server_name'] }
        }
      },
      {
        type: 'function',
        function: {
          name: 'execute_tool',
          description: 'Execute a tool with given parameters',
          parameters: { type: 'object', properties: { tool_name: { type: 'string' }, parameters: { type: 'object' } }, required: ['tool_name'] }
        }
      }
    ];

    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are an MCP agent. Use the available tools to help the user. Always try to use tools when appropriate.' },
          { role: 'user', content: message }
        ],
        tools: toolDefs,
        tool_choice: 'auto',
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'MCP Server Platform',
        }
      }
    );

    const aiResponse = response.data;
    const choice = aiResponse.choices?.[0];

    // Log execution
    await pool.query(
      'INSERT INTO tool_executions (tool_name, agent_name, input_data, output_data, status, duration_ms) VALUES ($1,$2,$3,$4,$5,$6)',
      ['ai_tool_use', 'OpenRouter', JSON.stringify({ message }), JSON.stringify(aiResponse), 'success', aiResponse.usage?.total_tokens || 0]
    );

    res.json({
      message: choice?.message?.content,
      tool_calls: choice?.message?.tool_calls,
      finish_reason: choice?.finish_reason,
      model: aiResponse.model,
      usage: aiResponse.usage,
      raw_response: aiResponse,
    });
  } catch (err) {
    console.error('Tool Use Error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

router.post('/analyze', auth, async (req, res) => {
  try {
    const { type, data } = req.body;

    const prompts = {
      'server-health': `Analyze the following MCP server configurations and provide a health assessment with recommendations:\n${JSON.stringify(data, null, 2)}`,
      'tool-optimization': `Analyze these tools and suggest optimizations for better performance:\n${JSON.stringify(data, null, 2)}`,
      'workflow-review': `Review this workflow configuration and suggest improvements:\n${JSON.stringify(data, null, 2)}`,
      'security-audit': `Perform a security audit on this MCP configuration:\n${JSON.stringify(data, null, 2)}`,
    };

    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert MCP Server analyst. Provide detailed, actionable insights.' },
          { role: 'user', content: prompts[type] || `Analyze this data:\n${JSON.stringify(data, null, 2)}` }
        ],
        temperature: 0.5,
        max_tokens: 4096,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'MCP Server Platform',
        }
      }
    );

    res.json({
      analysis: response.data.choices?.[0]?.message?.content,
      model: response.data.model,
      usage: response.data.usage,
      raw_response: response.data,
    });
  } catch (err) {
    console.error('Analysis Error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// Get conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM conversations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/conversations/:id', auth, async (req, res) => {
  try {
    const conv = await pool.query('SELECT * FROM conversations WHERE id = $1', [req.params.id]);
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const messages = await pool.query('SELECT * FROM conversation_messages WHERE conversation_id = $1 ORDER BY created_at ASC', [req.params.id]);
    res.json({ ...conv.rows[0], messages: messages.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/conversations/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM conversation_messages WHERE conversation_id = $1', [req.params.id]);
    const result = await pool.query('DELETE FROM conversations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Knowledge-base RAG: keyword/ILIKE retrieval over knowledge_base + LLM answer
router.post('/knowledge-rag', auth, async (req, res) => {
  try {
    const { query, category, limit } = req.body || {};
    if (!query) return res.status(400).json({ error: 'query is required' });

    const max = Math.min(parseInt(limit, 10) || 5, 20);
    const params = [`%${query}%`];
    let sql = `SELECT id, title, content, category, source FROM knowledge_base WHERE (title ILIKE $1 OR content ILIKE $1)`;
    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    sql += ` ORDER BY updated_at DESC LIMIT ${max}`;
    const docs = await pool.query(sql, params);

    const context = docs.rows.map((d, i) => `Doc ${i + 1} [${d.category || 'general'}] ${d.title}\n${(d.content || '').slice(0, 1500)}`).join('\n\n---\n\n');

    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You answer using the provided knowledge-base documents. If the answer is not in the docs, say so. Cite Doc numbers when relevant.' },
          { role: 'user', content: `Question: ${query}\n\nKnowledge Base Documents:\n${context || '(no documents found)'}` }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'MCP Server Platform',
        }
      }
    );

    const answer = response.data?.choices?.[0]?.message?.content || '';
    res.json({
      answer,
      retrieved: docs.rows.map(d => ({ id: d.id, title: d.title, category: d.category, source: d.source })),
      model: response.data?.model,
      usage: response.data?.usage,
    });
  } catch (err) {
    console.error('knowledge-rag error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// Aggregate AI usage cost summary (token-level rollup per conversation/agent/model)
router.get('/cost-summary', auth, async (req, res) => {
  try {
    // Best-effort: aggregate from conversation_messages if it carries usage data, else fall back to counts
    const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
    let totalsByAgent = { rows: [] };
    let totalsByModel = { rows: [] };
    try {
      totalsByAgent = await pool.query(
        `SELECT a.id AS agent_id, a.name AS agent_name, COUNT(cm.*) AS messages
         FROM conversation_messages cm
         LEFT JOIN conversations c ON c.id = cm.conversation_id
         LEFT JOIN agents a ON a.id = c.agent_id
         WHERE cm.created_at > NOW() - INTERVAL '${days} days'
         GROUP BY a.id, a.name
         ORDER BY messages DESC`
      );
    } catch (_) { /* schema may differ; ignore */ }
    try {
      totalsByModel = await pool.query(
        `SELECT a.model AS model, COUNT(cm.*) AS messages
         FROM conversation_messages cm
         LEFT JOIN conversations c ON c.id = cm.conversation_id
         LEFT JOIN agents a ON a.id = c.agent_id
         WHERE cm.created_at > NOW() - INTERVAL '${days} days'
         GROUP BY a.model
         ORDER BY messages DESC`
      );
    } catch (_) { /* ignore */ }

    res.json({
      windowDays: days,
      perAgent: totalsByAgent.rows,
      perModel: totalsByModel.rows,
      note: 'Counts only — full token/USD cost tracking requires storing usage per message (planned).'
    });
  } catch (err) {
    console.error('cost-summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/agent-chain — execute a sequence of agents, piping each one's output into the next.
router.post('/agent-chain', auth, async (req, res) => {
  try {
    const { agent_ids, initial_message } = req.body || {};
    if (!Array.isArray(agent_ids) || agent_ids.length === 0) {
      return res.status(400).json({ error: 'agent_ids (non-empty array) is required' });
    }
    if (!initial_message || typeof initial_message !== 'string') {
      return res.status(400).json({ error: 'initial_message is required' });
    }

    const steps = [];
    let currentInput = initial_message;
    for (const id of agent_ids) {
      const agentResult = await pool.query('SELECT id, name, system_prompt FROM agents WHERE id = $1', [id]);
      if (agentResult.rows.length === 0) {
        steps.push({ agent_id: id, error: 'Agent not found' });
        continue;
      }
      const agent = agentResult.rows[0];
      const systemPrompt = agent.system_prompt || 'You are a helpful AI assistant.';
      const data = await callOpenRouter(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: currentInput }
        ],
        { temperature: 0.6, max_tokens: 1500 }
      );
      const output = data?.choices?.[0]?.message?.content || '';
      steps.push({
        agent_id: agent.id,
        agent_name: agent.name,
        input: currentInput,
        output,
        model: data?.model,
        usage: data?.usage,
      });
      currentInput = output;
    }

    res.json({
      final_output: currentInput,
      steps,
      step_count: steps.length,
    });
  } catch (err) {
    if (err.statusCode === 503) return res.status(503).json({ error: err.message });
    console.error('agent-chain error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/multi-model-route — try primary model, fall back to alternates if it fails.
router.post('/multi-model-route', auth, async (req, res) => {
  try {
    const { message, primary_model, fallback_models, system_prompt } = req.body || {};
    if (!message || typeof message !== 'string') return res.status(400).json({ error: 'message is required' });
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not set' });
    }

    const candidates = [primary_model || process.env.OPENROUTER_MODEL]
      .concat(Array.isArray(fallback_models) ? fallback_models : [])
      .filter(Boolean);

    const attempts = [];
    let success = null;
    for (const model of candidates) {
      try {
        const r = await axios.post(
          `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
          {
            model,
            messages: [
              { role: 'system', content: system_prompt || 'You are a helpful AI assistant.' },
              { role: 'user', content: message }
            ],
            temperature: 0.5,
            max_tokens: 1500,
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'MCP Server Platform',
            }
          }
        );
        attempts.push({ model, status: 'ok' });
        success = {
          model_used: model,
          response: r.data?.choices?.[0]?.message?.content || '',
          model: r.data?.model,
          usage: r.data?.usage,
        };
        break;
      } catch (e) {
        attempts.push({ model, status: 'failed', error: e.response?.data?.error?.message || e.message });
      }
    }

    if (!success) {
      return res.status(502).json({ error: 'All models failed', attempts });
    }

    res.json({ ...success, attempts });
  } catch (err) {
    console.error('multi-model-route error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
