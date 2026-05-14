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
    const countResult = await pool.query('SELECT COUNT(*) FROM plan_reviews');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM plan_reviews ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM plan_reviews WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { project_name, plan_type, architect, engineer, description, building_type, stories } = req.body;
    if (!project_name) return res.status(400).json({ error: 'project_name is required' });
    const result = await pool.query(
      `INSERT INTO plan_reviews (project_name, plan_type, architect, engineer, description, building_type, stories, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Submitted') RETURNING *`,
      [project_name, plan_type, architect, engineer, description, building_type, stories]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { project_name, plan_type, architect, engineer, description, building_type, stories, status } = req.body;
    const result = await pool.query(
      `UPDATE plan_reviews SET project_name=$1, plan_type=$2, architect=$3, engineer=$4, description=$5, building_type=$6, stories=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [project_name, plan_type, architect, engineer, description, building_type, stories, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM plan_reviews WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM plan_reviews WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const plan = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are a construction plan review expert. Analyze the plans and provide: 1) Structural adequacy, 2) Code compliance, 3) Design concerns, 4) Required revisions, 5) Approval recommendation. Format with clear sections.',
      `Plan Review:\n- Project: ${plan.project_name}\n- Type: ${plan.plan_type}\n- Architect: ${plan.architect}\n- Engineer: ${plan.engineer}\n- Description: ${plan.description}\n- Building: ${plan.building_type}\n- Stories: ${plan.stories}`
    );

    await pool.query('UPDATE plan_reviews SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [aiResult.result, plan.id]);
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, '/api/plan-review/:id/analyze', 'plan_reviews', plan.id, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
