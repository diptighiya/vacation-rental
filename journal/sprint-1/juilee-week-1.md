# Sprint 1, week 1: Juilee

**Date:** 2026-09-22 · **Sprint:** 1 (Foundations: schema, auth, API contract, wireframes)

## What I worked on

| Issue | Work | Status |
|---|---|---|
| #49 | Shared UI kit: `ListingCard`, `PhotoGallery`, `RatingStars` in `web/src/components/ui` | Pushed |
| #19–#23, #31 | Host screens built early on mock data: My listings, the add/edit listing form, host analytics | Pushed. Not wired into routes yet (see Blockers) |
| #1 | First draft of `docs/api-contract.md`: every endpoint, the error format, status codes, pagination, dates | Draft. Needs Dipti's and Shirisha's review |
| #2 | Spring Boot API in `api/`: PostgreSQL schema with Flyway migrations (V1 schema, V2 amenities), JPA entities checked against the schema, exclusion constraint against double booking, ER diagram in `docs/` | Done. Tests pass |
| #3 | Idempotent seed: 52 listings in 16 cities / 22 zips, 6 hosts, 24 customers, 1 admin, ~720 bookings over the last 90 days, ~200 reviews. Documented in `api/README.md` | Done. Tests pass |
| #6 | Host sign-up (with contact phone) and host login screens in `web/src/pages/host` | Pushed. Mocked until #4/#5 |
| #9 | Host wireframes (My listings, listing form, analytics) exported to `docs/wireframes/host/` | Done |
| #12 | README skeleton and this report | Done |

## What I'll work on next

- Sprint 2 host endpoints on top of the schema: `GET/POST/PUT /api/host/listings`,
  availability, amenities and photos (#19–#22), and soft delete (#23)
- Swap the mock data in the host pages for real API calls as those endpoints land
- Fold the review comments on the API contract (#1) into the doc

## Blockers

- **The web scaffold (#47) is not on `main` yet.** `web/` has no `package.json`, `App.tsx`,
  `Button`, `lib/types.ts` or `lib/mockData.ts`, so the host pages can't be routed and
  `npm run build` / `npm run lint` can't run. When it lands, the routes to add are
  `/host/listings`, `/host/listings/new`, `/host/listings/:id/edit` and `/host/analytics`
  (behind the host RoleGuard), plus `/host/register` and `/host/login` (public).
- The #6 check that "a customer token cannot access host routes (403)" depends on the JWT
  middleware in #5.
- `RegisterPage` lets people pick "Host" without a phone number, but the database requires
  one for hosts. Either link that option to `/host/register` or add a phone field there
  (Shirisha to decide).
