import React from 'react';
import McpRequestTimeline from '../components/McpRequestTimeline';
import ToolUsageHeatmap from '../components/ToolUsageHeatmap';
import CapabilityManifestPdf from '../components/CapabilityManifestPdf';
import ToolRegistrationRulesEditor from '../components/ToolRegistrationRulesEditor';

export default function CustomViewsPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: '#f3f4f6', marginTop: 0 }}>MCP Views</h1>
      <p style={{ color: '#9ca3af', marginBottom: 24 }}>
        Custom operational views for the MCP server: live request analytics, tool usage patterns,
        capability disclosure documents, and tool admission policy.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <McpRequestTimeline />
        <ToolUsageHeatmap />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 16 }}>
        <CapabilityManifestPdf />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <ToolRegistrationRulesEditor />
      </div>
    </div>
  );
}
