const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/servers', require('./routes/servers'));
app.use('/api/tools', require('./routes/tools'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/prompts', require('./routes/prompts'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/workflows', require('./routes/workflows'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/executions', require('./routes/executions'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/apikeys', require('./routes/apikeys'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/models', require('./routes/models'));
app.use('/api/settings', require('./routes/settings'));

// Dashboard stats
const pool = require('./db');
app.get('/api/dashboard', require('./middleware/auth'), async (req, res) => {
  try {
    const [servers, tools, agents, prompts, resources, workflows, executions, conversations] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM mcp_servers'),
      pool.query('SELECT COUNT(*) as count FROM tools'),
      pool.query('SELECT COUNT(*) as count FROM agents'),
      pool.query('SELECT COUNT(*) as count FROM prompts'),
      pool.query('SELECT COUNT(*) as count FROM resources'),
      pool.query('SELECT COUNT(*) as count FROM workflows'),
      pool.query('SELECT COUNT(*) as count FROM tool_executions'),
      pool.query('SELECT COUNT(*) as count FROM conversations'),
    ]);
    res.json({
      servers: parseInt(servers.rows[0].count),
      tools: parseInt(tools.rows[0].count),
      agents: parseInt(agents.rows[0].count),
      prompts: parseInt(prompts.rows[0].count),
      resources: parseInt(resources.rows[0].count),
      workflows: parseInt(workflows.rows[0].count),
      executions: parseInt(executions.rows[0].count),
      conversations: parseInt(conversations.rows[0].count),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => {
  console.log(`MCP Server Backend running on port ${PORT}`);
});
