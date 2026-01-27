export interface Endpoint {
  uid: string;
  kind: string;
  url?: string;
  source_ep?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EndpointCreate {
  kind: string;
  url?: string;
  source_ep?: string;
  metadata?: Record<string, unknown>;
}

export interface EndpointUpdate {
  kind?: string;
  url?: string;
  source_ep?: string;
  metadata?: Record<string, unknown>;
}

export interface Dataset {
  uid: string;
  title?: string;
  source_ep?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DatasetCreate {
  title?: string;
  source_ep?: string;
  metadata?: Record<string, unknown>;
}

export interface DatasetUpdate {
  title?: string;
  source_ep?: string;
  metadata?: Record<string, unknown>;
}

export interface Service {
  uid: string;
  type?: string;
  openapi_url?: string;
  version?: string;
  source_ep?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ServiceCreate {
  type?: string;
  openapi_url?: string;
  version?: string;
  source_ep?: string;
  metadata?: Record<string, unknown>;
}

export interface ServiceUpdate {
  type?: string;
  openapi_url?: string;
  version?: string;
  source_ep?: string;
  metadata?: Record<string, unknown>;
}

export interface DatasetEndpoint {
  dataset_uid: string;
  endpoint_uid: string;
  role?: string;
  attrs?: Record<string, unknown>;
  created_at: string;
}

export interface DatasetEndpointCreate {
  dataset_uid: string;
  endpoint_uid: string;
  role?: string;
  attrs?: Record<string, unknown>;
}

export interface DatasetService {
  dataset_uid: string;
  service_uid: string;
  role?: string;
  attrs?: Record<string, unknown>;
  created_at: string;
}

export interface DatasetServiceCreate {
  dataset_uid: string;
  service_uid: string;
  role?: string;
  attrs?: Record<string, unknown>;
}

export interface ServiceEndpoint {
  service_uid: string;
  endpoint_uid: string;
  role?: string;
  attrs?: Record<string, unknown>;
  created_at: string;
}

export interface ServiceEndpointCreate {
  service_uid: string;
  endpoint_uid: string;
  role?: string;
  attrs?: Record<string, unknown>;
}

export interface Affinity {
  triple_uid: string;
  dataset_uid?: string;
  endpoint_uids?: string[];
  service_uids?: string[];
  attrs?: Record<string, unknown>;
  version?: number;
  created_at: string;
  updated_at: string;
}

export interface AffinityCreate {
  dataset_uid?: string;
  endpoint_uids?: string[];
  service_uids?: string[];
  attrs?: Record<string, unknown>;
  version?: number;
}

export interface AffinityUpdate {
  dataset_uid?: string;
  endpoint_uids?: string[];
  service_uids?: string[];
  attrs?: Record<string, unknown>;
  version?: number;
}
