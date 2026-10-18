# Changelog

All notable changes to the FinStat application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added - Phase 0: Test Harness & CI Bootstrap
- Step 0.1: [AUD-OPS-005 (Bootstrap)] Minimal GitHub Actions CI pipeline skeleton (`.github/workflows/ci.yml`) targeting Node 20.x on push and pull requests for `main` and `phase-*` branches.
- Step 0.2: [AUD-TEST-001 (Bootstrap)] In-memory MongoDB test database harness (`backend/tests/helpers/testDb.js`), auth fixture utilities (`backend/tests/helpers/authFixtures.js`), and package test script with `--detectOpenHandles` (`backend/package.json`).

### Changed - Phase 1: Operational Stability, Startup Integrity & Immediate Security Quick Wins
- Step 1.1: [AUD-OPS-001] Implemented serverless-aware bounded MongoDB connection pool sizing in `backend/config/db.js` defaulting to 1 connection in production/serverless (protecting Atlas limits against concurrent invocations), 10 in development, and respecting explicit bounds `[1, 100]`.
- Step 1.2: [AUD-OPS-002] Implemented fail-fast server startup bootstrapping via `startServer()` in `backend/server.js` ensuring connection resolution before listening, fatal termination on unreachable DB, and mounted `trust proxy` for reverse proxy client IP resolution.
- Step 1.3: [AUD-OPS-004] Implemented fail-fast startup environment schema validation via Zod in `backend/config/envValidator.js` validating `NODE_ENV`, `PORT` (with safe number coercion and 5000 fallback), `MONGO_URI`, `JWT_SECRET` (>=32 chars prod / >=8 dev), `CRON_SECRET` (>=16 chars), and `ENCRYPTION_KEY` (32-byte base64 string for AES-256 TOTP).
- Step 1.4: [AUD-PERF-002] Realigned Expenditure compound index sort direction to `{ user: 1, date: -1, _id: -1 }` in `backend/models/Expenditure.js` and applied idempotent migration `backend/migrations/20261015_210000_aud_perf_002_realign_expenditure_index.js` after verifying database backup snapshot.
- Step 1.5: [AUD-SEC-002] Eliminated hardcoded cron fallback secret in `backend/middleware/cronAuth.js`, enforced constant-time comparison via `crypto.timingSafeEqual`, and added dual-header support for `x-cron-secret` and Vercel Cron `Authorization: Bearer <token>`.
- Step 1.6: [AUD-SEC-007] Installed and mounted Helmet middleware in `backend/server.js` (`crossOriginResourcePolicy: false`) enforcing modern HTTP security headers (`nosniff`, `SAMEORIGIN`, `Referrer-Policy: no-referrer`).
- Step 1.7: [AUD-SEC-009] Mounted `authRateLimiter` middleware on `POST /api/auth/refresh` and `POST /api/auth/2fa/disable` in `backend/routes/auth.js` enforcing rate limits (HTTP 429 on 11th request/min).
- Step 1.8: [SIMP-001] Purged abandoned legacy paycheck CRUD subsystem files (`AddPaycheck.js`, `EditPaycheck.js`, `PaycheckForm.js`, `PaycheckListPage.js`) after verifying zero imports, zero route bindings in `App.js`, and clean production build.
- Step 1.9: [SIMP-005] Standardized duplicate route aliases: added permanent HTTP 308 redirect from `/api/salary-profile` to `/api/salary-profiles` in `backend/server.js` and standardized frontend legacy aliases (`/salary-profile`, `/paycheck-log`, `/trades/new`) to canonical paths via `<Navigate replace />` in `frontend/src/App.js`.

### Security & Hardening - Phase 2A: Auth & Session Hardening
- Step 2A.1: [AUD-SEC-001] Enforced Role-Based Access Control on singleton tax brackets by mounting `authorize(['admin'])` on `PUT /api/tax-brackets` in `backend/routes/taxBrackets.js`, blocking non-admin (`manager`/`viewer`) privilege escalation and unauthorized modification of global system tax configuration.
- Step 2A.2: [AUD-SEC-003] Eliminated privilege escalation and mass assignment vulnerabilities on profile updates by making `updateProfileSchema` `.strict()` in `backend/validationSchemas/userSchemas.js`, enforcing an explicit field whitelist in `backend/routes/users.js` (`PUT /api/users/profile` and `PUT /api/users/:id/profile`), and adding upfront uniqueness checks returning HTTP 409 Conflict for `username`, `email`, `nationalId`, and `employeeId`.
