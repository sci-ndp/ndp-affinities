# NDP Affinities

PostgreSQL database for the NDP Affinities system.

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

## Accessing pgAdmin

1. Open http://localhost:5050
2. Login with `admin@admin.com` / `admin` (or your `.env` values)
3. The server "affinities" is pre-configured
4. Enter the database password when prompted: `affinities` (or your `.env` value)

> **Note:** If you change `POSTGRES_USER`, `POSTGRES_DB`, or `POSTGRES_PASSWORD` in `.env`, you must also update `pgadmin/servers.json` to match.

## Commands

```bash
# Start services
docker compose up -d

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

## Project Structure

```
.
├── docker-compose.yml
├── .env.example
├── pgadmin/
│   └── servers.json      # pgAdmin server configuration
└── sql/
    └── migrations/       # Database migrations (run automatically)
        ├── 001_create_ndp_endpoint.sql
        ├── 002_create_ndp_dataset.sql
        ├── 003_create_ndp_service.sql
        ├── 004_create_ndp_dataset_endpoint.sql
        └── 005_create_ndp_dataset_service.sql
```
