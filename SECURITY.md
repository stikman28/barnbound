# Security Policy

BarnBound treats security as a design principle: every feature ships with its
abuse case considered — who could fake it, flood it, or deface it.

## Reporting a vulnerability

If you believe you've found a security issue in BarnBound, please email
**security@barn-bound.com** with:

- A description of the issue and its impact
- Steps to reproduce (a proof of concept is ideal)
- Any relevant URLs, request/response samples, or screenshots

Please **do not** open a public GitHub issue for security reports, and do not
access, modify, or delete data belonging to other users while investigating.

We'll acknowledge your report within 3 business days, keep you updated as we
investigate, and credit you (with your permission) when the fix ships.

## Scope

- `barn-bound.com` and this repository's application code (`web/`)
- Authentication, authorization, payments, and moderation flows are of
  particular interest

Out of scope: denial-of-service, spam/volume testing against production,
social engineering of BarnBound staff or members, and third-party services
(Cloudflare, PayPal, Azure) themselves.

## Current protections (summary)

- bcrypt password hashing; signed httpOnly session cookies (7-day, revocable
  via per-user session versioning)
- Email verification gates all content-creating actions; Cloudflare Turnstile
  at signup/login; rate limiting and login lockout with backoff
- Business-profile claims require proof and admin approval
- Community reporting with an admin moderation queue; append-only audit log
- Strict security headers (CSP, X-Frame-Options, nosniff, referrer policy)
- Zod validation on every write; Prisma parameterized queries; no card data
  ever touches BarnBound servers (PayPal-hosted payment flows)
