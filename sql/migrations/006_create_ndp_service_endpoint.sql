-- Create ndp_service_endpoint junction table
CREATE TABLE ndp_service_endpoint (
    service_uid UUID NOT NULL REFERENCES ndp_service(uid) ON DELETE CASCADE,
    endpoint_uid UUID NOT NULL REFERENCES ndp_endpoint(uid) ON DELETE CASCADE,
    role TEXT,
    attrs JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (service_uid, endpoint_uid)
);

-- Indexes for FK columns
CREATE INDEX idx_ndp_service_endpoint_service ON ndp_service_endpoint(service_uid);
CREATE INDEX idx_ndp_service_endpoint_endpoint ON ndp_service_endpoint(endpoint_uid);
