import { useState, useEffect } from 'react';
import { servicesApi } from '../api/client';
import type { Service, ServiceCreate } from '../types';

export function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceCreate>({ type: '' });

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
    try {
      if (editingService) {
        await servicesApi.update(editingService.uid, formData);
      } else {
        await servicesApi.create(formData);
      }
      setShowForm(false);
      setEditingService(null);
      setFormData({ type: '' });
      fetchServices();
    } catch (err) {
      setError('Failed to save service');
      console.error(err);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({ type: service.type, attrs: service.attrs });
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
    setFormData({ type: '' });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Services</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
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
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
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
            <th>UID</th>
            <th>Type</th>
            <th>Attributes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.length === 0 ? (
            <tr>
              <td colSpan={4} className="empty">No services found</td>
            </tr>
          ) : (
            services.map((service) => (
              <tr key={service.uid}>
                <td className="uid">{service.uid}</td>
                <td>{service.type}</td>
                <td className="attrs">{service.attrs ? JSON.stringify(service.attrs) : '-'}</td>
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
