import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const TOOLS = [
  { id: 'classify', label: 'Auto Classify Permit', endpoint: '/ai/auto-classify-permit' },
  { id: 'inspection', label: 'Inspection Schedule Optimize', endpoint: '/ai/inspection-schedule-optimize' },
  { id: 'code', label: 'Code Interpretation Assistant', endpoint: '/ai/code-interpretation-assistant' },
  { id: 'severity', label: 'Violation Severity Score', endpoint: '/ai/violation-severity-score' },
];

export default function AIPredictive({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState('classify');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [classify, setClassify] = useState({
    project_description: '',
    address: '',
    estimated_value: '',
    documents_summary: '',
  });
  const [inspection, setInspection] = useState({
    period_start: '',
    period_end: '',
    pending_inspections: '',
    inspector_capacity: '',
    travel_zones: '',
  });
  const [code, setCode] = useState({
    code_section: '',
    question: '',
    project_context: '',
    jurisdiction: '',
  });
  const [severity, setSeverity] = useState({
    violation_id: '',
    violation_type: '',
    code_section: '',
    description: '',
    property_address: '',
    prior_violations: '',
  });

  const parseJsonOrText = (s) => {
    if (!s || !s.trim()) return undefined;
    try { return JSON.parse(s); } catch { return s; }
  };

  const run = async () => {
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const tool = TOOLS.find(t => t.id === activeTool);
      let body;
      if (activeTool === 'classify') {
        body = {
          project_description: classify.project_description,
          address: classify.address,
          estimated_value: classify.estimated_value ? parseFloat(classify.estimated_value) : undefined,
          documents_summary: classify.documents_summary,
        };
      } else if (activeTool === 'inspection') {
        body = {
          period_start: inspection.period_start,
          period_end: inspection.period_end,
          pending_inspections: parseJsonOrText(inspection.pending_inspections),
          inspector_capacity: inspection.inspector_capacity ? parseInt(inspection.inspector_capacity, 10) : undefined,
          travel_zones: inspection.travel_zones,
        };
      } else if (activeTool === 'code') {
        body = {
          code_section: code.code_section,
          question: code.question,
          project_context: code.project_context,
          jurisdiction: code.jurisdiction,
        };
      } else {
        body = {
          violation_id: severity.violation_id ? parseInt(severity.violation_id, 10) : undefined,
          violation_type: severity.violation_type || undefined,
          code_section: severity.code_section || undefined,
          description: severity.description || undefined,
          property_address: severity.property_address || undefined,
          prior_violations: severity.prior_violations || undefined,
        };
      }
      const res = await API.post(tool.endpoint, body);
      setResult(res.data);
    } catch (err) {
      if (err.response?.status === 503) {
        setError(err.response?.data?.error || 'AI not configured (503). Set OPENROUTER_API_KEY in backend .env.');
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || err.message || 'AI request failed');
      }
    } finally {
      setLoading(false);
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
          <button className="btn-logout" style={{ marginRight: 8 }} onClick={() => navigate('/')}>
            <i className="fas fa-home"></i> Home
          </button>
          <button className="btn-logout" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </nav>

      <div className="dashboard">
        <div className="dashboard-header">
          <h1><i className="fas fa-brain"></i> AI Predictive Tools</h1>
          <p>Auto-classify permits, optimize inspection schedules, and interpret code sections</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTool(t.id); setResult(null); setError(''); }}
              className={activeTool === t.id ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '10px 16px', borderRadius: 6, border: 'none', cursor: 'pointer' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {activeTool === 'classify' && (
            <>
              <h3>Auto Classify Permit</h3>
              <div className="form-group">
                <label>Project Description *</label>
                <textarea rows={4} value={classify.project_description} onChange={(e) => setClassify({ ...classify, project_description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input value={classify.address} onChange={(e) => setClassify({ ...classify, address: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Estimated Value ($)</label>
                <input type="number" value={classify.estimated_value} onChange={(e) => setClassify({ ...classify, estimated_value: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Documents Summary</label>
                <textarea rows={3} value={classify.documents_summary} onChange={(e) => setClassify({ ...classify, documents_summary: e.target.value })} />
              </div>
            </>
          )}

          {activeTool === 'inspection' && (
            <>
              <h3>Inspection Schedule Optimize</h3>
              <div className="form-group">
                <label>Period Start</label>
                <input type="date" value={inspection.period_start} onChange={(e) => setInspection({ ...inspection, period_start: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Period End</label>
                <input type="date" value={inspection.period_end} onChange={(e) => setInspection({ ...inspection, period_end: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Pending Inspections (JSON)</label>
                <textarea rows={4} value={inspection.pending_inspections} onChange={(e) => setInspection({ ...inspection, pending_inspections: e.target.value })} placeholder='[{"id":1,"address":"123 Main","type":"final"}]' />
              </div>
              <div className="form-group">
                <label>Inspector Capacity (per day)</label>
                <input type="number" value={inspection.inspector_capacity} onChange={(e) => setInspection({ ...inspection, inspector_capacity: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Travel Zones</label>
                <textarea rows={2} value={inspection.travel_zones} onChange={(e) => setInspection({ ...inspection, travel_zones: e.target.value })} />
              </div>
            </>
          )}

          {activeTool === 'code' && (
            <>
              <h3>Code Interpretation Assistant</h3>
              <div className="form-group">
                <label>Code Section</label>
                <input value={code.code_section} onChange={(e) => setCode({ ...code, code_section: e.target.value })} placeholder="e.g., IBC 305.2" />
              </div>
              <div className="form-group">
                <label>Question *</label>
                <textarea rows={3} value={code.question} onChange={(e) => setCode({ ...code, question: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Project Context</label>
                <textarea rows={3} value={code.project_context} onChange={(e) => setCode({ ...code, project_context: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Jurisdiction</label>
                <input value={code.jurisdiction} onChange={(e) => setCode({ ...code, jurisdiction: e.target.value })} />
              </div>
            </>
          )}

          {activeTool === 'severity' && (
            <>
              <h3>Violation Severity Score</h3>
              <p style={{ color: '#64748b', fontSize: 13 }}>
                Provide a violation_id to load from <code>code_violations</code>, or fill the fields manually.
              </p>
              <div className="form-group">
                <label>Violation ID (optional)</label>
                <input type="number" value={severity.violation_id} onChange={(e) => setSeverity({ ...severity, violation_id: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Violation Type</label>
                <input value={severity.violation_type} onChange={(e) => setSeverity({ ...severity, violation_type: e.target.value })} placeholder="e.g., unpermitted construction" />
              </div>
              <div className="form-group">
                <label>Code Section</label>
                <input value={severity.code_section} onChange={(e) => setSeverity({ ...severity, code_section: e.target.value })} placeholder="e.g., IBC 105.1" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={severity.description} onChange={(e) => setSeverity({ ...severity, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Property Address</label>
                <input value={severity.property_address} onChange={(e) => setSeverity({ ...severity, property_address: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Prior Violations (free text)</label>
                <textarea rows={2} value={severity.prior_violations} onChange={(e) => setSeverity({ ...severity, prior_violations: e.target.value })} placeholder="e.g., 2 prior unpermitted-work violations in 2023" />
              </div>
            </>
          )}

          <button
            onClick={run}
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: 16, padding: '10px 24px', borderRadius: 6, border: 'none', cursor: 'pointer' }}
          >
            {loading ? 'Running...' : 'Run AI'}
          </button>

          {error && <div style={{ color: '#dc2626', marginTop: 12 }}>{error}</div>}
        </div>

        {result && (
          <div style={{ marginTop: 16, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3>Result</h3>
            <pre style={{ background: '#f9fafb', padding: 16, borderRadius: 6, overflow: 'auto', maxHeight: 500, fontSize: 13 }}>
              {JSON.stringify(result.result || result.data || result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
