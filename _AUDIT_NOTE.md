# Audit Apply Note — AIPermitZoningCompliance

Source: `_AUDIT/reports/batch_06.md` section 14.

## Discrepancy with Audit
The audit reported "0 AI endpoints" but the project actually has working AI under `routes/aiPermit.js` (`/fee-estimate`, `/permits/:id/ai-review`, `/permits/:id/ai-appeal`) mounted at `/api/ai`.

## Original Recommendations
### Missing AI counterparts
- `/auto-classify-permit`
- `/plan-review-ai` (a partial equivalent exists as `/permits/:id/ai-review`)
- `/inspection-schedule-optimize`
- `/violation-severity-score`
- `/code-interpretation-assistant`

### Missing non-AI
- CAD/GIS plan viewer; public portal; fee calculation engine; title/deed integration; doc management/versioning

### Custom suggestions
- AI plan pre-screening; zoning chatbot; inspection routing optimization; violation escalation scoring; neighborhood impact analysis

## Implemented
Added three endpoints in `backend/routes/aiPermit.js`:
- `POST /api/ai/auto-classify-permit`
- `POST /api/ai/inspection-schedule-optimize`
- `POST /api/ai/code-interpretation-assistant`

Reused `callOpenRouter`, `aiRateLimiter`, and `ai_results` table.

## Backlog
| Item | Tag |
|---|---|
| `/violation-severity-score` | MECHANICAL |
| CAD/GIS plan viewer | NEEDS-PRODUCT-DECISION |
| Public permit portal | NEEDS-PRODUCT-DECISION |
| Title/deed integration | NEEDS-CREDS |
| Document version management | MECHANICAL but multi-file |
| Neighborhood impact GIS analysis | NEEDS-CREDS |

## Apply pass 3 (frontend)

**Action:** LEFT-AS-IS — FE already wired.

Inspection: `frontend/src/pages/AIPredictive.js` exposes all three endpoints added in apply pass 2 (`/auto-classify-permit`, `/inspection-schedule-optimize`, `/code-interpretation-assistant`) through a feature picker, calling `/api/ai/<endpoint>` via `frontend/src/api.js` (axios with bearer token from `localStorage`). `FeeCalculator.js` calls `/api/ai/fee-estimate`. `AIHistory.js` calls `/api/ai/history`. `FeaturePage.js` provides the per-permit `ai-review` / `ai-appeal` actions. All routes mounted in `App.js`. No new FE files needed.

## Apply pass 4 (mechanical backlog)

**Action:** IMPLEMENTED — the only MECHANICAL backlog item.

**Features added (1):**

| # | Item | BE | FE |
|---|------|----|----|
| 1 | Violation Severity Score — `POST /api/ai/violation-severity-score` | `backend/routes/aiPermit.js` | `frontend/src/pages/AIPredictive.js` (new "severity" tab) |

The endpoint accepts either a `violation_id` (looks up `code_violations` row) or free-form fields (`violation_type`, `code_section`, `description`, `property_address`, `prior_violations`). Returns structured JSON: severity score, severity band, public-safety risk, escalation recommendation, estimated fine range, compliance deadline, key factors, rationale. **HTTP 503** is returned at the top of the handler if `OPENROUTER_API_KEY` is unset or still the placeholder. Reuses `callOpenRouter`, `aiRateLimiter`, and the existing `ai_results` table; auth-gated via the `/api/ai` mount in `server.js`.

The FE adds a fourth tool button to `AIPredictive.js` ("Violation Severity Score") with its own form, plus 503-aware error handling in the shared `run()` function.

**Smoke test:** PARTIAL. `node --check` PASS on backend; esbuild PASS on FE. Live HTTP smoke skipped because `backend/routes/permits.js:266` has a pre-existing syntax error that prevents `server.js` from loading (out of scope per "don't touch working code"). Verified via `require('./backend/routes/aiPermit')` that `POST /violation-severity-score` is registered alongside the other 6 routes.

**Backlog deferred:** CAD/GIS plan viewer (NEEDS-PRODUCT-DECISION), public permit portal (NEEDS-PRODUCT-DECISION), title/deed integration (NEEDS-CREDS), document version management (multi-file MECHANICAL — out of cap), neighborhood impact GIS analysis (NEEDS-CREDS).
