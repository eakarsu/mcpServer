import React from 'react';
import CrudPage from '../components/CrudPage';

export default function KnowledgePage() {
  return (
    <CrudPage
      title="Knowledge Base"
      subtitle="Manage knowledge entries for agent context"
      apiPath="/knowledge"
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category', render: v => <span className="badge badge-info">{v}</span> },
        { key: 'source', label: 'Source' },
        { key: 'tags', label: 'Tags', render: v => {
          const tags = typeof v === 'string' ? JSON.parse(v || '[]') : (v || []);
          return <div className="tag-list">{tags.slice(0, 3).map((t, i) => <span key={i} className="tag">{t}</span>)}</div>;
        }},
        { key: 'content', label: 'Content', render: v => v?.substring(0, 60) },
      ]}
      formFields={[
        { key: 'title', label: 'Title', placeholder: 'Knowledge entry title' },
        { key: 'content', label: 'Content', type: 'textarea', placeholder: 'Knowledge content...' },
        { key: 'category', label: 'Category', type: 'select', default: 'protocol', options: [
          { value: 'protocol', label: 'Protocol' },
          { value: 'best-practices', label: 'Best Practices' },
          { value: 'patterns', label: 'Patterns' },
          { value: 'security', label: 'Security' },
          { value: 'architecture', label: 'Architecture' },
          { value: 'prompts', label: 'Prompts' },
          { value: 'operations', label: 'Operations' },
          { value: 'performance', label: 'Performance' },
          { value: 'workflows', label: 'Workflows' },
          { value: 'testing', label: 'Testing' },
          { value: 'compliance', label: 'Compliance' },
        ]},
        { key: 'tags', label: 'Tags (JSON array)', type: 'json', default: '[]', placeholder: '["tag1","tag2"]' },
        { key: 'source', label: 'Source', placeholder: 'e.g. Internal Documentation' },
      ]}
    />
  );
}
