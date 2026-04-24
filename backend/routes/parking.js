const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parking_requirements ORDER BY created_at DESC');
    res.json(result.rows);
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

router.post('/:id/analyze', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parking_requirements WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const park = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are a parking requirements expert. Analyze and provide: 1) Required parking spaces calculation, 2) ADA parking requirements, 3) Bicycle parking needs, 4) Loading zone requirements, 5) Shared parking opportunities, 6) Variance eligibility. Format with clear sections.',
      `Parking Details:\n- Project: ${park.project_name}\n- Address: ${park.property_address}\n- Use: ${park.building_use}\n- Area: ${park.square_footage} sq ft\n- Units: ${park.num_units}\n- Proposed Spaces: ${park.proposed_spaces}\n- ADA Spaces: ${park.ada_spaces}\n- Zone: ${park.zone_type}`
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
