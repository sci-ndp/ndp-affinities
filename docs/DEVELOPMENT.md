# Development guide

How to run, test, change and release NDP Affinities. The architecture and the API are
described in [ARCHITECTURE.md](ARCHITECTURE.md).

## Local setup

### Full stack with Docker Compose

```bash
docker compose up -d --build
```

This starts PostgreSQL (`:5432`), pgAdmin (`:5050`), the API (`:8000`) and the web UI
(`:3000`); see the [README](../README.md) for variables and URLs. After changing Python code,
rebuild the API with `docker compose up -d --build api`; after changing the UI,
`docker compose up -d --build frontend`.

### API outside Docker

Python 3.12 (the version of `Dockerfile`).

```bash
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
docker compose up -d postgres          # or any PostgreSQL with the migrations applied
.venv/bin/uvicorn app.main:app --reload
```

The default `DATABASE_URL` is `postgresql://affinities:affinities@localhost:5432/affinities`,
which matches the Compose database with default credentials; export `DATABASE_URL`,
`CORS_ORIGINS` or `ROOT_PATH` to change it.

`app/config.py` also reads a `.env` file from the working directory and refuses to start
when that file contains keys other than its own settings. A `.env` copied from
`.env.example` (Compose variables) in the repository root therefore makes `uvicorn` and
`pytest` fail at import with `Extra inputs are not permitted`. Run them without such a file
in the working directory.

### Web UI outside Docker

Node 20 (the version of `frontend/Dockerfile`).

```bash
cd frontend
npm install
npm run dev        # Vite dev server, http://localhost:5173
npm run lint
npm run build      # tsc -b && vite build, output in frontend/dist
```

The dev server has no `config.js`, so the UI uses base path `/` and calls the API at
`http://localhost:8000`, which is where the Compose API or `uvicorn` listens. The API allows
all origins by default.

### Demo data

`app/seed_demo_data.py` and `app/seed_power_demo_data.py` (identical copy: `app/seed.py`)
insert demo records directly into the database; usage is in the [README](../README.md#demo-data).

## Tests

```bash
.venv/bin/pytest
.venv/bin/pytest --cov=app --cov-report=term-missing
```

- `tests/conftest.py` replaces the database dependency with an in-memory SQLite database
  (`StaticPool`) and creates the tables from the SQLAlchemy models for each test, so no
  service has to be running.
- One test file per router (`test_endpoints.py`, `test_datasets.py`, `test_services.py`,
  `test_dataset_endpoints.py`, `test_dataset_services.py`, `test_service_endpoints.py`,
  `test_affinities.py`, `test_linked.py`), plus `test_health.py` and
  `test_database_url.py` (the psycopg2 driver selection of `app/database.py`).
- SQLite runs neither the SQL migrations nor the PostgreSQL triggers, and the test engine
  does not enforce foreign keys, so cascades and `updated_at` triggers are only exercised
  against PostgreSQL.
- There is no CI for tests: the suite is run locally before opening a pull request. The only
  workflow, `.github/workflows/docker-publish.yml`, publishes images.

A check against PostgreSQL ("real test") is done with the Compose stack:
`docker compose up -d --build`, then exercise the changed routes with `curl` or `/docs`.
`docs/api_tutorial.ipynb` walks through every route and can be run against such a stack.

## Migrations

The schema lives in `sql/migrations/`, one numbered file per change
(`001_create_ndp_endpoint.sql` … `007_create_ndp_affinity_triple.sql`). To change it:

1. Add the next numbered file, e.g. `sql/migrations/008_<what>.sql`. Files run in name order.
2. Change the SQLAlchemy model in `app/models/` and the Pydantic schemas in `app/schemas/`
   to match; the tests build their tables from the models, not from the SQL.

How the files are applied:

- **Compose**: the directory is mounted at `/docker-entrypoint-initdb.d` of the PostgreSQL
  container, whose image runs the files only when it initialises an empty data volume.
- **All-in-one image**: `deploy/entrypoint.sh` runs every file with `psql` only when the
  volume has no `PG_VERSION` (first start), then grants the application role all privileges
  on the tables that exist at that moment.

There is no migration tool and no record of which files have been applied. On an existing
database a new file is not applied by either path; it has to be run by hand, for example:

```bash
# Compose
docker exec -i ndp-affinities-db psql -U affinities -d affinities < sql/migrations/008_x.sql

# All-in-one (tables are owned by the postgres superuser there; grant the app role access)
docker exec -i <container> su postgres -c "psql -d affinities" < sql/migrations/008_x.sql
docker exec <container> su postgres -c \
  "psql -d affinities -c 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO affinities;'"
```

## Change procedure

1. Open (or take) a GitHub issue describing the problem.
2. Branch from an up-to-date `main`: `fix/<issue>-<slug>` (or `feat/`, `docs/`, `ci/`).
3. Change the code and add or update tests; run `pytest` locally.
4. Do a real test against PostgreSQL with the Compose stack (and the all-in-one image when
   `Dockerfile.allinone` or `deploy/` changes).
5. For a release-worthy change, bump the version and add a `CHANGELOG.md` entry (see below).
6. Open a pull request to `main` referencing the issue. `main` is protected and requires one
   approving review.
7. Merge, then tag the release (below).

## Release procedure

1. Set the new version in `app/main.py` (`version="X.Y.Z"` in the `FastAPI(...)` call).
   It is the only place the version is declared; `frontend/package.json` stays at `0.0.0`.
2. In `CHANGELOG.md`, move the `[Unreleased]` entries under `## [X.Y.Z] - YYYY-MM-DD` and
   update the comparison links at the bottom.
3. Pull request, approval, merge to `main`.
4. Tag the merge commit and push the tag:

   ```bash
   git switch main && git pull --ff-only
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

5. The tag starts `.github/workflows/docker-publish.yml`, which:
   - fails if the tag differs from the version in `app/main.py`;
   - takes the release notes from the `## [X.Y.Z]` section of `CHANGELOG.md` (fails if it
     is missing or empty);
   - builds `Dockerfile.allinone` for `linux/amd64` and pushes `rbardaji/ndp-affinities:X.Y.Z`
     and `latest` (a version containing `-`, such as `0.4.0-rc1`, never moves `latest` and is
     marked as a prerelease);
   - runs the pushed image and checks that `/api/health` and `/` answer;
   - creates or updates the GitHub release `vX.Y.Z`.

   The workflow can also be started by hand (`workflow_dispatch`) for an existing tag, with
   the version and whether to move `latest`.

The workflow needs the repository secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`. They
are not configured yet, so no image has been published from CI; Docker Hub's newest tag is
`0.2.0` (also `latest`). The `v0.3.1` tag was created before the workflow existed; once the
secrets are set, 0.3.1 can be published with a manual run for version `0.3.1`.

The repository also has a tag `v1.0.0` on a January 2026 commit whose code declares
version 0.1.0; it does not correspond to a release in `CHANGELOG.md`.
