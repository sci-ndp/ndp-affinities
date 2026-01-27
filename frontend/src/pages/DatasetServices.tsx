import { useState, useEffect } from 'react';
import { datasetServicesApi, datasetsApi, servicesApi } from '../api/client';
import type { DatasetService, Dataset, Service } from '../types';

export function DatasetServices() {
  const [relations, setRelations] = useState<DatasetService[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<DatasetService>({
    dataset_uid: '',
    service_uid: '',
    role: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [relRes, dsRes, svcRes] = await Promise.all([
        datasetServicesApi.list(),
        datasetsApi.list(),
        servicesApi.list()
      ]);
      setRelations(relRes.data);
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await datasetServicesApi.create(formData);
      setShowForm(false);
      setFormData({ dataset_uid: '', service_uid: '', role: '' });
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
    setFormData({ dataset_uid: '', service_uid: '', role: '' });
  };

  const getDatasetTitle = (uid: string) => {
    const ds = datasets.find(d => d.uid === uid);
    return ds ? ds.title : uid;
  };

  const getServiceType = (uid: string) => {
    const svc = services.find(s => s.uid === uid);
    return svc ? svc.type : uid;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Dataset-Services</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
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
                <label>Dataset:</label>
                <select
                  value={formData.dataset_uid}
                  onChange={(e) => setFormData({ ...formData, dataset_uid: e.target.value })}
                  required
                >
                  <option value="">Select a dataset</option>
                  {datasets.map((ds) => (
                    <option key={ds.uid} value={ds.uid}>{ds.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Service:</label>
                <select
                  value={formData.service_uid}
                  onChange={(e) => setFormData({ ...formData, service_uid: e.target.value })}
                  required
                >
                  <option value="">Select a service</option>
                  {services.map((svc) => (
                    <option key={svc.uid} value={svc.uid}>{svc.type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Role (optional):</label>
                <input
                  type="text"
                  value={formData.role || ''}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value || undefined })}
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
            <th>Dataset</th>
            <th>Service</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {relations.length === 0 ? (
            <tr>
              <td colSpan={4} className="empty">No relationships found</td>
            </tr>
          ) : (
            relations.map((rel) => (
              <tr key={`${rel.dataset_uid}-${rel.service_uid}`}>
                <td>{getDatasetTitle(rel.dataset_uid)}</td>
                <td>{getServiceType(rel.service_uid)}</td>
                <td>{rel.role || '-'}</td>
                <td className="actions">
                  <button onClick={() => handleDelete(rel.dataset_uid, rel.service_uid)} className="btn-delete">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
