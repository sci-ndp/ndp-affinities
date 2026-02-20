import argparse
import random
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.affinity_triple import AffinityTriple
from app.models.dataset import Dataset
from app.models.dataset_endpoint import DatasetEndpoint
from app.models.dataset_service import DatasetService
from app.models.endpoint import Endpoint
from app.models.service import Service
from app.models.service_endpoint import ServiceEndpoint

SEED_SOURCE_EP = "demo-seed-power-v1"

DATASET_THEMES = [
    "volcano",
    "hydrology",
    "climate",
    "air-quality",
    "seismic",
    "ocean",
    "land-use",
    "wildfire",
    "snowpack",
    "agriculture",
]

REGIONS = [
    "utah",
    "alaska",
    "hawaii",
    "colorado",
    "yellowstone",
    "pacific",
    "atlantic",
    "desert-west",
]

SERVICE_TYPES = [
    "MINTPY",
    "ISCE2",
    "XARRAY_ENGINE",
    "FASTAPI_ANALYTICS",
    "EVENT_GRAPH",
    "HYDRO_MODEL",
    "ML_TRAINING",
    "FEATURE_PIPELINE",
    "QUALITY_ASSURANCE",
    "VECTOR_TILING",
]

ENDPOINT_PROTOCOLS = ["REST", "Kafka", "SSE", "S3"]
ENDPOINT_CAPABILITIES = [
    "timeseries",
    "subset",
    "forecast",
    "classification",
    "anomaly_detection",
    "lineage_lookup",
    "batch_export",
    "stream_ingest",
]

EDGE_ROLES = [
    "primary",
    "backup",
    "transform-input",
    "training-input",
    "publish-output",
]


@dataclass
class SeedOutput:
    datasets: int
    services: int
    endpoints: int
    dataset_endpoint_edges: int
    dataset_service_edges: int
    service_endpoint_edges: int
    affinities: int


def reset_seed_data(db: Session) -> None:
    dataset_ids = [uid for (uid,) in db.query(Dataset.uid).filter(Dataset.source_ep == SEED_SOURCE_EP).all()]
    service_ids = [uid for (uid,) in db.query(Service.uid).filter(Service.source_ep == SEED_SOURCE_EP).all()]

    if dataset_ids:
        db.query(AffinityTriple).filter(AffinityTriple.dataset_uid.in_(dataset_ids)).delete(synchronize_session=False)
        db.query(DatasetEndpoint).filter(DatasetEndpoint.dataset_uid.in_(dataset_ids)).delete(synchronize_session=False)
        db.query(DatasetService).filter(DatasetService.dataset_uid.in_(dataset_ids)).delete(synchronize_session=False)

    if service_ids:
        db.query(ServiceEndpoint).filter(ServiceEndpoint.service_uid.in_(service_ids)).delete(synchronize_session=False)

    db.query(Dataset).filter(Dataset.source_ep == SEED_SOURCE_EP).delete(synchronize_session=False)
    db.query(Service).filter(Service.source_ep == SEED_SOURCE_EP).delete(synchronize_session=False)
    db.query(Endpoint).filter(Endpoint.source_ep == SEED_SOURCE_EP).delete(synchronize_session=False)
    db.commit()


def create_datasets(db: Session, count: int) -> list[Dataset]:
    created: list[Dataset] = []
    for idx in range(count):
        theme = DATASET_THEMES[idx % len(DATASET_THEMES)]
        region = REGIONS[idx % len(REGIONS)]

        dataset = Dataset(
            title=f"{theme.title()} Observatory Dataset {idx + 1:03d}",
            source_ep=SEED_SOURCE_EP,
            metadata_={
                "seed_source": SEED_SOURCE_EP,
                "ndp_uid": f"urn:ndp:dataset:{idx + 1:04d}",
                "theme": theme,
                "region": region,
                "keywords": [theme, region, "affinity-demo"],
                "visibility": "public",
            },
        )
        db.add(dataset)
        created.append(dataset)

    db.commit()
    for item in created:
        db.refresh(item)
    return created


def create_services(db: Session, count: int) -> list[Service]:
    created: list[Service] = []
    for idx in range(count):
        service_type = SERVICE_TYPES[idx % len(SERVICE_TYPES)]
        major = 1 + (idx % 4)
        minor = idx % 10

        service = Service(
            type=service_type,
            version=f"{major}.{minor}",
            source_ep=SEED_SOURCE_EP,
            openapi_url=f"https://demo.ndp.local/services/{idx + 1:03d}/openapi.json",
            metadata_={
                "seed_source": SEED_SOURCE_EP,
                "ndp_uid": f"urn:ndp:service:{idx + 1:04d}",
                "service_type": service_type,
                "visibility": "public",
                "owner_org": f"org-{(idx % 5) + 1}",
            },
        )
        db.add(service)
        created.append(service)

    db.commit()
    for item in created:
        db.refresh(item)
    return created


def create_endpoints(db: Session, count: int) -> list[Endpoint]:
    created: list[Endpoint] = []
    for idx in range(count):
        region = REGIONS[idx % len(REGIONS)]
        protocol = ENDPOINT_PROTOCOLS[idx % len(ENDPOINT_PROTOCOLS)]
        capability = ENDPOINT_CAPABILITIES[idx % len(ENDPOINT_CAPABILITIES)]
        endpoint_name = f"ndp-ep-{region}-{capability}-{idx + 1:03d}"

        endpoint = Endpoint(
            kind="NDP-EP",
            source_ep=SEED_SOURCE_EP,
            url=f"https://demo.ndp.local/ep/{endpoint_name}",
            metadata_={
                "seed_source": SEED_SOURCE_EP,
                "ndp_uid": f"urn:ndp:endpoint:{idx + 1:04d}",
                "ndp_ep_name": endpoint_name,
                "endpoint_type": "processing" if protocol in {"S3", "Kafka"} else "api",
                "protocol": protocol,
                "capability": capability,
                "visibility": "public",
                "owner_ep": f"urn:ndp:ep:{region}",
            },
        )
        db.add(endpoint)
        created.append(endpoint)

    db.commit()
    for item in created:
        db.refresh(item)
    return created


def link_graph(
    db: Session,
    rng: random.Random,
    datasets: list[Dataset],
    services: list[Service],
    endpoints: list[Endpoint],
) -> tuple[int, int, int, int]:
    ds_ep_edges = 0
    ds_svc_edges = 0
    svc_ep_edges = 0
    affinity_rows = 0

    for svc in services:
        endpoint_count = rng.randint(2, min(5, len(endpoints)))
        selected_eps = rng.sample(endpoints, endpoint_count)
        for ep in selected_eps:
            db.merge(
                ServiceEndpoint(
                    service_uid=svc.uid,
                    endpoint_uid=ep.uid,
                    role=rng.choice(EDGE_ROLES),
                    attrs={
                        "seed_source": SEED_SOURCE_EP,
                        "latency_ms": rng.randint(70, 450),
                        "availability": round(rng.uniform(0.96, 0.999), 3),
                    },
                )
            )
            svc_ep_edges += 1

    for idx, ds in enumerate(datasets):
        service_count = rng.randint(2, min(4, len(services)))
        endpoint_count = rng.randint(2, min(4, len(endpoints)))
        selected_svcs = rng.sample(services, service_count)
        selected_eps = rng.sample(endpoints, endpoint_count)

        for svc in selected_svcs:
            db.merge(
                DatasetService(
                    dataset_uid=ds.uid,
                    service_uid=svc.uid,
                    role=rng.choice(EDGE_ROLES),
                    attrs={
                        "seed_source": SEED_SOURCE_EP,
                        "quality": rng.choice(["bronze", "silver", "gold"]),
                    },
                )
            )
            ds_svc_edges += 1

        for ep in selected_eps:
            db.merge(
                DatasetEndpoint(
                    dataset_uid=ds.uid,
                    endpoint_uid=ep.uid,
                    role=rng.choice(EDGE_ROLES),
                    attrs={
                        "seed_source": SEED_SOURCE_EP,
                        "cost_class": rng.choice(["low", "medium", "high"]),
                    },
                )
            )
            ds_ep_edges += 1

        triple_count = rng.randint(2, 4)
        for t in range(triple_count):
            triple_services = rng.sample(selected_svcs, rng.randint(1, len(selected_svcs)))
            triple_endpoints = rng.sample(selected_eps, rng.randint(1, len(selected_eps)))

            db.add(
                AffinityTriple(
                    dataset_uid=ds.uid,
                    service_uids=[svc.uid for svc in triple_services],
                    endpoint_uids=[ep.uid for ep in triple_endpoints],
                    attrs={
                        "seed_source": SEED_SOURCE_EP,
                        "scenario": f"pipeline-{idx + 1:03d}-{t + 1}",
                        "confidence": round(rng.uniform(0.78, 0.99), 2),
                        "notes": "Synthetic multi-hop affinity for high-coverage demo",
                    },
                    version=rng.randint(1, 5),
                )
            )
            affinity_rows += 1

    db.commit()
    return ds_ep_edges, ds_svc_edges, svc_ep_edges, affinity_rows


def seed_demo_power(reset: bool, datasets_n: int, services_n: int, endpoints_n: int, seed: int) -> SeedOutput:
    rng = random.Random(seed)
    db = SessionLocal()
    try:
        if reset:
            reset_seed_data(db)

        datasets = create_datasets(db, datasets_n)
        services = create_services(db, services_n)
        endpoints = create_endpoints(db, endpoints_n)

        ds_ep_edges, ds_svc_edges, svc_ep_edges, affinity_rows = link_graph(
            db, rng, datasets, services, endpoints
        )

        return SeedOutput(
            datasets=len(datasets),
            services=len(services),
            endpoints=len(endpoints),
            dataset_endpoint_edges=ds_ep_edges,
            dataset_service_edges=ds_svc_edges,
            service_endpoint_edges=svc_ep_edges,
            affinities=affinity_rows,
        )
    finally:
        db.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed high-coverage synthetic graph data for NDP Affinities demo power views."
    )
    parser.add_argument("--reset", action="store_true", help="Delete previous power-seeded records before insert.")
    parser.add_argument("--datasets", type=int, default=30, help="Number of datasets to create.")
    parser.add_argument("--services", type=int, default=18, help="Number of services to create.")
    parser.add_argument("--endpoints", type=int, default=20, help="Number of endpoints to create.")
    parser.add_argument("--seed", type=int, default=20260209, help="PRNG seed for deterministic output.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.datasets < 1 or args.services < 1 or args.endpoints < 1:
        raise SystemExit("datasets/services/endpoints must all be >= 1")

    result = seed_demo_power(
        reset=args.reset,
        datasets_n=args.datasets,
        services_n=args.services,
        endpoints_n=args.endpoints,
        seed=args.seed,
    )

    print("Power demo seed complete")
    print(f"Source marker: {SEED_SOURCE_EP}")
    print(f"Datasets: {result.datasets}")
    print(f"Services: {result.services}")
    print(f"Endpoints: {result.endpoints}")
    print(f"Dataset-Endpoint edges: {result.dataset_endpoint_edges}")
    print(f"Dataset-Service edges: {result.dataset_service_edges}")
    print(f"Service-Endpoint edges: {result.service_endpoint_edges}")
    print(f"Affinity triples: {result.affinities}")


if __name__ == "__main__":
    main()
