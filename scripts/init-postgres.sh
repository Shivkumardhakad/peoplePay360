#!/bin/bash
set -e

# Create both HR and Payroll databases if they do not already exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE oddo_hr' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'oddo_hr')\gexec
    SELECT 'CREATE DATABASE oddo' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'oddo')\gexec
    GRANT ALL PRIVILEGES ON DATABASE oddo_hr TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE oddo TO $POSTGRES_USER;
EOSQL
