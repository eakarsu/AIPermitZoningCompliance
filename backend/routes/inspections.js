const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inspections ORDER BY inspection_date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inspections WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { property_address, inspection_type, inspector_name, inspection_date, project_name, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO inspections (property_address, inspection_type, inspector_name, inspection_date, project_name, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Scheduled') RETURNING *`,
      [property_address, inspection_type, inspector_name, inspection_date, project_name, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { property_address, inspection_type, inspector_name, inspection_date, project_name, notes, status } = req.body;
    const result = await pool.query(
      `UPDATE inspections SET property_address=$1, inspection_type=$2, inspector_name=$3, inspection_date=$4, project_name=$5, notes=$6, status=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [property_address, inspection_type, inspector_name, inspection_date, project_name, notes, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM inspections WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inspections WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const inspection = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are a building inspection specialist. Analyze the inspection and provide: 1) Pre-inspection checklist, 2) Common issues for this inspection type, 3) Required documentation, 4) Pass/fail criteria, 5) Follow-up recommendations. Format with clear sections.',
      `Inspection Details:\n- Address: ${inspection.property_address}\n- Type: ${inspection.inspection_type}\n- Inspector: ${inspection.inspector_name}\n- Date: ${inspection.inspection_date}\n- Project: ${inspection.project_name}\n- Notes: ${inspection.notes}`
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
