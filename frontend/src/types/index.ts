export interface Endpoint {
  uid: string;
  kind: string;
  attrs?: Record<string, unknown>;
}

export interface EndpointCreate {
  kind: string;
  attrs?: Record<string, unknown>;
}

export interface Dataset {
  uid: string;
  title: string;
  attrs?: Record<string, unknown>;
}

export interface DatasetCreate {
  title: string;
  attrs?: Record<string, unknown>;
}

export interface Service {
  uid: string;
  type: string;
  attrs?: Record<string, unknown>;
}

export interface ServiceCreate {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface DatasetEndpoint {
  dataset_uid: string;
  endpoint_uid: string;
  role?: string;
}

export interface DatasetService {
  dataset_uid: string;
  service_uid: string;
  role?: string;
}

export interface ServiceEndpoint {
  service_uid: string;
  endpoint_uid: string;
  role?: string;
}

export interface Affinity {
  triple_uid: string;
  dataset_uid?: string;
  endpoint_uids: string[];
  service_uids: string[];
  attrs?: Record<string, unknown>;
  version: number;
}

export interface AffinityCreate {
  dataset_uid?: string;
  endpoint_uids?: string[];
  service_uids?: string[];
  attrs?: Record<string, unknown>;
  version: number;
}

export interface AffinityUpdate {
  dataset_uid?: string;
  endpoint_uids?: string[];
  service_uids?: string[];
  attrs?: Record<string, unknown>;
  version?: number;
}
