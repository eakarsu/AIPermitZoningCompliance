const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const router = express.Router();

// Get all permits
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM permit_applications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single permit
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM permit_applications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create permit
router.post('/', async (req, res) => {
  try {
    const { project_name, applicant_name, property_address, permit_type, description, estimated_cost, square_footage } = req.body;
    const result = await pool.query(
      `INSERT INTO permit_applications (project_name, applicant_name, property_address, permit_type, description, estimated_cost, square_footage, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending Review') RETURNING *`,
      [project_name, applicant_name, property_address, permit_type, description, estimated_cost, square_footage]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update permit
router.put('/:id', async (req, res) => {
  try {
    const { project_name, applicant_name, property_address, permit_type, description, estimated_cost, square_footage, status } = req.body;
    const result = await pool.query(
      `UPDATE permit_applications SET project_name=$1, applicant_name=$2, property_address=$3, permit_type=$4, description=$5, estimated_cost=$6, square_footage=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [project_name, applicant_name, property_address, permit_type, description, estimated_cost, square_footage, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete permit
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM permit_applications WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Analysis
router.post('/:id/analyze', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM permit_applications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const permit = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are an expert building permit reviewer. Analyze the permit application and provide: 1) Completeness assessment, 2) Potential issues or red flags, 3) Required additional documentation, 4) Estimated review timeline, 5) Compliance recommendations. Format your response with clear sections and bullet points.',
      `Permit Application Details:\n- Project: ${permit.project_name}\n- Applicant: ${permit.applicant_name}\n- Address: ${permit.property_address}\n- Type: ${permit.permit_type}\n- Description: ${permit.description}\n- Estimated Cost: $${permit.estimated_cost}\n- Square Footage: ${permit.square_footage}`
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
