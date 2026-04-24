const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM environmental_assessments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM environmental_assessments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { project_name, property_address, assessment_type, ecosystem_type, acreage, description } = req.body;
    const result = await pool.query(
      `INSERT INTO environmental_assessments (project_name, property_address, assessment_type, ecosystem_type, acreage, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending') RETURNING *`,
      [project_name, property_address, assessment_type, ecosystem_type, acreage, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { project_name, property_address, assessment_type, ecosystem_type, acreage, description, status } = req.body;
    const result = await pool.query(
      `UPDATE environmental_assessments SET project_name=$1, property_address=$2, assessment_type=$3, ecosystem_type=$4, acreage=$5, description=$6, status=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [project_name, property_address, assessment_type, ecosystem_type, acreage, description, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM environmental_assessments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM environmental_assessments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const env = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are an environmental impact assessment expert. Analyze and provide: 1) Environmental impact level, 2) Protected species concerns, 3) Water/soil impact, 4) Mitigation measures required, 5) Regulatory compliance status, 6) Sustainability recommendations. Format with clear sections.',
      `Environmental Assessment:\n- Project: ${env.project_name}\n- Address: ${env.property_address}\n- Type: ${env.assessment_type}\n- Ecosystem: ${env.ecosystem_type}\n- Acreage: ${env.acreage}\n- Description: ${env.description}`
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
