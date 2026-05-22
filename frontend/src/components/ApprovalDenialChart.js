import React, { useEffect, useState } from 'react';
import API from '../api';

export default function ApprovalDenialChart() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    API.get('/custom-views/approval-denial-chart')
      .then(r => setData(r.data))
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div style={{ color: '#f87171' }}>Error: {err}</div>;
  if (!data) return <div style={{ color: '#9ca3af' }}>Loading chart...</div>;

  const series = data.series || [];
  const maxTotal = Math.max(1, ...series.map(s => s.total));

  return (
    <div style={{ background: '#111827', padding: 16, borderRadius: 8, color: '#e5e7eb' }}>
      <h3 style={{ margin: '0 0 12px 0' }}>Permit Approval / Denial Chart</h3>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12 }}>
        <span style={{ color: '#10b981' }}>Approved: {data.totals.approved}</span>
        <span style={{ color: '#f59e0b' }}>Under Review: {data.totals.under_review}</span>
        <span style={{ color: '#3b82f6' }}>Pending: {data.totals.pending}</span>
        <span style={{ color: '#ef4444' }}>Denied: {data.totals.denied}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {series.map(s => {
          const wA = (s.approved / maxTotal) * 100;
          const wU = (s.under_review / maxTotal) * 100;
          const wP = (s.pending / maxTotal) * 100;
          const wD = (s.denied / maxTotal) * 100;
          return (
            <div key={s.permit_type} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 60px', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <div title={s.permit_type} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.permit_type}</div>
              <div style={{ display: 'flex', height: 18, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${wA}%`, background: '#10b981' }} title={`Approved: ${s.approved}`} />
                <div style={{ width: `${wU}%`, background: '#f59e0b' }} title={`Under Review: ${s.under_review}`} />
                <div style={{ width: `${wP}%`, background: '#3b82f6' }} title={`Pending: ${s.pending}`} />
                <div style={{ width: `${wD}%`, background: '#ef4444' }} title={`Denied: ${s.denied}`} />
              </div>
              <div style={{ textAlign: 'right' }}>{s.total}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
