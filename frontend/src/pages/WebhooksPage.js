import React from 'react';
import CrudPage from '../components/CrudPage';

export default function WebhooksPage() {
  return (
    <CrudPage
      title="Webhooks"
      subtitle="Manage webhook integrations and notifications"
      apiPath="/webhooks"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'url', label: 'URL', render: v => v?.substring(0, 45) },
        { key: 'status', label: 'Status', render: v => <span className={`badge badge-${v}`}>{v}</span> },
        { key: 'events', label: 'Events', render: v => {
          const events = typeof v === 'string' ? JSON.parse(v || '[]') : (v || []);
          return <div className="tag-list">{events.slice(0, 2).map((e, i) => <span key={i} className="tag">{e}</span>)}</div>;
        }},
      ]}
      formFields={[
        { key: 'name', label: 'Webhook Name', placeholder: 'e.g. Deployment Notify' },
        { key: 'url', label: 'URL', placeholder: 'https://hooks.example.com/...' },
        { key: 'events', label: 'Events (JSON)', type: 'json', default: '[]', placeholder: '["deployment.completed","alert.critical"]' },
        { key: 'secret', label: 'Secret', placeholder: 'Webhook secret for verification' },
        { key: 'status', label: 'Status', type: 'select', default: 'active', options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]},
        { key: 'headers', label: 'Headers (JSON)', type: 'json', default: '{}', placeholder: '{"Content-Type":"application/json"}' },
      ]}
    />
  );
}
