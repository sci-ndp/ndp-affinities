import axios from 'axios';
import type {
  Endpoint, EndpointCreate, EndpointUpdate,
  Dataset, DatasetCreate, DatasetUpdate,
  Service, ServiceCreate, ServiceUpdate,
  DatasetEndpoint, DatasetEndpointCreate,
  DatasetService, DatasetServiceCreate,
  ServiceEndpoint, ServiceEndpointCreate,
  Affinity, AffinityCreate, AffinityUpdate
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Endpoints
export const endpointsApi = {
  list: (params?: { skip?: number; limit?: number }) => api.get<Endpoint[]>('/ep', { params }),
  get: (uid: string) => api.get<Endpoint>(`/ep/${uid}`),
  create: (data: EndpointCreate) => api.post<Endpoint>('/ep', data),
  update: (uid: string, data: EndpointUpdate) => api.put<Endpoint>(`/ep/${uid}`, data),
  delete: (uid: string) => api.delete(`/ep/${uid}`),
};

// Datasets
export const datasetsApi = {
  list: (params?: { skip?: number; limit?: number }) => api.get<Dataset[]>('/datasets', { params }),
  get: (uid: string) => api.get<Dataset>(`/datasets/${uid}`),
  create: (data: DatasetCreate) => api.post<Dataset>('/datasets', data),
  update: (uid: string, data: DatasetUpdate) => api.put<Dataset>(`/datasets/${uid}`, data),
  delete: (uid: string) => api.delete(`/datasets/${uid}`),
};

// Services
export const servicesApi = {
  list: (params?: { skip?: number; limit?: number }) => api.get<Service[]>('/services', { params }),
  get: (uid: string) => api.get<Service>(`/services/${uid}`),
  create: (data: ServiceCreate) => api.post<Service>('/services', data),
  update: (uid: string, data: ServiceUpdate) => api.put<Service>(`/services/${uid}`, data),
  delete: (uid: string) => api.delete(`/services/${uid}`),
};

// Dataset-Endpoints
export const datasetEndpointsApi = {
  list: (params?: { skip?: number; limit?: number }) => api.get<DatasetEndpoint[]>('/dataset-endpoints', { params }),
  get: (datasetUid: string, endpointUid: string) =>
    api.get<DatasetEndpoint>(`/dataset-endpoints/${datasetUid}/${endpointUid}`),
  create: (data: DatasetEndpointCreate) => api.post<DatasetEndpoint>('/dataset-endpoints', data),
  delete: (datasetUid: string, endpointUid: string) =>
    api.delete(`/dataset-endpoints/${datasetUid}/${endpointUid}`),
};

// Dataset-Services
export const datasetServicesApi = {
  list: (params?: { skip?: number; limit?: number }) => api.get<DatasetService[]>('/dataset-services', { params }),
  get: (datasetUid: string, serviceUid: string) =>
    api.get<DatasetService>(`/dataset-services/${datasetUid}/${serviceUid}`),
  create: (data: DatasetServiceCreate) => api.post<DatasetService>('/dataset-services', data),
  delete: (datasetUid: string, serviceUid: string) =>
    api.delete(`/dataset-services/${datasetUid}/${serviceUid}`),
};

// Service-Endpoints
export const serviceEndpointsApi = {
  list: (params?: { skip?: number; limit?: number }) => api.get<ServiceEndpoint[]>('/service-endpoints', { params }),
  get: (serviceUid: string, endpointUid: string) =>
    api.get<ServiceEndpoint>(`/service-endpoints/${serviceUid}/${endpointUid}`),
  create: (data: ServiceEndpointCreate) => api.post<ServiceEndpoint>('/service-endpoints', data),
  delete: (serviceUid: string, endpointUid: string) =>
    api.delete(`/service-endpoints/${serviceUid}/${endpointUid}`),
};

// Affinities
export const affinitiesApi = {
  list: (params?: { skip?: number; limit?: number }) => api.get<Affinity[]>('/affinities', { params }),
  get: (uid: string) => api.get<Affinity>(`/affinities/${uid}`),
  create: (data: AffinityCreate) => api.post<Affinity>('/affinities', data),
  update: (uid: string, data: AffinityUpdate) => api.put<Affinity>(`/affinities/${uid}`, data),
  delete: (uid: string) => api.delete(`/affinities/${uid}`),
};

export default api;
