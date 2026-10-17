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

### Planned (Phase 1: Operational Stability, Startup Integrity & Immediate Security Quick Wins)
- Step 1.2: [AUD-OPS-002] Fail-fast server startup bootstrapping (`backend/server.js`).
- Step 1.3: [AUD-OPS-004] Startup environment schema validation (`backend/config/envValidator.js`).
- Step 1.4: [AUD-PERF-002] Expenditure compound index sort direction alignment (`backend/models/Expenditure.js`).
- Step 1.5: [AUD-SEC-002] Cron ingress secret fallback elimination (`backend/middleware/cronAuth.js`).
- Step 1.6: [AUD-SEC-007] Security headers mounting via Helmet (`backend/server.js`).
- Step 1.7: [AUD-SEC-009] Rate limiting on refresh & 2FA management (`backend/routes/auth.js`).
- Step 1.8: [SIMP-001] Purge abandoned legacy paycheck CRUD subsystem.
- Step 1.9: [SIMP-005] Eliminate duplicate route aliases across frontend & backend.
