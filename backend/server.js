const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '../.env' });

const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;
if ((process.env.JWT_SECRET || '').length < 32 || !process.env.GOVERNANCE_TENANT_ID) {
  throw new Error('JWT_SECRET (32+ characters) and GOVERNANCE_TENANT_ID are required');
}

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
if (process.env.ENABLE_GENERATED_ROUTES === 'true' && process.env.NODE_ENV !== 'production') {
  app.use('/api/integrations', authenticateToken, require('./routes/integrations'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/governed-permit-matters', require('./governance'));
if (process.env.ENABLE_GENERATED_ROUTES === 'true' && process.env.NODE_ENV !== 'production') {
  app.use('/api/cf-ai-plan-pre-screening', require('./routes/customFeat01_AiPlanPreScreening'));
  app.use('/api/cf-zoning-assistant-chatbot', require('./routes/customFeat02_ZoningAssistantChatbot'));
  app.use('/api/cf-inspection-routing-optimization', require('./routes/customFeat03_InspectionRoutingOptimization'));
  app.use('/api/cf-violation-escalation-scoring', require('./routes/customFeat04_ViolationEscalationScoring'));
  app.use('/api/cf-neighborhood-impact-analysis', require('./routes/customFeat05_NeighborhoodImpactAnalysis'));
}

// === Custom Views (mounted before any 404 handler) ===
app.use('/api/custom-views', require('./routes/customViews'));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
