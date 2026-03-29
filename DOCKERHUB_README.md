# NDP Affinities

All-in-one Docker image for the NDP Affinities system: PostgreSQL + FastAPI backend + React frontend, served via nginx.

## Quick Start

```bash
docker run -d -p 80:80 -v affinities-data:/var/lib/postgresql/data rbardaji/ndp-affinities
```

The application will be available at `http://localhost`.

### Custom Configuration

```bash
docker run -d -p 80:80 \
  -e POSTGRES_USER=myuser \
  -e POSTGRES_PASSWORD=mysecretpass \
  -e POSTGRES_DB=mydb \
  -v affinities-data:/var/lib/postgresql/data \
  rbardaji/ndp-affinities
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Web UI (React frontend) |
| `/api/` | REST API |
| `/api/docs` | Swagger API documentation |
| `/api/health` | Health check |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `affinities` | Database user |
| `POSTGRES_PASSWORD` | `affinities` | Database password |
| `POSTGRES_DB` | `affinities` | Database name |

## API Examples

```bash
# List endpoints
curl http://localhost/api/ep

# Create an endpoint
curl -X POST http://localhost/api/ep \
  -H "Content-Type: application/json" \
  -d '{"kind": "ckan", "url": "http://example.com"}'

# List datasets
curl http://localhost/api/datasets

# Create an affinity triple
curl -X POST http://localhost/api/affinities \
  -H "Content-Type: application/json" \
  -d '{"dataset_uid": "<uuid>", "endpoint_uids": ["<uuid>"], "service_uids": ["<uuid>"]}'
```

## Features

- **Endpoints** — Register and manage API/CKAN endpoints
- **Datasets** — Track data resources with metadata
- **Services** — Manage OpenAPI services
- **Affinity Triples** — Link datasets to endpoints and services
- **Relationship Queries** — Find related entities via `/api/linked/{uid}`

## Source Code

GitHub: [https://github.com/sci-ndp/ndp-affinities](https://github.com/sci-ndp/ndp-affinities)
