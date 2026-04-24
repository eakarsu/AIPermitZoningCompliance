const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM occupancy_classifications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM occupancy_classifications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { building_name, building_address, building_use, square_footage, num_floors, max_occupants, construction_type } = req.body;
    const result = await pool.query(
      `INSERT INTO occupancy_classifications (building_name, building_address, building_use, square_footage, num_floors, max_occupants, construction_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending') RETURNING *`,
      [building_name, building_address, building_use, square_footage, num_floors, max_occupants, construction_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { building_name, building_address, building_use, square_footage, num_floors, max_occupants, construction_type, status } = req.body;
    const result = await pool.query(
      `UPDATE occupancy_classifications SET building_name=$1, building_address=$2, building_use=$3, square_footage=$4, num_floors=$5, max_occupants=$6, construction_type=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [building_name, building_address, building_use, square_footage, num_floors, max_occupants, construction_type, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM occupancy_classifications WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM occupancy_classifications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const occ = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are an occupancy classification expert per IBC. Analyze and provide: 1) Occupancy group classification (A, B, E, F, H, I, M, R, S, U), 2) Construction type requirements, 3) Maximum occupant load, 4) Egress requirements, 5) Fire protection requirements, 6) Special provisions. Format with clear sections.',
      `Occupancy Details:\n- Building: ${occ.building_name}\n- Address: ${occ.building_address}\n- Use: ${occ.building_use}\n- Area: ${occ.square_footage} sq ft\n- Floors: ${occ.num_floors}\n- Max Occupants: ${occ.max_occupants}\n- Construction: ${occ.construction_type}`
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
