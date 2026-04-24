import React from 'react';
import CrudPage from '../components/CrudPage';

export default function LogsPage() {
  return (
    <CrudPage
      title="Audit Logs"
      subtitle="View system audit trail and activity logs"
      apiPath="/logs"
      columns={[
        { key: 'action', label: 'Action' },
        { key: 'entity_type', label: 'Entity Type', render: v => <span className="badge badge-info">{v}</span> },
        { key: 'level', label: 'Level', render: v => <span className={`badge badge-${v === 'error' ? 'error' : v === 'warning' ? 'warning' : 'success'}`}>{v}</span> },
        { key: 'user_email', label: 'User' },
        { key: 'created_at', label: 'Time', render: v => new Date(v).toLocaleString() },
      ]}
      formFields={[
        { key: 'action', label: 'Action', placeholder: 'e.g. server.created' },
        { key: 'entity_type', label: 'Entity Type', placeholder: 'e.g. mcp_server' },
        { key: 'entity_id', label: 'Entity ID', placeholder: '1' },
        { key: 'details', label: 'Details (JSON)', type: 'json', default: '{}' },
        { key: 'level', label: 'Level', type: 'select', default: 'info', options: [
          { value: 'info', label: 'Info' },
          { value: 'warning', label: 'Warning' },
          { value: 'error', label: 'Error' },
        ]},
        { key: 'user_email', label: 'User Email', placeholder: 'admin@mcpserver.com' },
      ]}
    />
  );
}
