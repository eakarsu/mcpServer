import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AgentChainPage() {
  const [agents, setAgents] = useState([]);
  const [agentIds, setAgentIds] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/agents')
      .then((r) => { if (!cancelled) setAgents(Array.isArray(r.data) ? r.data : (r.data?.agents || [])); })
      .catch(() => { /* ignore — page still usable via manual IDs */ });
    return () => { cancelled = true; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!agentIds.trim() || !initialMessage.trim()) return;
    const ids = agentIds.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n));
    if (ids.length === 0) {
      setError('Provide at least one numeric agent id');
      return;
    }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await api.post('/ai/agent-chain', { agent_ids: ids, initial_message: initialMessage });
      setResult(res.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 503) {
        setError('AI service unavailable — OPENROUTER_API_KEY is not set on the server.');
      } else {
        setError(err.response?.data?.error || err.message || 'Request failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Agent Chain</h1>
          <p className="page-subtitle">Pipe a message through a sequence of agents</p>
        </div>
      </div>

      {agents.length > 0 && (
        <div style={{ marginBottom: 12, color: '#6b7280', fontSize: 13 }}>
          Available agents: {agents.map((a) => `${a.id}:${a.name}`).join(', ')}
        </div>
      )}

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800 }}>
        <label>
          <div style={{ marginBottom: 4, fontWeight: 600 }}>Agent IDs (comma-separated, in order) *</div>
          <input
            className="form-control"
            value={agentIds}
            onChange={(e) => setAgentIds(e.target.value)}
            placeholder="e.g. 1,3,2"
          />
        </label>
        <label>
          <div style={{ marginBottom: 4, fontWeight: 600 }}>Initial Message *</div>
          <textarea
            className="form-control"
            rows={4}
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            placeholder="Input to feed the first agent..."
          />
        </label>
        <div>
          <button type="submit" className="btn btn-primary" disabled={loading || !agentIds.trim() || !initialMessage.trim()}>
            {loading ? 'Running...' : 'Run Chain'}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#991b1b' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>Final Output</h3>
          <div style={{ whiteSpace: 'pre-wrap', padding: 12, background: '#1f2937', color: '#f3f4f6', borderRadius: 6 }}>
            {result.final_output}
          </div>
          {Array.isArray(result.steps) && result.steps.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4>Steps</h4>
              <ol>
                {result.steps.map((s, i) => (
                  <li key={i} style={{ marginBottom: 12 }}>
                    <div><strong>{s.agent_name || `Agent ${s.agent_id}`}</strong>{s.error ? ` — error: ${s.error}` : ''}</div>
                    {s.input && <div style={{ fontSize: 13, color: '#6b7280' }}>Input: {String(s.input).slice(0, 200)}</div>}
                    {s.output && <div style={{ fontSize: 13 }}>Output: {String(s.output).slice(0, 400)}</div>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
