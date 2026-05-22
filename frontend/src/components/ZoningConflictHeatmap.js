import React, { useEffect, useState } from 'react';
import API from '../api';

export default function ZoningConflictHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    API.get('/custom-views/zoning-conflict-heatmap')
      .then(r => setData(r.data))
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div style={{ color: '#f87171' }}>Error: {err}</div>;
  if (!data) return <div style={{ color: '#9ca3af' }}>Loading heatmap...</div>;

  const { zones = [], permit_types = [], cells = [], max = 0 } = data;

  const colorFor = (v) => {
    if (!v) return '#1f2937';
    const t = max ? v / max : 0;
    const r = Math.round(80 + t * 175);
    const g = Math.round(60 + (1 - t) * 100);
    const b = 60;
    return `rgb(${r},${g},${b})`;
  };

  const cellMap = {};
  cells.forEach(c => { cellMap[`${c.zone}||${c.permit_type}`] = c.conflicts; });

  return (
    <div style={{ background: '#111827', padding: 16, borderRadius: 8, color: '#e5e7eb' }}>
      <h3 style={{ margin: '0 0 12px 0' }}>Zoning Conflict Heatmap (Zone x Permit Type)</h3>
      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 0 }}>Darker red = more conflicts (non-compliant / variance / special use). Max cell value: {max}</p>
      <div style={{ overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ padding: 6, textAlign: 'left', position: 'sticky', left: 0, background: '#111827' }}>Zone \\ Permit Type</th>
              {permit_types.map(t => (
                <th key={t} style={{ padding: 6, color: '#9ca3af', writingMode: 'vertical-rl', transform: 'rotate(180deg)', minWidth: 28 }}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zones.map(z => (
              <tr key={z}>
                <td style={{ padding: 6, fontWeight: 600, position: 'sticky', left: 0, background: '#111827', color: '#e5e7eb' }}>{z}</td>
                {permit_types.map(t => {
                  const v = cellMap[`${z}||${t}`] || 0;
                  return (
                    <td key={t} title={`${z} x ${t}: ${v} conflicts`} style={{ padding: 0, width: 28, height: 28, background: colorFor(v), color: v ? '#fff' : '#4b5563', textAlign: 'center', border: '1px solid #0b1220' }}>
                      {v || ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
