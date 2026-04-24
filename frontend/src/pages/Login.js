import React, { useState } from 'react';
import API from '../api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  const fillCredentials = () => {
    setEmail('admin@permitzone.com');
    setPassword('password123');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="icon-circle">
            <i className="fas fa-building-shield"></i>
          </div>
          <h1>PermitZone AI</h1>
          <p>Permit & Zoning Compliance Platform</p>
        </div>

        {error && <div className="login-error"><i className="fas fa-exclamation-circle"></i> {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <button onClick={fillCredentials} className="btn-fill">
          <i className="fas fa-magic"></i> Auto-Fill Demo Credentials
        </button>
      </div>
    </div>
  );
}

export default Login;
