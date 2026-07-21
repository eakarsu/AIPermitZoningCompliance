'use strict';

const present = (value) => typeof value === 'string' && value.trim().length > 0;
const source = (value) => value && present(value.sourceRef) && present(value.sha256) && /^[a-f0-9]{64}$/i.test(value.sha256) && present(value.capturedAt);

function evaluate(input) {
  const errors = [];
  const matter = input.matter || {};
  if (!present(matter.id) || !present(matter.owner) || !present(matter.jurisdiction) || !present(matter.scope)) errors.push('owned scoped permit matter is required');
  if (!present(matter.effectiveAt) || !Number.isInteger(matter.retentionDays) || matter.retentionDays < 1 || matter.retentionDays > 3650) errors.push('effective date and bounded retention are required');
  if (!['confidential','public','privileged'].includes(matter.classification)) errors.push('matter classification is required');

  const parcel = input.parcel || {};
  if (!present(parcel.parcelId) || !present(parcel.gisVersion) || !present(parcel.geometryRef) || !source(parcel)) errors.push('versioned, checksummed parcel/GIS provenance is required');
  if (!Array.isArray(input.zoningRules) || input.zoningRules.length < 1 || input.zoningRules.some((r) => !present(r.code) || !present(r.jurisdiction) || !present(r.effectiveFrom) || !source(r))) errors.push('effective jurisdictional zoning rules with source evidence are required');
  if ((input.zoningRules || []).some((r) => r.jurisdiction !== matter.jurisdiction)) errors.push('zoning rule jurisdiction must match the matter');

  const checklist = input.checklist || {};
  if (!present(checklist.version) || !Array.isArray(checklist.items) || checklist.items.length < 1 || checklist.items.some((i) => !present(i.requirement) || !present(i.owner) || !present(i.evidenceRef) || !['complete','exception','not-applicable'].includes(i.status))) errors.push('versioned, owned evidence-backed checklist is required');
  if (!Array.isArray(input.comments) || input.comments.some((c) => !present(c.author) || !present(c.createdAt) || !present(c.text))) errors.push('attributed review comments are required');
  if (!Array.isArray(input.fees) || input.fees.some((f) => !present(f.scheduleVersion) || !Number.isInteger(f.amountCents) || f.amountCents < 0 || !present(f.calculation))) errors.push('versioned cent-based fee calculations are required');
  if (!Array.isArray(input.inspections) || input.inspections.some((i) => !present(i.type) || !present(i.inspector) || !present(i.scheduledAt) || !['scheduled','passed','failed','cancelled'].includes(i.status))) errors.push('owned inspection lifecycle is required');

  const decision = input.decision || {};
  if (!['approve','deny','request-changes'].includes(decision.outcome) || !present(decision.reason) || !Array.isArray(decision.evidenceRefs) || decision.evidenceRefs.length < 1) errors.push('evidence-backed permit decision is required');
  if (!present(decision.decidedBy) || decision.decidedBy === input.createdBy || decision.humanApproved !== true) errors.push('independent authorized human decision is required');
  if (!present(decision.appealDeadline) || !present(decision.appealRoute)) errors.push('appeal deadline and route are required');
  if (input.legalAdvice === true) errors.push('workflow must be labelled non-legal-advice');
  if (!Array.isArray(input.history) || input.history.length < 1 || input.history.some((h) => !present(h.event) || !present(h.actor) || !present(h.at))) errors.push('append-only decision history is required');

  const validation = input.validation || {};
  if (!present(validation.fixtureVersion) || !Array.isArray(validation.jurisdictions) || validation.jurisdictions.length < 2 || !Array.isArray(validation.conflictCases) || validation.conflictCases.length < 1) errors.push('versioned multi-jurisdiction and conflict fixtures are required');
  if (!Array.isArray(validation.deadlineCases) || validation.deadlineCases.length < 1 || !Array.isArray(validation.adverseCases) || validation.adverseCases.length < 1) errors.push('deadline and adverse-decision fixtures are required');

  return {
    errors,
    result: { matterId: matter.id, parcelId: parcel.parcelId, outcome: errors.length ? 'blocked' : decision.outcome, appealDeadline: decision.appealDeadline || null },
    assumptions: ['Compliance support is not legal advice and local authority review controls'],
    uncertainty: { jurisdictionalChangeRisk: true, externalRegistryReconciliationRequired: true }
  };
}

module.exports = { evaluate };
