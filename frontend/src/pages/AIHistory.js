import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import API from '../api';

function AIHistory({ user, onLogout }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const LIMIT = 20;

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const res = await API.get(`/ai/history?page=${p}&limit=${LIMIT}`);
      setHistory(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error('Fetch AI history error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <div className="brand-icon"><i className="fas fa-building-shield"></i></div>
          <h2>PermitZone AI</h2>
        </div>
        <div className="navbar-right">
          <span className="navbar-user">Welcome, <strong>{user.name}</strong></span>
          <button className="btn-logout" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </nav>

      <div className="feature-page">
        <div className="page-header">
          <div className="page-header-left">
            <button className="btn-back" onClick={() => navigate('/')}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <h1><i className="fas fa-history" style={{ color: '#8b5cf6', marginRight: 12 }}></i>AI Analysis History</h1>
              <small style={{color:'#666'}}>{total} total analyses</small>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-table"><div className="ai-loading"><div className="spinner"></div> Loading history...</div></div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-history"></i>
            <p>No AI analyses yet. Run an analysis from any feature page.</p>
          </div>
        ) : (
          <div style={{padding:'0 24px'}}>
            {history.map(item => (
              <div key={item.id} style={{
                background:'white', border:'1px solid #e2e8f0', borderRadius:8,
                marginBottom:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div
                  style={{padding:'12px 16px', display:'flex', justifyContent:'space-between',
                    alignItems:'center', cursor:'pointer', background: expandedId === item.id ? '#f8fafc' : 'white'}}
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <div>
                    <strong style={{color:'#1e293b'}}>{item.endpoint}</strong>
                    <span style={{marginLeft:12,fontSize:'0.8rem',color:'#8b5cf6',background:'#ede9fe',padding:'2px 8px',borderRadius:12}}>
                      {item.entity_table}
                    </span>
                    {item.entity_id && (
                      <span style={{marginLeft:6,fontSize:'0.8rem',color:'#6b7280'}}>
                        ID: {item.entity_id}
                      </span>
                    )}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <span style={{fontSize:'0.8rem',color:'#9ca3af'}}>
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                    <i className={`fas fa-chevron-${expandedId === item.id ? 'up' : 'down'}`} style={{color:'#9ca3af'}}></i>
                  </div>
                </div>
                {expandedId === item.id && (
                  <div style={{padding:'16px', borderTop:'1px solid #e2e8f0', background:'#fafafa'}}>
                    {item.result_json && (
                      <div style={{marginBottom:12, padding:12, background:'#f0f9ff', borderRadius:6, border:'1px solid #bae6fd'}}>
                        <strong style={{fontSize:'0.85rem',color:'#0369a1'}}>Structured Result:</strong>
                        <pre style={{fontSize:'0.8rem',overflow:'auto',marginTop:6}}>
                          {JSON.stringify(item.result_json, null, 2)}
                        </pre>
                      </div>
                    )}
                    <div style={{fontSize:'0.9rem'}}>
                      <ReactMarkdown>{item.result}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{display:'flex',gap:8,justifyContent:'center',padding:'16px 0',alignItems:'center'}}>
                <button
                  className="btn-action"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{padding:'6px 14px'}}
                >
                  <i className="fas fa-chevron-left"></i> Prev
                </button>
                <span style={{fontSize:'0.9rem',color:'#666'}}>Page {page} of {totalPages}</span>
                <button
                  className="btn-action"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{padding:'6px 14px'}}
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AIHistory;
