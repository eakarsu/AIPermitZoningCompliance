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
    const countResult = await pool.query('SELECT COUNT(*) FROM fire_safety_checks');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM fire_safety_checks ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fire_safety_checks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { building_name, building_address, building_type, square_footage, num_floors, has_sprinklers, has_fire_alarm, fire_exits } = req.body;
    if (!building_name || !building_address) {
      return res.status(400).json({ error: 'building_name and building_address are required' });
    }
    const result = await pool.query(
      `INSERT INTO fire_safety_checks (building_name, building_address, building_type, square_footage, num_floors, has_sprinklers, has_fire_alarm, fire_exits, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending') RETURNING *`,
      [building_name, building_address, building_type, square_footage, num_floors, has_sprinklers, has_fire_alarm, fire_exits]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { building_name, building_address, building_type, square_footage, num_floors, has_sprinklers, has_fire_alarm, fire_exits, status } = req.body;
    const result = await pool.query(
      `UPDATE fire_safety_checks SET building_name=$1, building_address=$2, building_type=$3, square_footage=$4, num_floors=$5, has_sprinklers=$6, has_fire_alarm=$7, fire_exits=$8, status=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
      [building_name, building_address, building_type, square_footage, num_floors, has_sprinklers, has_fire_alarm, fire_exits, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM fire_safety_checks WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fire_safety_checks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const fire = result.rows[0];
    const structuredPrompt = `You are a fire safety compliance expert. Respond with JSON:
{"compliance_status":"compliant|non_compliant|conditional","risk_level":"low|medium|high|critical","issues":[{"code_section":"...","description":"...","severity":"..."}],"recommendations":[],"estimated_resolution_days":0,"summary":"..."}
Then provide analysis: 1) Fire Safety Rating, 2) Required Systems, 3) Egress Compliance, 4) Fire Separation, 5) Deficiencies, 6) Corrective Actions.`;

    const aiResult = await callOpenRouter(
      structuredPrompt,
      `Fire Safety:\n- Building: ${fire.building_name}\n- Address: ${fire.building_address}\n- Type: ${fire.building_type}\n- Area: ${fire.square_footage} sq ft\n- Floors: ${fire.num_floors}\n- Sprinklers: ${fire.has_sprinklers}\n- Fire Alarm: ${fire.has_fire_alarm}\n- Exits: ${fire.fire_exits}`
    );

    await pool.query('UPDATE fire_safety_checks SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [aiResult.result, fire.id]);
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, '/api/fire-safety/:id/analyze', 'fire_safety_checks', fire.id, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
