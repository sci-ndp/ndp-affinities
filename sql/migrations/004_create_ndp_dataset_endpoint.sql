-- Create ndp_dataset_endpoint junction table
CREATE TABLE ndp_dataset_endpoint (
    dataset_uid UUID NOT NULL REFERENCES ndp_dataset(uid) ON DELETE CASCADE,
    endpoint_uid UUID NOT NULL REFERENCES ndp_endpoint(uid) ON DELETE CASCADE,
    role TEXT,
    attrs JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (dataset_uid, endpoint_uid)
);

-- Indexes for FK columns (improve JOIN performance)
CREATE INDEX idx_ndp_dataset_endpoint_dataset ON ndp_dataset_endpoint(dataset_uid);
CREATE INDEX idx_ndp_dataset_endpoint_endpoint ON ndp_dataset_endpoint(endpoint_uid);
