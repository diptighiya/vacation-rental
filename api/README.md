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

## Tests

```bash
./mvnw test
```

The tests start a real embedded PostgreSQL 17, so no Docker is needed. They check:

- the migrations build every table on an empty database, and the JPA entities match the schema
- the database rejects double bookings, unknown statuses and hosts without a phone

## Layout

```
api/
  src/main/java/dev/stayfinder/api/
    domain/     JPA entities shared by every slice (User, Listing, Booking, Review, ...)
  src/main/resources/
    db/migration/   Flyway scripts. Add a new V<n>__name.sql; never edit a pushed one.
    application.yml
```
