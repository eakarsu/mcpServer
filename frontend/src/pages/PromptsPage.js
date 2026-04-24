import React from 'react';
import CrudPage from '../components/CrudPage';

export default function PromptsPage() {
  return (
    <CrudPage
      title="Prompts"
      subtitle="Manage prompt templates for MCP agents"
      apiPath="/prompts"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category', render: v => <span className="badge badge-info">{v}</span> },
        { key: 'description', label: 'Description', render: v => v?.substring(0, 60) },
        { key: 'is_active', label: 'Active', render: v => <span className={`badge ${v ? 'badge-success' : 'badge-error'}`}>{v ? 'Yes' : 'No'}</span> },
      ]}
      formFields={[
        { key: 'name', label: 'Prompt Name', placeholder: 'e.g. Code Review' },
        { key: 'description', label: 'Description', placeholder: 'Brief description of the prompt' },
        { key: 'content', label: 'Prompt Content', type: 'textarea', placeholder: 'Enter prompt template with {{variables}}...' },
        { key: 'category', label: 'Category', type: 'select', default: 'development', options: [
          { value: 'development', label: 'Development' },
          { value: 'debugging', label: 'Debugging' },
          { value: 'documentation', label: 'Documentation' },
          { value: 'database', label: 'Database' },
          { value: 'security', label: 'Security' },
          { value: 'testing', label: 'Testing' },
          { value: 'devops', label: 'DevOps' },
          { value: 'monitoring', label: 'Monitoring' },
          { value: 'operations', label: 'Operations' },
          { value: 'architecture', label: 'Architecture' },
        ]},
        { key: 'variables', label: 'Variables (JSON)', type: 'json', default: '[]' },
        { key: 'is_active', label: 'Active', type: 'select', default: 'true', options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ]},
      ]}
    />
  );
}
