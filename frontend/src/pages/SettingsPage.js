import React from 'react';
import CrudPage from '../components/CrudPage';

export default function SettingsPage() {
  return (
    <CrudPage
      title="Settings"
      subtitle="Manage platform configuration settings"
      apiPath="/settings"
      columns={[
        { key: 'key', label: 'Key' },
        { key: 'value', label: 'Value' },
        { key: 'category', label: 'Category', render: v => <span className="badge badge-info">{v}</span> },
        { key: 'description', label: 'Description', render: v => v?.substring(0, 60) },
      ]}
      formFields={[
        { key: 'key', label: 'Setting Key', placeholder: 'e.g. max_retries' },
        { key: 'value', label: 'Value', placeholder: 'Setting value' },
        { key: 'category', label: 'Category', type: 'select', default: 'general', options: [
          { value: 'general', label: 'General' },
          { value: 'ai', label: 'AI' },
          { value: 'agents', label: 'Agents' },
          { value: 'security', label: 'Security' },
          { value: 'logging', label: 'Logging' },
          { value: 'webhooks', label: 'Webhooks' },
          { value: 'maintenance', label: 'Maintenance' },
          { value: 'performance', label: 'Performance' },
          { value: 'monitoring', label: 'Monitoring' },
          { value: 'ui', label: 'UI' },
        ]},
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe this setting...' },
      ]}
    />
  );
}
