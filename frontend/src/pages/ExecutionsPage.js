import React from 'react';
import CrudPage from '../components/CrudPage';

export default function ExecutionsPage() {
  return (
    <CrudPage
      title="Tool Executions"
      subtitle="View tool execution history and logs"
      apiPath="/executions"
      columns={[
        { key: 'tool_name', label: 'Tool' },
        { key: 'agent_name', label: 'Agent' },
        { key: 'status', label: 'Status', render: v => <span className={`badge badge-${v}`}>{v}</span> },
        { key: 'duration_ms', label: 'Duration', render: v => v < 1000 ? `${v}ms` : `${(v/1000).toFixed(1)}s` },
        { key: 'executed_at', label: 'Executed At', render: v => new Date(v).toLocaleString() },
      ]}
      formFields={[
        { key: 'tool_name', label: 'Tool Name', placeholder: 'e.g. read_file' },
        { key: 'agent_name', label: 'Agent Name', placeholder: 'e.g. Code Review Agent' },
        { key: 'input_data', label: 'Input Data (JSON)', type: 'json', default: '{}' },
        { key: 'output_data', label: 'Output Data (JSON)', type: 'json', default: '{}' },
        { key: 'status', label: 'Status', type: 'select', default: 'success', options: [
          { value: 'success', label: 'Success' },
          { value: 'error', label: 'Error' },
          { value: 'timeout', label: 'Timeout' },
        ]},
        { key: 'duration_ms', label: 'Duration (ms)', type: 'number', default: '0' },
      ]}
    />
  );
}
