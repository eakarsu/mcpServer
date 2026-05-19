import React, { useState } from 'react';
import api from '../services/api';

export default function KnowledgeRagPage() {
  const [query, setQuery] = useState('');
  const [agentId, setAgentId] = useState('');
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body = { query };
      if (agentId.trim()) body.agentId = agentId.trim();
      if (topK) body.topK = Number(topK);
      const res = await api.post('/ai/knowledge-rag', body);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Knowledge RAG</h1>
          <p className="page-subtitle">Ask a question grounded in the knowledge base</p>
        </div>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800 }}>
        <label>
          <div style={{ marginBottom: 4, fontWeight: 600 }}>Query *</div>
          <textarea
            className="form-control"
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What does the knowledge base say about ...?"
          />
        </label>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ flex: 1 }}>
            <div style={{ marginBottom: 4, fontWeight: 600 }}>Agent ID (optional)</div>
            <input
              className="form-control"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="scope to a specific agent"
            />
          </label>
          <label style={{ width: 140 }}>
            <div style={{ marginBottom: 4, fontWeight: 600 }}>Top K</div>
            <input
              className="form-control"
              type="number"
              min={1}
              max={20}
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
            />
          </label>
        </div>
        <div>
          <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
            {loading ? 'Searching...' : 'Ask'}
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
          <h3>Answer</h3>
          <div style={{ whiteSpace: 'pre-wrap', padding: 12, background: '#1f2937', color: '#f3f4f6', borderRadius: 6 }}>
            {result.answer || result.result || JSON.stringify(result, null, 2)}
          </div>
          {Array.isArray(result.sources) && result.sources.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4>Sources</h4>
              <ol>
                {result.sources.map((s, idx) => (
                  <li key={idx}>
                    <strong>{s.title || s.name || `Doc ${idx + 1}`}</strong>
                    {s.snippet && <div style={{ fontSize: 13, color: '#6b7280' }}>{s.snippet}</div>}
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
