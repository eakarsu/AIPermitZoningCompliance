const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '../.env' });

const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Ensure upload directories exist
const uploadDir = path.join(__dirname, 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public routes
app.use('/api/auth', require('./routes/auth'));

// Protected feature routes
app.use('/api/permits', authenticateToken, require('./routes/permits'));
app.use('/api/zoning', authenticateToken, require('./routes/zoning'));
app.use('/api/documents', authenticateToken, require('./routes/documents'));
app.use('/api/violations', authenticateToken, require('./routes/violations'));
app.use('/api/inspections', authenticateToken, require('./routes/inspections'));
app.use('/api/plan-review', authenticateToken, require('./routes/planReview'));
app.use('/api/environmental', authenticateToken, require('./routes/environmental'));
app.use('/api/setbacks', authenticateToken, require('./routes/setbacks'));
app.use('/api/occupancy', authenticateToken, require('./routes/occupancy'));
app.use('/api/fire-safety', authenticateToken, require('./routes/fireSafety'));
app.use('/api/ada-compliance', authenticateToken, require('./routes/adaCompliance'));
app.use('/api/stormwater', authenticateToken, require('./routes/stormwater'));
app.use('/api/historical', authenticateToken, require('./routes/historical'));
app.use('/api/noise', authenticateToken, require('./routes/noise'));
app.use('/api/parking', authenticateToken, require('./routes/parking'));
app.use('/api/ai', authenticateToken, require('./routes/aiHistory'));
app.use('/api/ai', authenticateToken, require('./routes/aiPermit'));
app.use('/api/jurisdiction-rules', authenticateToken, require('./routes/jurisdictionRules'));
app.use('/api/integrations', authenticateToken, require('./routes/integrations'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// === Custom Feature Mounts (batch_06) ===
app.use('/api/cf-ai-plan-pre-screening', require('./routes/customFeat01_AiPlanPreScreening'));
app.use('/api/cf-zoning-assistant-chatbot', require('./routes/customFeat02_ZoningAssistantChatbot'));
app.use('/api/cf-inspection-routing-optimization', require('./routes/customFeat03_InspectionRoutingOptimization'));
app.use('/api/cf-violation-escalation-scoring', require('./routes/customFeat04_ViolationEscalationScoring'));
app.use('/api/cf-neighborhood-impact-analysis', require('./routes/customFeat05_NeighborhoodImpactAnalysis'));


// === Batch 06 Gaps & Frontend Mounts ===
app.use('/api/gap-existing-aihistory-js-and-aipermit-js-stubs-need-r', require('./routes/gapFeat_existing_aihistory_js_and_aipermit_js_stubs_need_r'));
app.use('/api/gap-plans-without-plan', require('./routes/gapFeat_plans_without_plan'));
app.use('/api/gap-inspections-without-inspection', require('./routes/gapFeat_inspections_without_inspection'));
app.use('/api/gap-violations-without-violation', require('./routes/gapFeat_violations_without_violation'));
app.use('/api/gap-code-without-code', require('./routes/gapFeat_code_without_code'));
app.use('/api/gap-no-cad-gis-integration-plan-viewer-parcel-maps', require('./routes/gapFeat_no_cad_gis_integration_plan_viewer_parcel_maps'));
app.use('/api/gap-no-public-portal-online-permit-tracking-doc-submis', require('./routes/gapFeat_no_public_portal_online_permit_tracking_doc_submis'));
app.use('/api/gap-no-fee-calculation-engine', require('./routes/gapFeat_no_fee_calculation_engine'));
app.use('/api/gap-limited-integration-with-title-deed-records-integr', require('./routes/gapFeat_limited_integration_with_title_deed_records_integr'));
app.use('/api/gap-no-document-versioning-for-plans', require('./routes/gapFeat_no_document_versioning_for_plans'));
app.use('/api/gap-limited-frontend-only-7-pages-for-19', require('./routes/gapFeat_limited_frontend_only_7_pages_for_19'));
app.use('/api/gap-no-notifications-layer-grep-shows-only-1-mention', require('./routes/gapFeat_no_notifications_layer_grep_shows_only_1_mention'));
app.use('/api/gap-no-webhooks-for-inspection-scheduling-triggers', require('./routes/gapFeat_no_webhooks_for_inspection_scheduling_triggers'));
app.use('/api/gap-no-audit-log-only-1-audit-reference', require('./routes/gapFeat_no_audit_log_only_1_audit_reference'));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
