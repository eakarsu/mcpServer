import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FiSend, FiPlus, FiTrash2, FiZap, FiCpu, FiBarChart2, FiMessageSquare } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('chat');
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
    api.get('/agents').then(r => setAgents(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const { data } = await api.get('/ai/conversations');
      setConversations(data);
    } catch {}
  };

  const loadConversation = async (conv) => {
    try {
      const { data } = await api.get(`/ai/conversations/${conv.id}`);
      setActiveConv(data);
      setMessages(data.messages || []);
    } catch {
      toast.error('Failed to load conversation');
    }
  };

  const newConversation = () => {
    setActiveConv(null);
    setMessages([]);
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await api.delete(`/ai/conversations/${id}`);
      toast.success('Conversation deleted');
      if (activeConv?.id === id) { setActiveConv(null); setMessages([]); }
      loadConversations();
    } catch { toast.error('Delete failed'); }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      let endpoint = '/ai/chat';
      let payload = { message: userMsg, conversation_id: activeConv?.id };

      if (selectedAgent) payload.agent_id = selectedAgent;
      if (mode === 'tool-use') endpoint = '/ai/tool-use';
      if (mode === 'analyze') {
        endpoint = '/ai/analyze';
        payload = { type: 'server-health', data: { query: userMsg } };
      }

      const { data } = await api.post(endpoint, payload);

      const aiContent = data.message || data.analysis || 'No response';
      const aiMessage = {
        role: 'assistant',
        content: aiContent,
        tool_calls: data.tool_calls,
        usage: data.usage,
        model: data.model,
        raw_response: data.raw_response,
      };

      setMessages(prev => [...prev, aiMessage]);

      if (data.conversation_id && !activeConv) {
        setActiveConv({ id: data.conversation_id });
      }
      loadConversations();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'AI request failed';
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errMsg}` }]);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Chat</h1>
          <p className="page-subtitle">Interact with AI using OpenRouter</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-select" style={{ width: 180 }} value={mode} onChange={e => setMode(e.target.value)}>
            <option value="chat">Chat Mode</option>
            <option value="tool-use">Tool Use Mode</option>
            <option value="analyze">Analysis Mode</option>
          </select>
          <select className="form-select" style={{ width: 200 }} value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
            <option value="">Default Agent</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      <div className="chat-layout">
        <div className="conv-sidebar">
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={newConversation}>
            <FiPlus size={14} /> New Chat
          </button>
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conv-item ${activeConv?.id === conv.id ? 'active' : ''}`}
              onClick={() => loadConversation(conv)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="conv-item-title">{conv.title || 'Untitled'}</div>
                <button className="btn btn-sm btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 2 }}
                  onClick={(e) => deleteConversation(conv.id, e)}>
                  <FiTrash2 size={12} />
                </button>
              </div>
              <div className="conv-item-meta">{conv.agent_name} &middot; {new Date(conv.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>

        <div className="chat-main">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon"><FiMessageSquare size={48} /></div>
                <div className="empty-state-text">Start a conversation</div>
                <div className="empty-state-sub">Ask anything about your MCP servers, tools, or agents</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
                  {[
                    'List all active MCP servers and their status',
                    'How do I configure a new MCP tool?',
                    'Analyze my server architecture for improvements',
                    'Create a deployment workflow for production',
                  ].map((q, i) => (
                    <button key={i} className="btn btn-secondary btn-sm" onClick={() => { setInput(q); }}>
                      {q.substring(0, 40)}...
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="chat-message">
                <div className={`chat-avatar ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  {msg.role === 'user' ? 'U' : 'AI'}
                </div>
                <div style={{ flex: 1 }}>
                  <div className={`chat-bubble ${msg.role}`}>
                    {msg.role === 'assistant' ? (
                      <div className="ai-response">
                        {msg.model && (
                          <div className="ai-response-header">
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <FiCpu size={12} /> {msg.model}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {mode === 'tool-use' && <><FiZap size={12} /> Tool Use</>}
                              {mode === 'analyze' && <><FiBarChart2 size={12} /> Analysis</>}
                              {mode === 'chat' && <><FiMessageSquare size={12} /> Chat</>}
                            </span>
                          </div>
                        )}
                        <div className="ai-response-body">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        {msg.tool_calls && msg.tool_calls.length > 0 && (
                          <div style={{ padding: '0 16px 16px' }}>
                            {msg.tool_calls.map((tc, j) => (
                              <div key={j} className="tool-call">
                                <div className="tool-call-header">
                                  <FiZap size={12} /> Tool Call: {tc.function?.name}
                                </div>
                                <div className="tool-call-body">
                                  <div className="json-display">{JSON.stringify(JSON.parse(tc.function?.arguments || '{}'), null, 2)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.usage && (
                          <div className="ai-usage">
                            <span>Prompt: {msg.usage.prompt_tokens} tokens</span>
                            <span>Completion: {msg.usage.completion_tokens} tokens</span>
                            <span>Total: {msg.usage.total_tokens} tokens</span>
                          </div>
                        )}
                      </div>
                    ) : msg.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message">
                <div className="chat-avatar ai">AI</div>
                <div className="chat-bubble">
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'tool-use' ? 'Ask the AI to use tools...' :
                mode === 'analyze' ? 'Describe what to analyze...' :
                'Type your message...'
              }
              disabled={loading}
            />
            <button className="chat-send" onClick={handleSend} disabled={loading || !input.trim()}>
              <FiSend size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
