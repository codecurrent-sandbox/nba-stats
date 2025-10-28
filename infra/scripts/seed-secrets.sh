#!/bin/bash

# NBA Stats Secret Seeding Script
# Seeds required secrets into Azure Key Vault before deployment

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

Seed secrets into Azure Key Vault for NBA Stats application

OPTIONS:
    -k, --key-vault      Key Vault name - REQUIRED
    -a, --api-key        NBA API Key - REQUIRED
    -h, --help           Display this help message

EXAMPLES:
    $0 -k nba-stats-dev-kv -a your-api-key-here
    $0 --key-vault nba-stats-prod-kv --api-key \$NBA_API_KEY

ENVIRONMENT VARIABLES:
    NBA_API_KEY          NBA API Key (alternative to --api-key flag)

EOF
    exit 1
}

# Parse command line arguments
KEY_VAULT=""
NBA_API_KEY_VALUE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -k|--key-vault)
            KEY_VAULT="$2"
            shift 2
            ;;
        -a|--api-key)
            NBA_API_KEY_VALUE="$2"
            shift 2
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

# Check for NBA_API_KEY in environment if not provided via flag
if [ -z "$NBA_API_KEY_VALUE" ] && [ -n "$NBA_API_KEY" ]; then
    NBA_API_KEY_VALUE="$NBA_API_KEY"
fi

# Validate required parameters
if [ -z "$KEY_VAULT" ] || [ -z "$NBA_API_KEY_VALUE" ]; then
    log_error "Key Vault name and NBA API Key are required"
    usage
fi

log_info "Seeding secrets into Key Vault: $KEY_VAULT"

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    log_error "Not logged in to Azure. Please run 'az login' first"
    exit 1
fi

# Display current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
log_info "Using Azure subscription: $SUBSCRIPTION"

# Check if Key Vault exists
if ! az keyvault show --name "$KEY_VAULT" &> /dev/null; then
    log_error "Key Vault '$KEY_VAULT' not found"
    log_error "Please ensure the Key Vault has been created first"
    exit 1
fi

log_info "Key Vault found: $KEY_VAULT"

# Seed NBA API Key
log_info "Setting NBA-API-KEY secret..."
if az keyvault secret set \
    --vault-name "$KEY_VAULT" \
    --name "NBA-API-KEY" \
    --value "$NBA_API_KEY_VALUE" \
    --output none; then
    log_info "✓ NBA-API-KEY secret set successfully"
else
    log_error "Failed to set NBA-API-KEY secret"
    exit 1
fi

# Verify the secret was set
if az keyvault secret show \
    --vault-name "$KEY_VAULT" \
    --name "NBA-API-KEY" \
    --query "name" \
    --output tsv &> /dev/null; then
    log_info "✓ NBA-API-KEY secret verified"
else
    log_error "Failed to verify NBA-API-KEY secret"
    exit 1
fi

log_info "Secret seeding complete!"
log_info ""
log_info "Secrets in Key Vault:"
az keyvault secret list --vault-name "$KEY_VAULT" --query "[].name" -o table

log_info ""
log_info "Next steps:"
log_info "1. Deploy infrastructure using deploy.sh"
log_info "2. Build and push container images"
log_info "3. Update Container Apps with new images"
