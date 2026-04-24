import React from 'react';
import CrudPage from '../components/CrudPage';

export default function AgentsPage() {
  return (
    <CrudPage
      title="Agents"
      subtitle="Manage AI agents with tool-use capabilities"
      apiPath="/agents"
      columns={[
        { key: 'name', label: 'Agent Name' },
        { key: 'model', label: 'Model', render: v => <span className="badge badge-info">{v?.split('/').pop()}</span> },
        { key: 'status', label: 'Status', render: v => <span className={`badge badge-${v}`}>{v}</span> },
        { key: 'temperature', label: 'Temp' },
        { key: 'max_tokens', label: 'Max Tokens' },
        { key: 'description', label: 'Description', render: v => v?.substring(0, 50) },
      ]}
      formFields={[
        { key: 'name', label: 'Agent Name', placeholder: 'e.g. Code Review Agent' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'What does this agent do?' },
        { key: 'model', label: 'Model', default: 'anthropic/claude-haiku-4.5', placeholder: 'anthropic/claude-haiku-4.5' },
        { key: 'system_prompt', label: 'System Prompt', type: 'textarea', placeholder: 'You are a helpful agent that...' },
        { key: 'temperature', label: 'Temperature', type: 'number', default: '0.7' },
        { key: 'max_tokens', label: 'Max Tokens', type: 'number', default: '4096' },
        { key: 'tools', label: 'Tools (JSON array)', type: 'json', default: '[]', placeholder: '["read_file","write_file"]' },
        { key: 'status', label: 'Status', type: 'select', default: 'active', options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]},
      ]}
    />
  );
}
