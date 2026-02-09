import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import {
  affinitiesApi,
  datasetEndpointsApi,
  datasetServicesApi,
  datasetsApi,
  endpointsApi,
  serviceEndpointsApi,
  servicesApi
} from '../api/client';
import type {
  Affinity,
  Dataset,
  DatasetEndpoint,
  DatasetService,
  Endpoint,
  Service,
  ServiceEndpoint
} from '../types';

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

function shortUid(uid: string): string {
  return uid.slice(0, 8);
}

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [affinities, setAffinities] = useState<Affinity[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [datasetEndpoints, setDatasetEndpoints] = useState<DatasetEndpoint[]>([]);
  const [datasetServices, setDatasetServices] = useState<DatasetService[]>([]);
  const [serviceEndpoints, setServiceEndpoints] = useState<ServiceEndpoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          affRes,
          dsRes,
          epRes,
          svcRes,
          dsEpRes,
          dsSvcRes,
          svcEpRes
        ] = await Promise.all([
          affinitiesApi.list(),
          datasetsApi.list(),
          endpointsApi.list(),
          servicesApi.list(),
          datasetEndpointsApi.list(),
          datasetServicesApi.list(),
          serviceEndpointsApi.list()
        ]);

        setAffinities(affRes.data);
        setDatasets(dsRes.data);
        setEndpoints(epRes.data);
        setServices(svcRes.data);
        setDatasetEndpoints(dsEpRes.data);
        setDatasetServices(dsSvcRes.data);
        setServiceEndpoints(svcEpRes.data);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const datasetById = useMemo(() => {
    return new Map(datasets.map((dataset) => [dataset.uid, dataset]));
  }, [datasets]);

  const endpointById = useMemo(() => {
    return new Map(endpoints.map((endpoint) => [endpoint.uid, endpoint]));
  }, [endpoints]);

  const serviceById = useMemo(() => {
    return new Map(services.map((service) => [service.uid, service]));
  }, [services]);

  const analytics = useMemo(() => {
    const datasetsCovered = new Set(affinities.map((affinity) => affinity.dataset_uid).filter(Boolean));
    const endpointsUsedByAffinities = new Set(affinities.flatMap((affinity) => affinity.endpoint_uids || []));
    const servicesUsedByAffinities = new Set(affinities.flatMap((affinity) => affinity.service_uids || []));

    const avgEndpointsPerAffinity = affinities.length
      ? (affinities.reduce((sum, affinity) => sum + (affinity.endpoint_uids?.length || 0), 0) / affinities.length).toFixed(1)
      : '0.0';
    const avgServicesPerAffinity = affinities.length
      ? (affinities.reduce((sum, affinity) => sum + (affinity.service_uids?.length || 0), 0) / affinities.length).toFixed(1)
      : '0.0';

    const datasetCoverage = pct(datasetsCovered.size, datasets.length);
    const endpointCoverage = pct(endpointsUsedByAffinities.size, endpoints.length);
    const serviceCoverage = pct(servicesUsedByAffinities.size, services.length);

    const systemReadiness = Math.round((datasetCoverage + endpointCoverage + serviceCoverage) / 3);

    const affinityByDataset = new Map<string, number>();
    for (const affinity of affinities) {
      if (!affinity.dataset_uid) continue;
      affinityByDataset.set(affinity.dataset_uid, (affinityByDataset.get(affinity.dataset_uid) || 0) + 1);
    }

    const topDatasets = [...affinityByDataset.entries()]
      .map(([uid, total]) => ({ uid, total, label: datasetById.get(uid)?.title || `Dataset ${shortUid(uid)}` }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const endpointKindCounts = new Map<string, number>();
    for (const uid of endpointsUsedByAffinities) {
      const kind = endpointById.get(uid)?.kind || 'unknown';
      endpointKindCounts.set(kind, (endpointKindCounts.get(kind) || 0) + 1);
    }

    const serviceTypeCounts = new Map<string, number>();
    for (const uid of servicesUsedByAffinities) {
      const type = serviceById.get(uid)?.type || 'unknown';
      serviceTypeCounts.set(type, (serviceTypeCounts.get(type) || 0) + 1);
    }

    const topEndpointKinds = [...endpointKindCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topServiceTypes = [...serviceTypeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    const latestAffinities = [...affinities]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);

    return {
      datasetsCovered,
      endpointsUsedByAffinities,
      servicesUsedByAffinities,
      datasetCoverage,
      endpointCoverage,
      serviceCoverage,
      systemReadiness,
      avgEndpointsPerAffinity,
      avgServicesPerAffinity,
      topDatasets,
      topEndpointKinds,
      topServiceTypes,
      latestAffinities
    };
  }, [affinities, datasets.length, endpoints.length, services.length, datasetById, endpointById, serviceById]);

  if (loading) return <div>Loading...</div>;

  const readinessStyle = { '--readiness': `${analytics.systemReadiness}%` } as CSSProperties;

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <div>
          <h1>NDP Affinities Intelligence Console</h1>
          <p className="lead">
            This dashboard demonstrates the stack's core value: expressing dataset + endpoint + service compatibility as
            concrete, queryable affinity triples.
          </p>
        </div>

        <div className="readiness-panel">
          <p>Readiness Score</p>
          <div className="readiness-ring" style={readinessStyle}>
            <span>{analytics.systemReadiness}%</span>
          </div>
          <small>Coverage-based score across datasets, endpoints, and services.</small>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <section className="stats-grid">
        <article className="stat-card">
          <p>Total Affinities</p>
          <h3>{affinities.length}</h3>
        </article>
        <article className="stat-card">
          <p>Datasets Covered</p>
          <h3>{analytics.datasetsCovered.size} / {datasets.length}</h3>
        </article>
        <article className="stat-card">
          <p>Endpoints Used</p>
          <h3>{analytics.endpointsUsedByAffinities.size} / {endpoints.length}</h3>
        </article>
        <article className="stat-card">
          <p>Services Used</p>
          <h3>{analytics.servicesUsedByAffinities.size} / {services.length}</h3>
        </article>
        <article className="stat-card">
          <p>Avg Endpoints per Affinity</p>
          <h3>{analytics.avgEndpointsPerAffinity}</h3>
        </article>
        <article className="stat-card">
          <p>Avg Services per Affinity</p>
          <h3>{analytics.avgServicesPerAffinity}</h3>
        </article>
      </section>

      <section className="dashboard-layout">
        <article className="card">
          <h3>Coverage By Domain</h3>
          <div className="coverage-rows">
            <div>
              <p>Dataset Coverage</p>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${analytics.datasetCoverage}%` }} /></div>
              <small>{analytics.datasetCoverage}% of datasets represented in affinities</small>
            </div>
            <div>
              <p>Endpoint Coverage</p>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${analytics.endpointCoverage}%` }} /></div>
              <small>{analytics.endpointCoverage}% of endpoints used by affinities</small>
            </div>
            <div>
              <p>Service Coverage</p>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${analytics.serviceCoverage}%` }} /></div>
              <small>{analytics.serviceCoverage}% of services used by affinities</small>
            </div>
          </div>
        </article>

        <article className="card">
          <h3>Graph Connectivity</h3>
          <div className="edge-grid">
            <div>
              <p>Dataset-EndPoint edges</p>
              <h4>{datasetEndpoints.length}</h4>
            </div>
            <div>
              <p>Dataset-Service edges</p>
              <h4>{datasetServices.length}</h4>
            </div>
            <div>
              <p>Service-Endpoint edges</p>
              <h4>{serviceEndpoints.length}</h4>
            </div>
            <div>
              <p>Total graph edges</p>
              <h4>{datasetEndpoints.length + datasetServices.length + serviceEndpoints.length}</h4>
            </div>
          </div>
          <div className="graph-link-row">
            <Link className="btn-primary" to="/graph-connectivity">Open Graph View</Link>
          </div>
        </article>
      </section>

      <section className="dashboard-layout">
        <article className="card insight-card">
          <h3>Top Dataset Affinity Hubs</h3>
          {analytics.topDatasets.length === 0 ? (
            <p className="empty">No dataset hubs yet.</p>
          ) : (
            <ul className="insight-list">
              {analytics.topDatasets.map((item) => (
                <li key={item.uid}>
                  <span>{item.label}</span>
                  <strong>{item.total}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card insight-card">
          <h3>Most Used Endpoint Kinds</h3>
          {analytics.topEndpointKinds.length === 0 ? (
            <p className="empty">No endpoint usage yet.</p>
          ) : (
            <ul className="insight-list">
              {analytics.topEndpointKinds.map(([kind, total]) => (
                <li key={kind}>
                  <span>{kind}</span>
                  <strong>{total}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card insight-card">
          <h3>Most Used Service Types</h3>
          {analytics.topServiceTypes.length === 0 ? (
            <p className="empty">No service usage yet.</p>
          ) : (
            <ul className="insight-list">
              {analytics.topServiceTypes.map(([type, total]) => (
                <li key={type}>
                  <span>{type}</span>
                  <strong>{total}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="dashboard-layout">
        <article className="card">
          <h3>Latest Affinity Updates</h3>
          {analytics.latestAffinities.length === 0 ? (
            <p className="empty">No affinities available.</p>
          ) : (
            <ul className="timeline-list">
              {analytics.latestAffinities.map((affinity) => (
                <li key={affinity.triple_uid}>
                  <p>{datasetById.get(affinity.dataset_uid || '')?.title || `Dataset ${shortUid(affinity.dataset_uid || affinity.triple_uid)}`}</p>
                  <small>
                    {new Date(affinity.updated_at).toLocaleString()} | {affinity.endpoint_uids?.length || 0} endpoints | {affinity.service_uids?.length || 0} services
                  </small>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card">
          <h3>Demo Routes</h3>
          <div className="dashboard-cards demo-links">
            <Link className="card demo-card" to="/affinities">
              <h4>Affinity Explorer</h4>
              <p>Inspect, filter, and present triple compatibility storylines.</p>
            </Link>
            <Link className="card demo-card" to="/datasets">
              <h4>Datasets</h4>
              <p>Review metadata and sources that feed affinity matching.</p>
            </Link>
            <Link className="card demo-card" to="/services">
              <h4>Services</h4>
              <p>Show service capabilities and versions powering integrations.</p>
            </Link>
            <Link className="card demo-card" to="/graph-connectivity">
              <h4>Graph Connectivity</h4>
              <p>Live relationship graph with affinity overlays for high-impact demos.</p>
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
