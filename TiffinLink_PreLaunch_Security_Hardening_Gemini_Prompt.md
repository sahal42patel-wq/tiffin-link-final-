# TiffinLink — Complete Pre-Launch Security Audit, Hardening & Verification Prompt for Gemini

## 1. Role and objective

Act as a senior application-security engineer, penetration tester, Node.js/Express security specialist, MongoDB security engineer, React security specialist, API security auditor, and AI-security reviewer.

I am developing **TiffinLink**, a food marketplace with customer, provider/home-chef/kitchen, delivery-partner, and administrator panels. It supports direct food orders, a request-and-offer marketplace, delivery assignment and GPS tracking, payments and refunds, ratings, provider verification, and AI-assisted provider matching/fraud detection where those integrations are actually enabled.

The current stack is expected to include React, Node.js, Express.js, MongoDB, and Mongoose. Inspect the actual repository and confirm the real architecture before making assumptions.

Your task is to **inspect the existing repository, conduct an evidence-based security review, implement verified missing controls, test the changes, and produce an honest report**. Do not merely give recommendations. Make safe, focused code changes where the codebase and available environment allow them.

Use the current OWASP Top 10 (2025), OWASP Application Security Verification Standard (ASVS), OWASP API Security guidance, and OWASP GenAI security guidance when relevant. These are review references, not a claim of formal certification. If online research is available, verify relevant requirements using official primary sources.

## 2. Existing security work to verify

Previous development notes report that the project has added or configured:

- Helmet security headers, including CSP/HSTS and anti-clickjacking protections.
- Rate limiting using `express-rate-limit`.
- NoSQL injection protection using `express-mongo-sanitize`.
- HTTP parameter pollution protection using `hpp`.
- Input-validation support using `validator`.
- Security middleware, reported as `securityMiddleware.js`.
- Authentication middleware, reported as `authMiddleware.js`.
- Central error handling, reported as `errorMiddleware.js`.
- Security audit logging for sensitive mutations.
- Authentication cookies with `HttpOnly` and `SameSite` settings.
- CORS configuration and server-header hardening.
- A reported request-body limit of 15 MB.
- Dependency auditing with `npm audit`.
- Some authorization fixes for orders, delivery tracking, Socket.IO rooms, pickup OTP disclosure, provider-setting mass assignment, and login input validation.

**Do not assume that any protection works just because a package is installed or a previous report says it was implemented.** Locate the actual files, check package versions and configuration, inspect middleware order and route coverage, and run relevant tests.

Do not unnecessarily duplicate middleware, replace the authentication design, or overwrite working TiffinLink business logic.

## 3. Mandatory operating rules

1. Inspect the existing repository and understand its architecture before editing.
2. Preserve working features and the current stack unless a justified security change requires otherwise.
3. Never display real `.env` values, API keys, signing secrets, database credentials, access tokens, session IDs, identity documents, payment details, or production user data in output or logs.
4. Do not run destructive testing, fuzzing, load testing, or penetration tests against production or any system without explicit authorization. Use a local or authorized staging environment with synthetic accounts and data.
5. Do not run destructive database migrations or commands without understanding their impact and protecting existing data.
6. Do not upgrade dependencies blindly or force incompatible versions merely to silence audit output.
7. Do not claim a control is working unless actual code and relevant tests/evidence support that claim.
8. If a test is blocked by unavailable credentials, external services, or infrastructure, report it as `BLOCKED` or `NOT RUN`, not `PASS`.
9. Distinguish recommendations from changes actually implemented and tests actually executed.
10. Do not claim TiffinLink is “100% secure” or formally OWASP-compliant without suitable independent verification.
11. Begin with an inventory of the application and a prioritized findings list, then continue to implement verified high-priority fixes where safe and possible.

## 4. OWASP security baseline

Use these OWASP Top 10 (2025) categories as a review structure:

- **A01:2025 — Broken Access Control**
- **A02:2025 — Security Misconfiguration**
- **A03:2025 — Software Supply Chain Failures**
- **A04:2025 — Cryptographic Failures**
- **A05:2025 — Injection**
- **A06:2025 — Insecure Design**
- **A07:2025 — Authentication Failures**
- **A08:2025 — Software or Data Integrity Failures**
- **A09:2025 — Security Logging and Alerting Failures**
- **A10:2025 — Mishandling of Exceptional Conditions**

For every applicable category, identify affected areas, inspect the implementation, record evidence, and run appropriate tests. Do not mark a category addressed only because generic middleware was added.

## 5. A01 — Broken access control and API authorization (highest priority)

Audit every sensitive API route, downloadable file, and WebSocket event for role permissions and resource ownership.

Test these TiffinLink cases:

- A customer changes an order ID to access another customer's order.
- A provider attempts to access another provider's menus, meal requests, earnings, payouts, customers, or private documents.
- A delivery partner accesses or updates another driver's delivery, route, GPS position, or earnings.
- A customer calls administrator, provider-only, or driver-only APIs.
- A provider attempts to set their own verification status, commission, or earnings.
- A driver attempts to mark another driver's delivery picked up or delivered.
- A corporate or hostel/PG user accesses another organization's information.
- An unverified provider performs operations that require approval.
- A user injects protected fields into an otherwise valid update request.
- An unauthorized user accesses private files through a guessed or shared URL.
- A socket client attempts to join another user's private Socket.IO room.

Required controls:

1. Enforce permissions in Express for every sensitive resource; hiding frontend buttons is not security.
2. Load resources and verify ownership/relationship permissions on the backend.
3. Use explicit allowlists for client-editable fields. Never blindly apply `req.body` to user, order, provider, driver, payment, or configuration models.
4. Enforce valid state transitions in services for orders, offers, delivery, payments, refunds, and account changes.
5. Secure private document downloads and WebSocket events, not just REST JSON responses.
6. Test object-level, property-level, and function-level authorization.
7. Return safe responses that do not leak private resource information.

Create an authorization matrix listing critical endpoints, permitted roles, resource ownership requirements, allowed fields/actions, valid state preconditions, and test evidence.

## 6. A07 — Authentication, sessions, and CSRF

Inspect the existing authentication design first. Do not replace it blindly.

Verify and implement as appropriate:

- Passwords use a suitable modern password-hashing algorithm and safe parameters; plaintext passwords are never stored or logged.
- Login, registration, OTP verification/resend, forgot-password, and password-reset routes have appropriate abuse controls.
- Rate limits consider relevant combinations of IP address, account identifier, and operation where appropriate; proxy/IP configuration must be correct.
- OTPs and reset tokens are cryptographically generated, safely stored, single-use, time-limited, and invalidated after successful use when appropriate.
- Responses avoid unnecessary account enumeration.
- Sessions/tokens can be revoked on logout, compromise, password change, or administrative action as required by the chosen design.
- If refresh tokens exist, review rotation, revocation, reuse detection, expiry, and storage.
- If cookies authenticate users, verify `HttpOnly`, `Secure` over production HTTPS, appropriate `SameSite`, narrow scope, and CSRF protection for state-changing operations. `SameSite` alone may not protect every workflow.
- If bearer tokens are used, review expiry, storage, revocation, and leakage risks. Do not combine incompatible authentication designs.
- Provide stronger authentication, preferably MFA, for administrators and high-privilege actions where practical.
- Require additional verification for sensitive changes such as payout details and security settings.
- Log relevant security events without logging secrets.

Review the reported limit of 25 attempts per 15 minutes instead of assuming it suits every route. Choose and document route-specific limits, test them, and avoid trivial account-lockout denial-of-service risks.

## 7. A02 — CORS, security headers, HTTPS, and configuration

Inspect:

- Explicit CORS allowlists for trusted frontend origins.
- Credential handling and allowed methods/headers.
- Helmet configuration and actual CSP behavior.
- `X-Content-Type-Options: nosniff`.
- Appropriate framing/anti-clickjacking protection.
- Referrer and Permissions policies where appropriate.
- Removal of unnecessary server-identifying headers.
- HTTPS and valid certificate configuration.
- HSTS configuration.
- Debug modes, permissive CORS, default credentials, open database ports, and test-only routes in production.
- Separation of development, staging, and production configurations.
- Reverse-proxy settings and correct `trust proxy` behavior.

CORS is not authorization; it does not replace authentication, resource ownership checks, or server-side permissions.

Do not blindly enable HSTS `includeSubDomains` or preload. Confirm HTTPS works on every affected domain/subdomain first. Configure `trust proxy` based on the actual trusted proxy topology; do not blindly set it to `true` or `1` without verifying the deployment path.

Test the actual application routes and integrations so CSP does not break maps, payments, login, or other required resources. Presence of security headers alone does not prove overall security.

## 8. A05 — Injection, XSS, NoSQL injection, and input validation

Review untrusted input from request bodies, route and query parameters, headers where relevant, filters/sorting, reviews, uploaded files, redirect URLs, and AI inputs.

Implement as appropriate:

- Explicit request-validation schemas and allowlisted fields.
- Type, range, length, nested-object, array-size, and identifier validation.
- Safe MongoDB query construction; never accept arbitrary MongoDB operators or raw client-supplied query objects.
- Review compatibility and actual use of `express-mongo-sanitize`; do not depend on sanitization alone.
- Avoid untrusted `$where`, arbitrary regular expressions, and expensive query behavior.
- Allowlist filter/sort fields and apply pagination/complexity limits.
- Safe structured database access; separately review any SQL or command execution if present.
- Safe React rendering, contextual output encoding, and a maintained rich-HTML sanitizer only where rich HTML is intentionally supported.
- Avoid unsafe `dangerouslySetInnerHTML` unless a documented, reviewed sanitization boundary exists.
- Safe URL and redirect handling.

Removing `<script>` tags is not a complete XSS defense. Do not silently mutate legitimate user data; reject invalid input with clear, safe validation errors.

Test NoSQL operators, XSS payloads, duplicate query parameters, extra JSON properties, malformed input, unsafe URLs, and expensive query attempts in local/staging only.

## 9. A04 — Cryptography and sensitive-data protection

Inventory personal and sensitive data processed by TiffinLink, including account details, addresses, precise GPS, identity/verification documents, password-reset/session material, payment references, payout information, support conversations, corporate memberships, and hostel/PG data.

Implement appropriate protections:

- HTTPS for public production traffic.
- Strong password hashing.
- Secrets held outside source code and frontend bundles.
- Encrypted database connections where supported.
- Appropriate storage encryption and field-level encryption for especially sensitive data where justified.
- Least-privilege access to sensitive collections and verification documents.
- Private file storage with authorized, short-lived access where appropriate.
- Redaction/minimization of personal data in logs.
- Data retention and deletion policies for GPS history, identity documents, logs, and support records.
- Safe key rotation and a response procedure for exposed secrets.

Do not store full payment-card details unnecessarily. Prefer the payment gateway's secure tokenized flow.

## 10. A03/A08 — Dependencies, software supply chain, and data integrity

### Dependency supply chain

Inspect `package.json`, lockfiles, direct/transitive dependencies, lifecycle scripts, build scripts, CI/CD configuration, deployment permissions, and repository history where available.

Run `npm audit` or the relevant package manager scan and triage actual findings. Update vulnerable packages using compatible versions where possible and test the application after changes. Avoid unnecessary breaking upgrades.

Search the repository/history for accidentally committed secrets using approved tooling. Never print secret values. If exposed secrets are found, recommend immediate rotation/revocation.

Review CI/CD permissions, build secrets, artifact integrity, trusted package sources, branch protection, and deployment credentials.

### Data integrity

Ensure only trusted backend workflows can set roles, verification status, payment/refund state, delivery assignment/completion, commission, earnings, fraud decisions, and organization approvals.

Use database constraints, atomic updates, validated state transitions, and idempotency as appropriate.

## 11. Payments and business-logic integrity

TiffinLink includes direct ordering, competing offers, delivery assignments, refunds, platform commission, and driver earnings. Treat these as high-risk operations.

Verify that:

1. Prices, quantities, discounts, taxes, delivery fees, commission, and earnings are calculated on the backend.
2. Payment webhooks use the gateway's signature-verification mechanism and suitable replay protections.
3. Duplicate webhooks/events cannot create duplicate financial operations.
4. A payment redirect is not treated as proof of successful payment.
5. Payment status and order status remain distinct and are safely reconciled.
6. Checkout/order creation is protected against duplicate submission.
7. Refunds require valid authorization and transaction state.
8. Coupon re-use is controlled according to policy.
9. Concurrent offer selection cannot create multiple winning orders where only one winner is allowed.
10. Concurrent driver acceptance cannot assign the same delivery to two drivers.
11. Drivers cannot earn payouts for invalid or uncompleted deliveries.
12. Partial failures between payment and order creation can be recovered/reconciled.
13. Financial changes have auditable records.

Test replayed webhooks, duplicate checkouts, manipulated amounts, repeated refunds, coupon abuse, concurrent offer selection, concurrent driver assignment, unauthorized payout changes, and stale order pricing. Use a payment-provider sandbox if available.

## 12. GPS, maps, and location privacy

Treat customer and driver locations as sensitive data.

- Authenticate all location updates and verify that the driver owns the active delivery.
- Validate coordinates, timestamps, and update frequency.
- Expose only the relevant current driver location to authorized participants in an active delivery.
- Restrict private Socket.IO location events to authorized rooms.
- Do not expose driver directories, home locations, or unnecessary historical journeys.
- Stop or reduce delivery-specific tracking after completion according to a documented policy.
- Define retention/deletion rules for location history.
- Handle stale GPS, permission denial, impossible jumps, and network loss honestly.
- Keep routing secrets server-side and restrict keys/quota.
- Do not fabricate GPS movement or ETAs.

Test unauthorized access to location updates, location history, routes, and WebSocket events.

## 13. File-upload security

TiffinLink may accept government IDs, provider certificates, food-license documents, profile photos, menu images, and kitchen photos.

Implement as appropriate:

- File-type-specific size limits.
- Explicit format allowlists.
- Server-side content/type inspection rather than trusting the extension or client MIME header.
- Safe generated filenames and path-traversal protection.
- Private storage outside executable/public web roots or a suitable private object store.
- Authorization on file downloads.
- Short-lived authorized access links where appropriate.
- Safe image processing with dimension, decompression, and processing-time limits.
- Malware scanning where suitable to the risk/deployment.
- No execution of uploaded files.
- Access logs for sensitive documents.
- Retention/deletion rules for expired or rejected documents.

Do not rely only on the global 15 MB body limit. Test malformed and oversized synthetic uploads in local/staging only.

## 14. A09 — Security logging, alerting, and incident response

Inspect the actual `securityAuditLogger` or equivalent. Verify event coverage, data captured, access permissions, retention, and whether alerts are really delivered.

Log relevant events, including:

- Repeated authentication failures and account recovery events.
- Password/MFA/role/payout-detail changes.
- Authorization denials and suspicious access patterns.
- Provider/driver verification changes.
- Offer-selection and delivery-assignment conflicts.
- Payment webhook failures and reconciliation anomalies.
- Unusual refunds/cancellations.
- Administrative actions and security configuration changes.
- Fraud alert review/resolution.
- Significant AI policy/validation failures where applicable.

Use appropriate timestamps, request/correlation IDs, authenticated actor ID, action, resource reference, outcome, and minimal context.

Never log passwords, raw OTPs, session tokens, authorization headers, full card details, private documents, or unnecessary precise GPS coordinates. Sanitize user-controlled values against log injection.

Configure actionable alerts for authentication anomalies, spikes in 401/403/429/5xx responses, privilege changes, webhook verification failures, suspicious refund/payout patterns, database/backup failures, abnormal API volume, and AI provider failures/cost spikes where AI exists.

Document who reviews alerts and how incidents are escalated. If monitoring is not configured, report the gap.

## 15. A10 — Error handling and exceptional conditions

Inspect `errorMiddleware.js` and critical workflows.

- Return correct HTTP status codes and consistent safe error bodies.
- Use request/correlation IDs.
- Do not expose stack traces, internal paths, MongoDB details, secrets, or dependency data to clients.
- Preserve actionable diagnostic context only in protected server logs.
- Provide safe field-validation messages.
- Handle database timeouts, external provider failures, network interruptions, expired sessions, unavailable routing/AI/payment services, and background-job failures.
- Never return success before the required persistent action succeeds or is explicitly represented as pending.
- Use safe retries and idempotency for financial/operational actions; do not blindly retry non-idempotent operations.
- Ensure partial failure between database changes and Socket.IO notification can recover, using a durable outbox/job mechanism where warranted.
- Show honest UI states for offline, payment pending, no match, route unavailable, and failed dispatch.

Do not claim secure error handling merely because central middleware exists; test it.

## 16. AI/GenAI security — only where AI is actually integrated

Inspect which AI functions are genuinely deployed. Do not describe rule-based scoring as a live AI model.

Where AI is used:

- Treat meal descriptions, provider descriptions, reviews, uploaded document text, support messages, and external content as untrusted inputs.
- Test and defend against prompt injection and instruction override.
- Do not give models unrestricted database, shell, payment, refund, or admin powers.
- Use least-privilege tools and allowlisted actions.
- Enforce backend authorization and deterministic business rules for all model-proposed actions.
- Validate model output with strict schemas and reject malformed/unexpected values.
- Never execute arbitrary database queries/commands produced by a model.
- Never let a model independently authorize payments, refunds, delivery completion, role changes, or account suspension.
- Minimize sensitive information sent to models and review provider retention/training terms.
- Add input/output size limits, timeouts, rate limits, quotas, spending alerts, and failure handling.
- Record necessary non-sensitive decision metadata for investigation.
- Keep fraud scoring explainable and require appropriate human review for consequential actions.

Test prompt injection, sensitive-data disclosure, unsafe tool use, invalid output, cost-abuse scenarios, and unavailable-model behavior. If AI is not connected, report these controls as future integration requirements, not as implemented protections.

## 17. MongoDB and backups

Verify that:

- Database authentication is enabled.
- Database users follow least privilege.
- Network access is restricted to trusted application hosts/services.
- TLS is configured where supported.
- Production and development databases are isolated.
- Indexes/unique constraints protect critical state.
- Transactions are used when required and supported.
- Trusted fields cannot be modified without authorized backend workflows.
- Backups, exports, and snapshots are protected.
- Restoration is tested in an isolated environment.
- Retention, deletion, and recovery objectives are documented.

Do not assume the database is safe because the application can connect to it.

## 18. Production configuration and secrets

Inspect actual `.env.example`, runtime configuration, deployment settings, and package versions without displaying secret values.

Verify:

- MongoDB URI and least-privilege credentials.
- JWT/session secret strength and rotation procedure.
- Trusted frontend origins.
- HTTPS and secure cookie configuration.
- Reverse-proxy/IP configuration.
- Payment gateway credentials and signed webhooks.
- Maps/routing provider keys.
- SMS/email/OTP provider configuration.
- Private file/object storage.
- Optional AI credentials.
- Background-job/queue durability.
- Socket.IO scaling if multiple backend instances are used.
- Logging and monitoring.
- Backup and retention configuration.

Use placeholders in `.env.example`; never commit real credentials. Validate required environment variables at startup without printing them.

Review CSP, HSTS, CORS, body-size limits, route-specific upload limits, rate limits, and timeouts against the actual production topology.

## 19. Security tests required

Run automated tests and safe manual checks in local/staging. Report every test as `PASS`, `FAIL`, `BLOCKED`, or `NOT RUN`.

### Authorization tests

- Customer accesses another customer's order.
- Provider accesses another provider's data.
- Driver accesses another driver's delivery.
- Non-admin calls admin APIs.
- Client mass-assigns protected fields.
- Cross-organization data access.
- Unauthorized file and WebSocket access.

### Authentication tests

- Login and OTP rate limits.
- OTP/password-reset expiry and reuse.
- Logout/session invalidation.
- Password change/session revocation.
- CSRF where applicable.
- Secure cookie behavior over HTTPS.
- Admin MFA where implemented.

### Injection and validation tests

- NoSQL operator payloads.
- Unexpected fields/nested objects.
- Invalid identifiers/statuses.
- XSS payloads in displayed content.
- Unsafe filter/sort attempts.
- Oversized request bodies/uploads.
- Malformed JSON and duplicate query parameters.

### Payments/business logic

- Invalid/replayed webhooks.
- Duplicate checkout/confirmation.
- Client-supplied amount manipulation.
- Duplicate refund.
- Coupon abuse.
- Concurrent offer selection.
- Concurrent driver assignment.
- Unauthorized delivery completion.
- Invalid status transitions.

### Location/uploads

- Unauthenticated GPS update.
- Driver updates another driver's location.
- Unrelated user accesses GPS history.
- Location access after delivery completion.
- Unauthorized identity-document access.
- Malformed/oversized uploads.

### AI tests, where applicable

- Prompt injection in descriptions/reviews.
- Attempt to override permissions.
- Malformed model output.
- Sensitive data in model outputs/logs.
- Model timeout and spending-limit behavior.
- Fraud risk leading to unauthorized automatic suspension.

### Deployment tests

- Actual security headers.
- No secrets in client bundles.
- Restricted database network access.
- Backup restore.
- Dependency findings triaged.
- Alerts reach the configured monitoring destination.

A successful build or the presence of headers does not prove a security test passed.

## 20. Severity and release priority

Prioritize based on evidence, exploitability, actual impact, affected users, and compensating controls.

- **P0 — Critical:** authentication bypass, exposed secrets, severe remote code execution, significant payment manipulation, broad private-data exposure, or publicly exposed identity documents. Stop release and fix immediately.
- **P1 — High:** broken authorization for orders/earnings, privilege escalation, unsafe payment webhooks, private GPS exposure, unsafe uploads, or exploitable high-impact dependencies. Fix before public launch unless an explicitly approved exception has effective mitigation.
- **P2 — Medium:** incomplete monitoring, excessive error detail, weak operational limits, or lower-impact data exposure. Prioritize based on real risk; material privacy/financial/safety issues must block launch regardless of label.
- **P3 — Low:** incremental improvements with limited demonstrated impact.

Do not assign severity solely from the category name.

## 21. Implementation phases

### Phase 1 — Inspect

Inspect the real repository, frontend/backend entry points, authentication, middleware, models, database, payment flow, uploads, Socket.IO, and deployment configuration. Identify what already works and what is missing.

### Phase 2 — Prioritize

Create a findings matrix with severity, evidence, affected files/routes, impact, recommended remediation, and verification test.

### Phase 3 — Remediate

Fix the most important verified gaps with focused, compatible changes. Preserve working functionality. Avoid duplicate middleware.

### Phase 4 — Verify

Run existing tests, add targeted security tests, repair failures, and rerun the tests after changes.

### Phase 5 — Deployment review

Review production configuration, backup restoration, monitoring/incident response, and remaining external-service requirements.

Do not run destructive tests against production.

## 22. Required final report

After the work, provide:

1. **Architecture inspected:** actual entry points, authentication design, database, and configured integrations.
2. **Existing controls verified:** evidence showing how each control works.
3. **Findings:** title, severity, affected area, evidence, impact, and safe reproduction steps.
4. **Changes made:** exact files changed and reasons.
5. **Tests executed:** actual commands, test names, results, and environment.
6. **Blocked/not-run tests:** explain missing services, credentials, or infrastructure.
7. **Dependency audit:** relevant findings and justified remediation.
8. **Configuration gaps:** missing production settings, without exposing secret values.
9. **Remaining risks:** what still needs to be addressed and why.
10. **Launch recommendation:** `NOT READY`, `READY FOR STAGING`, or `READY FOR PRODUCTION REVIEW`, supported by evidence.
11. **Next actions:** short prioritized list.

Clearly distinguish recommendations from code changes actually implemented. Never claim a vulnerability is fixed unless code and relevant tests/evidence support it.

## 23. Final instruction

Start by inspecting the existing TiffinLink repository and confirming the current working state. Review the actual security middleware, authentication, sessions, CORS, CSP, rate limits, NoSQL handling, audit logging, payment workflows, MongoDB configuration, file uploads, and sensitive APIs.

Create an evidence-based audit matrix mapped to OWASP Top 10 (2025), relevant ASVS controls, OWASP API security guidance, and GenAI security guidance where applicable.

Then implement the highest-priority verified gaps. Run the tests, fix failures, and report anything remaining.

**Do not stop after adding packages, setting headers, or writing recommendations. Inspect, implement, test, and report honestly. Protect TiffinLink's users, financial operations, personal data, and production systems throughout the process.**

## Official references

Use these as starting points and verify the relevant current versions:

- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- OWASP API Security: https://owasp.org/www-project-api-security/
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP GenAI Security Project: https://genai.owasp.org/
- OWASP Secrets Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- Express security best practices: https://expressjs.com/en/advanced/best-practice-security.html
- Express behind proxies: https://expressjs.com/en/guide/behind-proxies.html
- MongoDB security checklist: https://www.mongodb.com/docs/manual/administration/security-checklist/
- Node.js crypto documentation: https://nodejs.org/api/crypto.html
