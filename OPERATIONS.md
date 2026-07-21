# Governed permit and zoning operations

## Intended use and limits

The governed API records scoped matters, parcel/GIS provenance, effective zoning rules, evidence-backed checklists, comments, versioned fees, inspections, human decisions, appeals, and history. It is not legal advice. Local authority decisions and current codes control; independent authorized review is required.

## Data and integrations

Signed tenant claims enforce matter boundaries. Parcel registry, GIS, permit registry, filing, document, fee-payment, inspection-scheduling, and notification operations use an approval-gated outbox with request-bound idempotency, bounded retry, dead letters, and reconciliation. Secrets and raw credentials never enter payloads. Privilege, classification, retention, and legal hold rules constrain export and erasure.

## Deploy, rollback, and recovery

Run `./start.sh check`, back up PostgreSQL and document/GIS stores, then use `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate`. Roll back code without dropping additive matter/audit tables. Restore verified backups, recalculate deadlines and fees, reconcile registry/inspection receipts, and replay only original outbox requests. Rotate JWT and provider credentials centrally and invalidate old tokens.

Alert on jurisdiction mismatch, code effective-date change, checklist gaps, inspection failure, adverse decisions, missed appeal deadlines, self-approval, dead letters, and incomplete erasure receipts.
