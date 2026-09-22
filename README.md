# StayFinder

A vacation rental marketplace. Customers search and book stays, hosts list and manage their
rentals, and admins approve listings and watch platform analytics.

**Team:** _team name to be added_

| Member | GitHub | Slice |
|---|---|---|
| Dipti | [@diptighiya](https://github.com/diptighiya) | Admin, infrastructure and CI/CD |
| Shirisha | [@shirisha456](https://github.com/shirisha456) | Customer |
| Juilee | [@juileegiramkar](https://github.com/juileegiramkar) | Host, database and seed data |

## Links

- **Sprint board:** [milestones](https://github.com/diptighiya/vacation-rental/milestones)
  ([Sprint 1](https://github.com/diptighiya/vacation-rental/milestone/1)) and
  [issues](https://github.com/diptighiya/vacation-rental/issues)
- **Weekly scrum reports:** [journal/](journal/)
- **API contract:** [docs/api-contract.md](docs/api-contract.md)
- **Database schema and ER diagram:** [docs/database.md](docs/database.md)
- **Wireframes:** [docs/wireframes/](docs/wireframes/)

## Repository layout

| Folder | What's in it |
|---|---|
| `web/` | React + TypeScript + Vite frontend (see `web/README.md`) |
| `api/` | Spring Boot API and PostgreSQL migrations and seed data (see [api/README.md](api/README.md)) |
| `docs/` | API contract, database design and wireframes |
| `journal/` | Weekly scrum reports, one file per member per week |

## Getting started

```bash
# API and database
cd api
docker compose up -d
./mvnw spring-boot:run -Dspring-boot.run.profiles=seed   # migrate and load demo data
./mvnw spring-boot:run                                   # http://localhost:8080

# Web
cd web
npm install
npm run dev                                              # http://localhost:5173
```
