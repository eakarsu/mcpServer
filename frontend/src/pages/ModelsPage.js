import React from 'react';
import CrudPage from '../components/CrudPage';

export default function ModelsPage() {
  return (
    <CrudPage
      title="Models"
      subtitle="Manage AI model configurations"
      apiPath="/models"
      columns={[
        { key: 'name', label: 'Model Name' },
        { key: 'provider', label: 'Provider', render: v => <span className="badge badge-info">{v}</span> },
        { key: 'model_id', label: 'Model ID' },
        { key: 'context_window', label: 'Context', render: v => `${(v/1000).toFixed(0)}K` },
        { key: 'pricing_input', label: 'Input Price' },
        { key: 'status', label: 'Status', render: v => <span className={`badge badge-${v}`}>{v}</span> },
      ]}
      formFields={[
        { key: 'name', label: 'Model Name', placeholder: 'e.g. Claude Haiku 4.5' },
        { key: 'provider', label: 'Provider', placeholder: 'e.g. Anthropic' },
        { key: 'model_id', label: 'Model ID', placeholder: 'e.g. anthropic/claude-haiku-4.5' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'context_window', label: 'Context Window', type: 'number', default: '128000' },
        { key: 'max_tokens', label: 'Max Tokens', type: 'number', default: '4096' },
        { key: 'pricing_input', label: 'Input Pricing', placeholder: '$0.25/1M' },
        { key: 'pricing_output', label: 'Output Pricing', placeholder: '$1.25/1M' },
        { key: 'status', label: 'Status', type: 'select', default: 'active', options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'deprecated', label: 'Deprecated' },
        ]},
      ]}
    />
  );
}
