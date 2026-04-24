import React from 'react';
import CrudPage from '../components/CrudPage';

const statusBadge = (val) => <span className={`badge badge-${val}`}>{val}</span>;

export default function ServersPage() {
  return (
    <CrudPage
      title="MCP Servers"
      subtitle="Manage Model Context Protocol server connections"
      apiPath="/servers"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'protocol', label: 'Protocol', render: v => <span className="badge badge-info">{v}</span> },
        { key: 'status', label: 'Status', render: statusBadge },
        { key: 'auth_type', label: 'Auth' },
        { key: 'max_connections', label: 'Max Conn' },
        { key: 'endpoint', label: 'Endpoint', render: v => v?.substring(0, 40) + (v?.length > 40 ? '...' : '') },
      ]}
      formFields={[
        { key: 'name', label: 'Server Name', placeholder: 'e.g. File System Server' },
        { key: 'endpoint', label: 'Endpoint', placeholder: 'e.g. stdio:///usr/local/bin/mcp-fs' },
        { key: 'protocol', label: 'Protocol', type: 'select', default: 'stdio', options: [
          { value: 'stdio', label: 'Standard I/O (stdio)' },
          { value: 'sse', label: 'Server-Sent Events (SSE)' },
          { value: 'websocket', label: 'WebSocket' },
        ]},
        { key: 'status', label: 'Status', type: 'select', default: 'active', options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'maintenance', label: 'Maintenance' },
        ]},
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Server description...' },
        { key: 'auth_type', label: 'Auth Type', type: 'select', default: 'none', options: [
          { value: 'none', label: 'None' },
          { value: 'bearer', label: 'Bearer Token' },
          { value: 'api_key', label: 'API Key' },
          { value: 'oauth2', label: 'OAuth 2.0' },
          { value: 'basic', label: 'Basic Auth' },
        ]},
        { key: 'max_connections', label: 'Max Connections', type: 'number', default: '10' },
      ]}
    />
  );
}
