# NDP Affinities

PostgreSQL database with FastAPI backend and React frontend for the NDP Affinities system.

## Requirements

- Docker
- Docker Compose

## Quick Start

```bash
docker compose up -d
```

This will start:
- **PostgreSQL** on `localhost:5432`
- **pgAdmin** on `http://localhost:5050`
- **API** on `http://localhost:8000` (Swagger UI at `/docs`)
- **Frontend** on `http://localhost:3000`

Migrations run automatically on first startup.

## Environment Variables

Copy `.env.example` to `.env` to customize:

```bash
cp .env.example .env
```

### PostgreSQL

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `affinities` | Database user |
| `POSTGRES_PASSWORD` | `affinities` | Database password |
| `POSTGRES_DB` | `affinities` | Database name |
| `POSTGRES_PORT` | `5432` | Exposed port |

### pgAdmin

| Variable | Default | Description |
|----------|---------|-------------|
| `PGADMIN_EMAIL` | `admin@admin.com` | Login email |
| `PGADMIN_PASSWORD` | `admin` | Login password |
| `PGADMIN_PORT` | `5050` | Exposed port |

### API

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://affinities:affinities@localhost:5432/affinities` | Database connection string |
| `API_PORT` | `8000` | Exposed port |
| `CORS_ORIGINS` | `*` | Allowed CORS origins (comma-separated, or `*` for all) |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `FRONTEND_PORT` | `3000` | Exposed port |
| `VITE_API_URL` | `http://localhost:8000` | API URL (used at build time) |

## Production Deployment

For production, use `docker-compose.prod.yml` which excludes pgAdmin and requires explicit configuration:

```bash
# Create .env with production values (change passwords!)
cp .env.example .env
# Edit .env with secure passwords and proper CORS_ORIGINS

# Start production services
docker compose -f docker-compose.prod.yml up -d
```

Production configuration notes:
- Set strong passwords for `POSTGRES_USER` and `POSTGRES_PASSWORD`
- Set `CORS_ORIGINS` to your frontend domain (e.g., `https://yourdomain.com`)
- Set `VITE_API_URL` to your API URL (e.g., `https://api.yourdomain.com`)
- Configure a reverse proxy (nginx, traefik) for HTTPS

## Local Development

### API

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Running Tests

```bash
.venv/bin/pytest --cov=app --cov-report=term-missing
```

## Accessing pgAdmin

1. Open http://localhost:5050
2. Login with `admin@admin.com` / `admin` (or your `.env` values)
3. The server "affinities" is pre-configured
4. Enter the database password when prompted: `affinities` (or your `.env` value)

> **Note:** If you change `POSTGRES_USER`, `POSTGRES_DB`, or `POSTGRES_PASSWORD` in `.env`, you must also update `pgadmin/servers.json` to match.

## Commands

```bash
# Start services (development)
docker compose up -d

# Start services (production)
docker compose -f docker-compose.prod.yml up -d

# Stop services
docker compose down

# Stop and remove volumes (deletes all data)
docker compose down -v

# View logs
docker compose logs -f

# Connect to PostgreSQL directly
docker exec -it ndp-affinities-db psql -U affinities -d affinities
```

## Database Schema

### ndp_endpoint

Stores endpoint information.

| Column | Type | Constraints |
|--------|------|-------------|
| `uid` | UUID | PK, auto-generated |
| `kind` | TEXT | NOT NULL |
| `url` | TEXT | |
| `source_ep` | TEXT | |
| `metadata` | JSONB | |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto-generated |
| `updated_at` | TIMESTAMPTZ | NOT NULL, auto-updated on modify |

### ndp_dataset

Stores dataset information.

| Column | Type | Constraints |
|--------|------|-------------|
| `uid` | UUID | PK, auto-generated |
| `title` | TEXT | |
| `source_ep` | TEXT | |
| `metadata` | JSONB | |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto-generated |
| `updated_at` | TIMESTAMPTZ | NOT NULL, auto-updated on modify |

### ndp_service

Stores service information.

| Column | Type | Constraints |
|--------|------|-------------|
| `uid` | UUID | PK, auto-generated |
| `type` | TEXT | |
| `openapi_url` | TEXT | |
| `version` | TEXT | |
| `source_ep` | TEXT | |
| `metadata` | JSONB | |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto-generated |
| `updated_at` | TIMESTAMPTZ | NOT NULL, auto-updated on modify |

### ndp_dataset_endpoint

Junction table connecting datasets with endpoints (many-to-many).

| Column | Type | Constraints |
|--------|------|-------------|
| `dataset_uid` | UUID | PK, FK → ndp_dataset |
| `endpoint_uid` | UUID | PK, FK → ndp_endpoint |
| `role` | TEXT | |
| `attrs` | JSONB | |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto-generated |

### ndp_dataset_service

Junction table connecting datasets with services (many-to-many).

| Column | Type | Constraints |
|--------|------|-------------|
| `dataset_uid` | UUID | PK, FK → ndp_dataset |
| `service_uid` | UUID | PK, FK → ndp_service |
| `role` | TEXT | |
| `attrs` | JSONB | |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto-generated |

### ndp_service_endpoint

Junction table connecting services with endpoints (many-to-many).

| Column | Type | Constraints |
|--------|------|-------------|
| `service_uid` | UUID | PK, FK → ndp_service |
| `endpoint_uid` | UUID | PK, FK → ndp_endpoint |
| `role` | TEXT | |
| `attrs` | JSONB | |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto-generated |

### ndp_affinity_triple

Stores affinity combinations (dataset + endpoints + services).

| Column | Type | Constraints |
|--------|------|-------------|
| `triple_uid` | UUID | PK, auto-generated |
| `dataset_uid` | UUID | FK → ndp_dataset |
| `endpoint_uids` | UUID[] | array |
| `service_uids` | UUID[] | array |
| `attrs` | JSONB | |
| `version` | INT | |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto-generated |
| `updated_at` | TIMESTAMPTZ | NOT NULL, auto-updated on modify |

## Project Structure

```
.
├── docker-compose.yml        # Development setup
├── docker-compose.prod.yml   # Production setup (no pgAdmin)
├── Dockerfile                # API container
├── requirements.txt
├── .env.example
├── app/                      # FastAPI application
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── types.py
│   ├── models/
│   ├── schemas/
│   └── routers/
├── frontend/                 # React frontend
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── types/
│   └── ...
├── tests/                    # Test suite
├── pgadmin/
│   └── servers.json
└── sql/
    └── migrations/
```
