import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import API from '../api';
import featureConfig from '../featureConfig';

function FeaturePage({ user, onLogout }) {
  const { featureKey } = useParams();
  const navigate = useNavigate();
  const config = featureConfig[featureKey];

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [showDelete, setShowDelete] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [aiReviewResult, setAiReviewResult] = useState(null);
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [appealResult, setAppealResult] = useState(null);
  const [appealLoading, setAppealLoading] = useState(false);
  const [appealContext, setAppealContext] = useState('');
  const LIMIT = 20;

  const fetchData = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await API.get(`${config.endpoint}?page=${p}&limit=${LIMIT}`);
      // Handle both old array response and new paginated response
      if (Array.isArray(res.data)) {
        setData(res.data);
        setTotalPages(1);
        setTotal(res.data.length);
      } else {
        setData(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  }, [config.endpoint]);

  useEffect(() => {
    if (config) fetchData(page);
  }, [config, fetchData, page]);

  if (!config) {
    return <div className="loading-screen">Feature not found</div>;
  }

  const formatValue = (value, format) => {
    if (value === null || value === undefined) return '-';
    switch (format) {
      case 'currency':
        return '$' + Number(value).toLocaleString();
      case 'number':
        return Number(value).toLocaleString();
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'boolean':
        return value === true || value === 'true' ? 'Yes' : 'No';
      case 'status':
        const statusClass = String(value).toLowerCase().replace(/[\s/]+/g, '-');
        return <span className={`status-badge ${statusClass}`}>{value}</span>;
      default:
        return String(value);
    }
  };

  const handleRowClick = async (item) => {
    try {
      const res = await API.get(`${config.endpoint}/${item.id}`);
      setSelectedItem(res.data);
      setShowDetail(true);
      setAiResult(null);
      setUploadMsg('');
    } catch (err) {
      console.error('Detail fetch error:', err);
    }
  };

  const handleNew = () => {
    const initial = {};
    config.fields.forEach(f => {
      if (!f.editOnly) initial[f.key] = '';
    });
    setFormData(initial);
    setEditMode(false);
    setShowForm(true);
  };

  const handleEdit = () => {
    const initial = {};
    config.fields.forEach(f => {
      initial[f.key] = selectedItem[f.key] || '';
    });
    setFormData(initial);
    setEditMode(true);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await API.put(`${config.endpoint}/${selectedItem.id}`, formData);
      } else {
        await API.post(config.endpoint, formData);
      }
      setShowForm(false);
      fetchData(page);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`${config.endpoint}/${selectedItem.id}`);
      setShowDelete(false);
      setShowDetail(false);
      fetchData(page);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleAiAnalyze = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await API.post(`${config.endpoint}/${selectedItem.id}/analyze`);
      setAiResult(res.data);
      // Refresh to show saved ai_analysis
      const refreshed = await API.get(`${config.endpoint}/${selectedItem.id}`);
      setSelectedItem(refreshed.data);
    } catch (err) {
      setAiResult({ success: false, result: 'AI analysis failed: ' + (err.response?.data?.error || err.message) });
    }
    setAiLoading(false);
  };

  // Permit state machine actions
  const handlePermitAction = async (action) => {
    try {
      await API.post(`${config.endpoint}/${selectedItem.id}/${action}`);
      const refreshed = await API.get(`${config.endpoint}/${selectedItem.id}`);
      setSelectedItem(refreshed.data);
      fetchData(page);
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.error || err.message));
    }
  };

  // Document upload
  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploadLoading(true);
    setUploadMsg('');
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', uploadFile);
      formDataUpload.append('entity_type', featureKey);
      if (selectedItem) formDataUpload.append('entity_id', selectedItem.id);

      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadMsg(`File uploaded: ${data.original_filename}`);
        setUploadFile(null);
      } else {
        setUploadMsg('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setUploadMsg('Upload error: ' + err.message);
    }
    setUploadLoading(false);
  };

  const isPermitsPage = featureKey === 'permits';

  const handleAiReview = async () => {
    if (!selectedItem) return;
    setAiReviewLoading(true);
    setAiReviewResult(null);
    try {
      const res = await API.post(`/ai/permits/${selectedItem.id}/ai-review`);
      setAiReviewResult(res.data);
    } catch (err) {
      setAiReviewResult({ success: false, result: 'AI review failed: ' + (err.response?.data?.error || err.message) });
    }
    setAiReviewLoading(false);
  };

  const handleAppeal = async () => {
    if (!selectedItem) return;
    setAppealLoading(true);
    setAppealResult(null);
    try {
      const res = await API.post(`/ai/permits/${selectedItem.id}/ai-appeal`, { additional_context: appealContext });
      setAppealResult(res.data);
    } catch (err) {
      setAppealResult({ success: false, result: 'Appeal generation failed: ' + (err.response?.data?.error || err.message) });
    }
    setAppealLoading(false);
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <div className="brand-icon"><i className="fas fa-building-shield"></i></div>
          <h2>PermitZone AI</h2>
        </div>
        <div className="navbar-right">
          {featureKey === 'permits' && (
            <>
              <button className="btn-logout" style={{marginRight:8}} onClick={() => navigate('/kanban')}>
                <i className="fas fa-columns"></i> Kanban
              </button>
              <button className="btn-logout" style={{marginRight:8}} onClick={() => navigate('/fee-calculator')}>
                <i className="fas fa-calculator"></i> Fee Calc
              </button>
            </>
          )}
          <button className="btn-logout" style={{marginRight:8}} onClick={() => navigate('/ai-history')}>
            <i className="fas fa-history"></i> AI History
          </button>
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
              <h1><i className={`fas ${config.icon}`} style={{ color: config.color, marginRight: 12 }}></i>{config.title}</h1>
              <small style={{color:'#666'}}>{total} total records</small>
            </div>
          </div>
          <button className="btn-new" onClick={handleNew}>
            <i className="fas fa-plus"></i> New Item
          </button>
        </div>

        <div className="data-table-container">
          {loading ? (
            <div className="loading-table"><div className="ai-loading"><div className="spinner"></div> Loading data...</div></div>
          ) : data.length === 0 ? (
            <div className="empty-state">
              <i className={`fas ${config.icon}`}></i>
              <p>No records yet. Click "New Item" to add one.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  {config.columns.map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th>AI Analysis</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr key={item.id} onClick={() => handleRowClick(item)}>
                    <td>{(page - 1) * LIMIT + idx + 1}</td>
                    {config.columns.map(col => (
                      <td key={col.key}>
                        {col.format ? formatValue(item[col.key], col.format) : (item[col.key] || '-')}
                      </td>
                    ))}
                    <td>
                      {item.ai_analysis ? (
                        <span className="status-badge compliant" title="AI analysis available">
                          <i className="fas fa-robot"></i> Done
                        </span>
                      ) : (
                        <span style={{color:'#999',fontSize:'0.8rem'}}>Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination" style={{display:'flex',gap:8,justifyContent:'center',padding:'16px 0',alignItems:'center'}}>
            <button
              className="btn-action"
              onClick={() => { setPage(p => Math.max(1, p - 1)); fetchData(page - 1); }}
              disabled={page <= 1}
              style={{padding:'6px 14px'}}
            >
              <i className="fas fa-chevron-left"></i> Prev
            </button>
            <span style={{fontSize:'0.9rem',color:'#666'}}>Page {page} of {totalPages}</span>
            <button
              className="btn-action"
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); fetchData(page + 1); }}
              disabled={page >= totalPages}
              style={{padding:'6px 14px'}}
            >
              Next <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className={`fas ${config.icon}`} style={{ color: config.color, marginRight: 10 }}></i> Record Details</h2>
              <button className="modal-close" onClick={() => setShowDetail(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {config.detailFields.map(field => (
                  <div key={field.key} className={`detail-item ${field.fullWidth ? 'full-width' : ''}`}>
                    <label>{field.label}</label>
                    <div className="value">
                      {field.format ? formatValue(selectedItem[field.key], field.format) : (selectedItem[field.key] || '-')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Permit State Machine Buttons */}
              {isPermitsPage && (
                <div style={{margin:'16px 0', padding:'12px', background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0'}}>
                  <strong style={{display:'block',marginBottom:8,color:'#374151'}}>Permit Workflow</strong>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:'0.85rem',color:'#6b7280'}}>Current: <strong>{selectedItem.status}</strong></span>
                    {selectedItem.status !== 'submitted' && selectedItem.status !== 'approved' && selectedItem.status !== 'rejected' && (
                      <button className="btn-action" style={{background:'#3b82f6',color:'white',padding:'4px 12px',fontSize:'0.85rem'}}
                        onClick={() => handlePermitAction('submit')}>
                        <i className="fas fa-paper-plane"></i> Submit
                      </button>
                    )}
                    {user.role === 'admin' && selectedItem.status === 'submitted' && (
                      <>
                        <button className="btn-action" style={{background:'#22c55e',color:'white',padding:'4px 12px',fontSize:'0.85rem'}}
                          onClick={() => handlePermitAction('approve')}>
                          <i className="fas fa-check"></i> Approve
                        </button>
                        <button className="btn-action" style={{background:'#ef4444',color:'white',padding:'4px 12px',fontSize:'0.85rem'}}
                          onClick={() => handlePermitAction('reject')}>
                          <i className="fas fa-times"></i> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Saved AI Analysis */}
              {selectedItem.ai_analysis && !aiResult && (
                <div className="ai-result" style={{marginTop:16}}>
                  <div className="ai-result-header">
                    <i className="fas fa-robot"></i>
                    <h3>Saved AI Analysis</h3>
                  </div>
                  <div className="ai-result-body">
                    <ReactMarkdown>{selectedItem.ai_analysis}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Document Upload */}
              <div style={{margin:'16px 0', padding:'12px', background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0'}}>
                <strong style={{display:'block',marginBottom:8,color:'#374151'}}>Upload Document</strong>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.tiff,.bmp"
                    onChange={e => setUploadFile(e.target.files[0])}
                    style={{fontSize:'0.85rem'}} />
                  <button className="btn-action" style={{background:'#8b5cf6',color:'white',padding:'4px 12px',fontSize:'0.85rem'}}
                    onClick={handleUpload} disabled={!uploadFile || uploadLoading}>
                    {uploadLoading ? 'Uploading...' : <><i className="fas fa-upload"></i> Upload</>}
                  </button>
                </div>
                {uploadMsg && <p style={{marginTop:6,fontSize:'0.85rem',color: uploadMsg.includes('failed') || uploadMsg.includes('error') ? '#ef4444' : '#22c55e'}}>{uploadMsg}</p>}
              </div>

              {/* AI Review Panel (permits only) */}
              {isPermitsPage && (
                <div style={{margin:'16px 0', padding:'12px', background:'#f0f4ff', borderRadius:8, border:'1px solid #a5b4fc'}}>
                  <strong style={{display:'block',marginBottom:8,color:'#3730a3'}}>
                    <i className="fas fa-magnifying-glass" style={{marginRight:6}}></i>AI Detailed Review
                  </strong>
                  <p style={{fontSize:'0.82rem',color:'#4338ca',marginBottom:8}}>
                    Generates a comprehensive review with specific IBC/IRC code citations and all uploaded documents.
                  </p>
                  <button className="btn-action" style={{background:'#6366f1',color:'white',padding:'5px 14px',fontSize:'0.85rem'}}
                    onClick={handleAiReview} disabled={aiReviewLoading}>
                    {aiReviewLoading ? <><i className="fas fa-spinner fa-spin" style={{marginRight:6}}></i>Reviewing...</> : <><i className="fas fa-robot" style={{marginRight:6}}></i>Run AI Review</>}
                  </button>
                  {aiReviewResult && (
                    <div className="ai-result" style={{marginTop:10}}>
                      <div className="ai-result-header"><i className="fas fa-robot"></i><h3>AI Review Findings</h3>
                        {aiReviewResult.documents_reviewed !== undefined && <span style={{fontSize:'0.8rem',color:'#6b7280'}}>{aiReviewResult.documents_reviewed} docs reviewed</span>}
                      </div>
                      <div className="ai-result-body"><ReactMarkdown>{aiReviewResult.result || 'No result'}</ReactMarkdown></div>
                    </div>
                  )}
                </div>
              )}

              {/* Appeal Assistant (permits only, for rejected/denied) */}
              {isPermitsPage && (selectedItem?.status === 'rejected' || selectedItem?.status === 'Denied' || selectedItem?.status === 'Revisions Required') && (
                <div style={{margin:'16px 0', padding:'12px', background:'#fff7ed', borderRadius:8, border:'1px solid #fdba74'}}>
                  <strong style={{display:'block',marginBottom:8,color:'#9a3412'}}>
                    <i className="fas fa-gavel" style={{marginRight:6}}></i>Appeal Assistant
                  </strong>
                  <p style={{fontSize:'0.82rem',color:'#c2410c',marginBottom:8}}>
                    AI drafts appeal arguments with code references for this {selectedItem.status.toLowerCase()} permit.
                  </p>
                  <div style={{marginBottom:8}}>
                    <label style={{fontSize:'0.82rem',color:'#374151',display:'block',marginBottom:4}}>Additional context (optional)</label>
                    <textarea value={appealContext} onChange={e => setAppealContext(e.target.value)}
                      placeholder="Any additional facts that support the appeal..."
                      rows={2} style={{width:'100%',padding:'6px 8px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:'0.85rem'}} />
                  </div>
                  <button className="btn-action" style={{background:'#ea580c',color:'white',padding:'5px 14px',fontSize:'0.85rem'}}
                    onClick={handleAppeal} disabled={appealLoading}>
                    {appealLoading ? <><i className="fas fa-spinner fa-spin" style={{marginRight:6}}></i>Generating...</> : <><i className="fas fa-file-contract" style={{marginRight:6}}></i>Generate Appeal</>}
                  </button>
                  {appealResult && (
                    <div className="ai-result" style={{marginTop:10}}>
                      <div className="ai-result-header"><i className="fas fa-gavel"></i><h3>Appeal Arguments</h3></div>
                      <div className="ai-result-body"><ReactMarkdown>{appealResult.result || 'No result'}</ReactMarkdown></div>
                    </div>
                  )}
                </div>
              )}

              {/* Fresh AI Analysis Section */}
              {aiLoading && (
                <div className="ai-result">
                  <div className="ai-result-header">
                    <i className="fas fa-robot"></i>
                    <h3>AI Analysis</h3>
                  </div>
                  <div className="ai-loading">
                    <div className="spinner"></div>
                    Analyzing with AI... Please wait
                  </div>
                </div>
              )}

              {aiResult && (
                <div className="ai-result">
                  <div className="ai-result-header">
                    <i className="fas fa-robot"></i>
                    <h3>AI Analysis Result</h3>
                    {aiResult.model && <span className="ai-model">{aiResult.model}</span>}
                  </div>
                  <div className="ai-result-body">
                    <ReactMarkdown>{aiResult.result}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-action ai" onClick={handleAiAnalyze} disabled={aiLoading}>
                <i className="fas fa-robot"></i> AI Analyze
              </button>
              <button className="btn-action edit" onClick={handleEdit}>
                <i className="fas fa-edit"></i> Edit
              </button>
              <button className="btn-action delete" onClick={() => setShowDelete(true)}>
                <i className="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={() => setShowDelete(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="confirm-dialog">
                <p>Are you sure you want to delete this record? This action cannot be undone.</p>
                <div className="btn-row">
                  <button className="btn-action cancel" onClick={() => setShowDelete(false)}>Cancel</button>
                  <button className="btn-action delete" onClick={handleDelete}>
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit' : 'New'} {config.title.replace(/s$/, '')}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {config.fields
                  .filter(f => editMode || !f.editOnly)
                  .map(field => (
                    <div key={field.key} className={`form-group ${field.fullWidth ? 'full-width' : ''}`}>
                      <label>{field.label} {field.required && '*'}</label>
                      {field.type === 'select' ? (
                        <select
                          value={formData[field.key] || ''}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        >
                          <option value="">Select...</option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt === 'true' ? 'Yes' : opt === 'false' ? 'No' : opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.key] || ''}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.key] || ''}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-action cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-action save" onClick={handleSave}>
                <i className="fas fa-save"></i> {editMode ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeaturePage;
