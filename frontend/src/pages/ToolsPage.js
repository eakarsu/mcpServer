import React from 'react';
import CrudPage from '../components/CrudPage';

export default function ToolsPage() {
  return (
    <CrudPage
      title="Tools"
      subtitle="Manage available tools for MCP agents"
      apiPath="/tools"
      columns={[
        { key: 'name', label: 'Tool Name' },
        { key: 'category', label: 'Category', render: v => <span className="badge badge-info">{v}</span> },
        { key: 'description', label: 'Description', render: v => v?.substring(0, 60) },
        { key: 'is_active', label: 'Active', render: v => <span className={`badge ${v ? 'badge-success' : 'badge-error'}`}>{v ? 'Active' : 'Inactive'}</span> },
        { key: 'server_id', label: 'Server ID' },
      ]}
      formFields={[
        { key: 'name', label: 'Tool Name', placeholder: 'e.g. read_file' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'What does this tool do?' },
        { key: 'category', label: 'Category', type: 'select', default: 'filesystem', options: [
          { value: 'filesystem', label: 'Filesystem' },
          { value: 'git', label: 'Git' },
          { value: 'database', label: 'Database' },
          { value: 'communication', label: 'Communication' },
          { value: 'devops', label: 'DevOps' },
          { value: 'cloud', label: 'Cloud' },
          { value: 'data', label: 'Data' },
          { value: 'productivity', label: 'Productivity' },
          { value: 'cache', label: 'Cache' },
          { value: 'monitoring', label: 'Monitoring' },
          { value: 'search', label: 'Search' },
        ]},
        { key: 'input_schema', label: 'Input Schema (JSON)', type: 'json', default: '{}', placeholder: '{"type":"object","properties":{}}' },
        { key: 'server_id', label: 'Server ID', type: 'number', placeholder: '1' },
        { key: 'is_active', label: 'Status', type: 'select', default: 'true', options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ]},
      ]}
    />
  );
}
