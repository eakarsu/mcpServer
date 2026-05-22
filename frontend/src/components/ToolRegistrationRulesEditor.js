import React, { useEffect, useState } from 'react';
import api from '../services/api';

const empty = { name: '', pattern: '', action: 'allow', priority: 100, enabled: true, notes: '' };

export default function ToolRegistrationRulesEditor() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/custom-views/tool-rules');
      setRules(r.data.rules || []);
      setErr(null);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/custom-views/tool-rules/${editingId}`, form);
      } else {
        await api.post('/custom-views/tool-rules', form);
      }
      setForm(empty);
      setEditingId(null);
      load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const edit = (r) => {
    setEditingId(r.id);
    setForm({ name: r.name, pattern: r.pattern, action: r.action, priority: r.priority, enabled: r.enabled, notes: r.notes || '' });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await api.delete(`/custom-views/tool-rules/${id}`);
      load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const ipt = { background: '#111827', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 4, padding: '6px 8px', fontSize: 13 };

  return (
    <div style={{ background: '#1f2937', padding: 16, borderRadius: 8, border: '1px solid #374151' }}>
      <h3 style={{ marginTop: 0, color: '#e5e7eb' }}>Tool Registration Rules</h3>
      <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 0 }}>
        Govern which MCP tools may register with this server. Rules are evaluated in priority order.
      </p>

      {err && <div style={{ color: '#f87171', marginBottom: 10 }}>Error: {err}</div>}

      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 12 }}>
        <input style={ipt} placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input style={ipt} placeholder="Pattern (e.g. fs.*)" value={form.pattern} onChange={e => setForm({ ...form, pattern: e.target.value })} required />
        <select style={ipt} value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}>
          <option value="allow">allow</option>
          <option value="deny">deny</option>
          <option value="quarantine">quarantine</option>
        </select>
        <input style={ipt} type="number" placeholder="Priority" value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} />
        <input style={ipt} placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>
          {editingId ? 'Update' : 'Add Rule'}
        </button>
      </form>

      {loading ? (
        <div style={{ color: '#9ca3af' }}>Loading rules...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e5e7eb', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#111827' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Priority</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Pattern</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Action</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Notes</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid #374151' }}>
                <td style={{ padding: 8 }}>{r.priority}</td>
                <td style={{ padding: 8 }}>{r.name}</td>
                <td style={{ padding: 8, fontFamily: 'monospace' }}>{r.pattern}</td>
                <td style={{ padding: 8 }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: r.action === 'allow' ? '#065f46' : r.action === 'deny' ? '#7f1d1d' : '#78350f',
                    color: '#fff'
                  }}>{r.action}</span>
                </td>
                <td style={{ padding: 8, color: '#9ca3af' }}>{r.notes}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => edit(r)} style={{ marginRight: 6, background: '#374151', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => remove(r.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 12, color: '#9ca3af', textAlign: 'center' }}>No rules yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
