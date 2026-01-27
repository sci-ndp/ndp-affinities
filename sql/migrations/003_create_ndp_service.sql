-- Create ndp_service table
CREATE TABLE ndp_service (
    uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT,
    openapi_url TEXT,
    version TEXT,
    source_ep TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for ndp_service
CREATE TRIGGER trg_ndp_service_updated_at
    BEFORE UPDATE ON ndp_service
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
