import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiServer, FiTool, FiCpu, FiFileText, FiFolder, FiGitBranch, FiActivity, FiMessageSquare } from 'react-icons/fi';
import api from '../services/api';

const cards = [
  { key: 'servers', label: 'MCP Servers', icon: FiServer, path: '/servers', color: '#6366f1' },
  { key: 'tools', label: 'Tools', icon: FiTool, path: '/tools', color: '#10b981' },
  { key: 'agents', label: 'Agents', icon: FiCpu, path: '/agents', color: '#f59e0b' },
  { key: 'prompts', label: 'Prompts', icon: FiFileText, path: '/prompts', color: '#3b82f6' },
  { key: 'resources', label: 'Resources', icon: FiFolder, path: '/resources', color: '#8b5cf6' },
  { key: 'workflows', label: 'Workflows', icon: FiGitBranch, path: '/workflows', color: '#ec4899' },
  { key: 'executions', label: 'Executions', icon: FiActivity, path: '/executions', color: '#ef4444' },
  { key: 'conversations', label: 'AI Chats', icon: FiMessageSquare, path: '/conversations', color: '#14b8a6' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">MCP Server Platform Overview</p>
        </div>
      </div>
      <div className="dashboard-grid">
        {cards.map(c => (
          <div key={c.key} className="stat-card" onClick={() => navigate(c.path)} style={{ '--accent': c.color }}>
            <div className="stat-icon"><c.icon size={32} color={c.color} /></div>
            <div className="stat-value">{stats[c.key] ?? '—'}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
