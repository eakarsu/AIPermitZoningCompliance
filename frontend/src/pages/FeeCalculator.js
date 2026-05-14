import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import API from '../api';

const PERMIT_TYPES = [
  'Commercial New Build', 'Residential Multi-Family', 'Commercial Renovation',
  'Institutional', 'Healthcare Facility', 'Residential Townhouse', 'Mixed-Use',
  'Municipal', 'Assisted Living', 'Industrial', 'Hospitality', 'Utility',
  'Cultural/Recreation', 'Transportation', 'Food Processing', 'Recreation',
];

function FeeCalculator({ user, onLogout }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    permit_type: '',
    project_value: '',
    jurisdiction: '',
    square_footage: '',
    project_description: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!form.permit_type || !form.project_value) {
      setError('Permit type and project value are required.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await API.post('/ai/fee-estimate', form);
      setResult(res.data);
    } catch (err) {
      setError('Fee estimate failed: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  const feeJson = result?.result_json;

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
              <h1><i className="fas fa-calculator" style={{ color: '#10b981', marginRight: 12 }}></i>AI Fee Calculator</h1>
              <small style={{ color: '#666' }}>Estimate permit fees with AI</small>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 1000 }}>
          {/* Input Form */}
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24 }}>
            <h3 style={{ marginBottom: 18 }}>Project Information</h3>
            {error && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', marginBottom: 14, fontSize: '0.9rem' }}>{error}</div>}
            <form onSubmit={handleCalculate}>
              <div className="form-group">
                <label>Permit Type *</label>
                <select value={form.permit_type} onChange={e => setForm({ ...form, permit_type: e.target.value })} required>
                  <option value="">Select permit type...</option>
                  {PERMIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Project Value ($) *</label>
                <input type="number" value={form.project_value} onChange={e => setForm({ ...form, project_value: e.target.value })} placeholder="e.g., 500000" min="0" required />
              </div>
              <div className="form-group">
                <label>Jurisdiction</label>
                <input type="text" value={form.jurisdiction} onChange={e => setForm({ ...form, jurisdiction: e.target.value })} placeholder="e.g., City of Chicago, IL" />
              </div>
              <div className="form-group">
                <label>Square Footage</label>
                <input type="number" value={form.square_footage} onChange={e => setForm({ ...form, square_footage: e.target.value })} placeholder="e.g., 5000" min="0" />
              </div>
              <div className="form-group">
                <label>Project Description</label>
                <textarea value={form.project_description} onChange={e => setForm({ ...form, project_description: e.target.value })} placeholder="Brief description of the project..." rows={3} />
              </div>
              <button type="submit" className="btn-new" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>Calculating...</> : <><i className="fas fa-calculator" style={{ marginRight: 8 }}></i>Calculate Fees</>}
              </button>
            </form>
          </div>

          {/* Results */}
          <div>
            {loading && (
              <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
                <p style={{ color: '#6b7280' }}>Calculating permit fees...</p>
              </div>
            )}

            {result && !loading && (
              <div>
                {feeJson && (
                  <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
                    <h3 style={{ marginBottom: 14 }}>Fee Breakdown</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      {[
                        { label: 'Base Fee', value: feeJson.base_fee },
                        { label: 'Valuation Fee', value: feeJson.valuation_fee },
                        { label: 'Plan Review Fee', value: feeJson.plan_review_fee },
                        { label: 'Inspection Fee', value: feeJson.inspection_fee },
                        { label: 'Impact Fees', value: feeJson.impact_fees },
                      ].map(item => (
                        <div key={item.label} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 6 }}>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.label}</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827' }}>
                            ${item.value != null ? Number(item.value).toLocaleString() : '~'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {feeJson.other_fees && feeJson.other_fees.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <strong style={{ fontSize: '0.9rem' }}>Additional Fees:</strong>
                        {feeJson.other_fees.map((fee, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                            <span>{fee.name}</span>
                            <span style={{ fontWeight: 600 }}>${Number(fee.amount || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ padding: '14px 16px', background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#065f46' }}>Estimated Total</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#065f46' }}>
                          ${feeJson.total_estimated_fee != null ? Number(feeJson.total_estimated_fee).toLocaleString() : '~'}
                        </div>
                      </div>
                      <span className="status-badge" style={{
                        background: feeJson.fee_confidence === 'high' ? '#22c55e' : feeJson.fee_confidence === 'medium' ? '#f59e0b' : '#94a3b8',
                        color: 'white', fontSize: '0.8rem'
                      }}>
                        {feeJson.fee_confidence || 'medium'} confidence
                      </span>
                    </div>

                    {feeJson.notes && (
                      <div style={{ marginTop: 10, fontSize: '0.82rem', color: '#6b7280', padding: '8px 12px', background: '#fafafa', borderRadius: 6 }}>
                        <i className="fas fa-info-circle" style={{ marginRight: 6 }}></i>{feeJson.notes}
                      </div>
                    )}
                  </div>
                )}

                <div className="ai-result">
                  <div className="ai-result-header">
                    <i className="fas fa-robot"></i>
                    <h3>Fee Analysis</h3>
                    {result.model && <span className="ai-model">{result.model}</span>}
                  </div>
                  <div className="ai-result-body">
                    <ReactMarkdown>{result.result}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {!result && !loading && (
              <div style={{ background: '#f8fafc', borderRadius: 10, border: '2px dashed #e2e8f0', padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                <i className="fas fa-calculator" style={{ fontSize: '2.5rem', marginBottom: 12, display: 'block' }}></i>
                <p>Fill in the project details and click "Calculate Fees" to get an AI-powered fee estimate.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeeCalculator;
