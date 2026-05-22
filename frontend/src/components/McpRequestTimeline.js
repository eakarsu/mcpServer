import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function McpRequestTimeline() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get('/custom-views/request-timeline')
      .then(r => setData(r.data))
      .catch(e => setErr(e.response?.data?.error || e.message));
  }, []);

  if (err) return <div style={{ color: '#f87171', padding: 12 }}>Timeline error: {err}</div>;
  if (!data) return <div style={{ padding: 12, color: '#9ca3af' }}>Loading timeline...</div>;

  const max = Math.max(...data.timeline.map(t => t.requests), 1);
  return (
    <div style={{ background: '#1f2937', padding: 16, borderRadius: 8, border: '1px solid #374151' }}>
      <h3 style={{ marginTop: 0, color: '#e5e7eb' }}>MCP Request Timeline (24h)</h3>
      <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 0 }}>Total: <b>{data.total}</b> across {data.bins} hourly buckets</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 180, padding: '8px 0', borderBottom: '1px solid #4b5563' }}>
        {data.timeline.map((t, i) => {
          const h = Math.max(2, (t.requests / max) * 160);
          const eh = Math.max(0, (t.errors / max) * 160);
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }} title={`${t.label}: ${t.requests} req, ${t.errors} err`}>
              <div style={{ width: '100%', height: h, background: 'linear-gradient(180deg,#60a5fa,#2563eb)', borderRadius: '3px 3px 0 0', position: 'relative' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: eh, background: '#ef4444', borderRadius: '0 0 0 0' }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: 11, marginTop: 4 }}>
        <span>{data.timeline[0]?.label}</span>
        <span>now</span>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, background: '#2563eb', marginRight: 6 }} />Requests
        <span style={{ display: 'inline-block', width: 10, height: 10, background: '#ef4444', marginLeft: 16, marginRight: 6 }} />Errors
      </div>
    </div>
  );
}
