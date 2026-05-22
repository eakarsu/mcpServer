import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function ToolUsageHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get('/custom-views/tool-heatmap')
      .then(r => setData(r.data))
      .catch(e => setErr(e.response?.data?.error || e.message));
  }, []);

  if (err) return <div style={{ color: '#f87171', padding: 12 }}>Heatmap error: {err}</div>;
  if (!data) return <div style={{ padding: 12, color: '#9ca3af' }}>Loading heatmap...</div>;

  const cellColor = (v) => {
    const p = v / data.max;
    const r = Math.round(30 + p * 220);
    const g = Math.round(60 + p * 90);
    const b = Math.round(180 - p * 100);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div style={{ background: '#1f2937', padding: 16, borderRadius: 8, border: '1px solid #374151' }}>
      <h3 style={{ marginTop: 0, color: '#e5e7eb' }}>Tool Usage Heatmap (by day)</h3>
      <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 0 }}>Peak: <b>{data.max}</b> invocations</p>
      <table style={{ borderCollapse: 'separate', borderSpacing: 4, width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', color: '#9ca3af', fontSize: 12 }}></th>
            {data.days.map(d => (
              <th key={d} style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center' }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.matrix.map((row, ri) => (
            <tr key={ri}>
              <td style={{ color: '#e5e7eb', fontSize: 13, paddingRight: 8, whiteSpace: 'nowrap' }}>{row.tool}</td>
              {row.row.map((c, ci) => (
                <td key={ci}
                    title={`${row.tool} - ${c.day}: ${c.value}`}
                    style={{
                      background: cellColor(c.value),
                      color: '#fff',
                      textAlign: 'center',
                      padding: '8px 0',
                      borderRadius: 4,
                      fontSize: 12,
                      minWidth: 40,
                    }}>
                  {c.value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
