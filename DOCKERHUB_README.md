# NDP Affinities

All-in-one image of NDP Affinities, the National Data Platform registry of Endpoints,
datasets, services, their links and affinity triples. One container runs PostgreSQL 17,
the FastAPI API (uvicorn) and nginx, managed by supervisord.

```bash
docker run -d --name affinities -p 80:80 \
  -e ROOT_PATH=/api \
  -v affinities-data:/var/lib/postgresql/data \
  rbardaji/ndp-affinities:<version>
```

| URL | What |
|-----|------|
| `http://localhost/` | Web UI |
| `http://localhost/api/` | REST API (nginx strips `/api/`) |
| `http://localhost/api/docs` | Swagger UI |
| `http://localhost/api/health` | Health check, returns `{"status":"ok"}` |

## Port and volume

- Port `80` (nginx). PostgreSQL and uvicorn are not exposed.
- Volume `/var/lib/postgresql/data`. On the first start with an empty volume the image
  creates the database and applies the SQL migrations; later starts reuse it as is.

## Environment variables

| Variable | Default | Meaning |
|----------|---------|---------|
| `POSTGRES_USER` | `affinities` | Database role, created on first start |
| `POSTGRES_PASSWORD` | `affinities` | Its password |
| `POSTGRES_DB` | `affinities` | Database name |
| `ROOT_PATH` | empty | Set to `/api` so that `/api/docs` loads its OpenAPI document from `/api/openapi.json` |
| `CORS_ORIGINS` | `*` | Allowed origins, comma-separated, or `*` |

The `POSTGRES_*` values are applied when the volume is initialised; keep them the same on
later starts, because the API connects with them.

## Notes

- The API has **no authentication**: anyone who can reach the port can create, change and
  delete records.
- The bundled web UI requests its data from `http://localhost:8000`, not from `/api`
  (no runtime `config.js` is generated in this image). Use the API under `/api/` directly.
- Images up to 0.2.0 predate the configurable `ROOT_PATH` (0.3.0) and the psycopg2
  driver fix (0.3.1). Images are published from GitHub Actions on version tags.

```bash
curl http://localhost/api/ep
curl -X POST http://localhost/api/ep -H "Content-Type: application/json" \
  -d '{"kind": "ckan", "url": "https://demo.ckan.org"}'
```

Source and documentation: https://github.com/sci-ndp/ndp-affinities
