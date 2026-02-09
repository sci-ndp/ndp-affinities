import { useState, useEffect } from 'react';
import { servicesApi } from '../api/client';
import type { Service, ServiceCreate } from '../types';

export function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceCreate>({});
  const [metadataText, setMetadataText] = useState('');
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await servicesApi.list();
      setServices(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch services');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (metadataError) {
      setError('Fix JSON errors in Metadata before saving.');
      return;
    }
    try {
      const payload: ServiceCreate = {
        ...formData,
        metadata: metadataText.trim() ? JSON.parse(metadataText) : undefined
      };
      if (editingService) {
        await servicesApi.update(editingService.uid, payload);
      } else {
        await servicesApi.create(payload);
      }
      setShowForm(false);
      setEditingService(null);
      setFormData({});
      setMetadataText('');
      setMetadataError(null);
      fetchServices();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || 'Failed to save service');
      console.error(err);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      type: service.type,
      openapi_url: service.openapi_url,
      version: service.version,
      source_ep: service.source_ep,
      metadata: service.metadata
    });
    setMetadataText(service.metadata ? JSON.stringify(service.metadata, null, 2) : '');
    setMetadataError(null);
    setShowForm(true);
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await servicesApi.delete(uid);
      fetchServices();
    } catch (err) {
      setError('Failed to delete service');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingService(null);
    setFormData({});
    setMetadataText('');
    setMetadataError(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Services</h1>
        <button
          onClick={() => {
            setEditingService(null);
            setFormData({});
            setMetadataText('');
            setMetadataError(null);
            setShowForm(true);
          }}
          className="btn-primary"
        >
          Add Service
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingService ? 'Edit Service' : 'New Service'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type:</label>
                <input
                  type="text"
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value || undefined })}
                />
              </div>
              <div className="form-group">
                <label>OpenAPI URL:</label>
                <input
                  type="text"
                  value={formData.openapi_url || ''}
                  onChange={(e) => setFormData({ ...formData, openapi_url: e.target.value || undefined })}
                  placeholder="https://example.com/openapi.json"
                />
              </div>
              <div className="form-group">
                <label>Version:</label>
                <input
                  type="text"
                  value={formData.version || ''}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value || undefined })}
                  placeholder="1.0.0"
                />
              </div>
              <div className="form-group">
                <label>Source Endpoint:</label>
                <input
                  type="text"
                  value={formData.source_ep || ''}
                  onChange={(e) => setFormData({ ...formData, source_ep: e.target.value || undefined })}
                />
              </div>
              <div className="form-group">
                <label>Metadata (JSON):</label>
                <textarea
                  value={metadataText}
                  onChange={(e) => {
                    const value = e.target.value;
                    setMetadataText(value);

                    if (!value.trim()) {
                      setFormData({ ...formData, metadata: undefined });
                      setMetadataError(null);
                      return;
                    }

                    try {
                      const metadata = JSON.parse(value);
                      setFormData({ ...formData, metadata });
                      setMetadataError(null);
                    } catch {
                      setMetadataError('Must be valid JSON.');
                    }
                  }}
                  rows={4}
                  placeholder='{"key": "value"}'
                />
                {metadataError && <small className="field-error">{metadataError}</small>}
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
            <th>UID</th>
            <th>Type</th>
            <th>Version</th>
            <th>OpenAPI URL</th>
            <th>Source EP</th>
            <th>Metadata</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.length === 0 ? (
            <tr>
              <td colSpan={7} className="empty">No services found</td>
            </tr>
          ) : (
            services.map((service) => (
              <tr key={service.uid}>
                <td className="uid">{service.uid}</td>
                <td>{service.type || '-'}</td>
                <td>{service.version || '-'}</td>
                <td>{service.openapi_url || '-'}</td>
                <td>{service.source_ep || '-'}</td>
                <td className="attrs">{service.metadata ? JSON.stringify(service.metadata) : '-'}</td>
                <td className="actions">
                  <button onClick={() => handleEdit(service)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDelete(service.uid)} className="btn-delete">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
