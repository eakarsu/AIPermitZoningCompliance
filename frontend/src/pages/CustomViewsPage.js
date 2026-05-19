import React from 'react';
import { useNavigate } from 'react-router-dom';
import ApprovalDenialChart from '../components/ApprovalDenialChart';
import ZoningConflictHeatmap from '../components/ZoningConflictHeatmap';
import PermitApplicationPDF from '../components/PermitApplicationPDF';
import ZoningRulesEditor from '../components/ZoningRulesEditor';

export default function CustomViewsPage({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <div className="brand-icon"><i className="fas fa-building-shield"></i></div>
          <h2>PermitZone AI</h2>
        </div>
        <div className="navbar-right">
          {user && <span className="navbar-user">Welcome, <strong>{user.name}</strong></span>}
          <button className="btn-logout" style={{ marginRight: 8 }} onClick={() => navigate('/')}>
            <i className="fas fa-home"></i> Dashboard
          </button>
          {onLogout && (
            <button className="btn-logout" onClick={onLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          )}
        </div>
      </nav>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* Sidebar: Zoning Views */}
        <aside style={{ width: 220, background: '#0f172a', color: '#e5e7eb', padding: 16, borderRight: '1px solid #1f2937' }}>
          <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: '#9ca3af', marginTop: 0 }}>Zoning Views</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13 }}>
            <li style={navItem}><a href="#approval-denial-chart" style={navLink}><i className="fas fa-chart-bar" style={icon}></i> Approval / Denial</a></li>
            <li style={navItem}><a href="#zoning-conflict-heatmap" style={navLink}><i className="fas fa-th" style={icon}></i> Conflict Heatmap</a></li>
            <li style={navItem}><a href="#permit-application-pdf" style={navLink}><i className="fas fa-file-pdf" style={icon}></i> Permit PDF</a></li>
            <li style={navItem}><a href="#zoning-rules-editor" style={navLink}><i className="fas fa-edit" style={icon}></i> Rules Editor</a></li>
          </ul>
        </aside>

        <main style={{ flex: 1, padding: 24, background: '#0b1220' }}>
          <h1 style={{ color: '#e5e7eb', marginTop: 0 }}>Custom Views</h1>
          <p style={{ color: '#9ca3af' }}>Permit and zoning compliance dashboards & tools.</p>

          <div id="approval-denial-chart" style={{ marginBottom: 24 }}><ApprovalDenialChart /></div>
          <div id="zoning-conflict-heatmap" style={{ marginBottom: 24 }}><ZoningConflictHeatmap /></div>
          <div id="permit-application-pdf" style={{ marginBottom: 24 }}><PermitApplicationPDF /></div>
          <div id="zoning-rules-editor" style={{ marginBottom: 24 }}><ZoningRulesEditor /></div>
        </main>
      </div>
    </div>
  );
}

const navItem = { marginBottom: 8 };
const navLink = { color: '#e5e7eb', textDecoration: 'none', display: 'block', padding: '8px 10px', borderRadius: 4, background: '#1f2937' };
const icon = { marginRight: 8, color: '#3b82f6' };
