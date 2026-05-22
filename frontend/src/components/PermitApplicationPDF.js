import React, { useEffect, useState } from 'react';
import API from '../api';

export default function PermitApplicationPDF() {
  const [permitId, setPermitId] = useState('');
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const fetchPdf = async (id) => {
    setLoading(true); setErr(null);
    try {
      const r = await API.get('/custom-views/permit-application-pdf' + (id ? `?id=${id}` : ''));
      setDoc(r.data);
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPdf(); }, []);

  const handleDownload = () => {
    if (!doc?.html) return;
    const blob = new Blob([doc.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = (doc.filename || 'permit.pdf').replace(/\.pdf$/, '.html');
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: '#111827', padding: 16, borderRadius: 8, color: '#e5e7eb' }}>
      <h3 style={{ margin: '0 0 12px 0' }}>Permit Application PDF</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="number"
          placeholder="Permit ID (optional)"
          value={permitId}
          onChange={e => setPermitId(e.target.value)}
          style={{ padding: 8, background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 4 }}
        />
        <button onClick={() => fetchPdf(permitId)} disabled={loading} style={{ padding: '8px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {loading ? 'Loading...' : 'Generate PDF'}
        </button>
        <button onClick={handleDownload} disabled={!doc} style={{ padding: '8px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Download
        </button>
      </div>
      {err && <div style={{ color: '#f87171' }}>Error: {err}</div>}
      {doc && (
        <div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
            File: <code>{doc.filename}</code> &middot; {doc.bytes} bytes &middot; Permit #{doc.permit_id}
          </div>
          <iframe
            title="permit-preview"
            srcDoc={doc.html}
            style={{ width: '100%', height: 480, background: 'white', border: '1px solid #374151', borderRadius: 4 }}
          />
        </div>
      )}
    </div>
  );
}
