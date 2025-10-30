#!/bin/bash

# NBA Stats Database Schema Initialization Script
# Initializes PostgreSQL database schema for the NBA Stats application

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Initialize NBA Stats database schema in Azure PostgreSQL

OPTIONS:
    -s, --server         PostgreSQL server name (FQDN) - REQUIRED
    -d, --database       Database name (default: nba_stats)
    -u, --username       Admin username - REQUIRED
    -p, --password       Admin password - REQUIRED
    -f, --schema-file    Path to schema SQL file
    --force              Skip confirmation prompt if tables exist (for CI/CD)
    -h, --help           Display this help message

EXAMPLES:
    $0 -s myserver.postgres.database.azure.com -u admin -p password
    $0 --server myserver.postgres.database.azure.com --username admin --password \$DB_PASSWORD --force

ENVIRONMENT VARIABLES:
    POSTGRES_PASSWORD    PostgreSQL admin password (alternative to --password flag)

EOF
    exit 1
}

# Parse command line arguments
SERVER=""
DATABASE="nba_stats"
USERNAME=""
PASSWORD=""
SCHEMA_FILE=""
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--server)
            SERVER="$2"
            shift 2
            ;;
        -d|--database)
            DATABASE="$2"
            shift 2
            ;;
        -u|--username)
            USERNAME="$2"
            shift 2
            ;;
        -p|--password)
            PASSWORD="$2"
            shift 2
            ;;
        -f|--schema-file)
            SCHEMA_FILE="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Check for password in environment if not provided via flag
if [ -z "$PASSWORD" ] && [ -n "$POSTGRES_PASSWORD" ]; then
    PASSWORD="$POSTGRES_PASSWORD"
fi

# Validate required parameters
if [ -z "$SERVER" ] || [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
    log_error "Server, username, and password are required"
    usage
fi

# Default schema file location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname $(dirname "$SCRIPT_DIR"))"
DEFAULT_SCHEMA="$REPO_ROOT/services/api/src/database/schema.sql"

if [ -z "$SCHEMA_FILE" ]; then
    SCHEMA_FILE="$DEFAULT_SCHEMA"
fi

# Validate schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    log_error "Schema file not found: $SCHEMA_FILE"
    exit 1
fi

log_info "Initializing database schema"
log_info "Server: $SERVER"
log_info "Database: $DATABASE"
log_info "Username: $USERNAME"
log_info "Schema File: $SCHEMA_FILE"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    log_error "psql command not found"
    log_error "Please install PostgreSQL client tools"
    log_error "  macOS: brew install postgresql"
    log_error "  Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Connection string
export PGPASSWORD="$PASSWORD"
CONN_STRING="host=$SERVER port=5432 dbname=$DATABASE user=$USERNAME sslmode=require"

# Test connection
log_info "Testing database connection..."
if psql "$CONN_STRING" -c "SELECT version();" &> /dev/null; then
    log_info "✓ Database connection successful"
else
    log_error "Failed to connect to database"
    log_error "Please check your connection parameters"
    exit 1
fi

# Check if schema is already initialized
log_info "Checking if schema is already initialized..."
TABLE_COUNT=$(psql "$CONN_STRING" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -gt 0 ]; then
    log_warn "Database already contains $TABLE_COUNT tables"
    if [ "$FORCE" = false ]; then
        read -p "Do you want to continue and potentially overwrite existing schema? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
            log_info "Schema initialization cancelled"
            exit 0
        fi
    else
        log_info "Force flag enabled, proceeding with schema initialization"
    fi
fi

# Run schema initialization
log_info "Running schema initialization..."
if psql "$CONN_STRING" -f "$SCHEMA_FILE"; then
    log_info "✓ Schema initialized successfully"
else
    log_error "Failed to initialize schema"
    exit 1
fi

# Verify tables were created
log_info "Verifying schema..."
TABLES=$(psql "$CONN_STRING" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;")

if [ -n "$TABLES" ]; then
    log_info "✓ Schema verification complete"
    log_info ""
    log_info "Created tables:"
    echo "$TABLES" | while read -r table; do
        if [ -n "$table" ]; then
            log_info "  - $table"
        fi
    done
else
    log_error "No tables found after initialization"
    exit 1
fi

# Run migrations if they exist
MIGRATIONS_DIR="$REPO_ROOT/services/api/src/database/migrations"
if [ -d "$MIGRATIONS_DIR" ]; then
    log_info "Checking for database migrations..."
    
    MIGRATION_FILES=$(find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort)
    
    if [ -n "$MIGRATION_FILES" ]; then
        log_info "Found migrations to apply:"
        echo "$MIGRATION_FILES" | while read -r migration; do
            if [ -n "$migration" ]; then
                MIGRATION_NAME=$(basename "$migration")
                log_info "  - $MIGRATION_NAME"
            fi
        done
        
        echo "$MIGRATION_FILES" | while read -r migration; do
            if [ -n "$migration" ]; then
                MIGRATION_NAME=$(basename "$migration")
                log_info "Applying migration: $MIGRATION_NAME"
                if psql "$CONN_STRING" -f "$migration"; then
                    log_info "✓ Migration applied: $MIGRATION_NAME"
                else
                    log_error "Failed to apply migration: $MIGRATION_NAME"
                    exit 1
                fi
            fi
        done
    else
        log_info "No migration files found"
    fi
fi

# Unset password
unset PGPASSWORD

log_info ""
log_info "Database initialization complete!"
log_info ""
log_info "Next steps:"
log_info "1. Deploy Container Apps with the application code"
log_info "2. Verify application can connect to the database"
log_info "3. Test API endpoints"
