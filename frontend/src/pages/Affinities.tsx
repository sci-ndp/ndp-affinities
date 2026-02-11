import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { affinitiesApi, datasetsApi, endpointsApi, servicesApi } from '../api/client';
import type { Affinity, AffinityCreate, Dataset, Endpoint, Service } from '../types';

const CHIP_PREVIEW_LIMIT = 3;

function formatShortUid(uid: string): string {
  return uid.slice(0, 8);
}

function formatJsonInput(value?: Record<string, unknown>): string {
  return value ? JSON.stringify(value, null, 2) : '';
}

export function Affinities() {
  const [searchParams] = useSearchParams();
  const [affinities, setAffinities] = useState<Affinity[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAffinity, setEditingAffinity] = useState<Affinity | null>(null);
  const [selectedAffinityUid, setSelectedAffinityUid] = useState<string | null>(null);

  const initialDatasetFilter = searchParams.get('dataset_uid') || '';
  const [query, setQuery] = useState('');
  const [datasetFilter, setDatasetFilter] = useState(initialDatasetFilter);
  const [endpointFilter, setEndpointFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const [formData, setFormData] = useState<AffinityCreate>({ endpoint_uids: [], service_uids: [] });
  const [attrsText, setAttrsText] = useState('');
  const [attrsError, setAttrsError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [affRes, dsRes, epRes, svcRes] = await Promise.all([
        affinitiesApi.list(),
        datasetsApi.list(),
        endpointsApi.list(),
        servicesApi.list()
      ]);
      const sortedAffinities = [...affRes.data].sort((a, b) => {
        const aTime = new Date(a.updated_at).getTime();
        const bTime = new Date(b.updated_at).getTime();
        return bTime - aTime;
      });
      setAffinities(sortedAffinities);
      setDatasets(dsRes.data);
      setEndpoints(epRes.data);
      setServices(svcRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const datasetById = useMemo(
    () => new Map(datasets.map((dataset) => [dataset.uid, dataset])),
    [datasets]
  );
  const endpointById = useMemo(
    () => new Map(endpoints.map((endpoint) => [endpoint.uid, endpoint])),
    [endpoints]
  );
  const serviceById = useMemo(
    () => new Map(services.map((service) => [service.uid, service])),
    [services]
  );

  const getDatasetLabel = (uid: string | undefined): string => {
    if (!uid) return 'No dataset';
    const dataset = datasetById.get(uid);
    return dataset?.title || `Dataset ${formatShortUid(uid)}`;
  };

  const getEndpointLabel = (uid: string): string => {
    const endpoint = endpointById.get(uid);
    if (!endpoint) return `Endpoint ${formatShortUid(uid)}`;
    return `${endpoint.kind} (${formatShortUid(uid)})`;
  };

  const getServiceLabel = (uid: string): string => {
    const service = serviceById.get(uid);
    if (!service) return `Service ${formatShortUid(uid)}`;
    return `${service.type || 'service'} (${formatShortUid(uid)})`;
  };

  const filteredAffinities = useMemo(() => {
    return affinities.filter((affinity) => {
      const datasetName = getDatasetLabel(affinity.dataset_uid).toLowerCase();
      const endpointNames = (affinity.endpoint_uids || []).map(getEndpointLabel).join(' ').toLowerCase();
      const serviceNames = (affinity.service_uids || []).map(getServiceLabel).join(' ').toLowerCase();
      const combined = `${datasetName} ${endpointNames} ${serviceNames}`;

      const passesQuery = !query.trim() || combined.includes(query.trim().toLowerCase());
      const passesDataset = !datasetFilter || affinity.dataset_uid === datasetFilter;
      const passesEndpoint = !endpointFilter || (affinity.endpoint_uids || []).includes(endpointFilter);
      const passesService = !serviceFilter || (affinity.service_uids || []).includes(serviceFilter);

      return passesQuery && passesDataset && passesEndpoint && passesService;
    });
  }, [
    affinities,
    datasetFilter,
    endpointFilter,
    getDatasetLabel,
    getEndpointLabel,
    getServiceLabel,
    query,
    serviceFilter
  ]);

  useEffect(() => {
    if (filteredAffinities.length === 0) {
      setSelectedAffinityUid(null);
      return;
    }

    const selectedStillExists = filteredAffinities.some((affinity) => affinity.triple_uid === selectedAffinityUid);
    if (!selectedStillExists) {
      setSelectedAffinityUid(filteredAffinities[0].triple_uid);
    }
  }, [filteredAffinities, selectedAffinityUid]);

  const selectedAffinity = filteredAffinities.find((affinity) => affinity.triple_uid === selectedAffinityUid) || null;

  const metrics = useMemo(() => {
    const datasetsCovered = new Set(filteredAffinities.map((affinity) => affinity.dataset_uid).filter(Boolean));
    const uniqueEndpoints = new Set(filteredAffinities.flatMap((affinity) => affinity.endpoint_uids || []));
    const uniqueServices = new Set(filteredAffinities.flatMap((affinity) => affinity.service_uids || []));

    return {
      total: filteredAffinities.length,
      datasets: datasetsCovered.size,
      endpoints: uniqueEndpoints.size,
      services: uniqueServices.size
    };
  }, [filteredAffinities]);

  const toggleArrayItem = (array: string[], item: string): string[] => {
    if (array.includes(item)) {
      return array.filter((value) => value !== item);
    }
    return [...array, item];
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingAffinity(null);
    setFormData({ endpoint_uids: [], service_uids: [] });
    setAttrsText('');
    setAttrsError(null);
  };

  const handleEdit = (affinity: Affinity) => {
    setEditingAffinity(affinity);
    setFormData({
      dataset_uid: affinity.dataset_uid,
      endpoint_uids: affinity.endpoint_uids || [],
      service_uids: affinity.service_uids || [],
      attrs: affinity.attrs,
      version: affinity.version
    });
    setAttrsText(formatJsonInput(affinity.attrs));
    setAttrsError(null);
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (attrsError) {
      setError('Fix JSON errors in Attributes before saving.');
      return;
    }

    try {
      const payload: AffinityCreate = {
        ...formData,
        attrs: attrsText.trim() ? JSON.parse(attrsText) : undefined
      };

      if (editingAffinity) {
        await affinitiesApi.update(editingAffinity.triple_uid, payload);
      } else {
        const createResponse = await affinitiesApi.create(payload);
        setSelectedAffinityUid(createResponse.data.triple_uid);
      }

      resetForm();
      await fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || 'Failed to save affinity');
      console.error(err);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this affinity?')) return;
    try {
      await affinitiesApi.delete(uid);
      if (selectedAffinityUid === uid) {
        setSelectedAffinityUid(null);
      }
      await fetchData();
    } catch (err) {
      setError('Failed to delete affinity');
      console.error(err);
    }
  };

  const renderChipList = (items: string[], resolveLabel: (uid: string) => string) => {
    if (items.length === 0) {
      return <span className="empty-hint">None</span>;
    }

    const preview = items.slice(0, CHIP_PREVIEW_LIMIT);
    const remainder = items.length - preview.length;

    return (
      <>
        {preview.map((item) => (
          <span key={item} className="entity-chip">{resolveLabel(item)}</span>
        ))}
        {remainder > 0 && <span className="entity-chip muted">+{remainder} more</span>}
      </>
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="affinities-page">
      <div className="page-header">
        <div>
          <h1>Affinity Explorer</h1>
          <p className="lead">Interactive view of dataset, endpoint, and service combinations for demo-ready storytelling.</p>
          <div className="proof-badges">
            <span className="proof-badge">Rule: Hyperedge triple</span>
            <span className="proof-badge">Rule: Versioned association</span>
            <span className="proof-badge">Rule: Pairwise context</span>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingAffinity(null);
            setFormData({ endpoint_uids: [], service_uids: [] });
            setAttrsText('');
            setAttrsError(null);
          }}
          className="btn-primary"
        >
          Add Affinity
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <section className="stats-grid">
        <article className="stat-card">
          <p>Shown Affinities</p>
          <h3>{metrics.total}</h3>
        </article>
        <article className="stat-card">
          <p>Datasets in Scope</p>
          <h3>{metrics.datasets}</h3>
        </article>
        <article className="stat-card">
          <p>Endpoints in Scope</p>
          <h3>{metrics.endpoints}</h3>
        </article>
        <article className="stat-card">
          <p>Services in Scope</p>
          <h3>{metrics.services}</h3>
        </article>
      </section>

      <section className="explorer-filters">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by dataset title, endpoint kind, or service type"
        />
        <select value={datasetFilter} onChange={(event) => setDatasetFilter(event.target.value)}>
          <option value="">All datasets</option>
          {datasets.map((dataset) => (
            <option key={dataset.uid} value={dataset.uid}>{dataset.title || `Dataset ${formatShortUid(dataset.uid)}`}</option>
          ))}
        </select>
        <select value={endpointFilter} onChange={(event) => setEndpointFilter(event.target.value)}>
          <option value="">All endpoints</option>
          {endpoints.map((endpoint) => (
            <option key={endpoint.uid} value={endpoint.uid}>{endpoint.kind} ({formatShortUid(endpoint.uid)})</option>
          ))}
        </select>
        <select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}>
          <option value="">All services</option>
          {services.map((service) => (
            <option key={service.uid} value={service.uid}>{service.type || 'service'} ({formatShortUid(service.uid)})</option>
          ))}
        </select>
      </section>

      <section className="explorer-layout">
        <div className="affinity-list">
          {filteredAffinities.length === 0 && <div className="empty">No affinities match your filters.</div>}
          {filteredAffinities.map((affinity) => (
            <button
              key={affinity.triple_uid}
              type="button"
              className={`affinity-item ${selectedAffinityUid === affinity.triple_uid ? 'active' : ''}`}
              onClick={() => setSelectedAffinityUid(affinity.triple_uid)}
            >
              <div className="affinity-item-header">
                <h3>{getDatasetLabel(affinity.dataset_uid)}</h3>
                <span className="mono">v{affinity.version ?? '-'}</span>
              </div>
              <p className="mono">{affinity.triple_uid}</p>
              <div className="chip-group">
                {renderChipList(affinity.endpoint_uids || [], getEndpointLabel)}
              </div>
              <div className="chip-group">
                {renderChipList(affinity.service_uids || [], getServiceLabel)}
              </div>
            </button>
          ))}
        </div>

        <aside className="affinity-detail">
          {!selectedAffinity && <div className="empty">Select an affinity to inspect relationships.</div>}
          {selectedAffinity && (
            <>
              <h2>{getDatasetLabel(selectedAffinity.dataset_uid)}</h2>
              <p className="mono">Triple UID: {selectedAffinity.triple_uid}</p>
              <p className="mono">Version: {selectedAffinity.version ?? '-'}</p>

              <h4>Endpoints</h4>
              <div className="chip-group">
                {(selectedAffinity.endpoint_uids || []).length === 0 && <span className="empty-hint">None</span>}
                {(selectedAffinity.endpoint_uids || []).map((uid) => (
                  <span key={uid} className="entity-chip">{getEndpointLabel(uid)}</span>
                ))}
              </div>

              <h4>Services</h4>
              <div className="chip-group">
                {(selectedAffinity.service_uids || []).length === 0 && <span className="empty-hint">None</span>}
                {(selectedAffinity.service_uids || []).map((uid) => (
                  <span key={uid} className="entity-chip">{getServiceLabel(uid)}</span>
                ))}
              </div>

              <h4>Attributes</h4>
              <pre>{selectedAffinity.attrs ? JSON.stringify(selectedAffinity.attrs, null, 2) : 'No attributes'}</pre>

              <div className="detail-actions">
                <button onClick={() => handleEdit(selectedAffinity)} className="btn-edit">Edit</button>
                <button onClick={() => handleDelete(selectedAffinity.triple_uid)} className="btn-delete">Delete</button>
              </div>
            </>
          )}
        </aside>
      </section>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <h2>{editingAffinity ? 'Edit Affinity' : 'New Affinity'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Dataset:</label>
                <select
                  value={formData.dataset_uid || ''}
                  onChange={(event) => setFormData({ ...formData, dataset_uid: event.target.value || undefined })}
                >
                  <option value="">No dataset</option>
                  {datasets.map((dataset) => (
                    <option key={dataset.uid} value={dataset.uid}>{dataset.title || `Dataset ${formatShortUid(dataset.uid)}`}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Endpoints:</label>
                <div className="checkbox-list">
                  {endpoints.map((endpoint) => (
                    <label key={endpoint.uid} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={(formData.endpoint_uids || []).includes(endpoint.uid)}
                        onChange={() => setFormData({
                          ...formData,
                          endpoint_uids: toggleArrayItem(formData.endpoint_uids || [], endpoint.uid)
                        })}
                      />
                      {endpoint.kind} ({formatShortUid(endpoint.uid)})
                    </label>
                  ))}
                  {endpoints.length === 0 && <span className="empty-hint">No endpoints available</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Services:</label>
                <div className="checkbox-list">
                  {services.map((service) => (
                    <label key={service.uid} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={(formData.service_uids || []).includes(service.uid)}
                        onChange={() => setFormData({
                          ...formData,
                          service_uids: toggleArrayItem(formData.service_uids || [], service.uid)
                        })}
                      />
                      {service.type || 'service'} ({formatShortUid(service.uid)})
                    </label>
                  ))}
                  {services.length === 0 && <span className="empty-hint">No services available</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Version:</label>
                <input
                  type="number"
                  value={formData.version ?? ''}
                  onChange={(event) => setFormData({
                    ...formData,
                    version: event.target.value ? parseInt(event.target.value, 10) : undefined
                  })}
                  min={1}
                  placeholder="Optional"
                />
              </div>

              <div className="form-group">
                <label>Attributes (JSON):</label>
                <textarea
                  value={attrsText}
                  onChange={(event) => {
                    const value = event.target.value;
                    setAttrsText(value);

                    if (!value.trim()) {
                      setFormData({ ...formData, attrs: undefined });
                      setAttrsError(null);
                      return;
                    }

                    try {
                      const attrs = JSON.parse(value);
                      setFormData({ ...formData, attrs });
                      setAttrsError(null);
                    } catch {
                      setAttrsError('Must be valid JSON.');
                    }
                  }}
                  rows={6}
                  placeholder='{"confidence": 0.95, "priority": "high"}'
                />
                {attrsError && <small className="field-error">{attrsError}</small>}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Save</button>
                <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
