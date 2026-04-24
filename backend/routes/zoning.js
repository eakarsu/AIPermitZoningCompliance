const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM zoning_checks ORDER BY created_at DESC');
    res.json(result.rows);
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

router.post('/:id/analyze', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM zoning_checks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const zoning = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are a zoning compliance expert. Analyze the zoning check request and provide: 1) Zoning compatibility assessment, 2) Setback requirements, 3) Use restrictions, 4) Density limitations, 5) Variance needs if any, 6) Compliance status. Format with clear sections.',
      `Zoning Check Details:\n- Address: ${zoning.property_address}\n- Zone Type: ${zoning.zone_type}\n- Proposed Use: ${zoning.proposed_use}\n- Current Use: ${zoning.current_use}\n- Lot Size: ${zoning.lot_size} sq ft\n- Building Height: ${zoning.building_height} ft\n- Lot Coverage: ${zoning.lot_coverage}%`
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
