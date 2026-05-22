import React, { useState } from 'react';
import api from '../services/api';

export default function ToolBlastRadiusPage() {
  const [payload, setPayload] = useState(JSON.stringify({ tools: [
    { name: 'gmail.send', scopes: ['email.send', 'contacts.read'], tenants: 3, approval: 'auto' },
    { name: 'db.query', scopes: ['database.read'], tenants: 1, approval: 'manual' }
  ] }, null, 2));
  const [result, setResult] = useState(null);
  const run = async () => setResult((await api.post('/tool-blast-radius/review', JSON.parse(payload))).data);
  return (
    <div className="page">
      <h1>Tool Blast Radius</h1>
      <p>Review MCP tool scope, tenant reach, and approval policy before registration.</p>
      <textarea style={{ width: '100%', minHeight: 220 }} value={payload} onChange={(event) => setPayload(event.target.value)} />
      <button className="btn btn-primary" onClick={run}>Review Tools</button>
      {result && <div className="card"><h2>Max score {result.maxScore}</h2><p>{result.policy}</p>{result.tools.map((tool) => <p key={tool.name}>{tool.name}: {tool.tier} · {tool.score}</p>)}</div>}
    </div>
  );
}
