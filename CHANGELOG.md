# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- The Docker image is published from CI (#56). `.github/workflows/docker-publish.yml` runs on a `v*` tag, or by hand for an existing tag: it checks the tag against the version in `app/main.py`, takes the release notes from this file, builds `Dockerfile.allinone`, pushes `rbardaji/ndp-affinities:<version>` and `latest` (never `latest` for a prerelease), starts the pushed image to confirm `/api/health` and the UI answer, and only then creates or updates the GitHub release. It needs the `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` repository secrets. Until now the image was pushed by hand, and Docker Hub had stopped at 0.2.0.

## [0.3.1] - 2026-10-08

### Fixed
- The API did not start from a fresh build (#54). `requirements.txt` installs `psycopg2-binary` and allows any SQLAlchemy 2.x, and SQLAlchemy 2.1 changed the driver a plain `postgresql://` URL selects from psycopg2 to psycopg 3, which is not installed. Every `DATABASE_URL` in the repository is a plain `postgresql://` URL, so a build made after 2.1 was released crashed at start with `No module named 'psycopg'` — `docker compose up --build` and the all-in-one image alike; the test suite could not even be collected. The engine now names `postgresql+psycopg2` when the URL names no driver, so existing `DATABASE_URL` values keep working with any SQLAlchemy version. Verified: with `docker compose up --build` and with the all-in-one image, the API starts and stores data; the all-in-one image built from the previous code never answers on `/api/`.

## [0.3.0] - 2026-07-09

### Changed
- API root path is now read from the `ROOT_PATH` environment variable instead of being hardcoded to `/affinity-api`, so the same image can be served under any prefix behind a reverse proxy (defaults to no prefix)
- Docker Compose passes `ROOT_PATH` through to the API service

## [0.2.0] - 2026-04-08

### Changed
- Switch frontend from build-time to runtime environment variables
- Add entrypoint.sh that generates config.js and dynamic nginx config at container startup
- Frontend now reads ROOT_PATH and VITE_API_URL at runtime via window.__AFFINITIES_CONFIG__
- Docker Compose passes environment variables instead of build args

### Added
- API tutorial Jupyter Notebook (docs/api_tutorial_v0.1.1.ipynb)

## [0.1.1] - 2026-02-28

### Changed
- Remove unused `source_ep` field from endpoint creation

## [0.1.0] - 2026-02-28

### Added
- All-in-one Docker image with PostgreSQL, nginx, and uvicorn
- Automatic database initialization and migrations
- Deployment documentation in README
- Published to Docker Hub: rbardaji/ndp-affinities

## [0.0.0] - 2025-02-28

### Added
- Initial project structure
- PostgreSQL database with FastAPI backend
- React frontend with dashboard
- Endpoints for managing datasets, endpoints, services
- Affinity triples system
- Dataset-endpoint and dataset-service relationships
- `/linked` endpoint for querying related entities
- `/linked/batch` endpoint for batch queries
- Pagination support in dashboard
- CKAN names display in listings

[Unreleased]: https://github.com/sci-ndp/ndp-affinities/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/sci-ndp/ndp-affinities/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/sci-ndp/ndp-affinities/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/sci-ndp/ndp-affinities/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/sci-ndp/ndp-affinities/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/sci-ndp/ndp-affinities/releases/tag/v0.0.0
