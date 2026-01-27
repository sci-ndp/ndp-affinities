-- Create ndp_dataset_service junction table
CREATE TABLE ndp_dataset_service (
    dataset_uid UUID NOT NULL REFERENCES ndp_dataset(uid) ON DELETE CASCADE,
    service_uid UUID NOT NULL REFERENCES ndp_service(uid) ON DELETE CASCADE,
    role TEXT,
    attrs JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (dataset_uid, service_uid)
);

-- Indexes for FK columns
CREATE INDEX idx_ndp_dataset_service_dataset ON ndp_dataset_service(dataset_uid);
CREATE INDEX idx_ndp_dataset_service_service ON ndp_dataset_service(service_uid);
