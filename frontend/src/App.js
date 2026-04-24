import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServersPage from './pages/ServersPage';
import ToolsPage from './pages/ToolsPage';
import AgentsPage from './pages/AgentsPage';
import PromptsPage from './pages/PromptsPage';
import ResourcesPage from './pages/ResourcesPage';
import WorkflowsPage from './pages/WorkflowsPage';
import KnowledgePage from './pages/KnowledgePage';
import ExecutionsPage from './pages/ExecutionsPage';
import ConversationsPage from './pages/ConversationsPage';
import LogsPage from './pages/LogsPage';
import ApiKeysPage from './pages/ApiKeysPage';
import WebhooksPage from './pages/WebhooksPage';
import ModelsPage from './pages/ModelsPage';
import SettingsPage from './pages/SettingsPage';

import { FiServer, FiTool, FiCpu, FiFileText, FiFolder, FiGitBranch, FiBook, FiActivity, FiMessageSquare, FiList, FiKey, FiLink, FiBox, FiSettings, FiHome, FiLogOut, FiMenu } from 'react-icons/fi';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: FiHome },
  { path: '/servers', label: 'MCP Servers', icon: FiServer },
  { path: '/tools', label: 'Tools', icon: FiTool },
  { path: '/agents', label: 'Agents', icon: FiCpu },
  { path: '/prompts', label: 'Prompts', icon: FiFileText },
  { path: '/resources', label: 'Resources', icon: FiFolder },
  { path: '/workflows', label: 'Workflows', icon: FiGitBranch },
  { path: '/knowledge', label: 'Knowledge Base', icon: FiBook },
  { path: '/executions', label: 'Executions', icon: FiActivity },
  { path: '/conversations', label: 'AI Chat', icon: FiMessageSquare },
  { path: '/logs', label: 'Audit Logs', icon: FiList },
  { path: '/apikeys', label: 'API Keys', icon: FiKey },
  { path: '/webhooks', label: 'Webhooks', icon: FiLink },
  { path: '/models', label: 'Models', icon: FiBox },
  { path: '/settings', label: 'Settings', icon: FiSettings },
];

function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo" onClick={() => setCollapsed(!collapsed)}>
          <FiMenu size={20} />
          {!collapsed && <span className="logo-text">MCP Platform</span>}
        </div>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            title={item.label}
          >
            <item.icon size={18} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <FiLogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`main-content ${collapsed ? 'expanded' : ''}`}>
        {children}
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/servers" element={<ProtectedRoute><ServersPage /></ProtectedRoute>} />
        <Route path="/tools" element={<ProtectedRoute><ToolsPage /></ProtectedRoute>} />
        <Route path="/agents" element={<ProtectedRoute><AgentsPage /></ProtectedRoute>} />
        <Route path="/prompts" element={<ProtectedRoute><PromptsPage /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute><ResourcesPage /></ProtectedRoute>} />
        <Route path="/workflows" element={<ProtectedRoute><WorkflowsPage /></ProtectedRoute>} />
        <Route path="/knowledge" element={<ProtectedRoute><KnowledgePage /></ProtectedRoute>} />
        <Route path="/executions" element={<ProtectedRoute><ExecutionsPage /></ProtectedRoute>} />
        <Route path="/conversations" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute><LogsPage /></ProtectedRoute>} />
        <Route path="/apikeys" element={<ProtectedRoute><ApiKeysPage /></ProtectedRoute>} />
        <Route path="/webhooks" element={<ProtectedRoute><WebhooksPage /></ProtectedRoute>} />
        <Route path="/models" element={<ProtectedRoute><ModelsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
