const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM historical_reviews ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM historical_reviews WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { property_address, building_name, year_built, historic_district, landmark_status, proposed_changes, architectural_style } = req.body;
    const result = await pool.query(
      `INSERT INTO historical_reviews (property_address, building_name, year_built, historic_district, landmark_status, proposed_changes, architectural_style, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Under Review') RETURNING *`,
      [property_address, building_name, year_built, historic_district, landmark_status, proposed_changes, architectural_style]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { property_address, building_name, year_built, historic_district, landmark_status, proposed_changes, architectural_style, status } = req.body;
    const result = await pool.query(
      `UPDATE historical_reviews SET property_address=$1, building_name=$2, year_built=$3, historic_district=$4, landmark_status=$5, proposed_changes=$6, architectural_style=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [property_address, building_name, year_built, historic_district, landmark_status, proposed_changes, architectural_style, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM historical_reviews WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM historical_reviews WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const hist = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are a historic preservation expert. Analyze and provide: 1) Historical significance assessment, 2) Impact of proposed changes, 3) Preservation requirements, 4) Secretary of Interior Standards compliance, 5) Alternative approaches, 6) Approval likelihood. Format with clear sections.',
      `Historical Review:\n- Address: ${hist.property_address}\n- Building: ${hist.building_name}\n- Year Built: ${hist.year_built}\n- District: ${hist.historic_district}\n- Landmark: ${hist.landmark_status}\n- Proposed Changes: ${hist.proposed_changes}\n- Style: ${hist.architectural_style}`
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
