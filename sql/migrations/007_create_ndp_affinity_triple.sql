-- Create ndp_affinity_triple table
CREATE TABLE ndp_affinity_triple (
    triple_uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_uid UUID REFERENCES ndp_dataset(uid) ON DELETE CASCADE,
    endpoint_uids UUID[],
    service_uids UUID[],
    attrs JSONB,
    version INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for ndp_affinity_triple
CREATE TRIGGER trg_ndp_affinity_triple_updated_at
    BEFORE UPDATE ON ndp_affinity_triple
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index for dataset FK
CREATE INDEX idx_ndp_affinity_triple_dataset ON ndp_affinity_triple(dataset_uid);
