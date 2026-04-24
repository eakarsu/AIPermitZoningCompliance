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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(config.endpoint);
      setData(res.data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  }, [config.endpoint]);

  useEffect(() => {
    if (config) fetchData();
  }, [config, fetchData]);

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
      fetchData();
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`${config.endpoint}/${selectedItem.id}`);
      setShowDelete(false);
      setShowDetail(false);
      fetchData();
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
    } catch (err) {
      setAiResult({ success: false, result: 'AI analysis failed: ' + (err.response?.data?.error || err.message) });
    }
    setAiLoading(false);
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
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr key={item.id} onClick={() => handleRowClick(item)}>
                    <td>{idx + 1}</td>
                    {config.columns.map(col => (
                      <td key={col.key}>
                        {col.format ? formatValue(item[col.key], col.format) : (item[col.key] || '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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

              {/* AI Analysis Section */}
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
