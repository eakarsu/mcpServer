import React, { useState } from 'react';
import api from '../services/api';

export default function CostSummaryPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await api.get('/ai/cost-summary', { params: { days } });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (rows, columns) => (
    <table className="data-table" style={{ width: '100%', marginTop: 8 }}>
      <thead>
        <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx}>{columns.map((c) => <td key={c.key}>{row[c.key] ?? '—'}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cost Summary</h1>
          <p className="page-subtitle">Aggregate message counts by agent and model</p>
        </div>
      </div>

      <form onSubmit={load} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16 }}>
        <label>
          <div style={{ marginBottom: 4, fontWeight: 600 }}>Days</div>
          <input
            className="form-control"
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            style={{ width: 120 }}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Loading...' : 'Load Summary'}
        </button>
      </form>

      {error && (
        <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#991b1b' }}>
          {error}
        </div>
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {data.note && (
            <div style={{ padding: 12, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 6, color: '#92400e' }}>
              {data.note}
            </div>
          )}
          {Array.isArray(data.byAgent) && (
            <section>
              <h3>By Agent</h3>
              {data.byAgent.length === 0
                ? <div style={{ color: '#6b7280' }}>No data</div>
                : renderTable(data.byAgent, [
                    { key: 'agent_id', label: 'Agent ID' },
                    { key: 'agent_name', label: 'Agent' },
                    { key: 'message_count', label: 'Messages' },
                  ])}
            </section>
          )}
          {Array.isArray(data.byModel) && (
            <section>
              <h3>By Model</h3>
              {data.byModel.length === 0
                ? <div style={{ color: '#6b7280' }}>No data</div>
                : renderTable(data.byModel, [
                    { key: 'model', label: 'Model' },
                    { key: 'message_count', label: 'Messages' },
                  ])}
            </section>
          )}
          {!data.byAgent && !data.byModel && (
            <pre style={{ padding: 12, background: '#1f2937', color: '#f3f4f6', borderRadius: 6, overflowX: 'auto' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
