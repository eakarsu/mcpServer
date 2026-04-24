import React from 'react';
import CrudPage from '../components/CrudPage';

export default function ApiKeysPage() {
  return (
    <CrudPage
      title="API Keys"
      subtitle="Manage API keys for external access"
      apiPath="/apikeys"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'key_prefix', label: 'Key Prefix' },
        { key: 'status', label: 'Status', render: v => <span className={`badge badge-${v}`}>{v}</span> },
        { key: 'permissions', label: 'Permissions', render: v => {
          const perms = typeof v === 'string' ? JSON.parse(v || '[]') : (v || []);
          return <div className="tag-list">{perms.map((p, i) => <span key={i} className="tag">{p}</span>)}</div>;
        }},
        { key: 'created_at', label: 'Created', render: v => new Date(v).toLocaleDateString() },
      ]}
      formFields={[
        { key: 'name', label: 'Key Name', placeholder: 'e.g. Production API Key' },
        { key: 'permissions', label: 'Permissions (JSON)', type: 'json', default: '["read"]', placeholder: '["read","write","execute"]' },
        { key: 'status', label: 'Status', type: 'select', default: 'active', options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'revoked', label: 'Revoked' },
        ]},
        { key: 'expires_at', label: 'Expires At', type: 'text', placeholder: '2025-12-31 (optional)' },
      ]}
    />
  );
}
