const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stormwater_management ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stormwater_management WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { project_name, property_address, site_area, impervious_area, drainage_basin, soil_type, proposed_bmp } = req.body;
    const result = await pool.query(
      `INSERT INTO stormwater_management (project_name, property_address, site_area, impervious_area, drainage_basin, soil_type, proposed_bmp, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending') RETURNING *`,
      [project_name, property_address, site_area, impervious_area, drainage_basin, soil_type, proposed_bmp]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { project_name, property_address, site_area, impervious_area, drainage_basin, soil_type, proposed_bmp, status } = req.body;
    const result = await pool.query(
      `UPDATE stormwater_management SET project_name=$1, property_address=$2, site_area=$3, impervious_area=$4, drainage_basin=$5, soil_type=$6, proposed_bmp=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [project_name, property_address, site_area, impervious_area, drainage_basin, soil_type, proposed_bmp, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM stormwater_management WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stormwater_management WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const storm = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are a stormwater management expert. Analyze and provide: 1) Runoff calculation, 2) BMP effectiveness, 3) Detention/retention requirements, 4) Water quality measures, 5) Erosion control plan, 6) Regulatory compliance. Format with clear sections.',
      `Stormwater Details:\n- Project: ${storm.project_name}\n- Address: ${storm.property_address}\n- Site Area: ${storm.site_area} acres\n- Impervious Area: ${storm.impervious_area} sq ft\n- Drainage Basin: ${storm.drainage_basin}\n- Soil Type: ${storm.soil_type}\n- Proposed BMP: ${storm.proposed_bmp}`
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
