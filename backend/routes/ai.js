const express = require('express');
const axios = require('axios');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

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

module.exports = router;
