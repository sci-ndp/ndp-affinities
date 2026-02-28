# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/sci-ndp/ndp-affinities/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/sci-ndp/ndp-affinities/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/sci-ndp/ndp-affinities/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/sci-ndp/ndp-affinities/releases/tag/v0.0.0
