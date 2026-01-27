import { useState, useEffect } from 'react';
import { datasetsApi } from '../api/client';
import type { Dataset, DatasetCreate } from '../types';

export function Datasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [formData, setFormData] = useState<DatasetCreate>({ title: '' });

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await datasetsApi.list();
      setDatasets(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch datasets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDataset) {
        await datasetsApi.update(editingDataset.uid, formData);
      } else {
        await datasetsApi.create(formData);
      }
      setShowForm(false);
      setEditingDataset(null);
      setFormData({ title: '' });
      fetchDatasets();
    } catch (err) {
      setError('Failed to save dataset');
      console.error(err);
    }
  };

  const handleEdit = (dataset: Dataset) => {
    setEditingDataset(dataset);
    setFormData({ title: dataset.title, attrs: dataset.attrs });
    setShowForm(true);
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this dataset?')) return;
    try {
      await datasetsApi.delete(uid);
      fetchDatasets();
    } catch (err) {
      setError('Failed to delete dataset');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDataset(null);
    setFormData({ title: '' });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Datasets</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Add Dataset
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingDataset ? 'Edit Dataset' : 'New Dataset'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
            <th>Title</th>
            <th>Attributes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {datasets.length === 0 ? (
            <tr>
              <td colSpan={4} className="empty">No datasets found</td>
            </tr>
          ) : (
            datasets.map((dataset) => (
              <tr key={dataset.uid}>
                <td className="uid">{dataset.uid}</td>
                <td>{dataset.title}</td>
                <td className="attrs">{dataset.attrs ? JSON.stringify(dataset.attrs) : '-'}</td>
                <td className="actions">
                  <button onClick={() => handleEdit(dataset)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDelete(dataset.uid)} className="btn-delete">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
