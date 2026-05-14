const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../ai');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { feeEstimateValidation } = require('../middleware/validate');
const router = express.Router();

// POST /api/ai/fee-estimate - Fee calculator
router.post('/fee-estimate', aiRateLimiter, feeEstimateValidation, async (req, res) => {
  try {
    const { permit_type, project_value, jurisdiction, square_footage, project_description } = req.body;
    if (!permit_type || !project_value) {
      return res.status(400).json({ error: 'permit_type and project_value are required' });
    }

    const systemPrompt = `You are an expert in municipal permit fee structures. Provide a detailed fee estimate. Respond ONLY with this JSON structure first:
{
  "base_fee": 0,
  "valuation_fee": 0,
  "plan_review_fee": 0,
  "inspection_fee": 0,
  "impact_fees": 0,
  "other_fees": [{"name": "...", "amount": 0, "description": "..."}],
  "total_estimated_fee": 0,
  "fee_confidence": "low|medium|high",
  "notes": "...",
  "breakdown": [{"category": "...", "amount": 0, "basis": "..."}]
}
Then provide a plain-language explanation of the fee breakdown.`;

    const userMsg = `Permit Type: ${permit_type}
Project Value: $${project_value}
Jurisdiction: ${jurisdiction || 'General US jurisdiction'}
Square Footage: ${square_footage || 'Not specified'}
Project Description: ${project_description || 'Not provided'}

Calculate estimated permit fees including all applicable categories. Base on typical municipal fee schedules.`;

    const aiResult = await callOpenRouter(systemPrompt, userMsg);

    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, '/api/ai/fee-estimate', null, null, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json(aiResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/permits/:id/ai-review - Detailed AI permit reviewer
router.post('/permits/:id/ai-review', aiRateLimiter, async (req, res) => {
  try {
    const permitResult = await pool.query('SELECT * FROM permit_applications WHERE id = $1', [req.params.id]);
    if (permitResult.rows.length === 0) return res.status(404).json({ error: 'Permit not found' });
    const permit = permitResult.rows[0];

    // Fetch uploaded documents for this permit
    let docs = [];
    try {
      const docsResult = await pool.query(
        "SELECT * FROM uploaded_documents WHERE entity_type = 'permits' AND entity_id = $1",
        [req.params.id]
      );
      docs = docsResult.rows;
    } catch (e) { /* table may not exist yet */ }

    // Fetch any jurisdiction rules
    let jRules = [];
    try {
      const jResult = await pool.query(
        "SELECT * FROM jurisdiction_rules WHERE jurisdiction ILIKE $1 LIMIT 20",
        [`%${(permit.property_address || '').split(',').pop()?.trim() || ''}%`]
      );
      jRules = jResult.rows;
    } catch (e) {}

    const docsText = docs.length > 0
      ? docs.map(d => `- ${d.original_filename} (uploaded: ${d.created_at?.toISOString().split('T')[0]})`).join('\n')
      : 'No documents uploaded yet.';

    const jRulesText = jRules.length > 0
      ? jRules.map(r => `[${r.rule_type}] ${r.requirement}`).join('\n')
      : 'No specific jurisdiction rules on file.';

    const systemPrompt = `You are a senior building permit plan reviewer with expertise in IBC, IRC, and local municipal codes. Perform a comprehensive permit application review. Respond with JSON first:
{
  "overall_recommendation": "approve|approve_with_conditions|revise_and_resubmit|reject",
  "completeness_score": 0,
  "compliance_score": 0,
  "findings": [
    {
      "category": "...",
      "code_citation": "...",
      "finding_type": "deficiency|concern|recommendation|positive",
      "severity": "critical|major|minor|informational",
      "description": "...",
      "corrective_action": "..."
    }
  ],
  "required_corrections": ["..."],
  "conditions_of_approval": ["..."],
  "missing_documents": ["..."],
  "estimated_approval_timeline_days": 0,
  "summary": "..."
}
Then provide the full detailed review narrative.`;

    const userMsg = `PERMIT APPLICATION REVIEW

Project: ${permit.project_name}
Applicant: ${permit.applicant_name}
Address: ${permit.property_address}
Type: ${permit.permit_type}
Description: ${permit.description || 'Not provided'}
Estimated Cost: $${permit.estimated_cost || 'Not provided'}
Square Footage: ${permit.square_footage || 'Not provided'}
Current Status: ${permit.status}

SUBMITTED DOCUMENTS:
${docsText}

APPLICABLE JURISDICTION RULES:
${jRulesText}

Perform a thorough review with specific IBC/IRC code citations where applicable.`;

    const aiResult = await callOpenRouter(systemPrompt, userMsg);

    // Save to permit's ai_analysis field
    await pool.query(
      'UPDATE permit_applications SET ai_analysis = $1, updated_at = NOW() WHERE id = $2',
      [aiResult.result, permit.id]
    );

    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, '/api/ai/permits/:id/ai-review', 'permit_applications', permit.id, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json({ ...aiResult, permit_id: permit.id, documents_reviewed: docs.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/permits/:id/ai-appeal - Appeal assistant for rejected permits
router.post('/permits/:id/ai-appeal', aiRateLimiter, async (req, res) => {
  try {
    const permitResult = await pool.query('SELECT * FROM permit_applications WHERE id = $1', [req.params.id]);
    if (permitResult.rows.length === 0) return res.status(404).json({ error: 'Permit not found' });
    const permit = permitResult.rows[0];

    if (permit.status !== 'rejected' && permit.status !== 'Denied' && permit.status !== 'Revisions Required') {
      return res.status(400).json({ error: 'Appeal assistant is only available for rejected or denied permits' });
    }

    // Extract rejection reasons from status history
    const history = permit.status_history || [];
    const rejectionEntry = history.reverse().find(h => h.to === 'rejected' || h.to === 'Denied');
    const rejectionReason = rejectionEntry?.reason || req.body.rejection_reason || 'Reason not specified';
    const { additional_context } = req.body;

    const systemPrompt = `You are an expert permit appeals attorney. Draft a compelling appeal for a rejected permit application, citing specific code sections and precedents. Respond with JSON first:
{
  "appeal_strength": "strong|moderate|weak",
  "primary_arguments": ["..."],
  "code_references": [{"code": "...", "section": "...", "how_it_supports_appeal": "..."}],
  "supporting_evidence_needed": ["..."],
  "procedural_steps": ["..."],
  "timeline_to_appeal_days": 0,
  "estimated_success_probability": "low|medium|high",
  "alternative_solutions": ["..."]
}
Then provide the full draft appeal letter.`;

    const userMsg = `PERMIT APPEAL REQUEST

Project: ${permit.project_name}
Applicant: ${permit.applicant_name}
Address: ${permit.property_address}
Permit Type: ${permit.permit_type}
Description: ${permit.description || 'Not provided'}
Estimated Cost: $${permit.estimated_cost || 'Not provided'}

REJECTION REASON:
${rejectionReason}

ADDITIONAL CONTEXT FROM APPLICANT:
${additional_context || 'None provided'}

Draft appeal arguments and a formal appeal letter. Reference specific building codes (IBC, IRC, local municipal codes) that support the applicant's position. Identify any procedural errors in the rejection.`;

    const aiResult = await callOpenRouter(systemPrompt, userMsg);

    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, '/api/ai/permits/:id/ai-appeal', 'permit_applications', permit.id, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
    );

    res.json({ ...aiResult, permit_id: permit.id, rejection_reason: rejectionReason });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/auto-classify-permit
router.post('/auto-classify-permit', aiRateLimiter, async (req, res) => {
  try {
    const { project_description, scope_of_work, occupancy_type, project_value, jurisdiction } = req.body || {};
    if (!project_description) return res.status(400).json({ error: 'project_description required' });
    const systemPrompt = `You auto-classify building/zoning permit applications and route them to the right department. Return ONLY JSON:
{ "permit_type": string, "secondary_permits_required": [string], "routing_department": string, "ibc_use_group": string, "review_disciplines_needed": [string], "confidence": "low|medium|high", "rationale": string }`;
    const userMsg = `Project description: ${project_description}\nScope of work: ${scope_of_work || ''}\nOccupancy type: ${occupancy_type || 'unknown'}\nProject value: ${project_value || 'unknown'}\nJurisdiction: ${jurisdiction || 'general US municipality'}`;
    const aiResult = await callOpenRouter(systemPrompt, userMsg);
    try {
      await pool.query(
        `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.user.id, '/api/ai/auto-classify-permit', null, null, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
      );
    } catch {}
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/inspection-schedule-optimize
router.post('/inspection-schedule-optimize', aiRateLimiter, async (req, res) => {
  try {
    const { date_range, inspectors, pending_inspections } = req.body || {};
    let pending = pending_inspections;
    if (!pending) {
      try { const r = await pool.query('SELECT * FROM inspections WHERE status IN (\'pending\',\'scheduled\') ORDER BY scheduled_date ASC LIMIT 200'); pending = r.rows; } catch { pending = []; }
    }
    const systemPrompt = `You optimize building-permit inspection schedules. Return ONLY JSON:
{ "ranked_priorities": [{"inspection_id": any, "priority_score": number, "predicted_failure_probability": number, "reason": string}], "route_suggestions": [{"inspector": string, "ordered_inspections": [any], "estimated_drive_time_minutes": number}], "overall_recommendations": [string] }`;
    const userMsg = `Date range: ${date_range || 'next 5 business days'}\nInspectors: ${JSON.stringify(inspectors || [])}\nPending inspections: ${JSON.stringify(pending).slice(0, 6000)}`;
    const aiResult = await callOpenRouter(systemPrompt, userMsg);
    try {
      await pool.query(
        `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.user.id, '/api/ai/inspection-schedule-optimize', 'inspections', null, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
      );
    } catch {}
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/violation-severity-score
// Body: { violation_id?, violation_type?, code_section?, description?, property_address?, prior_violations? }
// If violation_id is supplied, looks up code_violations row first.
router.post('/violation-severity-score', aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
      return res.status(503).json({ error: 'AI not configured. Set OPENROUTER_API_KEY in .env.' });
    }

    let { violation_id, violation_type, code_section, description, property_address, prior_violations } = req.body || {};
    if (violation_id) {
      try {
        const r = await pool.query('SELECT * FROM code_violations WHERE id = $1', [violation_id]);
        if (r.rows.length > 0) {
          const v = r.rows[0];
          violation_type = violation_type || v.violation_type;
          code_section = code_section || v.code_section;
          description = description || v.description;
          property_address = property_address || v.property_address;
        }
      } catch { /* tolerate if table missing */ }
    }
    if (!violation_type && !description) {
      return res.status(400).json({ error: 'violation_type or description required (or supply a valid violation_id)' });
    }

    const systemPrompt = `You score code violations for severity, public-safety risk, and recommended escalation. Return ONLY JSON:
{
  "severity_score": number,
  "severity_band": "minor | moderate | serious | critical",
  "public_safety_risk": "low | medium | high",
  "escalation_recommendation": "warning | citation | fine | stop_work | emergency_action",
  "estimated_fine_range_usd": { "min": number, "max": number },
  "compliance_deadline_days": number,
  "key_factors": [string],
  "rationale": string
}`;
    const userMsg = `Violation type: ${violation_type || 'unspecified'}
Code section: ${code_section || 'unspecified'}
Property address: ${property_address || 'unspecified'}
Description: ${description || 'unspecified'}
Prior violations on this property: ${prior_violations || 'none reported'}

Score severity on a 1-10 scale (10 = imminent danger / stop-work justified).`;

    const aiResult = await callOpenRouter(systemPrompt, userMsg);

    try {
      await pool.query(
        `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.user && req.user.id, '/api/ai/violation-severity-score', 'code_violations', violation_id || null, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
      );
    } catch { /* tolerate */ }

    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/code-interpretation-assistant
router.post('/code-interpretation-assistant', aiRateLimiter, async (req, res) => {
  try {
    const { question, jurisdiction, code_section, project_context } = req.body || {};
    if (!question) return res.status(400).json({ error: 'question required' });
    const systemPrompt = `You answer plain-language questions about zoning and building codes. ALWAYS include a disclaimer that the answer is informational and the user should confirm with the local jurisdiction. Return ONLY JSON:
{ "summary_answer": string, "applicable_code_sections": [string], "key_considerations": [string], "ambiguities_or_assumptions": [string], "next_steps": [string], "disclaimer": string }`;
    const userMsg = `Jurisdiction: ${jurisdiction || 'general'}\nCode section (if known): ${code_section || ''}\nProject context: ${project_context || ''}\nQuestion: ${question}`;
    const aiResult = await callOpenRouter(systemPrompt, userMsg);
    try {
      await pool.query(
        `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result, result_json) VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.user.id, '/api/ai/code-interpretation-assistant', null, null, aiResult.result, aiResult.result_json ? JSON.stringify(aiResult.result_json) : null]
      );
    } catch {}
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
