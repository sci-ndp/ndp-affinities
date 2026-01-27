-- Create ndp_endpoint table
CREATE TABLE ndp_endpoint (
    uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind TEXT NOT NULL,
    url TEXT,
    source_ep TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ndp_endpoint
CREATE TRIGGER trg_ndp_endpoint_updated_at
    BEFORE UPDATE ON ndp_endpoint
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
