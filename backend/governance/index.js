'use strict';
const { createRouter } = require('./router');
const { postgres } = require('./store');
const { evaluate } = require('./domain');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

module.exports = createRouter({
  db: postgres(pool), auth: authenticateToken, evaluate, workflow: 'permit-matter',
  providers: ['parcel-registry','gis','permit-registry','filing-gateway','document-store','fee-payment','inspection-scheduling','notifications'],
  approverRoles: ['permit_officer','zoning_reviewer','inspection_supervisor','records_officer','admin']
});
