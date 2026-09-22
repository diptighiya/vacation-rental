# StayFinder API

Spring Boot 4 on Java 17+, PostgreSQL 17, and Flyway for migrations. The schema is described in
[docs/database.md](../docs/database.md) and the endpoints in
[docs/api-contract.md](../docs/api-contract.md).

## Prerequisites

- JDK 17 or newer (`java -version`). You don't need Maven: `./mvnw` downloads the right version.
- Docker, for the local database. The tests don't need it.

On Windows, use `mvnw.cmd` instead of `./mvnw`.

## Run it

```bash
cd api
docker compose up -d                                        # Postgres 17 on localhost:5432
./mvnw spring-boot:run -Dspring-boot.run.profiles=migrate   # apply migrations to a fresh DB, then exit
./mvnw spring-boot:run -Dspring-boot.run.profiles=seed      # load demo data, then exit (see below)
./mvnw spring-boot:run                                      # start the API on :8080
```

Every start applies pending migrations first. The `migrate` profile does only that.

## Configuration

Everything comes from environment variables. The defaults match `compose.yaml`.

| Variable | Default | Used for |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/stayfinder` | JDBC URL |
| `DB_USERNAME` / `DB_PASSWORD` | `stayfinder` / `stayfinder` | Database login |
| `PORT` | `8080` | HTTP port |
| `SEED_ADMIN_EMAIL` | `admin@stayfinder.dev` | Admin account the seed creates |
| `SEED_ADMIN_PASSWORD` | *(empty)* | Admin password. When empty, the seed generates one and prints it once. |
| `SEED_DEMO_PASSWORD` | `demo1234` | Password for every seeded host and customer |
| `SEED_RESET` | `false` | `true` deletes all users, listings, bookings and reviews before seeding |

## Seed data (issue #3)

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=seed
```

This loads:

- **1 admin**, **6 hosts** and **24 customers**
- **52 listings** in **16 cities / 22 zip codes** (Bay Area, LA, San Diego, Tahoe, wine country,
  Portland, Seattle, Sedona, Denver, Austin and Brooklyn), with coordinates, 2–5 photos,
  amenities from the predefined list, house hours and availability windows
- a status mix for the admin queue: 41 approved, 7 pending (two have no photos and one has
  no coordinates, so the incomplete-listing flag in #25 has something to catch) and 4
  removed (three by an admin with a reason, one by its host)
- about 700 bookings, placed from 100 days ago to 60 days ahead so the 30/60/90-day
  analytics differ. About 10% are cancelled, a few were made "today" for the
  booked-today badge, and removed listings keep their future stays so #23 can flag them.
  Every booking follows the booking rules: guests ≤ max, 1–14 nights, inside an
  availability window, and total = nights × price.
- about 200 reviews, only on completed, confirmed stays

The dates are relative to the day you first run it.

**Demo logins** (password `demo1234` unless you set `SEED_DEMO_PASSWORD`). These match the
demo accounts on the web login page:

| Role | Email |
|---|---|
| Customer | `sam.customer@stayfinder.dev` |
| Host | `nina.host@stayfinder.dev` (also `marcus.host@`, `elena.host@`, `tom.host@`, `priya.host@`, `jordan.host@`) |
| Admin | `admin@stayfinder.dev`, with the password from `SEED_ADMIN_PASSWORD` or the one printed on first run |

The admin password is never stored in the repo (#7).

**Idempotent.** Every seeded row has a fixed ID and is inserted with
`ON CONFLICT DO NOTHING`. Running the seed again inserts nothing and changes nothing: the log
says `inserted 0 new rows`, and an existing admin password stays as it is. To move the
dates up to today, for example before a demo, wipe and reseed:

```bash
SEED_RESET=true ./mvnw spring-boot:run -Dspring-boot.run.profiles=seed
```

`SEED_RESET` deletes every user, listing, booking and review, including ones created through
the app. Only use it on a local or demo database.

## Tests

```bash
./mvnw test
```

The tests start a real embedded PostgreSQL 17, so no Docker is needed. They check:

- the migrations build every table on an empty database, and the JPA entities match the schema
- the database rejects double bookings, unknown statuses and hosts without a phone
- the seed meets the #3 targets, follows the booking rules, and changes nothing when run twice

## Layout

```
api/
  src/main/java/dev/stayfinder/api/
    domain/     JPA entities shared by every slice (User, Listing, Booking, Review, ...)
    seed/       DatabaseSeeder and its data (the seed profile)
  src/main/resources/
    db/migration/   Flyway scripts. Add a new V<n>__name.sql; never edit a pushed one.
    application.yml
```
