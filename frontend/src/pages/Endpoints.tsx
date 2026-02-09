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
  const [metadataText, setMetadataText] = useState('');
  const [metadataError, setMetadataError] = useState<string | null>(null);

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
    if (metadataError) {
      setError('Fix JSON errors in Metadata before saving.');
      return;
    }
    try {
      const payload: EndpointCreate = {
        ...formData,
        metadata: metadataText.trim() ? JSON.parse(metadataText) : undefined
      };
      if (editingEndpoint) {
        await endpointsApi.update(editingEndpoint.uid, payload);
      } else {
        await endpointsApi.create(payload);
      }
      setShowForm(false);
      setEditingEndpoint(null);
      setFormData({ kind: '' });
      setMetadataText('');
      setMetadataError(null);
      fetchEndpoints();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || 'Failed to save endpoint');
      console.error(err);
    }
  };

  const handleEdit = (endpoint: Endpoint) => {
    setEditingEndpoint(endpoint);
    setFormData({
      kind: endpoint.kind,
      url: endpoint.url,
      source_ep: endpoint.source_ep,
      metadata: endpoint.metadata
    });
    setMetadataText(endpoint.metadata ? JSON.stringify(endpoint.metadata, null, 2) : '');
    setMetadataError(null);
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
    setMetadataText('');
    setMetadataError(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Endpoints</h1>
        <button
          onClick={() => {
            setEditingEndpoint(null);
            setFormData({ kind: '' });
            setMetadataText('');
            setMetadataError(null);
            setShowForm(true);
          }}
          className="btn-primary"
        >
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
                <label>Kind: *</label>
                <input
                  type="text"
                  value={formData.kind}
                  onChange={(e) => setFormData({ ...formData, kind: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>URL:</label>
                <input
                  type="text"
                  value={formData.url || ''}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value || undefined })}
                  placeholder="https://example.com/api"
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
            <th>Kind</th>
            <th>URL</th>
            <th>Source EP</th>
            <th>Metadata</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {endpoints.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty">No endpoints found</td>
            </tr>
          ) : (
            endpoints.map((endpoint) => (
              <tr key={endpoint.uid}>
                <td className="uid">{endpoint.uid}</td>
                <td>{endpoint.kind}</td>
                <td>{endpoint.url || '-'}</td>
                <td>{endpoint.source_ep || '-'}</td>
                <td className="attrs">{endpoint.metadata ? JSON.stringify(endpoint.metadata) : '-'}</td>
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
