import { useState, useEffect } from 'react';
import { datasetEndpointsApi, datasetsApi, endpointsApi } from '../api/client';
import type { DatasetEndpoint, DatasetEndpointCreate, Dataset, Endpoint } from '../types';

export function DatasetEndpoints() {
  const [relations, setRelations] = useState<DatasetEndpoint[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<DatasetEndpointCreate>({
    dataset_uid: '',
    endpoint_uid: ''
  });
  const [attrsText, setAttrsText] = useState('');
  const [attrsError, setAttrsError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [relRes, dsRes, epRes] = await Promise.all([
        datasetEndpointsApi.list(),
        datasetsApi.list(),
        endpointsApi.list()
      ]);
      setRelations(relRes.data);
      setDatasets(dsRes.data);
      setEndpoints(epRes.data);
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
    if (attrsError) {
      setError('Fix JSON errors in Attributes before saving.');
      return;
    }
    try {
      const payload: DatasetEndpointCreate = {
        ...formData,
        attrs: attrsText.trim() ? JSON.parse(attrsText) : undefined
      };
      await datasetEndpointsApi.create(payload);
      setShowForm(false);
      setFormData({ dataset_uid: '', endpoint_uid: '' });
      setAttrsText('');
      setAttrsError(null);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || 'Failed to create relationship');
      console.error(err);
    }
  };

  const handleDelete = async (datasetUid: string, endpointUid: string) => {
    if (!confirm('Are you sure you want to delete this relationship?')) return;
    try {
      await datasetEndpointsApi.delete(datasetUid, endpointUid);
      fetchData();
    } catch (err) {
      setError('Failed to delete relationship');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ dataset_uid: '', endpoint_uid: '' });
    setAttrsText('');
    setAttrsError(null);
  };

  const getDatasetTitle = (uid: string) => {
    const ds = datasets.find(d => d.uid === uid);
    return ds?.title || uid;
  };

  const getEndpointKind = (uid: string) => {
    const ep = endpoints.find(e => e.uid === uid);
    return ep?.kind || uid;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Dataset-Endpoints</h1>
        <button
          onClick={() => {
            setFormData({ dataset_uid: '', endpoint_uid: '' });
            setAttrsText('');
            setAttrsError(null);
            setShowForm(true);
          }}
          className="btn-primary"
        >
          Add Relationship
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>New Dataset-Endpoint Relationship</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Dataset: *</label>
                <select
                  value={formData.dataset_uid}
                  onChange={(e) => setFormData({ ...formData, dataset_uid: e.target.value })}
                  required
                >
                  <option value="">Select a dataset</option>
                  {datasets.map((ds) => (
                    <option key={ds.uid} value={ds.uid}>{ds.title || ds.uid}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Endpoint: *</label>
                <select
                  value={formData.endpoint_uid}
                  onChange={(e) => setFormData({ ...formData, endpoint_uid: e.target.value })}
                  required
                >
                  <option value="">Select an endpoint</option>
                  {endpoints.map((ep) => (
                    <option key={ep.uid} value={ep.uid}>{ep.kind}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Role:</label>
                <input
                  type="text"
                  value={formData.role || ''}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value || undefined })}
                />
              </div>
              <div className="form-group">
                <label>Attributes (JSON):</label>
                <textarea
                  value={attrsText}
                  onChange={(e) => {
                    const value = e.target.value;
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
                  rows={4}
                  placeholder='{"key": "value"}'
                />
                {attrsError && <small className="field-error">{attrsError}</small>}
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
            <th>Dataset</th>
            <th>Endpoint</th>
            <th>Role</th>
            <th>Attributes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {relations.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty">No relationships found</td>
            </tr>
          ) : (
            relations.map((rel) => (
              <tr key={`${rel.dataset_uid}-${rel.endpoint_uid}`}>
                <td>{getDatasetTitle(rel.dataset_uid)}</td>
                <td>{getEndpointKind(rel.endpoint_uid)}</td>
                <td>{rel.role || '-'}</td>
                <td className="attrs">{rel.attrs ? JSON.stringify(rel.attrs) : '-'}</td>
                <td className="actions">
                  <button onClick={() => handleDelete(rel.dataset_uid, rel.endpoint_uid)} className="btn-delete">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
