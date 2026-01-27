import { useState, useEffect } from 'react';
import { endpointsApi } from '../api/client';
import type { Endpoint, EndpointCreate } from '../types';

export function Endpoints() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [formData, setFormData] = useState<EndpointCreate>({ kind: '' });

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      const response = await endpointsApi.list();
      setEndpoints(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch endpoints');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEndpoint) {
        await endpointsApi.update(editingEndpoint.uid, formData);
      } else {
        await endpointsApi.create(formData);
      }
      setShowForm(false);
      setEditingEndpoint(null);
      setFormData({ kind: '' });
      fetchEndpoints();
    } catch (err) {
      setError('Failed to save endpoint');
      console.error(err);
    }
  };

  const handleEdit = (endpoint: Endpoint) => {
    setEditingEndpoint(endpoint);
    setFormData({ kind: endpoint.kind, attrs: endpoint.attrs });
    setShowForm(true);
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this endpoint?')) return;
    try {
      await endpointsApi.delete(uid);
      fetchEndpoints();
    } catch (err) {
      setError('Failed to delete endpoint');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEndpoint(null);
    setFormData({ kind: '' });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Endpoints</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Add Endpoint
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingEndpoint ? 'Edit Endpoint' : 'New Endpoint'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Kind:</label>
                <input
                  type="text"
                  value={formData.kind}
                  onChange={(e) => setFormData({ ...formData, kind: e.target.value })}
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
            <th>Kind</th>
            <th>Attributes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {endpoints.length === 0 ? (
            <tr>
              <td colSpan={4} className="empty">No endpoints found</td>
            </tr>
          ) : (
            endpoints.map((endpoint) => (
              <tr key={endpoint.uid}>
                <td className="uid">{endpoint.uid}</td>
                <td>{endpoint.kind}</td>
                <td className="attrs">{endpoint.attrs ? JSON.stringify(endpoint.attrs) : '-'}</td>
                <td className="actions">
                  <button onClick={() => handleEdit(endpoint)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDelete(endpoint.uid)} className="btn-delete">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
