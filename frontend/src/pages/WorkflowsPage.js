import React from 'react';
import CrudPage from '../components/CrudPage';

export default function WorkflowsPage() {
  return (
    <CrudPage
      title="Workflows"
      subtitle="Manage multi-step agent workflows"
      apiPath="/workflows"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'trigger_type', label: 'Trigger', render: v => <span className="badge badge-info">{v}</span> },
        { key: 'status', label: 'Status', render: v => <span className={`badge badge-${v}`}>{v}</span> },
        { key: 'schedule', label: 'Schedule', render: v => v || '—' },
        { key: 'description', label: 'Description', render: v => v?.substring(0, 50) },
      ]}
      formFields={[
        { key: 'name', label: 'Workflow Name', placeholder: 'e.g. Deploy to Production' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'steps', label: 'Steps (JSON)', type: 'json', default: '[]', placeholder: '[{"name":"Step 1","tool":"tool_name"}]' },
        { key: 'trigger_type', label: 'Trigger Type', type: 'select', default: 'manual', options: [
          { value: 'manual', label: 'Manual' },
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'webhook', label: 'Webhook' },
          { value: 'event', label: 'Event-driven' },
        ]},
        { key: 'status', label: 'Status', type: 'select', default: 'active', options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'paused', label: 'Paused' },
        ]},
        { key: 'schedule', label: 'Schedule (Cron)', placeholder: '0 2 * * * (optional)' },
      ]}
    />
  );
}
