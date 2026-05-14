const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM code_violations');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM code_violations ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM code_violations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { property_address, violation_type, code_section, description, severity, reported_by } = req.body;
    if (!property_address || !code_section) {
      return res.status(400).json({ error: 'property_address and code_section are required' });
    }
    const result = await pool.query(
      `INSERT INTO code_violations (property_address, violation_type, code_section, description, severity, reported_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Open') RETURNING *`,
      [property_address, violation_type, code_section, description, severity, reported_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { property_address, violation_type, code_section, description, severity, reported_by, status } = req.body;
    const result = await pool.query(
      `UPDATE code_violations SET property_address=$1, violation_type=$2, code_section=$3, description=$4, severity=$5, reported_by=$6, status=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [property_address, violation_type, code_section, description, severity, reported_by, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM code_violations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM code_violations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const violation = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are a building code violation expert. Analyze the violation and provide: 1) Severity assessment, 2) Required corrective actions, 3) Timeline for compliance, 4) Potential fines/penalties, 5) Prevention recommendations. Format with clear sections.',
      `Violation Details:\n- Address: ${violation.property_address}\n- Type: ${violation.violation_type}\n- Code Section: ${violation.code_section}\n- Description: ${violation.description}\n- Severity: ${violation.severity}\n- Reported By: ${violation.reported_by}`
    );

    await pool.query('UPDATE code_violations SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [aiResult.result, violation.id]);
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, '/api/violations/:id/analyze', 'code_violations', violation.id, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
