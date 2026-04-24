const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM document_reviews ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM document_reviews WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { document_name, document_type, project_name, submitted_by, description, page_count } = req.body;
    const result = await pool.query(
      `INSERT INTO document_reviews (document_name, document_type, project_name, submitted_by, description, page_count, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending Review') RETURNING *`,
      [document_name, document_type, project_name, submitted_by, description, page_count]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { document_name, document_type, project_name, submitted_by, description, page_count, status } = req.body;
    const result = await pool.query(
      `UPDATE document_reviews SET document_name=$1, document_type=$2, project_name=$3, submitted_by=$4, description=$5, page_count=$6, status=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [document_name, document_type, project_name, submitted_by, description, page_count, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM document_reviews WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM document_reviews WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const doc = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are a construction document review specialist. Analyze the document and provide: 1) Document completeness check, 2) Code compliance issues, 3) Missing elements, 4) Recommendations for approval, 5) Risk assessment. Format with clear sections.',
      `Document Review Details:\n- Document: ${doc.document_name}\n- Type: ${doc.document_type}\n- Project: ${doc.project_name}\n- Submitted By: ${doc.submitted_by}\n- Description: ${doc.description}\n- Pages: ${doc.page_count}`
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
