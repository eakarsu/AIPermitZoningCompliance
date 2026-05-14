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
    const countResult = await pool.query('SELECT COUNT(*) FROM environmental_assessments');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM environmental_assessments ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM environmental_assessments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { project_name, property_address, assessment_type, ecosystem_type, acreage, description } = req.body;
    if (!project_name || !property_address) return res.status(400).json({ error: 'project_name and property_address are required' });
    const result = await pool.query(
      `INSERT INTO environmental_assessments (project_name, property_address, assessment_type, ecosystem_type, acreage, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending') RETURNING *`,
      [project_name, property_address, assessment_type, ecosystem_type, acreage, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { project_name, property_address, assessment_type, ecosystem_type, acreage, description, status } = req.body;
    const result = await pool.query(
      `UPDATE environmental_assessments SET project_name=$1, property_address=$2, assessment_type=$3, ecosystem_type=$4, acreage=$5, description=$6, status=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [project_name, property_address, assessment_type, ecosystem_type, acreage, description, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM environmental_assessments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM environmental_assessments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const env = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are an environmental impact assessment expert. Analyze and provide: 1) Impact level, 2) Protected species concerns, 3) Water/soil impact, 4) Mitigation measures, 5) Regulatory compliance, 6) Sustainability recommendations. Format with clear sections.',
      `Environmental Assessment:\n- Project: ${env.project_name}\n- Address: ${env.property_address}\n- Type: ${env.assessment_type}\n- Ecosystem: ${env.ecosystem_type}\n- Acreage: ${env.acreage}\n- Description: ${env.description}`
    );

    await pool.query('UPDATE environmental_assessments SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [aiResult.result, env.id]);
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, '/api/environmental/:id/analyze', 'environmental_assessments', env.id, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
