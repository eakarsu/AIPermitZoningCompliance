import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const STATUS_COLUMNS = [
  { key: 'Pending Review', label: 'Pending Review', color: '#94a3b8' },
  { key: 'submitted', label: 'Submitted', color: '#3b82f6' },
  { key: 'Under Review', label: 'Under Review', color: '#f59e0b' },
  { key: 'revision_needed', label: 'Revision Needed', color: '#f97316' },
  { key: 'Revisions Required', label: 'Revisions Required', color: '#f97316' },
  { key: 'approved', label: 'Approved', color: '#22c55e' },
  { key: 'Approved', label: 'Approved', color: '#22c55e' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' },
  { key: 'Denied', label: 'Denied', color: '#ef4444' },
];

// Merge duplicate status labels
const MERGED_COLUMNS = [
  { keys: ['Pending Review'], label: 'Pending Review', color: '#94a3b8' },
  { keys: ['submitted'], label: 'Submitted', color: '#3b82f6' },
  { keys: ['Under Review'], label: 'Under Review', color: '#f59e0b' },
  { keys: ['revision_needed', 'Revisions Required'], label: 'Revision Needed', color: '#f97316' },
  { keys: ['approved', 'Approved'], label: 'Approved', color: '#22c55e' },
  { keys: ['rejected', 'Denied'], label: 'Rejected/Denied', color: '#ef4444' },
];

function KanbanBoard({ user, onLogout }) {
  const navigate = useNavigate();
  const [board, setBoard] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dragItem, setDragItem] = useState(null);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchBoard = async () => {
    setLoading(true);
    try {
      const res = await API.get('/permits/kanban/board');
      setBoard(res.data || {});
    } catch (err) {
      setError('Failed to load Kanban board: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  useEffect(() => { fetchBoard(); }, []);

  const getAllPermitsForColumn = (col) => {
    const permits = [];
    col.keys.forEach(key => {
      const arr = board[key] || [];
      arr.forEach(p => { if (!permits.find(x => x.id === p.id)) permits.push(p); });
    });
    return permits;
  };

  const totalPermits = MERGED_COLUMNS.reduce((sum, col) => sum + getAllPermitsForColumn(col).length, 0);

  const handleTransition = async (permitId, newStatus) => {
    try {
      setStatusMsg('');
      await API.put(`/permits/${permitId}/status`, { status: newStatus });
      await fetchBoard();
      setStatusMsg(`Permit moved to "${newStatus}"`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('Error: ' + (err.response?.data?.error || err.message));
    }
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
          <button className="btn-logout" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </nav>

      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <button className="btn-back" onClick={() => navigate('/')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1 style={{ margin: 0 }}>
              <i className="fas fa-columns" style={{ color: '#3b82f6', marginRight: 10 }}></i>
              Permit Workflow Board
            </h1>
            <small style={{ color: '#666' }}>{totalPermits} total permits</small>
          </div>
          <button className="btn-new" onClick={() => navigate('/feature/permits')} style={{ marginLeft: 'auto' }}>
            <i className="fas fa-plus"></i> New Permit
          </button>
        </div>

        {statusMsg && (
          <div style={{ padding: '8px 14px', borderRadius: 6, marginBottom: 12, background: statusMsg.startsWith('Error') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${statusMsg.startsWith('Error') ? '#fca5a5' : '#86efac'}`, color: statusMsg.startsWith('Error') ? '#dc2626' : '#166534', fontSize: '0.9rem' }}>
            {statusMsg}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
            Loading board...
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, alignItems: 'flex-start' }}>
            {MERGED_COLUMNS.map(col => {
              const permits = getAllPermitsForColumn(col);
              return (
                <div key={col.label} style={{
                  minWidth: 260, maxWidth: 280, background: '#f8fafc', borderRadius: 10,
                  border: '1px solid #e2e8f0', flexShrink: 0, overflow: 'hidden',
                }}>
                  <div style={{
                    background: col.color, color: 'white', padding: '10px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <strong style={{ fontSize: '0.9rem' }}>{col.label}</strong>
                    <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 12, padding: '2px 8px', fontSize: '0.8rem' }}>
                      {permits.length}
                    </span>
                  </div>
                  <div style={{ padding: '8px', minHeight: 100 }}>
                    {permits.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 8px', color: '#9ca3af', fontSize: '0.8rem' }}>
                        No permits here
                      </div>
                    ) : (
                      permits.map(permit => (
                        <div key={permit.id} style={{
                          background: 'white', borderRadius: 6, padding: '10px 12px', marginBottom: 8,
                          border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          transition: 'all 0.2s',
                        }}
                          onClick={() => setSelectedPermit(selectedPermit?.id === permit.id ? null : permit)}
                        >
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 4, color: '#111827' }}>
                            {permit.project_name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>
                            {permit.applicant_name}
                          </div>
                          {permit.property_address && (
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 6 }}>
                              <i className="fas fa-map-marker-alt" style={{ marginRight: 4 }}></i>
                              {permit.property_address.substring(0, 35)}{permit.property_address.length > 35 ? '...' : ''}
                            </div>
                          )}
                          {permit.estimated_cost && (
                            <div style={{ fontSize: '0.78rem', color: '#374151' }}>
                              ${Number(permit.estimated_cost).toLocaleString()}
                            </div>
                          )}

                          {/* Expanded actions */}
                          {selectedPermit?.id === permit.id && (
                            <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 6 }}>Move to:</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {[
                                  { label: 'Submit', status: 'submitted', color: '#3b82f6' },
                                  { label: 'In Review', status: 'Under Review', color: '#f59e0b' },
                                  { label: 'Approve', status: 'approved', color: '#22c55e', adminOnly: true },
                                  { label: 'Reject', status: 'rejected', color: '#ef4444', adminOnly: true },
                                  { label: 'Needs Revision', status: 'revision_needed', color: '#f97316' },
                                ]
                                  .filter(action => !action.adminOnly || user.role === 'admin')
                                  .map(action => (
                                    <button key={action.status} onClick={(e) => {
                                      e.stopPropagation();
                                      handleTransition(permit.id, action.status);
                                      setSelectedPermit(null);
                                    }}
                                      style={{
                                        background: action.color, color: 'white', border: 'none', borderRadius: 4,
                                        padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer',
                                      }}>
                                      {action.label}
                                    </button>
                                  ))}
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/feature/permits');
                                }}
                                  style={{ background: '#6b7280', color: 'white', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer' }}>
                                  Details
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default KanbanBoard;
