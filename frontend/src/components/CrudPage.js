import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiArrowLeft } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';

export default function CrudPage({ title, subtitle, apiPath, columns, formFields, renderDetail, icon: Icon }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(apiPath);
      setItems(data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    const defaults = {};
    formFields.forEach(f => { defaults[f.key] = f.default || ''; });
    setFormData(defaults);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    const data = {};
    formFields.forEach(f => {
      let val = item[f.key];
      if (f.type === 'json' && typeof val === 'object') val = JSON.stringify(val, null, 2);
      data[f.key] = val ?? f.default ?? '';
    });
    setFormData(data);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData };
      formFields.forEach(f => {
        if (f.type === 'json' && typeof payload[f.key] === 'string') {
          try { payload[f.key] = JSON.parse(payload[f.key]); } catch {}
        }
        if (f.type === 'number') payload[f.key] = Number(payload[f.key]);
      });

      if (editing) {
        await api.put(`${apiPath}/${editing.id}`, payload);
        toast.success('Updated successfully');
      } else {
        await api.post(apiPath, payload);
        toast.success('Created successfully');
      }
      setShowModal(false);
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`${apiPath}/${id}`);
      toast.success('Deleted successfully');
      if (selected?.id === id) setSelected(null);
      load();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const viewDetail = async (item) => {
    try {
      const { data } = await api.get(`${apiPath}/${item.id}`);
      setSelected(data);
    } catch {
      setSelected(item);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><FiPlus size={14} /> New {title.replace(/s$/, '').replace(/ies$/, 'y')}</button>
      </div>

      {selected && (
        <div className="detail-panel">
          <div className="detail-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-sm btn-secondary" onClick={() => setSelected(null)}><FiArrowLeft size={14} /></button>
              <h2 className="detail-title">{selected.name || selected.title || selected.key || `Item #${selected.id}`}</h2>
            </div>
            <div className="detail-actions">
              <button className="btn btn-sm btn-primary" onClick={() => openEdit(selected)}><FiEdit2 size={14} /> Edit</button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(selected.id)}><FiTrash2 size={14} /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            {renderDetail ? renderDetail(selected) : (
              <div className="detail-grid">
                {Object.entries(selected).map(([key, value]) => (
                  <div className="detail-field" key={key}>
                    <div className="detail-label">{key.replace(/_/g, ' ')}</div>
                    <div className="detail-value">
                      {typeof value === 'object' ? (
                        <div className="json-display">{JSON.stringify(value, null, 2)}</div>
                      ) : typeof value === 'boolean' ? (
                        <span className={`badge ${value ? 'badge-success' : 'badge-error'}`}>{String(value)}</span>
                      ) : String(value ?? '—')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columns.map(col => <th key={col.key}>{col.label}</th>)}
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No items found</td></tr>
            ) : items.map(item => (
              <tr key={item.id} onClick={() => viewDetail(item)}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(item[col.key], item) : (
                      typeof item[col.key] === 'boolean' ? (
                        <span className={`badge ${item[col.key] ? 'badge-success' : 'badge-error'}`}>{item[col.key] ? 'Yes' : 'No'}</span>
                      ) : (
                        String(item[col.key] ?? '—').substring(0, 80)
                      )
                    )}
                  </td>
                ))}
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-sm btn-icon btn-secondary" onClick={() => openEdit(item)}><FiEdit2 size={13} /></button>
                    <button className="btn btn-sm btn-icon btn-danger" onClick={() => handleDelete(item.id)}><FiTrash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Edit' : 'New'} {title.replace(/s$/, '').replace(/ies$/, 'y')}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              {formFields.map(f => (
                <div className="form-group" key={f.key}>
                  <label className="form-label">{f.label}</label>
                  {f.type === 'select' ? (
                    <select className="form-select" value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}>
                      {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === 'textarea' || f.type === 'json' ? (
                    <textarea className="form-textarea" value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} rows={f.type === 'json' ? 6 : 4} placeholder={f.placeholder} />
                  ) : (
                    <input className="form-input" type={f.type || 'text'} value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} placeholder={f.placeholder} />
                  )}
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
