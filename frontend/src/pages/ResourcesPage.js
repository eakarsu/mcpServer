import React from 'react';
import CrudPage from '../components/CrudPage';

export default function ResourcesPage() {
  return (
    <CrudPage
      title="Resources"
      subtitle="Manage MCP resources and data sources"
      apiPath="/resources"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type', render: v => <span className="badge badge-info">{v}</span> },
        { key: 'uri', label: 'URI', render: v => v?.substring(0, 45) },
        { key: 'mime_type', label: 'MIME Type' },
        { key: 'is_active', label: 'Active', render: v => <span className={`badge ${v ? 'badge-success' : 'badge-error'}`}>{v ? 'Yes' : 'No'}</span> },
      ]}
      formFields={[
        { key: 'name', label: 'Resource Name', placeholder: 'e.g. Project Config' },
        { key: 'uri', label: 'URI', placeholder: 'file:///app/config.json' },
        { key: 'type', label: 'Type', type: 'select', default: 'file', options: [
          { value: 'file', label: 'File' },
          { value: 'directory', label: 'Directory' },
          { value: 'database', label: 'Database' },
          { value: 'url', label: 'URL' },
          { value: 'cloud', label: 'Cloud Storage' },
        ]},
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'mime_type', label: 'MIME Type', placeholder: 'application/json' },
        { key: 'server_id', label: 'Server ID', type: 'number' },
        { key: 'is_active', label: 'Active', type: 'select', default: 'true', options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ]},
      ]}
    />
  );
}
