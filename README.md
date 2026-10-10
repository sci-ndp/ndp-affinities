# NDP Affinities

NDP Affinities is the registry of the National Data Platform that records which
NDP Endpoints exist, which datasets and services they hold, how those are linked,
and "affinity triples" that group a dataset with endpoints and services. It is a
FastAPI + SQLAlchemy API on PostgreSQL with a React (Vite) web UI.

Current version: **0.3.1** (declared in `app/main.py`; see [CHANGELOG.md](CHANGELOG.md)).

Who writes to it:

- the **NDP Federation** registers every new NDP Endpoint with `POST /ep`;
- each **NDP Endpoint (ep-api)** with `AFFINITIES_ENABLED=true` registers its datasets
  and services and links them to itself.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the data model, every route and
the integrations, and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for tests,
migrations and releases. [docs/README.md](docs/README.md) indexes all documents.

> **The API has no authentication.** Every route, including create, update and
> delete, is open to anyone who can reach the port. Restrict access at the network
> or reverse-proxy level.

## Quick start with Docker Compose

Requirements: Docker with the Compose plugin.

```bash
docker compose up -d --build
```

| Service | Container | URL |
|---------|-----------|-----|
| PostgreSQL 16 | `ndp-affinities-db` | `localhost:5432` |
| pgAdmin | `ndp-affinities-pgadmin` | http://localhost:5050 |
| API | `ndp-affinities-api` | http://localhost:8000 (Swagger UI at http://localhost:8000/docs) |
| Web UI | `ndp-affinities-frontend` | http://localhost:3000 |

The database schema is created from `sql/migrations/*.sql`, which Compose mounts into
the PostgreSQL container's `/docker-entrypoint-initdb.d`. PostgreSQL runs those files
**only when the data volume is empty** (first start). Migrations added later are not
applied to an existing volume; see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#migrations).

Check that it works:

```bash
curl http://localhost:8000/health          # {"status":"ok"}
curl -X POST http://localhost:8000/ep \
  -H "Content-Type: application/json" \
  -d '{"kind": "ckan", "url": "https://demo.ckan.org"}'
curl http://localhost:8000/ep
```

Use paths without a trailing slash: `/ep/` answers with a redirect to `/ep`.

### Configuration (`docker-compose.yml`)

Compose reads an optional `.env` file next to `docker-compose.yml`
(`cp .env.example .env`). Every variable has a default.

| Variable | Default | Used by | Meaning |
|----------|---------|---------|---------|
| `POSTGRES_USER` | `affinities` | postgres, api | Database user (also builds the API's `DATABASE_URL`) |
| `POSTGRES_PASSWORD` | `affinities` | postgres, api | Database password |
| `POSTGRES_DB` | `affinities` | postgres, api | Database name |
| `POSTGRES_PORT` | `5432` | postgres | Host port |
| `PGADMIN_EMAIL` | `admin@admin.com` | pgadmin | pgAdmin login |
| `PGADMIN_PASSWORD` | `admin` | pgadmin | pgAdmin password |
| `PGADMIN_PORT` | `5050` | pgadmin | Host port |
| `API_PORT` | `8000` | api | Host port |
| `CORS_ORIGINS` | `*` | api | Allowed origins, comma-separated, or `*` |
| `ROOT_PATH` | api: empty, frontend: `/` | api, frontend | Path prefix the services are served under (see below) |
| `FRONTEND_PORT` | `3000` | frontend | Host port |
| `VITE_API_URL` | `http://localhost:8000` | frontend | API base URL the browser calls, read at container start |

The API container's `DATABASE_URL` is built by Compose from the `POSTGRES_*` values
(`postgresql://USER:PASSWORD@postgres:5432/DB`). A plain `postgresql://` URL is opened
with psycopg2 (`app/database.py`; fixed in 0.3.1 — before, builds with SQLAlchemy 2.1
failed at start).

`POSTGRES_*` only take effect when the volume is created. To change them later, change
them inside PostgreSQL or recreate the volume (`docker compose down -v` deletes all data).

### ROOT_PATH and reverse proxies

- **API**: `ROOT_PATH` is passed to FastAPI as `root_path` (`app/config.py`). The API
  still answers on `/` inside the container; the prefix is used for generated URLs,
  such as the OpenAPI URL that `/docs` loads. Set it to the prefix under which a
  reverse proxy publishes the API (the proxy must strip the prefix).
- **Web UI**: `frontend/entrypoint.sh` writes `config.js`
  (`window.__AFFINITIES_CONFIG__ = {rootPath, apiUrl}`) at container start, rewrites
  asset paths in `index.html` and generates an nginx config that serves the UI under
  `ROOT_PATH`. `VITE_API_URL` becomes `apiUrl`, the base URL of every API call made by
  the browser. Both are read at runtime; no rebuild is needed.

In `docker-compose.yml` both services read the same `ROOT_PATH` variable, so setting
it in `.env` prefixes both.

`deploy/nginx/vdc-192-affinity.conf` is the reverse-proxy file of an earlier
deployment (frontend at `/affinity/`, API at `/affinity-api/`, both prefixes stripped).
It was written before the runtime `ROOT_PATH` configuration (0.2.0) and is kept as an
example only.

### Production compose file

`docker-compose.prod.yml` has no pgAdmin, does not publish the PostgreSQL port and has no
defaults for `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` and `CORS_ORIGINS`.

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

As the file stands, it does not pass `ROOT_PATH` to the API, and it passes
`VITE_API_URL`/`VITE_BASE_PATH` to the frontend as build arguments, which
`frontend/Dockerfile` does not use. The frontend therefore starts with the entrypoint
defaults (`ROOT_PATH=/`, `VITE_API_URL=http://localhost:8000`).

## All-in-one image

`Dockerfile.allinone` builds one container with PostgreSQL 17, the API (uvicorn on
`127.0.0.1:8000`) and nginx on port 80, managed by supervisord. It is published to
Docker Hub as `rbardaji/ndp-affinities` (see [DOCKERHUB_README.md](DOCKERHUB_README.md)).

```bash
docker build -f Dockerfile.allinone -t ndp-affinities .
docker run -d --name affinities -p 80:80 \
  -v affinities-data:/var/lib/postgresql/data \
  ndp-affinities
```

| URL | What |
|-----|------|
| http://localhost/ | Web UI |
| http://localhost/api/... | API (nginx proxies to uvicorn, which runs with root path `/api`) |
| http://localhost/api/docs | Swagger UI |
| http://localhost/api/health | Health check |

| Variable | Default | Meaning |
|----------|---------|---------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `affinities` | Used on first start to create the role and database, and to build `DATABASE_URL` on every start |
| `CORS_ORIGINS` | `*` | As above |

`ROOT_PATH` is not used in this image: the API always runs with root path `/api`, the
path nginx serves it under, so `/api/docs` loads `/api/openapi.json` and redirects stay
under `/api` with the port the client used (since 0.3.3; up to 0.3.2 the container
needed `-e ROOT_PATH=/api` for Swagger, and its redirects lost `/api` and the port).

On first start (no `PG_VERSION` in the volume) `deploy/entrypoint.sh` runs `initdb`,
creates the role and database, and applies every `sql/migrations/*.sql` file in order.
Later starts skip all of that, so new migrations are not applied to an existing volume.

On every start `deploy/entrypoint.sh` also writes the web UI's `config.js`, pointing it
at this image's API under `/api` (since 0.3.2; before, the image had no `config.js` and the
UI called `http://localhost:8000` instead).

## Demo data

Two seeders write directly to the database through `DATABASE_URL` (they do not call the
API). Each marks its rows with a `source_ep` value, and `--reset` deletes the rows carrying
that marker before inserting.

```bash
# Small connected demo set (source_ep "demo-seed-ui-v1")
docker compose exec api python -m app.seed_demo_data [--reset]

# Larger synthetic graph (source_ep "demo-seed-power-v1")
docker compose exec api python -m app.seed_power_demo_data \
  [--reset] [--datasets 30] [--services 18] [--endpoints 20] [--seed 20260209]
```

`app/seed.py` is an identical copy of `app/seed_power_demo_data.py`.

## Local development and tests

```bash
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/pytest --cov=app --cov-report=term-missing
```

Tests use an in-memory SQLite database and need no running services. Running the API or
the web UI outside Docker, migrations and the release procedure are in
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## pgAdmin

Open http://localhost:5050 and log in with `PGADMIN_EMAIL` / `PGADMIN_PASSWORD`. The server
"affinities" is preconfigured from `pgadmin/servers.json` (host `postgres`, user and
maintenance database `affinities`); enter `POSTGRES_PASSWORD` when asked. If you change
`POSTGRES_USER` or `POSTGRES_DB`, edit `pgadmin/servers.json` to match.

## Useful commands

```bash
docker compose logs -f api
docker compose down          # stop, keep data
docker compose down -v       # stop and delete all data
docker exec -it ndp-affinities-db psql -U affinities -d affinities
```

## Repository layout

```
app/                    FastAPI application
  main.py               app, version, CORS, error handler, /health
  config.py             settings (DATABASE_URL, CORS_ORIGINS, ROOT_PATH)
  database.py           engine and session
  types.py              UUID, UUID-array and JSON column types (PostgreSQL and SQLite)
  models/ schemas/ routers/
  seed_demo_data.py     demo seeder
  seed_power_demo_data.py, seed.py   synthetic-graph seeder
sql/migrations/         numbered SQL files that create the schema
frontend/               React + Vite web UI, its Dockerfile, nginx config and entrypoint
deploy/                 all-in-one entrypoint, nginx and supervisord configs; nginx example
tests/                  pytest suite
pgadmin/servers.json    pgAdmin server definition
docs/                   architecture, development guide, API tutorial notebook
Dockerfile              API image (Python 3.12)
Dockerfile.allinone     all-in-one image
docker-compose.yml      development stack (with pgAdmin)
docker-compose.prod.yml production stack (without pgAdmin)
.github/workflows/docker-publish.yml   builds and publishes the all-in-one image on v* tags
```

## Related projects

- NDP Endpoint (ep-api): https://github.com/national-data-platform/ep-api
- NDP Federation: https://github.com/sci-ndp/ndp-federation
