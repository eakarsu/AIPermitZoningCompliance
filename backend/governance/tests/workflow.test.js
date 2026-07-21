'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate } = require('../domain');

const valid = () => ({
  createdBy: 'applicant-1', legalAdvice: false,
  matter: { id: 'matter-1', owner: 'planner-1', jurisdiction: 'city-ny', scope: 'residential-addition', effectiveAt: '2026-07-18', retentionDays: 730, classification: 'public' },
  parcel: { parcelId: 'parcel-1', gisVersion: 'gis-v4', geometryRef: 'gis:shape:1', sourceRef: 'registry:parcel:1', sha256: 'a'.repeat(64), capturedAt: '2026-07-18T00:00:00Z' },
  zoningRules: [{ code: 'R2-SETBACK', jurisdiction: 'city-ny', effectiveFrom: '2026-01-01', sourceRef: 'code:r2:1', sha256: 'b'.repeat(64), capturedAt: '2026-07-18T00:00:00Z' }],
  checklist: { version: 'check-v3', items: [{ requirement: 'site-plan', owner: 'planner-1', evidenceRef: 'doc:plan:1', status: 'complete' }] },
  comments: [{ author: 'reviewer-2', createdAt: '2026-07-18T12:00:00Z', text: 'setback confirmed' }],
  fees: [{ scheduleVersion: 'fees-v2', amountCents: 12500, calculation: 'base permit fee' }],
  inspections: [{ type: 'foundation', inspector: 'inspector-1', scheduledAt: '2026-08-01T14:00:00Z', status: 'scheduled' }],
  decision: { outcome: 'approve', reason: 'requirements satisfied', evidenceRefs: ['doc:plan:1','code:r2:1'], decidedBy: 'officer-2', humanApproved: true, appealDeadline: '2026-08-18', appealRoute: 'zoning-board' },
  history: [{ event: 'submitted', actor: 'applicant-1', at: '2026-07-17T10:00:00Z' }],
  validation: { fixtureVersion: 'fixtures-v2', jurisdictions: ['city-ny','county-ny'], conflictCases: ['city-county-conflict'], deadlineCases: ['appeal-window'], adverseCases: ['denial'] }
});

test('accepts provenance-bound human-approved permit decision', () => assert.deepEqual(evaluate(valid()).errors, []));
test('blocks cross-jurisdiction rule and self-decision', () => { const input = valid(); input.zoningRules[0].jurisdiction = 'other-city'; input.decision.decidedBy = 'applicant-1'; assert.ok(evaluate(input).errors.length >= 2); });
