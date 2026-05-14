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
    const countResult = await pool.query('SELECT COUNT(*) FROM noise_compliance');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM noise_compliance ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM noise_compliance WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { project_name, property_address, noise_source, decibel_level, time_of_operation, zone_type, mitigation_measures } = req.body;
    if (!project_name || !property_address || !noise_source) return res.status(400).json({ error: 'project_name, property_address, and noise_source are required' });
    const result = await pool.query(
      `INSERT INTO noise_compliance (project_name, property_address, noise_source, decibel_level, time_of_operation, zone_type, mitigation_measures, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending') RETURNING *`,
      [project_name, property_address, noise_source, decibel_level, time_of_operation, zone_type, mitigation_measures]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { project_name, property_address, noise_source, decibel_level, time_of_operation, zone_type, mitigation_measures, status } = req.body;
    const result = await pool.query(
      `UPDATE noise_compliance SET project_name=$1, property_address=$2, noise_source=$3, decibel_level=$4, time_of_operation=$5, zone_type=$6, mitigation_measures=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [project_name, property_address, noise_source, decibel_level, time_of_operation, zone_type, mitigation_measures, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM noise_compliance WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM noise_compliance WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const noise = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are a noise ordinance compliance expert. Analyze and provide: 1) Noise level assessment, 2) Ordinance compliance status, 3) Time-of-day restrictions, 4) Required mitigation, 5) Impact on adjacent properties, 6) Monitoring recommendations. Format with clear sections.',
      `Noise:\n- Project: ${noise.project_name}\n- Address: ${noise.property_address}\n- Source: ${noise.noise_source}\n- Level: ${noise.decibel_level} dB\n- Hours: ${noise.time_of_operation}\n- Zone: ${noise.zone_type}\n- Mitigation: ${noise.mitigation_measures}`
    );

    await pool.query('UPDATE noise_compliance SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [aiResult.result, noise.id]);
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, '/api/noise/:id/analyze', 'noise_compliance', noise.id, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
