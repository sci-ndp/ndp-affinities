# Documentation

| Document | Contents |
|----------|----------|
| [../README.md](../README.md) | What NDP Affinities is, quick start with Docker Compose and with the all-in-one image, configuration, demo data |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Components, database schema (ER diagram), identifiers, the triple model, every API route, `/linked` semantics, configuration, absence of authentication, container layout, how ep-api and the Federation use the API |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Local setup, tests, migrations, change and release procedure |
| [api_tutorial.ipynb](api_tutorial.ipynb) | Jupyter notebook that calls every route group with `requests` |
| [../DOCKERHUB_README.md](../DOCKERHUB_README.md) | Description of the all-in-one image on Docker Hub (`rbardaji/ndp-affinities`) |
| [../CHANGELOG.md](../CHANGELOG.md) | Changes per release |

The running API also documents itself at `/docs` (Swagger UI) and `/openapi.json`.

## Related projects

| Project | Repository | Relation |
|---------|------------|----------|
| NDP Endpoint (ep-api) | https://github.com/national-data-platform/ep-api | Registers its datasets and services in Affinities and links them to itself (`api/services/affinities_services/affinities_client.py`) |
| NDP Federation | https://github.com/sci-ndp/ndp-federation | Registers every new Endpoint in Affinities with `POST /ep` (`app/services/pop.py`) |
