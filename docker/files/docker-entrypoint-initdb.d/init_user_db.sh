#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER prosody PASSWORD 'prosody';
    CREATE DATABASE prosody;
    GRANT ALL PRIVILEGES ON DATABASE prosody TO prosody;
EOSQL
