# Architecture

This document describes NDP Affinities 0.3.1 as implemented in this repository.

## Components

| Component | Code | Runs as |
|-----------|------|---------|
| API | `app/` (FastAPI, SQLAlchemy 2, Pydantic 2) | `Dockerfile` (Python 3.12, uvicorn on port 8000) |
| Database | `sql/migrations/*.sql` (PostgreSQL) | `postgres:16-alpine` in Compose; PostgreSQL 17 in the all-in-one image |
| Web UI | `frontend/` (React 19, React Router, axios, Vite) | `frontend/Dockerfile` (nginx serving the built files) |
| All-in-one image | `Dockerfile.allinone`, `deploy/` | one container with PostgreSQL, uvicorn and nginx under supervisord |

```mermaid
flowchart LR
  FED[NDP Federation] -- "POST /ep" --> API
  EP[NDP Endpoint ep-api] -- "POST /datasets, /services,\n/dataset-endpoints, /service-endpoints,\n/affinities; GET /ep/{uid}" --> API
  UI[Web UI in the browser] -- "REST (axios)" --> API
  API[Affinities API] -- SQLAlchemy / psycopg2 --> DB[(PostgreSQL)]
```

The API is stateless; all state is in PostgreSQL. There are no background jobs and no
outgoing calls: Affinities never contacts the Federation or the Endpoints.

## Authentication

There is none. No route has a security dependency, and the API does not read any token,
key or user. Any client that can reach the API can create, modify and delete every record.
CORS is configured with `allow_origins` from `CORS_ORIGINS` (default `*`),
`allow_credentials=True`, and all methods and headers allowed (`app/main.py`).

## Data model

The schema is created by the SQL files in `sql/migrations/`, applied in file-name order.
The SQLAlchemy models in `app/models/` mirror it; the models do not create tables in
PostgreSQL (only the tests call `Base.metadata.create_all`, on SQLite).

```mermaid
erDiagram
  ndp_endpoint {
    UUID uid PK
    TEXT kind "NOT NULL"
    TEXT url
    TEXT source_ep
    JSONB metadata
    TIMESTAMPTZ created_at
    TIMESTAMPTZ updated_at
  }
  ndp_dataset {
    UUID uid PK
    TEXT title
    TEXT source_ep
    JSONB metadata
    TIMESTAMPTZ created_at
    TIMESTAMPTZ updated_at
  }
  ndp_service {
    UUID uid PK
    TEXT type
    TEXT openapi_url
    TEXT version
    TEXT source_ep
    JSONB metadata
    TIMESTAMPTZ created_at
    TIMESTAMPTZ updated_at
  }
  ndp_dataset_endpoint {
    UUID dataset_uid PK,FK
    UUID endpoint_uid PK,FK
    TEXT role
    JSONB attrs
    TIMESTAMPTZ created_at
  }
  ndp_dataset_service {
    UUID dataset_uid PK,FK
    UUID service_uid PK,FK
    TEXT role
    JSONB attrs
    TIMESTAMPTZ created_at
  }
  ndp_service_endpoint {
    UUID service_uid PK,FK
    UUID endpoint_uid PK,FK
    TEXT role
    JSONB attrs
    TIMESTAMPTZ created_at
  }
  ndp_affinity_triple {
    UUID triple_uid PK
    UUID dataset_uid FK
    UUID_ARRAY endpoint_uids "no FK"
    UUID_ARRAY service_uids "no FK"
    JSONB attrs
    INT version
    TIMESTAMPTZ created_at
    TIMESTAMPTZ updated_at
  }
  ndp_dataset ||--o{ ndp_dataset_endpoint : ""
  ndp_endpoint ||--o{ ndp_dataset_endpoint : ""
  ndp_dataset ||--o{ ndp_dataset_service : ""
  ndp_service ||--o{ ndp_dataset_service : ""
  ndp_service ||--o{ ndp_service_endpoint : ""
  ndp_endpoint ||--o{ ndp_service_endpoint : ""
  ndp_dataset |o--o{ ndp_affinity_triple : ""
```

| Migration | Creates |
|-----------|---------|
| `001_create_ndp_endpoint.sql` | `ndp_endpoint`, the function `update_updated_at_column()` and its trigger on `ndp_endpoint` |
| `002_create_ndp_dataset.sql` | `ndp_dataset` and its `updated_at` trigger |
| `003_create_ndp_service.sql` | `ndp_service` and its `updated_at` trigger |
| `004_create_ndp_dataset_endpoint.sql` | `ndp_dataset_endpoint`, indexes on both columns |
| `005_create_ndp_dataset_service.sql` | `ndp_dataset_service`, indexes on both columns |
| `006_create_ndp_service_endpoint.sql` | `ndp_service_endpoint`, indexes on both columns |
| `007_create_ndp_affinity_triple.sql` | `ndp_affinity_triple`, its `updated_at` trigger, index on `dataset_uid` |

Keys and relations:

- The three entity tables have a `uid UUID` primary key with `DEFAULT gen_random_uuid()`.
- The three link tables have a composite primary key of their two UUIDs, and both columns
  are foreign keys with `ON DELETE CASCADE`. Deleting a dataset, endpoint or service
  deletes its link rows.
- `ndp_affinity_triple.dataset_uid` is a nullable foreign key to `ndp_dataset` with
  `ON DELETE CASCADE`: deleting a dataset deletes its triples.
- `endpoint_uids` and `service_uids` are plain `UUID[]` columns without foreign keys.
  Deleting an endpoint or service leaves its UUID inside existing triples.
- `updated_at` is maintained by `BEFORE UPDATE` triggers in PostgreSQL. Link tables have
  only `created_at`.
- There are no unique constraints besides the primary keys: the same URL or title can be
  registered any number of times, and so can identical triples.

`app/types.py` maps `UUID`, `UUID[]` and `JSONB` to `String(36)` / JSON text on other
databases, which is what lets the tests run on SQLite.

## Identifiers (the uid fields)

- Every `uid` and `triple_uid` is generated by the API (`uuid.uuid4()` as the model
  default) when the record is created. The create schemas have no `uid` field, so a client
  cannot choose it; an extra `uid` in the body is ignored. The column default
  `gen_random_uuid()` applies only to rows inserted with SQL directly.
- Clients keep the UUID returned by the `POST` and use it for every later reference. The
  ep-api stores the dataset UUID it gets back as `ndp_affinity_uuid` on its own dataset.
- `source_ep` is free text. The ep-api writes its own Affinities endpoint UUID there for
  datasets and services; the seeders write a marker string. For endpoints, `source_ep` is
  returned by the API but cannot be set or changed through it (removed from the create
  schema in 0.1.1, never in the update schema), so it is `null` for endpoints created
  through the API.
- `metadata` (entities) and `attrs` (links and triples) are free JSON objects. The only key
  the API reads is `metadata.ckan_name`, used by `/linked`.

## The triple model

An affinity triple (`/affinities`) groups one optional dataset with any number of
endpoints and services:

```json
{
  "dataset_uid": "<uuid or null>",
  "endpoint_uids": ["<uuid>", "..."],
  "service_uids": ["<uuid>", "..."],
  "attrs": {"any": "json"},
  "version": 1
}
```

- Every field is optional.
- Only `dataset_uid` is checked: if it is given and the dataset does not exist, the API
  answers 404. The UUIDs in `endpoint_uids` and `service_uids` are not checked.
- `version` is an integer chosen by the client; the API does not increment it.
- Triples are independent of the pairwise link tables: creating a triple creates no links,
  and creating links creates no triple.

The ep-api, for example, creates a triple `{dataset_uid, endpoint_uids: [its endpoint]}`
for each dataset and `{service_uids: [service], endpoint_uids: [its endpoint]}` for each
service, after creating the corresponding pairwise link.

## API routes

All routes are relative to the API root (`http://host:8000` in Compose,
`http://host/api` in the all-in-one image). The interactive reference is `/docs`
(Swagger UI) and `/openapi.json`.

### Entities

`/ep` (endpoints), `/datasets` and `/services` have the same five operations:

| Method | Path | Body | Success |
|--------|------|------|---------|
| GET | `/ep`, `/datasets`, `/services` | query `skip` (default 0), `limit` (default 100) | 200, list |
| GET | `/{collection}/{uid}` | — | 200, object; 404 if absent |
| POST | `/{collection}` | create body (below) | 201, object |
| PUT | `/{collection}/{uid}` | any subset of the create fields; only the fields sent are changed | 200, object; 404 if absent |
| DELETE | `/{collection}/{uid}` | — | 204; 404 if absent |

| Collection | Create body | Response adds |
|------------|-------------|---------------|
| `/ep` | `kind` (string, **required**), `url`, `metadata` | `uid`, `source_ep`, `created_at`, `updated_at` |
| `/datasets` | `title`, `source_ep`, `metadata` (all optional) | `uid`, `created_at`, `updated_at` |
| `/services` | `type`, `openapi_url`, `version`, `source_ep`, `metadata` (all optional) | `uid`, `created_at`, `updated_at` |

There is no `PATCH`; partial updates use `PUT`. Lists have no ordering clause and no
maximum `limit`.

### Pairwise links

| Method | Path | Body | Success |
|--------|------|------|---------|
| GET | `/dataset-endpoints` | query `skip`, `limit` | 200, list |
| GET | `/dataset-endpoints/{dataset_uid}/{endpoint_uid}` | — | 200; 404 |
| POST | `/dataset-endpoints` | `dataset_uid`, `endpoint_uid` (required), `role`, `attrs` | 201 |
| DELETE | `/dataset-endpoints/{dataset_uid}/{endpoint_uid}` | — | 204; 404 |
| GET | `/dataset-services` | query `skip`, `limit` | 200, list |
| GET | `/dataset-services/{dataset_uid}/{service_uid}` | — | 200; 404 |
| POST | `/dataset-services` | `dataset_uid`, `service_uid` (required), `role`, `attrs` | 201 |
| DELETE | `/dataset-services/{dataset_uid}/{service_uid}` | — | 204; 404 |
| GET | `/service-endpoints` | query `skip`, `limit` | 200, list |
| GET | `/service-endpoints/{service_uid}/{endpoint_uid}` | — | 200; 404 |
| POST | `/service-endpoints` | `service_uid`, `endpoint_uid` (required), `role`, `attrs` | 201 |
| DELETE | `/service-endpoints/{service_uid}/{endpoint_uid}` | — | 204; 404 |

The response is the stored row: the two UUIDs, `role`, `attrs`, `created_at`. Links cannot
be updated. `POST` returns 404 (`"Dataset '<uuid>' not found"` and similar) when either
side does not exist, and 409 (`"Resource already exists"`) when the pair is already linked.

### Affinity triples

| Method | Path | Body | Success |
|--------|------|------|---------|
| GET | `/affinities` | query `skip`, `limit` | 200, list |
| GET | `/affinities/{triple_uid}` | — | 200; 404 |
| POST | `/affinities` | `dataset_uid`, `endpoint_uids`, `service_uids`, `attrs`, `version` (all optional) | 201; 404 if `dataset_uid` does not exist |
| PUT | `/affinities/{triple_uid}` | any subset of the same fields | 200; 404 |
| DELETE | `/affinities/{triple_uid}` | — | 204; 404 |

The response adds `triple_uid`, `created_at` and `updated_at`.

### Linked lookups

| Method | Path | Body | Success |
|--------|------|------|---------|
| GET | `/linked/{uid}` | — | 200, `LinkedEntitiesResponse`; 404 if `uid` is not a dataset, endpoint or service |
| POST | `/linked/batch` | `{"uids": ["<uuid>", ...]}` | 200, list of `LinkedEntitiesResponse` in input order; 404 if any uid is unknown |

```json
{
  "input_uid": "<uuid>",
  "input_type": "dataset | endpoint | service",
  "datasets":  [{"uid": "<uuid>", "name": "...", "ckan_name": "..."}],
  "endpoints": [{"uid": "<uuid>", "name": "...", "ckan_name": "..."}],
  "services":  [{"uid": "<uuid>", "name": "...", "ckan_name": "..."}]
}
```

Semantics (`app/routers/linked.py`):

- The uid is looked up as a dataset first, then an endpoint, then a service; the first
  match sets `input_type`.
- **Dataset**: endpoints from `dataset-endpoints`, services from `dataset-services`, plus
  all endpoints and services of the triples whose `dataset_uid` is this dataset.
  `datasets` is always empty.
- **Endpoint**: datasets from `dataset-endpoints`, services from `service-endpoints`,
  plus, for every triple whose `endpoint_uids` contains it, the triple's dataset, its
  other endpoints and its services.
- **Service**: datasets from `dataset-services`, endpoints from `service-endpoints`, plus,
  for every triple whose `service_uids` contains it, the triple's dataset, its endpoints
  and its other services.
- The input uid is removed from the result. UUIDs that do not resolve to an existing
  record (for example a deleted endpoint still listed in a triple) are left out. Each list
  is sorted by uid.
- `name`: dataset `title`; endpoint `"kind: url"` (or whichever of `kind`, `url`, uid
  exists); service `type`, else `openapi_url`, else the uid.
- `ckan_name`: `metadata.ckan_name` of the record, or the string `"none"`.
- Only one hop is followed. For endpoint and service inputs every triple is read and
  filtered in Python.

### Health

`GET /health` returns `{"status": "ok"}`. It does not query the database.

### Errors

- 404 with `{"detail": "..."}` for missing records and missing references.
- 422 for bodies or path parameters that fail validation (for example a non-UUID uid).
- A database integrity error is turned into JSON by the handler in `app/main.py`: foreign
  key violation → 400 `"Referenced <field> '<value>' does not exist"`; unique violation →
  409 `"Resource already exists"`; anything else → 400 `"Database integrity error"`.
- A trailing slash (`/ep/`) answers 307 with a redirect to the path without it.

## Configuration

`app/config.py` (pydantic-settings) reads environment variables, and a `.env` file in the
working directory if one exists. Unknown keys in that `.env` file are rejected at start.

| Variable | Default | Meaning |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://affinities:affinities@localhost:5432/affinities` | SQLAlchemy URL; a plain `postgresql://` URL gets the `psycopg2` driver (`engine_url` in `app/database.py`) |
| `CORS_ORIGINS` | `*` | Comma-separated origins, or `*` |
| `ROOT_PATH` | empty | FastAPI `root_path`: the prefix a reverse proxy publishes the API under |

The web UI reads `window.__AFFINITIES_CONFIG__` (`rootPath`, `apiUrl`) from `config.js`,
written by `frontend/entrypoint.sh` from `ROOT_PATH` and `VITE_API_URL`. Without it the UI
uses base path `/` and API URL `http://localhost:8000`. Deployment variables are listed in
the [README](../README.md).

## Web UI

`frontend/src/App.tsx` defines these pages: Dashboard (`/`), Endpoints, Datasets, Services,
Dataset-Endpoints, Dataset-Services, Service-Endpoints, Affinities, Graph Connectivity and
Golden Rules. All data comes from the REST routes above through `frontend/src/api/client.ts`.
The Dashboard pages through all records; the Graph Connectivity page loads the first 100 of
each collection (default `limit`). The Golden Rules page is static text.

## All-in-one container layout

`Dockerfile.allinone` builds the UI with Node 20 and installs PostgreSQL, nginx and
supervisor on `python:3.12-slim`.

```
container :80
  nginx (deploy/nginx-allinone.conf)
    /        -> /usr/share/nginx/html (UI build, SPA fallback to index.html)
    /api/    -> http://127.0.0.1:8000/  (prefix stripped)
  uvicorn app.main:app on 127.0.0.1:8000   (supervisord program "uvicorn")
  postgres -D /var/lib/postgresql/data     (supervisord program "postgresql", volume)
```

`deploy/entrypoint.sh` initialises the cluster on the first start (see the README), exports
`DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DB` and starts supervisord
(`deploy/supervisord.conf`), which starts PostgreSQL, nginx and uvicorn and restarts them
if they exit. The UI in this image has no generated `config.js`, so it calls
`http://localhost:8000` (see the README).

## How other NDP components use Affinities

### NDP Federation

`app/services/pop.py` (around lines 541–579 of
[ndp-federation](https://github.com/sci-ndp/ndp-federation)) registers each newly created
Endpoint configuration when `AFFINITIES_API_URL` is set:

```
POST {AFFINITIES_API_URL}/ep
{"kind": "ndp-ep",
 "url": "<jupyter_url or null>",
 "metadata": {"organization": "...", "ep_name": "...", "federation_id": "<config id>"}}
```

Anything other than 201, or a connection error, makes the Federation request fail with 502.
The Federation stores the returned `uid` as `affinities_uid` on the Endpoint configuration.
That uid is the value the Endpoint's ep-api must have in `AFFINITIES_EP_UUID`.

### NDP Endpoint (ep-api)

`api/services/affinities_services/affinities_client.py` in
[ep-api](https://github.com/national-data-platform/ep-api) is active when
`AFFINITIES_ENABLED=true`, with `AFFINITIES_URL` (Affinities base URL),
`AFFINITIES_EP_UUID` (this Endpoint's uid in `/ep`) and `AFFINITIES_TIMEOUT` (seconds,
default 30). It calls:

| Call | When |
|------|------|
| `GET /ep/{AFFINITIES_EP_UUID}` | readiness probe (`api/routes/health_routes/ready.py`): is this Endpoint known to Affinities |
| `POST /datasets` `{title, source_ep: <ep uuid>, metadata}` | a dataset is registered |
| `POST /dataset-endpoints` `{dataset_uid, endpoint_uid: <ep uuid>, role, attrs}` | after the dataset |
| `POST /affinities` `{dataset_uid, endpoint_uids: [<ep uuid>], attrs}` | only if the link was created |
| `POST /services` `{type, openapi_url, version, source_ep: <ep uuid>, metadata}` | a service is registered |
| `POST /service-endpoints` `{service_uid, endpoint_uid: <ep uuid>, role, attrs}` | after the service |
| `POST /affinities` `{service_uids: [service], endpoint_uids: [<ep uuid>], attrs}` | only if the link was created |

If `AFFINITIES_EP_UUID` is not a known `/ep` record, the link `POST` returns 404 and the
ep-api skips the triple. Because the API has no authentication, the ep-api and the
Federation send no credentials.
