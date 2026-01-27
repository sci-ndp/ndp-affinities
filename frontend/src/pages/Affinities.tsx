import { useState, useEffect } from 'react';
import { affinitiesApi, datasetsApi, endpointsApi, servicesApi } from '../api/client';
import type { Affinity, AffinityCreate, Dataset, Endpoint, Service } from '../types';

export function Affinities() {
  const [affinities, setAffinities] = useState<Affinity[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAffinity, setEditingAffinity] = useState<Affinity | null>(null);
  const [formData, setFormData] = useState<AffinityCreate>({
    endpoint_uids: [],
    service_uids: []
  });

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
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAffinity) {
        await affinitiesApi.update(editingAffinity.triple_uid, formData);
      } else {
        await affinitiesApi.create(formData);
      }
      setShowForm(false);
      setEditingAffinity(null);
      setFormData({ endpoint_uids: [], service_uids: [] });
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || 'Failed to save affinity');
      console.error(err);
    }
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
    setShowForm(true);
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this affinity?')) return;
    try {
      await affinitiesApi.delete(uid);
      fetchData();
    } catch (err) {
      setError('Failed to delete affinity');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAffinity(null);
    setFormData({ endpoint_uids: [], service_uids: [] });
  };

  const getDatasetTitle = (uid: string | undefined) => {
    if (!uid) return '-';
    const ds = datasets.find(d => d.uid === uid);
    return ds?.title || uid;
  };

  const toggleArrayItem = (array: string[], item: string): string[] => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Affinities</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Add Affinity
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <h2>{editingAffinity ? 'Edit Affinity' : 'New Affinity'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Dataset:</label>
                <select
                  value={formData.dataset_uid || ''}
                  onChange={(e) => setFormData({ ...formData, dataset_uid: e.target.value || undefined })}
                >
                  <option value="">No dataset</option>
                  {datasets.map((ds) => (
                    <option key={ds.uid} value={ds.uid}>{ds.title || ds.uid}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Endpoints:</label>
                <div className="checkbox-list">
                  {endpoints.map((ep) => (
                    <label key={ep.uid} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={(formData.endpoint_uids || []).includes(ep.uid)}
                        onChange={() => setFormData({
                          ...formData,
                          endpoint_uids: toggleArrayItem(formData.endpoint_uids || [], ep.uid)
                        })}
                      />
                      {ep.kind}
                    </label>
                  ))}
                  {endpoints.length === 0 && <span className="empty-hint">No endpoints available</span>}
                </div>
              </div>
              <div className="form-group">
                <label>Services:</label>
                <div className="checkbox-list">
                  {services.map((svc) => (
                    <label key={svc.uid} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={(formData.service_uids || []).includes(svc.uid)}
                        onChange={() => setFormData({
                          ...formData,
                          service_uids: toggleArrayItem(formData.service_uids || [], svc.uid)
                        })}
                      />
                      {svc.type || svc.uid}
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
                  onChange={(e) => setFormData({ ...formData, version: e.target.value ? parseInt(e.target.value) : undefined })}
                  min={1}
                  placeholder="Optional"
                />
              </div>
              <div className="form-group">
                <label>Attributes (JSON):</label>
                <textarea
                  value={formData.attrs ? JSON.stringify(formData.attrs, null, 2) : ''}
                  onChange={(e) => {
                    try {
                      const attrs = e.target.value ? JSON.parse(e.target.value) : undefined;
                      setFormData({ ...formData, attrs });
                    } catch {
                      // Invalid JSON, keep current value
                    }
                  }}
                  rows={4}
                  placeholder='{"key": "value"}'
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Save</button>
                <button type="button" onClick={handleCancel} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Triple UID</th>
            <th>Dataset</th>
            <th>Endpoints</th>
            <th>Services</th>
            <th>Version</th>
            <th>Attributes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {affinities.length === 0 ? (
            <tr>
              <td colSpan={7} className="empty">No affinities found</td>
            </tr>
          ) : (
            affinities.map((aff) => (
              <tr key={aff.triple_uid}>
                <td className="uid">{aff.triple_uid}</td>
                <td>{getDatasetTitle(aff.dataset_uid)}</td>
                <td>{aff.endpoint_uids?.length || 0}</td>
                <td>{aff.service_uids?.length || 0}</td>
                <td>{aff.version ?? '-'}</td>
                <td className="attrs">{aff.attrs ? JSON.stringify(aff.attrs) : '-'}</td>
                <td className="actions">
                  <button onClick={() => handleEdit(aff)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDelete(aff.triple_uid)} className="btn-delete">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
