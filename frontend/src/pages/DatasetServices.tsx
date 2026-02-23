import { useState, useEffect } from 'react';
import { datasetServicesApi, datasetsApi, servicesApi } from '../api/client';
import { Pagination } from '../components/Pagination';
import type { DatasetService, DatasetServiceCreate, Dataset, Service } from '../types';

export function DatasetServices() {
  const [relations, setRelations] = useState<DatasetService[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [hasNext, setHasNext] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<DatasetServiceCreate>({
    dataset_uid: '',
    service_uid: ''
  });
  const [attrsText, setAttrsText] = useState('');
  const [attrsError, setAttrsError] = useState<string | null>(null);
  const lookupLimit = 1000;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [relRes, dsRes, svcRes] = await Promise.all([
        datasetServicesApi.list({
          skip: (page - 1) * pageSize,
          limit: pageSize
        }),
        datasetsApi.list({ limit: lookupLimit }),
        servicesApi.list({ limit: lookupLimit })
      ]);
      if (page > 1 && relRes.data.length === 0) {
        setPage(page - 1);
        return;
      }
      setRelations(relRes.data);
      setHasNext(relRes.data.length === pageSize);
      setDatasets(dsRes.data);
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
  }, [page, pageSize]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attrsError) {
      setError('Fix JSON errors in Attributes before saving.');
      return;
    }
    try {
      const payload: DatasetServiceCreate = {
        ...formData,
        attrs: attrsText.trim() ? JSON.parse(attrsText) : undefined
      };
      await datasetServicesApi.create(payload);
      setShowForm(false);
      setFormData({ dataset_uid: '', service_uid: '' });
      setAttrsText('');
      setAttrsError(null);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || 'Failed to create relationship');
      console.error(err);
    }
  };

  const handleDelete = async (datasetUid: string, serviceUid: string) => {
    if (!confirm('Are you sure you want to delete this relationship?')) return;
    try {
      await datasetServicesApi.delete(datasetUid, serviceUid);
      fetchData();
    } catch (err) {
      setError('Failed to delete relationship');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ dataset_uid: '', service_uid: '' });
    setAttrsText('');
    setAttrsError(null);
  };

  const getDatasetTitle = (uid: string) => {
    const ds = datasets.find(d => d.uid === uid);
    return ds?.title || uid;
  };

  const getServiceType = (uid: string) => {
    const svc = services.find(s => s.uid === uid);
    return svc?.type || uid;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Dataset-Services</h1>
        <button
          onClick={() => {
            setFormData({ dataset_uid: '', service_uid: '' });
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
            <h2>New Dataset-Service Relationship</h2>
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
                <label>Service: *</label>
                <select
                  value={formData.service_uid}
                  onChange={(e) => setFormData({ ...formData, service_uid: e.target.value })}
                  required
                >
                  <option value="">Select a service</option>
                  {services.map((svc) => (
                    <option key={svc.uid} value={svc.uid}>{svc.type || svc.uid}</option>
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
            <th>Service</th>
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
              <tr key={`${rel.dataset_uid}-${rel.service_uid}`}>
                <td>{getDatasetTitle(rel.dataset_uid)}</td>
                <td>{getServiceType(rel.service_uid)}</td>
                <td>{rel.role || '-'}</td>
                <td className="attrs">{rel.attrs ? JSON.stringify(rel.attrs) : '-'}</td>
                <td className="actions">
                  <button onClick={() => handleDelete(rel.dataset_uid, rel.service_uid)} className="btn-delete">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Pagination
        page={page}
        pageSize={pageSize}
        itemCount={relations.length}
        hasNext={hasNext}
        onPageChange={(nextPage) => setPage(nextPage)}
        onPageSizeChange={(nextSize) => {
          setPage(1);
          setPageSize(nextSize);
        }}
      />
    </div>
  );
}
