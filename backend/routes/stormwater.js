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
    const countResult = await pool.query('SELECT COUNT(*) FROM stormwater_management');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM stormwater_management ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stormwater_management WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { project_name, property_address, site_area, impervious_area, drainage_basin, soil_type, proposed_bmp } = req.body;
    if (!project_name || !property_address) return res.status(400).json({ error: 'project_name and property_address are required' });
    const result = await pool.query(
      `INSERT INTO stormwater_management (project_name, property_address, site_area, impervious_area, drainage_basin, soil_type, proposed_bmp, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending') RETURNING *`,
      [project_name, property_address, site_area, impervious_area, drainage_basin, soil_type, proposed_bmp]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { project_name, property_address, site_area, impervious_area, drainage_basin, soil_type, proposed_bmp, status } = req.body;
    const result = await pool.query(
      `UPDATE stormwater_management SET project_name=$1, property_address=$2, site_area=$3, impervious_area=$4, drainage_basin=$5, soil_type=$6, proposed_bmp=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [project_name, property_address, site_area, impervious_area, drainage_basin, soil_type, proposed_bmp, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM stormwater_management WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stormwater_management WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const storm = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are a stormwater management expert. Analyze and provide: 1) Runoff calculation, 2) BMP effectiveness, 3) Detention/retention requirements, 4) Water quality measures, 5) Erosion control plan, 6) Regulatory compliance. Format with clear sections.',
      `Stormwater:\n- Project: ${storm.project_name}\n- Address: ${storm.property_address}\n- Site: ${storm.site_area} acres\n- Impervious: ${storm.impervious_area} sq ft\n- Basin: ${storm.drainage_basin}\n- Soil: ${storm.soil_type}\n- BMP: ${storm.proposed_bmp}`
    );

    await pool.query('UPDATE stormwater_management SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [aiResult.result, storm.id]);
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, '/api/stormwater/:id/analyze', 'stormwater_management', storm.id, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
