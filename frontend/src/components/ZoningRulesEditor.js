import React, { useEffect, useState } from 'react';
import API from '../api';

const EMPTY = {
  zone_code: '',
  rule_label: '',
  front_setback_ft: 0,
  side_setback_ft: 0,
  rear_setback_ft: 0,
  max_density_units_per_acre: 0,
  max_height_ft: 0,
  notes: '',
};

export default function ZoningRulesEditor() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await API.get('/custom-views/zoning-rules');
      setItems(r.data.items || []);
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const reset = () => { setForm(EMPTY); setEditingId(null); };

  const save = async () => {
    try {
      if (editingId) {
        await API.put(`/custom-views/zoning-rules/${editingId}`, form);
      } else {
        await API.post('/custom-views/zoning-rules', form);
      }
      reset();
      await load();
    } catch (e) { setErr(e.message); }
  };

  const edit = (it) => {
    setEditingId(it.id);
    setForm({
      zone_code: it.zone_code || '',
      rule_label: it.rule_label || '',
      front_setback_ft: it.front_setback_ft || 0,
      side_setback_ft: it.side_setback_ft || 0,
      rear_setback_ft: it.rear_setback_ft || 0,
      max_density_units_per_acre: it.max_density_units_per_acre || 0,
      max_height_ft: it.max_height_ft || 0,
      notes: it.notes || '',
    });
  };

  const del = async (id) => {
    try { await API.delete(`/custom-views/zoning-rules/${id}`); await load(); }
    catch (e) { setErr(e.message); }
  };

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={{ background: '#111827', padding: 16, borderRadius: 8, color: '#e5e7eb' }}>
      <h3 style={{ margin: '0 0 12px 0' }}>Zoning Rules Editor (Setbacks / Density)</h3>
      {err && <div style={{ color: '#f87171', marginBottom: 8 }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
        <input placeholder="Zone code" value={form.zone_code} onChange={upd('zone_code')} style={inputStyle} />
        <input placeholder="Label" value={form.rule_label} onChange={upd('rule_label')} style={inputStyle} />
        <input type="number" placeholder="Front setback (ft)" value={form.front_setback_ft} onChange={upd('front_setback_ft')} style={inputStyle} />
        <input type="number" placeholder="Side setback (ft)" value={form.side_setback_ft} onChange={upd('side_setback_ft')} style={inputStyle} />
        <input type="number" placeholder="Rear setback (ft)" value={form.rear_setback_ft} onChange={upd('rear_setback_ft')} style={inputStyle} />
        <input type="number" placeholder="Max density u/ac" value={form.max_density_units_per_acre} onChange={upd('max_density_units_per_acre')} style={inputStyle} />
        <input type="number" placeholder="Max height (ft)" value={form.max_height_ft} onChange={upd('max_height_ft')} style={inputStyle} />
        <input placeholder="Notes" value={form.notes} onChange={upd('notes')} style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={save} style={btn('#2563eb')}>{editingId ? 'Update Rule' : 'Add Rule'}</button>
        {editingId && <button onClick={reset} style={btn('#6b7280')}>Cancel</button>}
        <button onClick={load} style={btn('#10b981')}>Refresh</button>
      </div>

      {loading ? <div style={{ color: '#9ca3af' }}>Loading...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#1f2937' }}>
                <th style={th}>Zone</th><th style={th}>Label</th><th style={th}>Front</th><th style={th}>Side</th><th style={th}>Rear</th><th style={th}>Density</th><th style={th}>Height</th><th style={th}>Notes</th><th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={td}>{it.zone_code}</td>
                  <td style={td}>{it.rule_label}</td>
                  <td style={td}>{it.front_setback_ft}</td>
                  <td style={td}>{it.side_setback_ft}</td>
                  <td style={td}>{it.rear_setback_ft}</td>
                  <td style={td}>{it.max_density_units_per_acre}</td>
                  <td style={td}>{it.max_height_ft}</td>
                  <td style={td}>{it.notes}</td>
                  <td style={td}>
                    <button onClick={() => edit(it)} style={smallBtn('#3b82f6')}>Edit</button>
                    <button onClick={() => del(it.id)} style={smallBtn('#ef4444')}>Delete</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="9" style={{ ...td, color: '#6b7280' }}>No rules yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: 8, background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 4, fontSize: 12 };
const th = { textAlign: 'left', padding: 8, color: '#9ca3af', fontWeight: 600 };
const td = { padding: 8 };
const btn = (color) => ({ padding: '8px 14px', background: color, color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 });
const smallBtn = (color) => ({ padding: '4px 8px', marginRight: 4, background: color, color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: 11 });
