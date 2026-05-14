import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import API from '../api';

const RULE_TYPES = [
  'Zoning', 'Setback', 'Height Limit', 'Parking', 'Signage', 'Fire Code', 'ADA', 'Environmental',
  'Historic Preservation', 'Noise', 'Stormwater', 'Energy Code', 'Building Code', 'Other',
];

function JurisdictionRules({ user, onLogout }) {
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ jurisdiction: '', rule_type: '', requirement: '', effective_date: '' });
  const [filterJurisdiction, setFilterJurisdiction] = useState('');
  const [filterRuleType, setFilterRuleType] = useState('');

  // AI check state
  const [showAiCheck, setShowAiCheck] = useState(false);
  const [aiCheckInput, setAiCheckInput] = useState({ address: '', project_type: '', jurisdiction: '' });
  const [aiCheckResult, setAiCheckResult] = useState(null);
  const [aiCheckLoading, setAiCheckLoading] = useState(false);

  const LIMIT = 20;

  const fetchRules = async (p = 1) => {
    setLoading(true);
    try {
      let url = `/jurisdiction-rules?page=${p}&limit=${LIMIT}`;
      if (filterJurisdiction) url += `&jurisdiction=${encodeURIComponent(filterJurisdiction)}`;
      if (filterRuleType) url += `&rule_type=${encodeURIComponent(filterRuleType)}`;
      const res = await API.get(url);
      setRules(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load rules:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRules(page); }, [page, filterJurisdiction, filterRuleType]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await API.put(`/jurisdiction-rules/${editItem.id}`, formData);
      } else {
        await API.post('/jurisdiction-rules', formData);
      }
      setShowForm(false);
      setEditItem(null);
      setFormData({ jurisdiction: '', rule_type: '', requirement: '', effective_date: '' });
      fetchRules(page);
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (rule) => {
    setEditItem(rule);
    setFormData({
      jurisdiction: rule.jurisdiction,
      rule_type: rule.rule_type,
      requirement: rule.requirement,
      effective_date: rule.effective_date ? rule.effective_date.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    await API.delete(`/jurisdiction-rules/${id}`);
    fetchRules(page);
  };

  const handleAiCheck = async () => {
    if (!aiCheckInput.address || !aiCheckInput.project_type) {
      alert('Please enter address and project type');
      return;
    }
    setAiCheckLoading(true);
    setAiCheckResult(null);
    try {
      const res = await API.post('/jurisdiction-rules/check', aiCheckInput);
      setAiCheckResult(res.data);
    } catch (err) {
      setAiCheckResult({ success: false, result: 'Check failed: ' + (err.response?.data?.error || err.message) });
    }
    setAiCheckLoading(false);
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <div className="brand-icon"><i className="fas fa-building-shield"></i></div>
          <h2>PermitZone AI</h2>
        </div>
        <div className="navbar-right">
          <span className="navbar-user">Welcome, <strong>{user.name}</strong></span>
          <button className="btn-logout" style={{ marginRight: 8 }} onClick={() => navigate('/ai-history')}>
            <i className="fas fa-history"></i> AI History
          </button>
          <button className="btn-logout" onClick={onLogout}><i className="fas fa-sign-out-alt"></i> Logout</button>
        </div>
      </nav>

      <div className="feature-page">
        <div className="page-header">
          <div className="page-header-left">
            <button className="btn-back" onClick={() => navigate('/')}><i className="fas fa-arrow-left"></i></button>
            <div>
              <h1><i className="fas fa-scale-balanced" style={{ color: '#6366f1', marginRight: 12 }}></i>Jurisdiction Rules</h1>
              <small style={{ color: '#666' }}>{total} total rules</small>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-action" style={{ background: '#6366f1', color: 'white', padding: '8px 16px' }}
              onClick={() => setShowAiCheck(!showAiCheck)}>
              <i className="fas fa-robot"></i> AI Jurisdiction Check
            </button>
            <button className="btn-new" onClick={() => { setEditItem(null); setFormData({ jurisdiction: '', rule_type: '', requirement: '', effective_date: '' }); setShowForm(true); }}>
              <i className="fas fa-plus"></i> Add Rule
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Filter by jurisdiction..."
            value={filterJurisdiction}
            onChange={e => { setFilterJurisdiction(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', flex: 1, minWidth: 200 }}
          />
          <select
            value={filterRuleType}
            onChange={e => { setFilterRuleType(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}
          >
            <option value="">All Rule Types</option>
            {RULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* AI Check Panel */}
        {showAiCheck && (
          <div style={{ background: '#f0f4ff', border: '1px solid #a5b4fc', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12, color: '#3730a3' }}>
              <i className="fas fa-robot" style={{ marginRight: 8 }}></i>AI Jurisdiction Compliance Check
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, color: '#374151' }}>Property Address *</label>
                <input type="text" placeholder="123 Main St, Springfield, IL"
                  value={aiCheckInput.address}
                  onChange={e => setAiCheckInput({ ...aiCheckInput, address: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, color: '#374151' }}>Project Type *</label>
                <input type="text" placeholder="e.g., Commercial New Build, Multi-Family"
                  value={aiCheckInput.project_type}
                  onChange={e => setAiCheckInput({ ...aiCheckInput, project_type: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, color: '#374151' }}>Jurisdiction (optional)</label>
                <input type="text" placeholder="e.g., City of Chicago"
                  value={aiCheckInput.jurisdiction}
                  onChange={e => setAiCheckInput({ ...aiCheckInput, jurisdiction: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}
                />
              </div>
            </div>
            <button className="btn-action" style={{ background: '#6366f1', color: 'white', padding: '8px 16px' }}
              onClick={handleAiCheck} disabled={aiCheckLoading}>
              {aiCheckLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Analyzing...</> : <><i className="fas fa-search" style={{ marginRight: 6 }}></i>Check Compliance</>}
            </button>

            {aiCheckResult && (
              <div className="ai-result" style={{ marginTop: 16 }}>
                <div className="ai-result-header">
                  <i className="fas fa-robot"></i>
                  <h3>AI Jurisdiction Compliance Assessment</h3>
                  {aiCheckResult.rules_checked !== undefined && (
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{aiCheckResult.rules_checked} rules checked</span>
                  )}
                </div>
                <div className="ai-result-body">
                  <ReactMarkdown>{aiCheckResult.result || 'No result returned.'}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="data-table-container">
          {loading ? (
            <div className="loading-table"><div className="ai-loading"><div className="spinner"></div> Loading rules...</div></div>
          ) : rules.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-scale-balanced"></i>
              <p>No jurisdiction rules yet. Click "Add Rule" to create the first one.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Jurisdiction</th>
                  <th>Rule Type</th>
                  <th>Requirement</th>
                  <th>Effective Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.id}>
                    <td><strong>{rule.jurisdiction}</strong></td>
                    <td><span className="status-badge" style={{ background: '#ede9fe', color: '#5b21b6' }}>{rule.rule_type}</span></td>
                    <td style={{ maxWidth: 300 }}>{rule.requirement.length > 80 ? rule.requirement.substring(0, 80) + '...' : rule.requirement}</td>
                    <td>{rule.effective_date ? new Date(rule.effective_date).toLocaleDateString() : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-action edit" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleEdit(rule)}>
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button className="btn-action delete" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleDelete(rule.id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '16px 0', alignItems: 'center' }}>
            <button className="btn-action" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 14px' }}>
              <i className="fas fa-chevron-left"></i> Prev
            </button>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Page {page} of {totalPages}</span>
            <button className="btn-action" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: '6px 14px' }}>
              Next <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editItem ? 'Edit' : 'Add'} Jurisdiction Rule</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Jurisdiction *</label>
                    <input type="text" value={formData.jurisdiction} onChange={e => setFormData({ ...formData, jurisdiction: e.target.value })} placeholder="e.g., City of Chicago, Cook County" required />
                  </div>
                  <div className="form-group">
                    <label>Rule Type *</label>
                    <select value={formData.rule_type} onChange={e => setFormData({ ...formData, rule_type: e.target.value })} required>
                      <option value="">Select type...</option>
                      {RULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Requirement *</label>
                    <textarea value={formData.requirement} onChange={e => setFormData({ ...formData, requirement: e.target.value })} placeholder="Describe the rule requirement..." rows={4} required />
                  </div>
                  <div className="form-group">
                    <label>Effective Date</label>
                    <input type="date" value={formData.effective_date} onChange={e => setFormData({ ...formData, effective_date: e.target.value })} />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-action cancel" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn-action save">
                    <i className="fas fa-save"></i> {editItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JurisdictionRules;
