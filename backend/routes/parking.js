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
    const countResult = await pool.query('SELECT COUNT(*) FROM parking_requirements');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM parking_requirements ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parking_requirements WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { project_name, property_address, building_use, square_footage, num_units, proposed_spaces, ada_spaces, zone_type } = req.body;
    if (!project_name || !property_address || !building_use) return res.status(400).json({ error: 'project_name, property_address, and building_use are required' });
    const result = await pool.query(
      `INSERT INTO parking_requirements (project_name, property_address, building_use, square_footage, num_units, proposed_spaces, ada_spaces, zone_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending') RETURNING *`,
      [project_name, property_address, building_use, square_footage, num_units, proposed_spaces, ada_spaces, zone_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { project_name, property_address, building_use, square_footage, num_units, proposed_spaces, ada_spaces, zone_type, status } = req.body;
    const result = await pool.query(
      `UPDATE parking_requirements SET project_name=$1, property_address=$2, building_use=$3, square_footage=$4, num_units=$5, proposed_spaces=$6, ada_spaces=$7, zone_type=$8, status=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
      [project_name, property_address, building_use, square_footage, num_units, proposed_spaces, ada_spaces, zone_type, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM parking_requirements WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parking_requirements WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const park = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are a parking requirements expert. Analyze and provide: 1) Required spaces calculation, 2) ADA parking requirements, 3) Bicycle parking, 4) Loading zone requirements, 5) Shared parking opportunities, 6) Variance eligibility. Format with clear sections.',
      `Parking:\n- Project: ${park.project_name}\n- Address: ${park.property_address}\n- Use: ${park.building_use}\n- Area: ${park.square_footage} sq ft\n- Units: ${park.num_units}\n- Proposed: ${park.proposed_spaces}\n- ADA: ${park.ada_spaces}\n- Zone: ${park.zone_type}`
    );

    await pool.query('UPDATE parking_requirements SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [aiResult.result, park.id]);
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, '/api/parking/:id/analyze', 'parking_requirements', park.id, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
