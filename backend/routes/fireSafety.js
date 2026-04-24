const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fire_safety_checks ORDER BY created_at DESC');
    res.json(result.rows);
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

router.post('/:id/analyze', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fire_safety_checks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const fire = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are a fire safety compliance expert. Analyze and provide: 1) Fire safety rating, 2) Required fire protection systems, 3) Egress compliance, 4) Fire separation requirements, 5) Deficiencies found, 6) Corrective actions. Format with clear sections.',
      `Fire Safety Details:\n- Building: ${fire.building_name}\n- Address: ${fire.building_address}\n- Type: ${fire.building_type}\n- Area: ${fire.square_footage} sq ft\n- Floors: ${fire.num_floors}\n- Sprinklers: ${fire.has_sprinklers}\n- Fire Alarm: ${fire.has_fire_alarm}\n- Fire Exits: ${fire.fire_exits}`
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
