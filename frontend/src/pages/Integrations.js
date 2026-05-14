import React, { useState } from 'react';
import API from '../api';

// Apply pass 5 — surfaces NEEDS-CREDS / PRODUCT-DECISION integration stubs.
// Each call returns 503 + missing env var when credentials are not configured.

function Card({ title, children }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

export default function Integrations({ user, onLogout }) {
  const [results, setResults] = useState({});
  const [docId, setDocId] = useState('1');
  const [filePath, setFilePath] = useState('');
  const [notes, setNotes] = useState('');
  const [addr, setAddr] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');

  const probe = async (key, fn) => {
    try {
      const r = await fn();
      setResults((s) => ({ ...s, [key]: { status: r.status, data: r.data } }));
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data || { error: err.message };
      setResults((s) => ({ ...s, [key]: { status, data } }));
    }
  };

  const Result = ({ k }) => {
    const r = results[k];
    if (!r) return null;
    const isMissing = r.status === 503 && r.data?.missing;
    return isMissing ? (
      <div style={{ background: '#fff8e1', padding: 8, borderRadius: 4, marginTop: 8 }}>
        Not configured: set <code>{r.data.missing}</code>
      </div>
    ) : (
      <pre style={{ background: '#f7f7f7', padding: 8, borderRadius: 4, fontSize: 12, marginTop: 8 }}>
        {JSON.stringify(r.data, null, 2)}
      </pre>
    );
  };

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Integrations</h2>
        <button onClick={onLogout}>Logout</button>
      </div>
      <p style={{ color: '#666' }}>
        County and GIS partner integrations + document version management + public portal preview.
      </p>

      <Card title="Title / deed lookup (NEEDS-CREDS: TITLE_DEED_API_KEY)">
        <input
          placeholder="Property address"
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={() => probe('td', () => API.post('/integrations/title-deed/lookup', { property_address: addr }))}>
          Lookup
        </button>
        <Result k="td" />
      </Card>

      <Card title="Neighborhood impact GIS (NEEDS-CREDS: GIS_API_KEY)">
        <input placeholder="lat" value={lat} onChange={(e) => setLat(e.target.value)} style={{ marginRight: 8, width: 100 }} />
        <input placeholder="lon" value={lon} onChange={(e) => setLon(e.target.value)} style={{ marginRight: 8, width: 100 }} />
        <button
          onClick={() =>
            probe('gis', () => API.post('/integrations/gis/neighborhood-impact', { lat: Number(lat), lon: Number(lon) }))
          }
        >
          Probe
        </button>
        <Result k="gis" />
      </Card>

      <Card title="Document versions">
        <div style={{ marginBottom: 8 }}>
          <input placeholder="doc id" value={docId} onChange={(e) => setDocId(e.target.value)} style={{ width: 80, marginRight: 8 }} />
          <input
            placeholder="file path"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            style={{ marginRight: 8 }}
          />
          <input placeholder="notes" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ marginRight: 8 }} />
          <button
            onClick={() =>
              probe('docAdd', () =>
                API.post(`/integrations/documents/${docId}/versions`, { file_path: filePath, notes })
              )
            }
          >
            Add version
          </button>
          <button
            onClick={() => probe('docList', () => API.get(`/integrations/documents/${docId}/versions`))}
            style={{ marginLeft: 8 }}
          >
            List
          </button>
        </div>
        <Result k="docAdd" />
        <Result k="docList" />
      </Card>

      <Card title="Public permit portal (PRODUCT-DECISION: read-only, no PII)">
        <button onClick={() => probe('portal', () => API.get('/integrations/public-portal/permits'))}>Refresh</button>
        <Result k="portal" />
      </Card>
    </div>
  );
}
