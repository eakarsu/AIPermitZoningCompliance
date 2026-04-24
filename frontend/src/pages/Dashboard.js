import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import featureConfig from '../featureConfig';

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const fetchCounts = async () => {
      const results = {};
      for (const [key, config] of Object.entries(featureConfig)) {
        try {
          const res = await API.get(config.endpoint);
          results[key] = res.data.length;
        } catch {
          results[key] = 0;
        }
      }
      setCounts(results);
    };
    fetchCounts();
  }, []);

  const totalRecords = Object.values(counts).reduce((sum, c) => sum + c, 0);
  const featureKeys = Object.keys(featureConfig);

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

      <div className="dashboard">
        <div className="dashboard-header">
          <h1>AI Permit & Zoning Compliance</h1>
          <p>Intelligent building permit management and zoning compliance platform</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon blue"><i className="fas fa-folder-open"></i></div>
            <div className="stat-info">
              <h3>{totalRecords}</h3>
              <p>Total Records</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><i className="fas fa-check-circle"></i></div>
            <div className="stat-info">
              <h3>{featureKeys.length}</h3>
              <p>Active Modules</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow"><i className="fas fa-robot"></i></div>
            <div className="stat-info">
              <h3>AI</h3>
              <p>Powered by OpenRouter</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><i className="fas fa-shield-halved"></i></div>
            <div className="stat-info">
              <h3>$500M</h3>
              <p>GovTech Market</p>
            </div>
          </div>
        </div>

        <div className="features-grid">
          {featureKeys.map(key => {
            const config = featureConfig[key];
            return (
              <div
                key={key}
                className="feature-card"
                style={{ '--card-color': config.color }}
                onClick={() => navigate(`/feature/${key}`)}
              >
                <div className="feature-card-header">
                  <div className="feature-icon" style={{ background: `${config.color}20`, color: config.color }}>
                    <i className={`fas ${config.icon}`}></i>
                  </div>
                  <h3>{config.title}</h3>
                </div>
                <p>{config.description}</p>
                <div className="feature-card-footer">
                  <span className="feature-count">{counts[key] || 0} records</span>
                  <span className="feature-arrow"><i className="fas fa-arrow-right"></i></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
