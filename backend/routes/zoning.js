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
    const countResult = await pool.query('SELECT COUNT(*) FROM zoning_checks');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM zoning_checks ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM zoning_checks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { property_address, zone_type, proposed_use, current_use, lot_size, building_height, lot_coverage } = req.body;
    if (!property_address || !proposed_use) {
      return res.status(400).json({ error: 'property_address and proposed_use are required' });
    }
    const result = await pool.query(
      `INSERT INTO zoning_checks (property_address, zone_type, proposed_use, current_use, lot_size, building_height, lot_coverage, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending') RETURNING *`,
      [property_address, zone_type, proposed_use, current_use, lot_size, building_height, lot_coverage]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { property_address, zone_type, proposed_use, current_use, lot_size, building_height, lot_coverage, status } = req.body;
    const result = await pool.query(
      `UPDATE zoning_checks SET property_address=$1, zone_type=$2, proposed_use=$3, current_use=$4, lot_size=$5, building_height=$6, lot_coverage=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [property_address, zone_type, proposed_use, current_use, lot_size, building_height, lot_coverage, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM zoning_checks WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM zoning_checks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const zoning = result.rows[0];
    const structuredPrompt = `You are a zoning compliance expert. Analyze the zoning request and respond with JSON:
{"compliance_status":"compliant|non_compliant|conditional","risk_level":"low|medium|high|critical","issues":[{"code_section":"...","description":"...","severity":"..."}],"recommendations":[],"estimated_resolution_days":0,"summary":"..."}
Then provide readable analysis with sections: 1) Zoning Compatibility, 2) Setback Requirements, 3) Use Restrictions, 4) Density Limitations, 5) Variance Needs, 6) Compliance Status.`;

    const aiResult = await callOpenRouter(
      structuredPrompt,
      `Zoning Check:\n- Address: ${zoning.property_address}\n- Zone: ${zoning.zone_type}\n- Proposed Use: ${zoning.proposed_use}\n- Current Use: ${zoning.current_use}\n- Lot Size: ${zoning.lot_size} sq ft\n- Height: ${zoning.building_height} ft\n- Coverage: ${zoning.lot_coverage}%`
    );

    await pool.query('UPDATE zoning_checks SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [aiResult.result, zoning.id]);
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, '/api/zoning/:id/analyze', 'zoning_checks', zoning.id, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
