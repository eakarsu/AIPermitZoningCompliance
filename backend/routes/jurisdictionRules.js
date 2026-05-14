const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { jurisdictionRuleValidation, jurisdictionCheckValidation } = require('../middleware/validate');
const router = express.Router();

// Ensure jurisdiction_rules table exists
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jurisdiction_rules (
      id SERIAL PRIMARY KEY,
      jurisdiction VARCHAR(255) NOT NULL,
      rule_type VARCHAR(100) NOT NULL,
      requirement TEXT NOT NULL,
      effective_date DATE,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}
ensureTable().catch(err => console.error('jurisdiction_rules table error:', err.message));

// GET all with pagination
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { jurisdiction, rule_type } = req.query;

    let where = 'WHERE 1=1';
    const params = [];
    if (jurisdiction) { params.push(jurisdiction); where += ` AND jurisdiction ILIKE $${params.length}`; }
    if (rule_type) { params.push(rule_type); where += ` AND rule_type = $${params.length}`; }

    const countRes = await pool.query(`SELECT COUNT(*) FROM jurisdiction_rules ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const paginatedParams = [...params, limit, offset];
    const result = await pool.query(
      `SELECT * FROM jurisdiction_rules ${where} ORDER BY jurisdiction, rule_type LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      paginatedParams
    );

    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jurisdiction_rules WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create
router.post('/', jurisdictionRuleValidation, async (req, res) => {
  try {
    const { jurisdiction, rule_type, requirement, effective_date } = req.body;
    if (!jurisdiction || !rule_type || !requirement) {
      return res.status(400).json({ error: 'jurisdiction, rule_type, and requirement are required' });
    }
    const result = await pool.query(
      `INSERT INTO jurisdiction_rules (jurisdiction, rule_type, requirement, effective_date, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [jurisdiction, rule_type, requirement, effective_date || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const { jurisdiction, rule_type, requirement, effective_date } = req.body;
    const result = await pool.query(
      `UPDATE jurisdiction_rules SET jurisdiction=$1, rule_type=$2, requirement=$3, effective_date=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
      [jurisdiction, rule_type, requirement, effective_date || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM jurisdiction_rules WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jurisdiction-rules/check - AI jurisdiction compliance check
router.post('/check', aiRateLimiter, jurisdictionCheckValidation, async (req, res) => {
  try {
    const { address, project_type, jurisdiction } = req.body;
    if (!address || !project_type) {
      return res.status(400).json({ error: 'address and project_type are required' });
    }

    // Fetch relevant jurisdiction rules
    let rulesResult;
    if (jurisdiction) {
      rulesResult = await pool.query(
        'SELECT * FROM jurisdiction_rules WHERE jurisdiction ILIKE $1 ORDER BY rule_type',
        [`%${jurisdiction}%`]
      );
    } else {
      rulesResult = await pool.query('SELECT * FROM jurisdiction_rules ORDER BY jurisdiction, rule_type LIMIT 50');
    }
    const rules = rulesResult.rows;

    const rulesText = rules.length > 0
      ? rules.map(r => `[${r.jurisdiction} - ${r.rule_type}] ${r.requirement} (effective: ${r.effective_date || 'N/A'})`).join('\n')
      : 'No specific jurisdiction rules found in database. Use general knowledge.';

    const systemPrompt = `You are an expert permit and zoning compliance attorney. Analyze jurisdiction-specific compliance requirements. Respond with JSON:
{
  "compliance_status": "compliant|non_compliant|conditional|needs_review",
  "risk_level": "low|medium|high|critical",
  "applicable_rules": [{"rule_type": "...", "requirement": "...", "applies": true|false, "notes": "..."}],
  "missing_requirements": ["..."],
  "recommendations": ["..."],
  "required_permits": ["..."],
  "estimated_review_time_days": 0,
  "summary": "..."
}
After JSON, provide a detailed human-readable assessment.`;

    const userMsg = `Address: ${address}\nProject Type: ${project_type}\nJurisdiction: ${jurisdiction || 'unknown'}\n\nApplicable Rules from Database:\n${rulesText}`;

    const aiResult = await callOpenRouter(systemPrompt, userMsg);

    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, '/api/jurisdiction-rules/check', 'jurisdiction_rules', null, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json({ ...aiResult, rules_checked: rules.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
