// Custom Views routes - 4 endpoints
// VIZ: permit approval/denial chart + zoning conflict heatmap (zone x permit type)
// NON-VIZ: permit application PDF + zoning rules editor (CRUD setbacks/density)

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

let limiterFactory;
try { limiterFactory = require('express-rate-limit'); } catch (_) { limiterFactory = null; }

let writeLimiter = (req, res, next) => next();
if (limiterFactory) {
  try {
    const { ipKeyGenerator } = limiterFactory;
    writeLimiter = limiterFactory({
      windowMs: 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req, res) => {
        if (typeof ipKeyGenerator === 'function') return ipKeyGenerator(req, res);
        return req.ip;
      },
    });
  } catch (e) {
    console.warn('customViews rate limiter not initialized:', e.message);
  }
}

// Ensure zoning_rules table exists for CRUD editor
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS zoning_rules (
        id SERIAL PRIMARY KEY,
        zone_code VARCHAR(50) NOT NULL,
        rule_label VARCHAR(255) NOT NULL,
        front_setback_ft NUMERIC(8,2) DEFAULT 0,
        side_setback_ft NUMERIC(8,2) DEFAULT 0,
        rear_setback_ft NUMERIC(8,2) DEFAULT 0,
        max_density_units_per_acre NUMERIC(8,2) DEFAULT 0,
        max_height_ft NUMERIC(8,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    const cnt = await pool.query('SELECT COUNT(*)::int AS c FROM zoning_rules');
    if (cnt.rows[0].c === 0) {
      await pool.query(`
        INSERT INTO zoning_rules (zone_code, rule_label, front_setback_ft, side_setback_ft, rear_setback_ft, max_density_units_per_acre, max_height_ft, notes)
        VALUES
          ('R-1', 'Low Density Residential', 25, 10, 20, 4, 35, 'Single family detached'),
          ('R-2', 'Medium Density Residential', 20, 8, 18, 12, 40, 'Duplex / townhomes'),
          ('R-4', 'High Density Residential', 15, 6, 15, 40, 65, 'Multi-family apartments'),
          ('C-2', 'General Commercial', 10, 5, 10, 0, 55, 'Retail and offices'),
          ('M-1', 'Light Industrial', 20, 10, 15, 0, 50, 'Warehouse / light manufacturing')
      `);
    }
  } catch (e) {
    console.warn('zoning_rules ensure failed:', e.message);
  }
})();

// 1) VIZ: GET /approval-denial-chart - permit approval/denial chart
router.get('/approval-denial-chart', authenticateToken, async (req, res) => {
  try {
    const rows = await pool.query(`
      SELECT permit_type, status, COUNT(*)::int AS count
      FROM permit_applications
      GROUP BY permit_type, status
      ORDER BY permit_type
    `);
    const byType = {};
    for (const r of rows.rows) {
      if (!byType[r.permit_type]) byType[r.permit_type] = { permit_type: r.permit_type, approved: 0, denied: 0, pending: 0, under_review: 0, total: 0 };
      const s = (r.status || '').toLowerCase();
      if (s.includes('approved')) byType[r.permit_type].approved += r.count;
      else if (s.includes('denied') || s.includes('rejected')) byType[r.permit_type].denied += r.count;
      else if (s.includes('under')) byType[r.permit_type].under_review += r.count;
      else byType[r.permit_type].pending += r.count;
      byType[r.permit_type].total += r.count;
    }
    const series = Object.values(byType);
    const totals = series.reduce((acc, s) => {
      acc.approved += s.approved; acc.denied += s.denied; acc.pending += s.pending; acc.under_review += s.under_review;
      return acc;
    }, { approved: 0, denied: 0, pending: 0, under_review: 0 });
    res.json({ ok: true, series, totals, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('approval-denial-chart error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2) VIZ: GET /zoning-conflict-heatmap - zone x permit type heatmap
router.get('/zoning-conflict-heatmap', authenticateToken, async (req, res) => {
  try {
    // zones from zoning_checks; permit types from permit_applications
    const zonesRes = await pool.query(`SELECT DISTINCT zone_type FROM zoning_checks ORDER BY zone_type`);
    const typesRes = await pool.query(`SELECT DISTINCT permit_type FROM permit_applications ORDER BY permit_type`);
    const zones = zonesRes.rows.map(r => r.zone_type).filter(Boolean);
    const types = typesRes.rows.map(r => r.permit_type).filter(Boolean);

    // Conflict signal: zoning_checks rows with non-compliant / variance status, joined to permits by property_address starts-with
    const conflictsRes = await pool.query(`
      SELECT z.zone_type, p.permit_type, COUNT(*)::int AS conflicts
      FROM zoning_checks z
      JOIN permit_applications p ON position(z.property_address in p.property_address) = 1
      WHERE LOWER(z.status) LIKE '%non%' OR LOWER(z.status) LIKE '%variance%' OR LOWER(z.status) LIKE '%review%' OR LOWER(z.status) LIKE '%special%'
      GROUP BY z.zone_type, p.permit_type
    `);
    const map = {};
    for (const r of conflictsRes.rows) {
      const k = `${r.zone_type}||${r.permit_type}`;
      map[k] = r.conflicts;
    }
    const cells = [];
    let maxVal = 0;
    for (const z of zones) {
      for (const t of types) {
        const v = map[`${z}||${t}`] || 0;
        if (v > maxVal) maxVal = v;
        cells.push({ zone: z, permit_type: t, conflicts: v });
      }
    }
    res.json({ ok: true, zones, permit_types: types, cells, max: maxVal, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('zoning-conflict-heatmap error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3) NON-VIZ: GET /permit-application-pdf?id=N - returns printable HTML "PDF" body
router.get('/permit-application-pdf', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.query.id, 10);
    let permit = null;
    if (id) {
      const r = await pool.query('SELECT * FROM permit_applications WHERE id = $1', [id]);
      permit = r.rows[0] || null;
    }
    if (!permit) {
      const r = await pool.query('SELECT * FROM permit_applications ORDER BY id LIMIT 1');
      permit = r.rows[0] || null;
    }
    if (!permit) return res.status(404).json({ error: 'No permits found' });

    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Permit Application #${permit.id}</title>
<style>
body{font-family:Helvetica,Arial,sans-serif;color:#111;padding:32px;max-width:800px;margin:0 auto}
h1{border-bottom:3px solid #2563eb;padding-bottom:8px}
.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #ccc}
.label{font-weight:600;color:#555}
.sig{margin-top:48px;border-top:1px solid #000;padding-top:8px;font-size:12px}
.badge{display:inline-block;padding:4px 10px;border-radius:4px;background:#dbeafe;color:#1e40af;font-weight:600}
</style></head><body>
<h1>Building Permit Application</h1>
<div class="row"><span class="label">Application ID</span><span>#${permit.id}</span></div>
<div class="row"><span class="label">Project Name</span><span>${permit.project_name || ''}</span></div>
<div class="row"><span class="label">Applicant</span><span>${permit.applicant_name || ''}</span></div>
<div class="row"><span class="label">Property Address</span><span>${permit.property_address || ''}</span></div>
<div class="row"><span class="label">Permit Type</span><span>${permit.permit_type || ''}</span></div>
<div class="row"><span class="label">Square Footage</span><span>${permit.square_footage || 0} sq ft</span></div>
<div class="row"><span class="label">Estimated Cost</span><span>$${Number(permit.estimated_cost || 0).toLocaleString()}</span></div>
<div class="row"><span class="label">Status</span><span class="badge">${permit.status || ''}</span></div>
<div class="row"><span class="label">Description</span><span>${permit.description || ''}</span></div>
<div class="row"><span class="label">Submitted</span><span>${permit.created_at ? new Date(permit.created_at).toLocaleString() : ''}</span></div>
<div class="sig">Applicant signature: _________________________________ &nbsp;&nbsp; Date: ____________</div>
<div class="sig">Reviewer approval:&nbsp; _________________________________ &nbsp;&nbsp; Date: ____________</div>
</body></html>`;

    res.json({
      ok: true,
      permit_id: permit.id,
      filename: `permit_${permit.id}.pdf`,
      content_type: 'text/html',
      html,
      bytes: Buffer.byteLength(html, 'utf8'),
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('permit-application-pdf error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4) NON-VIZ: zoning rules editor - CRUD for setbacks/density
router.get('/zoning-rules', authenticateToken, async (req, res) => {
  try {
    const rows = await pool.query('SELECT * FROM zoning_rules ORDER BY zone_code');
    res.json({ ok: true, items: rows.rows, count: rows.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/zoning-rules', authenticateToken, writeLimiter, async (req, res) => {
  try {
    const b = req.body || {};
    const r = await pool.query(
      `INSERT INTO zoning_rules
       (zone_code, rule_label, front_setback_ft, side_setback_ft, rear_setback_ft, max_density_units_per_acre, max_height_ft, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [b.zone_code || 'X', b.rule_label || 'Untitled',
        b.front_setback_ft || 0, b.side_setback_ft || 0, b.rear_setback_ft || 0,
        b.max_density_units_per_acre || 0, b.max_height_ft || 0, b.notes || '']
    );
    res.json({ ok: true, item: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/zoning-rules/:id', authenticateToken, writeLimiter, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const b = req.body || {};
    const r = await pool.query(
      `UPDATE zoning_rules SET
         zone_code = COALESCE($2, zone_code),
         rule_label = COALESCE($3, rule_label),
         front_setback_ft = COALESCE($4, front_setback_ft),
         side_setback_ft = COALESCE($5, side_setback_ft),
         rear_setback_ft = COALESCE($6, rear_setback_ft),
         max_density_units_per_acre = COALESCE($7, max_density_units_per_acre),
         max_height_ft = COALESCE($8, max_height_ft),
         notes = COALESCE($9, notes),
         updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, b.zone_code, b.rule_label, b.front_setback_ft, b.side_setback_ft, b.rear_setback_ft, b.max_density_units_per_acre, b.max_height_ft, b.notes]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, item: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/zoning-rules/:id', authenticateToken, writeLimiter, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM zoning_rules WHERE id = $1', [id]);
    res.json({ ok: true, deleted: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
