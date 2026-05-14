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
    const countResult = await pool.query('SELECT COUNT(*) FROM ada_compliance');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM ada_compliance ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ada_compliance WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { building_name, building_address, building_type, has_ramp, has_elevator, accessible_restrooms, accessible_parking, door_width } = req.body;
    if (!building_name || !building_address) {
      return res.status(400).json({ error: 'building_name and building_address are required' });
    }
    const result = await pool.query(
      `INSERT INTO ada_compliance (building_name, building_address, building_type, has_ramp, has_elevator, accessible_restrooms, accessible_parking, door_width, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending') RETURNING *`,
      [building_name, building_address, building_type, has_ramp, has_elevator, accessible_restrooms, accessible_parking, door_width]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { building_name, building_address, building_type, has_ramp, has_elevator, accessible_restrooms, accessible_parking, door_width, status } = req.body;
    const result = await pool.query(
      `UPDATE ada_compliance SET building_name=$1, building_address=$2, building_type=$3, has_ramp=$4, has_elevator=$5, accessible_restrooms=$6, accessible_parking=$7, door_width=$8, status=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
      [building_name, building_address, building_type, has_ramp, has_elevator, accessible_restrooms, accessible_parking, door_width, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ada_compliance WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ada_compliance WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const ada = result.rows[0];
    const structuredPrompt = `You are an ADA compliance expert. Respond with JSON:
{"compliance_status":"compliant|non_compliant|conditional","risk_level":"low|medium|high|critical","issues":[{"code_section":"...","description":"...","severity":"..."}],"recommendations":[],"estimated_resolution_days":0,"summary":"..."}
Then provide analysis: 1) ADA Compliance Status, 2) Accessibility Barriers, 3) Required Modifications, 4) Path of Travel, 5) Signage Requirements, 6) Remediation Cost.`;

    const aiResult = await callOpenRouter(
      structuredPrompt,
      `ADA:\n- Building: ${ada.building_name}\n- Address: ${ada.building_address}\n- Type: ${ada.building_type}\n- Ramp: ${ada.has_ramp}\n- Elevator: ${ada.has_elevator}\n- Accessible Restrooms: ${ada.accessible_restrooms}\n- Accessible Parking: ${ada.accessible_parking}\n- Door Width: ${ada.door_width} in`
    );

    await pool.query('UPDATE ada_compliance SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [aiResult.result, ada.id]);
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, '/api/ada-compliance/:id/analyze', 'ada_compliance', ada.id, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
