-- Create ndp_dataset table
CREATE TABLE ndp_dataset (
    uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    source_ep TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for ndp_dataset
CREATE TRIGGER trg_ndp_dataset_updated_at
    BEFORE UPDATE ON ndp_dataset
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
