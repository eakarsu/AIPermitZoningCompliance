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
    const countResult = await pool.query('SELECT COUNT(*) FROM setback_calculations');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM setback_calculations ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM setback_calculations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { property_address, zone_type, lot_width, lot_depth, front_setback, rear_setback, side_setback, proposed_structure } = req.body;
    if (!property_address || !zone_type) return res.status(400).json({ error: 'property_address and zone_type are required' });
    const result = await pool.query(
      `INSERT INTO setback_calculations (property_address, zone_type, lot_width, lot_depth, front_setback, rear_setback, side_setback, proposed_structure, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Calculated') RETURNING *`,
      [property_address, zone_type, lot_width, lot_depth, front_setback, rear_setback, side_setback, proposed_structure]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { property_address, zone_type, lot_width, lot_depth, front_setback, rear_setback, side_setback, proposed_structure, status } = req.body;
    const result = await pool.query(
      `UPDATE setback_calculations SET property_address=$1, zone_type=$2, lot_width=$3, lot_depth=$4, front_setback=$5, rear_setback=$6, side_setback=$7, proposed_structure=$8, status=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
      [property_address, zone_type, lot_width, lot_depth, front_setback, rear_setback, side_setback, proposed_structure, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM setback_calculations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM setback_calculations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const setback = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are a setback and property line expert. Analyze and provide: 1) Required setbacks for the zone, 2) Compliance status, 3) Buildable area calculation, 4) Variance eligibility, 5) Adjacent property considerations. Format with clear sections.',
      `Setback:\n- Address: ${setback.property_address}\n- Zone: ${setback.zone_type}\n- Lot: ${setback.lot_width}ft x ${setback.lot_depth}ft\n- Front: ${setback.front_setback}ft\n- Rear: ${setback.rear_setback}ft\n- Side: ${setback.side_setback}ft\n- Structure: ${setback.proposed_structure}`
    );

    await pool.query('UPDATE setback_calculations SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [aiResult.result, setback.id]);
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, '/api/setbacks/:id/analyze', 'setback_calculations', setback.id, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
