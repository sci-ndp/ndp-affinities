import { useState, useEffect } from 'react';
import { serviceEndpointsApi, servicesApi, endpointsApi } from '../api/client';
import type { ServiceEndpoint, Service, Endpoint } from '../types';

export function ServiceEndpoints() {
  const [relations, setRelations] = useState<ServiceEndpoint[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ServiceEndpoint>({
    service_uid: '',
    endpoint_uid: '',
    role: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [relRes, svcRes, epRes] = await Promise.all([
        serviceEndpointsApi.list(),
        servicesApi.list(),
        endpointsApi.list()
      ]);
      setRelations(relRes.data);
      setServices(svcRes.data);
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
    try {
      await serviceEndpointsApi.create(formData);
      setShowForm(false);
      setFormData({ service_uid: '', endpoint_uid: '', role: '' });
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || 'Failed to create relationship');
      console.error(err);
    }
  };

  const handleDelete = async (serviceUid: string, endpointUid: string) => {
    if (!confirm('Are you sure you want to delete this relationship?')) return;
    try {
      await serviceEndpointsApi.delete(serviceUid, endpointUid);
      fetchData();
    } catch (err) {
      setError('Failed to delete relationship');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ service_uid: '', endpoint_uid: '', role: '' });
  };

  const getServiceType = (uid: string) => {
    const svc = services.find(s => s.uid === uid);
    return svc ? svc.type : uid;
  };

  const getEndpointKind = (uid: string) => {
    const ep = endpoints.find(e => e.uid === uid);
    return ep ? ep.kind : uid;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Service-Endpoints</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Add Relationship
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>New Service-Endpoint Relationship</h2>
            <form onSubmit={handleSubmit}>
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
                <label>Endpoint:</label>
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
            <th>Service</th>
            <th>Endpoint</th>
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
              <tr key={`${rel.service_uid}-${rel.endpoint_uid}`}>
                <td>{getServiceType(rel.service_uid)}</td>
                <td>{getEndpointKind(rel.endpoint_uid)}</td>
                <td>{rel.role || '-'}</td>
                <td className="actions">
                  <button onClick={() => handleDelete(rel.service_uid, rel.endpoint_uid)} className="btn-delete">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
