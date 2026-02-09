import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { affinitiesApi, datasetsApi, endpointsApi, servicesApi } from '../api/client';
import type { Affinity, Dataset, Endpoint, Service } from '../types';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [affinities, setAffinities] = useState<Affinity[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [affRes, dsRes, epRes, svcRes] = await Promise.all([
          affinitiesApi.list(),
          datasetsApi.list(),
          endpointsApi.list(),
          servicesApi.list()
        ]);
        setAffinities(affRes.data);
        setDatasets(dsRes.data);
        setEndpoints(epRes.data);
        setServices(svcRes.data);
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

  const stats = useMemo(() => {
    const datasetsCovered = new Set(affinities.map((a) => a.dataset_uid).filter(Boolean));
    const endpointsUsed = new Set(affinities.flatMap((a) => a.endpoint_uids || []));
    const servicesUsed = new Set(affinities.flatMap((a) => a.service_uids || []));
    const avgEndpointsPerAffinity = affinities.length
      ? (affinities.reduce((sum, a) => sum + (a.endpoint_uids?.length || 0), 0) / affinities.length).toFixed(1)
      : '0.0';
    const avgServicesPerAffinity = affinities.length
      ? (affinities.reduce((sum, a) => sum + (a.service_uids?.length || 0), 0) / affinities.length).toFixed(1)
      : '0.0';

    return {
      datasetsCovered: datasetsCovered.size,
      endpointsUsed: endpointsUsed.size,
      servicesUsed: servicesUsed.size,
      avgEndpointsPerAffinity,
      avgServicesPerAffinity
    };
  }, [affinities]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>NDP Affinities Demo Dashboard</h1>
          <p className="lead">Live system health and relationship coverage across datasets, endpoints, services, and affinity triples.</p>
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
          <h3>{stats.datasetsCovered} / {datasets.length}</h3>
        </article>
        <article className="stat-card">
          <p>Endpoints Used</p>
          <h3>{stats.endpointsUsed} / {endpoints.length}</h3>
        </article>
        <article className="stat-card">
          <p>Services Used</p>
          <h3>{stats.servicesUsed} / {services.length}</h3>
        </article>
        <article className="stat-card">
          <p>Avg Endpoints per Affinity</p>
          <h3>{stats.avgEndpointsPerAffinity}</h3>
        </article>
        <article className="stat-card">
          <p>Avg Services per Affinity</p>
          <h3>{stats.avgServicesPerAffinity}</h3>
        </article>
      </section>

      <section className="dashboard-cards">
        <Link className="card demo-card" to="/affinities">
          <h3>Affinity Explorer</h3>
          <p>Showcase dataset-to-endpoint-to-service combinations with filtering and detail panes.</p>
        </Link>
        <Link className="card demo-card" to="/datasets">
          <h3>Datasets</h3>
          <p>{datasets.length} registered dataset records with source and metadata fields.</p>
        </Link>
        <Link className="card demo-card" to="/endpoints">
          <h3>Endpoints</h3>
          <p>{endpoints.length} endpoint definitions powering transfer and access flows.</p>
        </Link>
        <Link className="card demo-card" to="/services">
          <h3>Services</h3>
          <p>{services.length} services with OpenAPI and version surface for integration demos.</p>
        </Link>
      </section>
    </div>
  );
}
