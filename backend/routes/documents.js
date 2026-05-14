const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// Multer configuration for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/documents'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.tiff', '.bmp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

// Document upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid file type' });
    }

    const { entity_type, entity_id } = req.body;
    const filePath = `/uploads/documents/${req.file.filename}`;

    const result = await pool.query(
      `INSERT INTO uploaded_documents (original_filename, file_path, entity_type, entity_id, uploaded_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.file.originalname, filePath, entity_type || null, entity_id || null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM document_reviews');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM document_reviews ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
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
    if (!document_name || !project_name) {
      return res.status(400).json({ error: 'document_name and project_name are required' });
    }
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

router.post('/:id/analyze', aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM document_reviews WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const doc = result.rows[0];
    const aiResult = await callOpenRouter(
      'You are a construction document review specialist. Analyze the document and provide: 1) Document completeness check, 2) Code compliance issues, 3) Missing elements, 4) Recommendations for approval, 5) Risk assessment. Format with clear sections.',
      `Document Review:\n- Document: ${doc.document_name}\n- Type: ${doc.document_type}\n- Project: ${doc.project_name}\n- Submitted By: ${doc.submitted_by}\n- Description: ${doc.description}\n- Pages: ${doc.page_count}`
    );

    await pool.query('UPDATE document_reviews SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [aiResult.result, doc.id]);
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, '/api/documents/:id/analyze', 'document_reviews', doc.id, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
