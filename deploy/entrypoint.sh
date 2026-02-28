#!/bin/bash
set -e

# PostgreSQL data directory
PGDATA="/var/lib/postgresql/data"

# Default credentials
POSTGRES_USER="${POSTGRES_USER:-affinities}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-affinities}"
POSTGRES_DB="${POSTGRES_DB:-affinities}"

# Initialize PostgreSQL if not already done
if [ ! -f "$PGDATA/PG_VERSION" ]; then
    echo "Initializing PostgreSQL database..."
    
    # Ensure directory exists and has correct permissions
    mkdir -p "$PGDATA"
    chown -R postgres:postgres "$PGDATA"
    chmod 700 "$PGDATA"
    
    # Initialize database
    su postgres -c "/usr/lib/postgresql/17/bin/initdb -D $PGDATA"
    
    # Configure authentication
    echo "host all all 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"
    echo "local all all trust" >> "$PGDATA/pg_hba.conf"
    
    # Start PostgreSQL temporarily
    su postgres -c "/usr/lib/postgresql/17/bin/pg_ctl -D $PGDATA -w start"
    
    # Create user and database
    su postgres -c "psql -c \"CREATE USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';\""
    su postgres -c "psql -c \"CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;\""
    su postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;\""
    su postgres -c "psql -d $POSTGRES_DB -c \"GRANT ALL ON SCHEMA public TO $POSTGRES_USER;\""
    
    # Run migrations
    echo "Running migrations..."
    for f in /app/sql/migrations/*.sql; do
        echo "Applying $f..."
        su postgres -c "psql -d $POSTGRES_DB -f $f"
    done
    
    # Grant permissions on all tables
    echo "Granting permissions..."
    su postgres -c "psql -d $POSTGRES_DB -c \"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;\""
    su postgres -c "psql -d $POSTGRES_DB -c \"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;\""
    
    # Stop PostgreSQL (supervisord will start it)
    su postgres -c "/usr/lib/postgresql/17/bin/pg_ctl -D $PGDATA -w stop"
    
    echo "PostgreSQL initialized successfully"
fi

# Set DATABASE_URL for uvicorn
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}"

# Start supervisord
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
