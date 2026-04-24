const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/permits', require('./routes/permits'));
app.use('/api/zoning', require('./routes/zoning'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/violations', require('./routes/violations'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/plan-review', require('./routes/planReview'));
app.use('/api/environmental', require('./routes/environmental'));
app.use('/api/setbacks', require('./routes/setbacks'));
app.use('/api/occupancy', require('./routes/occupancy'));
app.use('/api/fire-safety', require('./routes/fireSafety'));
app.use('/api/ada-compliance', require('./routes/adaCompliance'));
app.use('/api/stormwater', require('./routes/stormwater'));
app.use('/api/historical', require('./routes/historical'));
app.use('/api/noise', require('./routes/noise'));
app.use('/api/parking', require('./routes/parking'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
