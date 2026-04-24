const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ada_compliance ORDER BY created_at DESC');
    res.json(result.rows);
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

router.post('/:id/analyze', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ada_compliance WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const ada = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are an ADA compliance expert. Analyze and provide: 1) ADA compliance status, 2) Accessibility barriers found, 3) Required modifications, 4) Path of travel assessment, 5) Signage requirements, 6) Estimated remediation cost. Format with clear sections.',
      `ADA Details:\n- Building: ${ada.building_name}\n- Address: ${ada.building_address}\n- Type: ${ada.building_type}\n- Ramp: ${ada.has_ramp}\n- Elevator: ${ada.has_elevator}\n- Accessible Restrooms: ${ada.accessible_restrooms}\n- Accessible Parking: ${ada.accessible_parking}\n- Door Width: ${ada.door_width} inches`
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
