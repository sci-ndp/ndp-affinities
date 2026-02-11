import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  affinitiesApi,
  datasetEndpointsApi,
  datasetServicesApi,
  datasetsApi,
  endpointsApi,
  serviceEndpointsApi,
  servicesApi,
} from '../api/client';
import type {
  Affinity,
  Dataset,
  DatasetEndpoint,
  DatasetService,
  Endpoint,
  Service,
  ServiceEndpoint,
} from '../types';

type NodeType = 'dataset' | 'service' | 'endpoint';
type GraphMode = 'combined' | 'pairwise' | 'triple';

type GraphNode = {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
};

type GraphEdge = {
  source: string;
  target: string;
  type: 'dataset-service' | 'service-endpoint' | 'dataset-endpoint' | 'affinity';
  weight: number;
};

const MAX_NODES_PER_LANE = 12;

function shortUid(uid: string): string {
  return uid.slice(0, 8);
}

function distributeY(count: number, top: number, bottom: number): number[] {
  if (count <= 1) return [(top + bottom) / 2];
  const span = bottom - top;
  return Array.from({ length: count }, (_, i) => top + (span * i) / (count - 1));
}

export function GraphConnectivity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = (searchParams.get('mode') as GraphMode) || 'combined';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [datasetEndpoints, setDatasetEndpoints] = useState<DatasetEndpoint[]>([]);
  const [datasetServices, setDatasetServices] = useState<DatasetService[]>([]);
  const [serviceEndpoints, setServiceEndpoints] = useState<ServiceEndpoint[]>([]);
  const [affinities, setAffinities] = useState<Affinity[]>([]);

  const [focusDataset, setFocusDataset] = useState('');
  const [graphMode, setGraphMode] = useState<GraphMode>(initialMode);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          dsRes,
          svcRes,
          epRes,
          dsEpRes,
          dsSvcRes,
          svcEpRes,
          affRes,
        ] = await Promise.all([
          datasetsApi.list(),
          servicesApi.list(),
          endpointsApi.list(),
          datasetEndpointsApi.list(),
          datasetServicesApi.list(),
          serviceEndpointsApi.list(),
          affinitiesApi.list(),
        ]);

        setDatasets(dsRes.data);
        setServices(svcRes.data);
        setEndpoints(epRes.data);
        setDatasetEndpoints(dsEpRes.data);
        setDatasetServices(dsSvcRes.data);
        setServiceEndpoints(svcEpRes.data);
        setAffinities(affRes.data);
        setError(null);
      } catch (err) {
        setError('Failed to load graph data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setSearchParams((prev) => {
      prev.set('mode', graphMode);
      return prev;
    }, { replace: true });
  }, [graphMode, setSearchParams]);

  const datasetById = useMemo(() => new Map(datasets.map((d) => [d.uid, d])), [datasets]);
  const serviceById = useMemo(() => new Map(services.map((s) => [s.uid, s])), [services]);
  const endpointById = useMemo(() => new Map(endpoints.map((e) => [e.uid, e])), [endpoints]);

  const graph = useMemo(() => {
    const datasetDegree = new Map<string, number>();
    const serviceDegree = new Map<string, number>();
    const endpointDegree = new Map<string, number>();

    const bump = (map: Map<string, number>, id: string) => {
      map.set(id, (map.get(id) || 0) + 1);
    };

    datasetEndpoints.forEach((edge) => {
      bump(datasetDegree, edge.dataset_uid);
      bump(endpointDegree, edge.endpoint_uid);
    });
    datasetServices.forEach((edge) => {
      bump(datasetDegree, edge.dataset_uid);
      bump(serviceDegree, edge.service_uid);
    });
    serviceEndpoints.forEach((edge) => {
      bump(serviceDegree, edge.service_uid);
      bump(endpointDegree, edge.endpoint_uid);
    });
    affinities.forEach((affinity) => {
      if (affinity.dataset_uid) bump(datasetDegree, affinity.dataset_uid);
      (affinity.service_uids || []).forEach((id) => bump(serviceDegree, id));
      (affinity.endpoint_uids || []).forEach((id) => bump(endpointDegree, id));
    });

    const rankedDatasets = [...datasets]
      .sort((a, b) => (datasetDegree.get(b.uid) || 0) - (datasetDegree.get(a.uid) || 0));
    const rankedServices = [...services]
      .sort((a, b) => (serviceDegree.get(b.uid) || 0) - (serviceDegree.get(a.uid) || 0));
    const rankedEndpoints = [...endpoints]
      .sort((a, b) => (endpointDegree.get(b.uid) || 0) - (endpointDegree.get(a.uid) || 0));

    let visibleDatasetIds = new Set(rankedDatasets.slice(0, MAX_NODES_PER_LANE).map((d) => d.uid));
    let visibleServiceIds = new Set(rankedServices.slice(0, MAX_NODES_PER_LANE).map((s) => s.uid));
    let visibleEndpointIds = new Set(rankedEndpoints.slice(0, MAX_NODES_PER_LANE).map((e) => e.uid));

    if (focusDataset) {
      visibleDatasetIds = new Set([focusDataset]);
      const directlyLinkedServices = new Set(
        datasetServices.filter((edge) => edge.dataset_uid === focusDataset).map((edge) => edge.service_uid)
      );
      const directlyLinkedEndpoints = new Set(
        datasetEndpoints.filter((edge) => edge.dataset_uid === focusDataset).map((edge) => edge.endpoint_uid)
      );

      affinities
        .filter((affinity) => affinity.dataset_uid === focusDataset)
        .forEach((affinity) => {
          (affinity.service_uids || []).forEach((id) => directlyLinkedServices.add(id));
          (affinity.endpoint_uids || []).forEach((id) => directlyLinkedEndpoints.add(id));
        });

      const secondHopEndpoints = serviceEndpoints
        .filter((edge) => directlyLinkedServices.has(edge.service_uid))
        .map((edge) => edge.endpoint_uid);
      secondHopEndpoints.forEach((id) => directlyLinkedEndpoints.add(id));

      visibleServiceIds = directlyLinkedServices;
      visibleEndpointIds = directlyLinkedEndpoints;
    }

    const yDatasets = distributeY(visibleDatasetIds.size, 110, 610);
    const yServices = distributeY(visibleServiceIds.size, 110, 610);
    const yEndpoints = distributeY(visibleEndpointIds.size, 110, 610);

    const nodes: GraphNode[] = [
      ...[...visibleDatasetIds].map((id, i) => ({
        id,
        label: datasetById.get(id)?.title || `Dataset ${shortUid(id)}`,
        type: 'dataset' as const,
        x: 160,
        y: yDatasets[i],
      })),
      ...[...visibleServiceIds].map((id, i) => ({
        id,
        label: serviceById.get(id)?.type || `Service ${shortUid(id)}`,
        type: 'service' as const,
        x: 600,
        y: yServices[i],
      })),
      ...[...visibleEndpointIds].map((id, i) => ({
        id,
        label: endpointById.get(id)?.kind || `Endpoint ${shortUid(id)}`,
        type: 'endpoint' as const,
        x: 1040,
        y: yEndpoints[i],
      })),
    ];

    const nodeIds = new Set(nodes.map((n) => n.id));
    const edgeMap = new Map<string, GraphEdge>();

    const addEdge = (source: string, target: string, type: GraphEdge['type']) => {
      if (!nodeIds.has(source) || !nodeIds.has(target)) return;
      const key = `${type}:${source}:${target}`;
      const existing = edgeMap.get(key);
      if (existing) {
        existing.weight += 1;
      } else {
        edgeMap.set(key, { source, target, type, weight: 1 });
      }
    };

    datasetServices.forEach((edge) => addEdge(edge.dataset_uid, edge.service_uid, 'dataset-service'));
    serviceEndpoints.forEach((edge) => addEdge(edge.service_uid, edge.endpoint_uid, 'service-endpoint'));
    datasetEndpoints.forEach((edge) => addEdge(edge.dataset_uid, edge.endpoint_uid, 'dataset-endpoint'));

    affinities.forEach((affinity) => {
      if (!affinity.dataset_uid) return;
      (affinity.service_uids || []).forEach((serviceUid) => addEdge(affinity.dataset_uid!, serviceUid, 'affinity'));
      (affinity.service_uids || []).forEach((serviceUid) => {
        (affinity.endpoint_uids || []).forEach((endpointUid) => addEdge(serviceUid, endpointUid, 'affinity'));
      });
    });

    return {
      nodes,
      edges: [...edgeMap.values()],
      hiddenCounts: {
        datasets: Math.max(0, datasets.length - visibleDatasetIds.size),
        services: Math.max(0, services.length - visibleServiceIds.size),
        endpoints: Math.max(0, endpoints.length - visibleEndpointIds.size),
      },
    };
  }, [
    affinities,
    datasetById,
    datasetEndpoints,
    datasetServices,
    datasets,
    endpointById,
    endpoints,
    focusDataset,
    serviceById,
    serviceEndpoints,
    services,
  ]);

  const filteredEdges = useMemo(() => {
    if (graphMode === 'pairwise') {
      return graph.edges.filter((edge) => edge.type !== 'affinity');
    }
    if (graphMode === 'triple') {
      return graph.edges.filter((edge) => edge.type === 'affinity');
    }
    return graph.edges;
  }, [graph.edges, graphMode]);

  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);

  const focusInsights = useMemo(() => {
    if (!focusDataset) {
      return {
        title: 'Global lens',
        services: new Set(datasetServices.map((edge) => edge.service_uid)).size,
        endpoints: new Set(datasetEndpoints.map((edge) => edge.endpoint_uid)).size,
        triples: affinities.length,
      };
    }

    const directServices = new Set(datasetServices.filter((edge) => edge.dataset_uid === focusDataset).map((edge) => edge.service_uid));
    const directEndpoints = new Set(datasetEndpoints.filter((edge) => edge.dataset_uid === focusDataset).map((edge) => edge.endpoint_uid));
    const tripleRows = affinities.filter((affinity) => affinity.dataset_uid === focusDataset);

    tripleRows.forEach((row) => {
      (row.service_uids || []).forEach((id) => directServices.add(id));
      (row.endpoint_uids || []).forEach((id) => directEndpoints.add(id));
    });

    return {
      title: datasetById.get(focusDataset)?.title || `Dataset ${shortUid(focusDataset)}`,
      services: directServices.size,
      endpoints: directEndpoints.size,
      triples: tripleRows.length,
    };
  }, [affinities, datasetById, datasetEndpoints, datasetServices, focusDataset]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="connectivity-page">
      <div className="page-header">
        <div>
          <h1>Graph Connectivity</h1>
          <p className="lead">
            Visual map of how datasets, services, and endpoints are connected through direct relationships and affinity paths.
          </p>
          <div className="proof-badges">
            <span className="proof-badge">Rule: Pairwise edges</span>
            <span className="proof-badge">Rule: Hyperedge overlay</span>
            <span className="proof-badge">Rule: Central lineage view</span>
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <section className="connectivity-toolbar">
        <label>
          Focus dataset:
          <select value={focusDataset} onChange={(event) => setFocusDataset(event.target.value)}>
            <option value="">Top connected nodes</option>
            {datasets.map((dataset) => (
              <option key={dataset.uid} value={dataset.uid}>
                {dataset.title || `Dataset ${shortUid(dataset.uid)}`}
              </option>
            ))}
          </select>
        </label>

        <div className="mode-switch">
          <button type="button" className={`step-chip ${graphMode === 'pairwise' ? 'active' : ''}`} onClick={() => setGraphMode('pairwise')}>Pairwise only</button>
          <button type="button" className={`step-chip ${graphMode === 'triple' ? 'active' : ''}`} onClick={() => setGraphMode('triple')}>Triple overlay</button>
          <button type="button" className={`step-chip ${graphMode === 'combined' ? 'active' : ''}`} onClick={() => setGraphMode('combined')}>Combined</button>
        </div>

        <div className="legend">
          <span className="legend-item dataset">Dataset lane</span>
          <span className="legend-item service">Service lane</span>
          <span className="legend-item endpoint">Endpoint lane</span>
          <span className="legend-item affinity">Affinity overlay</span>
        </div>
      </section>

      <section className="connectivity-layout">
        <div className="connectivity-canvas-wrap">
          <svg className="connectivity-canvas" viewBox="0 0 1200 720" role="img" aria-label="Connectivity network graph">
            <defs>
              <linearGradient id="edgeGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#42b4d6" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#2d95bf" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#2480a5" stopOpacity="0.35" />
              </linearGradient>
              <linearGradient id="affinityGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.55" />
              </linearGradient>
            </defs>

            <text x="110" y="60" className="lane-title">Datasets</text>
            <text x="550" y="60" className="lane-title">Services</text>
            <text x="1000" y="60" className="lane-title">Endpoints</text>

            {filteredEdges.map((edge, idx) => {
              const source = nodeById.get(edge.source);
              const target = nodeById.get(edge.target);
              if (!source || !target) return null;
              const c1x = source.x + (target.x - source.x) * 0.35;
              const c2x = source.x + (target.x - source.x) * 0.65;
              const d = `M ${source.x} ${source.y} C ${c1x} ${source.y}, ${c2x} ${target.y}, ${target.x} ${target.y}`;
              const isAffinity = edge.type === 'affinity';
              return (
                <path
                  key={`${edge.type}-${edge.source}-${edge.target}-${idx}`}
                  d={d}
                  className={`edge edge-${edge.type}`}
                  stroke={isAffinity ? 'url(#affinityGradient)' : 'url(#edgeGradient)'}
                  strokeWidth={isAffinity ? 1.2 + edge.weight * 0.9 : 0.8 + edge.weight * 0.55}
                  strokeDasharray={isAffinity ? '6 4' : undefined}
                />
              );
            })}

            {graph.nodes.map((node) => (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`} className={`graph-node ${node.type}`}>
                <circle r="14" />
                <text x={node.type === 'endpoint' ? -20 : 20} y="5" textAnchor={node.type === 'endpoint' ? 'end' : 'start'}>
                  {node.label.length > 44 ? `${node.label.slice(0, 44)}...` : node.label}
                </text>
                <title>{node.label}</title>
              </g>
            ))}
          </svg>
        </div>

        <aside className="card why-panel">
          <h3>Why This Matters</h3>
          <p className="lead-tight">{focusInsights.title}</p>
          <p>
            The central graph materializes how one dataset propagates through services and reaches endpoints, enabling
            fast cross-EP discovery and impact analysis.
          </p>
          <ul className="rule-proof-list">
            <li>Connected services: <strong>{focusInsights.services}</strong></li>
            <li>Connected endpoints: <strong>{focusInsights.endpoints}</strong></li>
            <li>Affinity triples: <strong>{focusInsights.triples}</strong></li>
          </ul>
        </aside>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <p>Visible Nodes</p>
          <h3>{graph.nodes.length}</h3>
        </article>
        <article className="stat-card">
          <p>Visible Edges</p>
          <h3>{filteredEdges.length}</h3>
        </article>
        <article className="stat-card">
          <p>Hidden Datasets</p>
          <h3>{graph.hiddenCounts.datasets}</h3>
        </article>
        <article className="stat-card">
          <p>Hidden Services</p>
          <h3>{graph.hiddenCounts.services}</h3>
        </article>
        <article className="stat-card">
          <p>Hidden Endpoints</p>
          <h3>{graph.hiddenCounts.endpoints}</h3>
        </article>
      </section>
    </div>
  );
}
