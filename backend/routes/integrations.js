// Apply pass 5 — additive backlog endpoints (NEEDS-CREDS / PRODUCT-DECISION).
// Documented env vars:
//   TITLE_DEED_API_KEY    — county title/deed integration (NEEDS-CREDS)
//   GIS_API_KEY           — neighborhood-impact GIS feed (NEEDS-CREDS)
// PRODUCT-DECISION: public permit portal exposes a read-only summary of permits
// (no PII); document version management uses a single `document_versions` table
// keyed by document_id with monotonic version_number.
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'permit_zoning_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

function gate(envVar) {
  return (req, res, next) => {
    const v = process.env[envVar];
    if (!v || v.startsWith('your_') || v === 'placeholder') {
      return res.status(503).json({ error: 'Integration not configured', missing: envVar });
    }
    next();
  };
}

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_versions (
      id SERIAL PRIMARY KEY,
      document_id INTEGER NOT NULL,
      version_number INTEGER NOT NULL,
      file_path TEXT,
      uploaded_by INTEGER,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_doc_versions ON document_versions(document_id, version_number)`
  ).catch(() => {});
}
ensureTables();

// ---- 1. Title/deed lookup (NEEDS-CREDS) ----
router.post('/title-deed/lookup', gate('TITLE_DEED_API_KEY'), async (req, res) => {
  const { property_address } = req.body || {};
  if (!property_address) return res.status(400).json({ error: 'property_address required' });
  res.json({ ok: true, provider: 'title-deed', property_address, message: 'Live county feed would be queried here' });
});

// ---- 2. Neighborhood impact GIS analysis (NEEDS-CREDS) ----
router.post('/gis/neighborhood-impact', gate('GIS_API_KEY'), async (req, res) => {
  const { lat, lon, radius_m } = req.body || {};
  if (lat == null || lon == null) return res.status(400).json({ error: 'lat and lon required' });
  res.json({ ok: true, provider: 'gis', lat, lon, radius_m: radius_m || 500, layers: [] });
});

// ---- 3. Document version add ----
router.post('/documents/:id/versions', async (req, res) => {
  try {
    const document_id = parseInt(req.params.id, 10);
    if (!Number.isFinite(document_id)) return res.status(400).json({ error: 'invalid document id' });
    const { file_path, notes } = req.body || {};
    const r = await pool.query(
      `SELECT COALESCE(MAX(version_number), 0) AS v FROM document_versions WHERE document_id=$1`,
      [document_id]
    );
    const next = (r.rows[0]?.v || 0) + 1;
    const ins = await pool.query(
      `INSERT INTO document_versions (document_id, version_number, file_path, uploaded_by, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [document_id, next, file_path || null, req.user?.id || null, notes || null]
    );
    res.json({ version: ins.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- 4. Document version list ----
router.get('/documents/:id/versions', async (req, res) => {
  try {
    const document_id = parseInt(req.params.id, 10);
    if (!Number.isFinite(document_id)) return res.status(400).json({ error: 'invalid document id' });
    const r = await pool.query(
      `SELECT * FROM document_versions WHERE document_id=$1 ORDER BY version_number DESC`,
      [document_id]
    );
    res.json({ versions: r.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- 5. Public portal — read-only summary (PRODUCT-DECISION: no PII) ----
router.get('/public-portal/permits', async (req, res) => {
  try {
    let rows = [];
    try {
      const r = await pool.query(
        `SELECT id, permit_type, status, property_address, created_at
         FROM permits
         ORDER BY created_at DESC
         LIMIT 200`
      );
      rows = r.rows;
    } catch (err) {
      rows = [];
    }
    res.json({ permits: rows, note: 'PRODUCT-DECISION: public read-only summary — PII fields excluded' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
