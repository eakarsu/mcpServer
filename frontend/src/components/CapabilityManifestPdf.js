import React, { useState } from 'react';

export default function CapabilityManifestPdf() {
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState('');

  const download = async () => {
    setDownloading(true);
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3082/api';
      const res = await fetch(`${API_BASE}/custom-views/capability-manifest.pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mcp-capability-manifest.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg(`Downloaded (${blob.size} bytes)`);
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ background: '#1f2937', padding: 16, borderRadius: 8, border: '1px solid #374151' }}>
      <h3 style={{ marginTop: 0, color: '#e5e7eb' }}>Capability Manifest (PDF)</h3>
      <p style={{ color: '#9ca3af', fontSize: 13 }}>
        Export a signed, printable manifest of MCP servers, tools, agents and transport capabilities.
        Useful for compliance reviews and partner integration paperwork.
      </p>
      <button
        onClick={download}
        disabled={downloading}
        style={{
          background: downloading ? '#374151' : '#2563eb',
          color: '#fff',
          border: 'none',
          padding: '10px 18px',
          borderRadius: 6,
          cursor: downloading ? 'not-allowed' : 'pointer',
          fontWeight: 600,
        }}
      >
        {downloading ? 'Generating...' : 'Download Manifest PDF'}
      </button>
      {msg && <div style={{ marginTop: 10, color: msg.startsWith('Error') ? '#f87171' : '#34d399', fontSize: 13 }}>{msg}</div>}
    </div>
  );
}
