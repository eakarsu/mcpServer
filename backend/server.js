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
app.use('/api/marketplace', require('./routes/marketplace')); app.use('/api/cost-budgets', require('./routes/costBudgets')); app.use('/api/ai-stream', require('./routes/aiStream')); app.use('/api/agent-debate', require('./routes/agentDebate')); app.use('/api/eval-harness', require('./routes/evalHarness')); app.use('/api/voice-action', require('./routes/voiceAction'));

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

// === Batch 10 Gaps & Frontend Mounts === (mounts)
app.use('/api/gap-rag-endpoint-present-but-multi-modal', require('./routes/gap_rag_endpoint_present_but_multi_modal'));
app.use('/api/gap-no-streaming-responses-inventoried', require('./routes/gap_no_streaming_responses_inventoried'));
app.use('/api/gap-no-advanced-agent-debate-voting-orchestration', require('./routes/gap_no_advanced_agent_debate_voting_orchestration'));
app.use('/api/gap-no-human-in-the-loop-approval', require('./routes/gap_no_human_in_the_loop_approval'));
app.use('/api/gap-no-safety-refusal-classifier', require('./routes/gap_no_safety_refusal_classifier'));
app.use('/api/gap-no-prompt-eval-harness', require('./routes/gap_no_prompt_eval_harness'));
app.use('/api/gap-no-marketplace-ui-for-plugins-tools', require('./routes/gap_no_marketplace_ui_for_plugins_tools'));
app.use('/api/gap-no-per-tenant-cost-budgeting-alerts', require('./routes/gap_no_per_tenant_cost_budgeting_alerts'));
app.use('/api/gap-no-deployment-management-rolling-deploy-canary', require('./routes/gap_no_deployment_management_rolling_deploy_canary'));
app.use('/api/gap-no-collaborative-prompt-editing', require('./routes/gap_no_collaborative_prompt_editing'));
app.use('/api/gap-no-sso-oidc-integration', require('./routes/gap_no_sso_oidc_integration'));
app.use('/api/gap-no-fine-grained-rbac-per-agent', require('./routes/gap_no_fine_grained_rbac_per_agent'));
