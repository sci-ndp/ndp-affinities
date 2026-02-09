import argparse
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

SEED_SOURCE_EP = "demo-seed-ui-v1"
SEED_VERSION = 1


@dataclass
class DemoRecord:
    labels: dict[str, str]
    dataset: dict[str, Any]
    service: dict[str, Any]
    ndp_ep: dict[str, Any]


DEMO_RECORDS: list[DemoRecord] = [
    DemoRecord(
        labels={
            "dataset": "Kilauea InSAR (2016-2018)",
            "service": "MintPy",
            "endpoint": "Time-series deformation",
        },
        dataset={
            "title": "Ground Deformation of Kilauea Volcano, Hawaii, 2016-2018, from InSAR",
            "keywords": ["deformation", "volcano", "hawaii", "insar"],
            "spatial_hint": "Kilauea Volcano region",
        },
        service={
            "type": "MINTPY",
            "version": "1.x",
            "notes": "MintPy-based InSAR time-series pipeline",
        },
        ndp_ep={
            "kind": "NDP-EP",
            "endpoint_type": "processing",
            "capability": "mintpy_timeseries",
            "interface": "batch-job",
            "default_params": {
                "reference_point_strategy": "stable_area",
                "unwrap": "auto",
                "output_format": "HDF5",
            },
        },
    ),
    DemoRecord(
        labels={
            "dataset": "S1 Alaska Snow Velocity",
            "service": "ISCE2",
            "endpoint": "Velocity mosaic",
        },
        dataset={
            "title": "Sentinel-1 Seasonal Snow Velocity, Alaska, 2020-2022",
            "keywords": ["cryosphere", "velocity", "sentinel-1", "alaska"],
            "spatial_hint": "Brooks Range and Alaska interior",
        },
        service={
            "type": "ISCE2",
            "version": "2.6",
            "notes": "InSAR interferogram generation and stacking",
        },
        ndp_ep={
            "kind": "NDP-EP",
            "endpoint_type": "processing",
            "capability": "velocity_mosaic",
            "interface": "batch-job",
            "default_params": {"window_days": 30, "filter": "gaussian", "output_format": "GeoTIFF"},
        },
    ),
    DemoRecord(
        labels={
            "dataset": "Utah Air Quality Archive",
            "service": "FastAPI Analytics",
            "endpoint": "Trend extraction API",
        },
        dataset={
            "title": "Urban Air Quality and PM2.5 Trends, Wasatch Front, 2010-2024",
            "keywords": ["air quality", "pm2.5", "urban", "timeseries"],
            "spatial_hint": "Salt Lake Valley",
        },
        service={
            "type": "FASTAPI_ANALYTICS",
            "version": "3.2",
            "notes": "REST analytics service for trend extraction and anomaly alerts",
        },
        ndp_ep={
            "kind": "NDP-EP",
            "endpoint_type": "api",
            "capability": "trend_query",
            "interface": "https-json",
            "default_params": {"aggregation": "weekly", "anomaly_method": "zscore"},
        },
    ),
    DemoRecord(
        labels={
            "dataset": "Gulf Stream SST Tiles",
            "service": "Xarray Engine",
            "endpoint": "Subset + reprojection",
        },
        dataset={
            "title": "Sea Surface Temperature Tiles, Gulf Stream Region, 2018-2025",
            "keywords": ["sst", "ocean", "tiles", "netcdf"],
            "spatial_hint": "North Atlantic western boundary current",
        },
        service={
            "type": "XARRAY_ENGINE",
            "version": "2025.1",
            "notes": "On-demand slicing, reprojection, and reduction for raster time cubes",
        },
        ndp_ep={
            "kind": "NDP-EP",
            "endpoint_type": "processing",
            "capability": "subset_reproject",
            "interface": "batch-job",
            "default_params": {"target_crs": "EPSG:4326", "tile_size": 512},
        },
    ),
    DemoRecord(
        labels={
            "dataset": "Yellowstone Seismic Catalog",
            "service": "Event Graph Builder",
            "endpoint": "Cluster explorer",
        },
        dataset={
            "title": "Yellowstone Regional Seismic Event Catalog, 2005-2025",
            "keywords": ["seismic", "events", "volcano", "graph"],
            "spatial_hint": "Yellowstone Caldera and surroundings",
        },
        service={
            "type": "EVENT_GRAPH",
            "version": "0.9",
            "notes": "Builds event similarity graphs and interactive cluster summaries",
        },
        ndp_ep={
            "kind": "NDP-EP",
            "endpoint_type": "api",
            "capability": "event_clustering",
            "interface": "https-json",
            "default_params": {"distance_km": 20, "time_window_days": 14},
        },
    ),
    DemoRecord(
        labels={
            "dataset": "Colorado River Flow Projections",
            "service": "Hydro Model Runner",
            "endpoint": "Scenario simulation",
        },
        dataset={
            "title": "Colorado River Seasonal Flow Projections, 2025-2045",
            "keywords": ["hydrology", "forecast", "climate", "river"],
            "spatial_hint": "Upper and Lower Colorado basins",
        },
        service={
            "type": "HYDRO_MODEL",
            "version": "4.0",
            "notes": "Scenario simulation service for basin-wide flow and drought projections",
        },
        ndp_ep={
            "kind": "NDP-EP",
            "endpoint_type": "processing",
            "capability": "flow_simulation",
            "interface": "batch-job",
            "default_params": {"ensemble": 64, "horizon_years": 20},
        },
    ),
]


def reset_seed_data(db: Session) -> None:
    dataset_ids = [uid for (uid,) in db.query(Dataset.uid).filter(Dataset.source_ep == SEED_SOURCE_EP).all()]

    if dataset_ids:
        db.query(AffinityTriple).filter(AffinityTriple.dataset_uid.in_(dataset_ids)).delete(synchronize_session=False)

    db.query(DatasetEndpoint).filter(
        DatasetEndpoint.dataset_uid.in_(dataset_ids)
    ).delete(synchronize_session=False)
    db.query(DatasetService).filter(
        DatasetService.dataset_uid.in_(dataset_ids)
    ).delete(synchronize_session=False)
    db.query(Dataset).filter(Dataset.source_ep == SEED_SOURCE_EP).delete(synchronize_session=False)
    db.query(Service).filter(Service.source_ep == SEED_SOURCE_EP).delete(synchronize_session=False)
    db.query(Endpoint).filter(Endpoint.source_ep == SEED_SOURCE_EP).delete(synchronize_session=False)
    db.commit()


def create_base_entities(db: Session) -> tuple[list[Dataset], list[Service], list[Endpoint]]:
    created_datasets: list[Dataset] = []
    created_services: list[Service] = []
    created_endpoints: list[Endpoint] = []

    for idx, record in enumerate(DEMO_RECORDS):
        dataset = Dataset(
            title=record.dataset["title"],
            source_ep=SEED_SOURCE_EP,
            metadata_={
                "seed_source": SEED_SOURCE_EP,
                "labels": record.labels,
                "keywords": record.dataset["keywords"],
                "spatial_hint": record.dataset["spatial_hint"],
                "demo_payload": {
                    "labels": record.labels,
                    "dataset": record.dataset,
                    "service": record.service,
                    "ndp_ep": record.ndp_ep,
                },
            },
        )

        service = Service(
            type=record.service["type"],
            version=record.service["version"],
            source_ep=SEED_SOURCE_EP,
            openapi_url=f"https://demo.ndp.local/services/{idx + 1}/openapi.json",
            metadata_={
                "seed_source": SEED_SOURCE_EP,
                "labels": record.labels,
                "notes": record.service["notes"],
                "demo_payload": {
                    "labels": record.labels,
                    "dataset": record.dataset,
                    "service": record.service,
                    "ndp_ep": record.ndp_ep,
                },
            },
        )

        endpoint = Endpoint(
            kind=record.ndp_ep["kind"],
            source_ep=SEED_SOURCE_EP,
            url=f"https://demo.ndp.local/endpoints/{idx + 1}",
            metadata_={
                "seed_source": SEED_SOURCE_EP,
                "labels": record.labels,
                "endpoint_type": record.ndp_ep["endpoint_type"],
                "capability": record.ndp_ep["capability"],
                "interface": record.ndp_ep["interface"],
                "default_params": record.ndp_ep["default_params"],
                "demo_payload": {
                    "labels": record.labels,
                    "dataset": record.dataset,
                    "service": record.service,
                    "ndp_ep": record.ndp_ep,
                },
            },
        )

        db.add(dataset)
        db.add(service)
        db.add(endpoint)
        db.flush()

        created_datasets.append(dataset)
        created_services.append(service)
        created_endpoints.append(endpoint)

    db.commit()
    return created_datasets, created_services, created_endpoints


def create_relationships_and_affinities(
    db: Session,
    datasets: list[Dataset],
    services: list[Service],
    endpoints: list[Endpoint],
) -> None:
    total = len(datasets)

    for idx in range(total):
        dataset = datasets[idx]
        primary_service = services[idx]
        primary_endpoint = endpoints[idx]

        next_service = services[(idx + 1) % total]
        next_endpoint = endpoints[(idx + 1) % total]

        dataset_endpoint_primary = DatasetEndpoint(
            dataset_uid=dataset.uid,
            endpoint_uid=primary_endpoint.uid,
            role="primary_ingest",
            attrs={"seed_source": SEED_SOURCE_EP, "confidence": 0.96},
        )
        dataset_endpoint_secondary = DatasetEndpoint(
            dataset_uid=dataset.uid,
            endpoint_uid=next_endpoint.uid,
            role="fallback_access",
            attrs={"seed_source": SEED_SOURCE_EP, "confidence": 0.88},
        )

        dataset_service_primary = DatasetService(
            dataset_uid=dataset.uid,
            service_uid=primary_service.uid,
            role="primary_processing",
            attrs={"seed_source": SEED_SOURCE_EP, "tier": "gold"},
        )
        dataset_service_secondary = DatasetService(
            dataset_uid=dataset.uid,
            service_uid=next_service.uid,
            role="secondary_processing",
            attrs={"seed_source": SEED_SOURCE_EP, "tier": "silver"},
        )

        service_endpoint_primary = ServiceEndpoint(
            service_uid=primary_service.uid,
            endpoint_uid=primary_endpoint.uid,
            role="hosted_on",
            attrs={"seed_source": SEED_SOURCE_EP, "latency_ms": 240},
        )
        service_endpoint_secondary = ServiceEndpoint(
            service_uid=next_service.uid,
            endpoint_uid=primary_endpoint.uid,
            role="compatible_with",
            attrs={"seed_source": SEED_SOURCE_EP, "latency_ms": 320},
        )

        db.merge(dataset_endpoint_primary)
        db.merge(dataset_endpoint_secondary)
        db.merge(dataset_service_primary)
        db.merge(dataset_service_secondary)
        db.merge(service_endpoint_primary)
        db.merge(service_endpoint_secondary)

        affinity = AffinityTriple(
            dataset_uid=dataset.uid,
            endpoint_uids=[primary_endpoint.uid, next_endpoint.uid],
            service_uids=[primary_service.uid, next_service.uid],
            attrs={
                "seed_source": SEED_SOURCE_EP,
                "labels": datasets[idx].metadata_["labels"],
                "narrative": "Auto-generated connected affinity for dashboard and explorer demos",
            },
            version=SEED_VERSION,
        )
        db.add(affinity)

    db.commit()


def seed_demo_data(reset: bool) -> None:
    db = SessionLocal()
    try:
        if reset:
            reset_seed_data(db)

        datasets, services, endpoints = create_base_entities(db)
        create_relationships_and_affinities(db, datasets, services, endpoints)

        print("Demo seed complete")
        print(f"Source marker: {SEED_SOURCE_EP}")
        print(f"Datasets created: {len(datasets)}")
        print(f"Services created: {len(services)}")
        print(f"Endpoints created: {len(endpoints)}")
        print(f"Affinities created: {len(datasets)}")
    finally:
        db.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed connected demo data for NDP Affinities UI demos.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete previously seeded demo data before creating a fresh demo dataset.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    seed_demo_data(reset=args.reset)
