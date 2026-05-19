import React, { useState } from 'react';
import api from '../services/api';

export default function MultiModelRoutePage() {
  const [message, setMessage] = useState('');
  const [primaryModel, setPrimaryModel] = useState('');
  const [fallbackModels, setFallbackModels] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const body = { message };
      if (primaryModel.trim()) body.primary_model = primaryModel.trim();
      const fbs = fallbackModels.split(',').map((s) => s.trim()).filter(Boolean);
      if (fbs.length > 0) body.fallback_models = fbs;
      if (systemPrompt.trim()) body.system_prompt = systemPrompt;
      const res = await api.post('/ai/multi-model-route', body);
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
          <h1 className="page-title">Multi-Model Routing</h1>
          <p className="page-subtitle">Try a primary model, fall back to alternates if it fails</p>
        </div>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800 }}>
        <label>
          <div style={{ marginBottom: 4, fontWeight: 600 }}>Message *</div>
          <textarea
            className="form-control"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Prompt to route..."
          />
        </label>
        <label>
          <div style={{ marginBottom: 4, fontWeight: 600 }}>System Prompt (optional)</div>
          <input
            className="form-control"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful AI assistant."
          />
        </label>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ flex: 1 }}>
            <div style={{ marginBottom: 4, fontWeight: 600 }}>Primary Model (optional)</div>
            <input
              className="form-control"
              value={primaryModel}
              onChange={(e) => setPrimaryModel(e.target.value)}
              placeholder="e.g. anthropic/claude-3-5-sonnet"
            />
          </label>
          <label style={{ flex: 1 }}>
            <div style={{ marginBottom: 4, fontWeight: 600 }}>Fallback Models (comma-separated)</div>
            <input
              className="form-control"
              value={fallbackModels}
              onChange={(e) => setFallbackModels(e.target.value)}
              placeholder="openai/gpt-4o-mini, mistral/..."
            />
          </label>
        </div>
        <div>
          <button type="submit" className="btn btn-primary" disabled={loading || !message.trim()}>
            {loading ? 'Routing...' : 'Run'}
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
          <div style={{ marginBottom: 8, fontSize: 13, color: '#6b7280' }}>Model used: <strong>{result.model_used}</strong></div>
          <h3>Response</h3>
          <div style={{ whiteSpace: 'pre-wrap', padding: 12, background: '#1f2937', color: '#f3f4f6', borderRadius: 6 }}>
            {result.response}
          </div>
          {Array.isArray(result.attempts) && result.attempts.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4>Attempts</h4>
              <ol>
                {result.attempts.map((a, i) => (
                  <li key={i}>
                    <strong>{a.model}</strong> — {a.status}{a.error ? `: ${a.error}` : ''}
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
