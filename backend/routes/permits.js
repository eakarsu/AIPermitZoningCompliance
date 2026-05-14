const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const { requireAdmin } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { permitValidation } = require('../middleware/validate');
const router = express.Router();

// Get all permits with pagination
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM permit_applications');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM permit_applications ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /kanban/board - MUST be before /:id to avoid route conflict
router.get('/kanban/board', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT status, json_agg(
        json_build_object('id', id, 'project_name', project_name, 'applicant_name', applicant_name,
          'property_address', property_address, 'permit_type', permit_type,
          'estimated_cost', estimated_cost, 'created_at', created_at, 'updated_at', updated_at)
        ORDER BY created_at DESC
      ) as permits
      FROM permit_applications GROUP BY status ORDER BY status
    `);
    const board = {};
    result.rows.forEach(row => { board[row.status] = row.permits || []; });
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single permit
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM permit_applications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create permit
router.post('/', permitValidation, async (req, res) => {
  try {
    const { project_name, applicant_name, property_address, permit_type, description, estimated_cost, square_footage } = req.body;
    if (!project_name || !applicant_name || !property_address) {
      return res.status(400).json({ error: 'project_name, applicant_name, and property_address are required' });
    }
    const result = await pool.query(
      `INSERT INTO permit_applications (project_name, applicant_name, property_address, permit_type, description, estimated_cost, square_footage, status, status_history)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending Review', '[]'::jsonb) RETURNING *`,
      [project_name, applicant_name, property_address, permit_type, description, estimated_cost, square_footage]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update permit
router.put('/:id', async (req, res) => {
  try {
    const { project_name, applicant_name, property_address, permit_type, description, estimated_cost, square_footage, status } = req.body;
    const result = await pool.query(
      `UPDATE permit_applications SET project_name=$1, applicant_name=$2, property_address=$3, permit_type=$4, description=$5, estimated_cost=$6, square_footage=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [project_name, applicant_name, property_address, permit_type, description, estimated_cost, square_footage, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete permit
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM permit_applications WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Analysis with persistence and rate limiting
router.post('/:id/analyze', aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM permit_applications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const permit = result.rows[0];

    const structuredPrompt = `You are an expert building permit reviewer. Analyze the permit application and respond with a JSON object in this exact format:
{
  "compliance_status": "compliant|non_compliant|conditional",
  "risk_level": "low|medium|high|critical",
  "issues": [{"code_section": "...", "description": "...", "severity": "low|medium|high|critical"}],
  "recommendations": ["..."],
  "estimated_resolution_days": 0,
  "summary": "..."
}
After the JSON, also provide a human-readable analysis with sections: 1) Completeness Assessment, 2) Potential Issues, 3) Required Documentation, 4) Estimated Review Timeline, 5) Compliance Recommendations.`;

    const aiResult = await callOpenRouter(
      structuredPrompt,
      `Permit Application Details:\n- Project: ${permit.project_name}\n- Applicant: ${permit.applicant_name}\n- Address: ${permit.property_address}\n- Type: ${permit.permit_type}\n- Description: ${permit.description}\n- Estimated Cost: $${permit.estimated_cost}\n- Square Footage: ${permit.square_footage}`
    );

    await pool.query('UPDATE permit_applications SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [aiResult.result, permit.id]);
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, '/api/permits/:id/analyze', 'permit_applications', permit.id, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Permit state machine: Submit
router.post('/:id/submit', async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM permit_applications WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const permit = existing.rows[0];
    const history = Array.isArray(permit.status_history) ? permit.status_history : [];
    history.push({ from: permit.status, to: 'submitted', timestamp: new Date().toISOString(), user_id: req.user.id });

    const result = await pool.query(
      `UPDATE permit_applications SET status = 'submitted', submitted_at = NOW(), status_history = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [JSON.stringify(history), req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Permit state machine: Approve (admin only)
router.post('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM permit_applications WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const permit = existing.rows[0];
    const history = Array.isArray(permit.status_history) ? permit.status_history : [];
    history.push({ from: permit.status, to: 'approved', timestamp: new Date().toISOString(), user_id: req.user.id });

    const result = await pool.query(
      `UPDATE permit_applications SET status = 'approved', approved_at = NOW(), status_history = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [JSON.stringify(history), req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Permit state machine: Reject (admin only)
router.post('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM permit_applications WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const permit = existing.rows[0];
    const history = Array.isArray(permit.status_history) ? permit.status_history : [];
    history.push({ from: permit.status, to: 'rejected', timestamp: new Date().toISOString(), user_id: req.user.id, reason: req.body.reason });

    const result = await pool.query(
      `UPDATE permit_applications SET status = 'rejected', rejected_at = NOW(), status_history = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [JSON.stringify(history), req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/permits/:id/status - workflow state machine with full role validation
router.put('/:id/status', async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    const VALID_TRANSITIONS = {
      'Pending Review': ['submitted', 'Under Review'],
      'submitted': ['Under Review', 'approved', 'rejected', 'revision_needed'],
      'Under Review': ['approved', 'rejected', 'revision_needed', 'Revisions Required'],
      'revision_needed': ['submitted', 'Under Review'],
      'Revisions Required': ['submitted', 'Under Review'],
      'approved': [],
      'Approved': [],
      'rejected': [],
      'Denied': [],
    };

    const ADMIN_ONLY_STATUSES = ['approved', 'Approved', 'rejected', 'Denied'];

    const existing = await pool.query('SELECT * FROM permit_applications WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const permit = existing.rows[0];

    if (ADMIN_ONLY_STATUSES.includes(status) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required to approve or reject permits' });
    }

    const allowed = VALID_TRANSITIONS[permit.status] || [];
    if (allowed.length > 0 && !allowed.includes(status)) {
      return res.status(400).json({
        error: `Invalid transition from "${permit.status}" to "${status}"`,
        allowed_transitions: allowed
      });
    }

    const history = Array.isArray(permit.status_history) ? permit.status_history : [];
    history.push({
      from: permit.status,
      to: status,
      timestamp: new Date().toISOString(),
      user_id: req.user.id,
      reason: reason || null
    });

    let extraSql = '';
    const extraParams = [];
    if (status === 'submitted') { extraSql += ', submitted_at = NOW()'; }
    if (status === 'approved' || status === 'Approved') { extraSql += ', approved_at = NOW()'; }
    if (status === 'rejected' || status === 'Denied') { extraSql += ', rejected_at = NOW()'; }

    const result = await pool.query(
      `UPDATE permit_applications SET status = $1, status_history = $2, updated_at = NOW()${extraSql} WHERE id = $3 RETURNING *`,
      [status, JSON.stringify(history), req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
 'Under Review', 'revision_needed', 'Revisions Required', 'approved', 'Approved', 'rejected', 'Denied'];
    COLUMNS.forEach(col => { board[col] = []; });
    result.rows.forEach(row => { board[row.status] = row.permits || []; });
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
