#!/bin/bash

# NBA Stats Infrastructure Deployment Script
# This script orchestrates the deployment of Azure infrastructure using Bicep

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

Deploy NBA Stats infrastructure to Azure

OPTIONS:
    -e, --environment    Environment (dev, test, prod) - REQUIRED
    -l, --location       Azure location (default: eastus)
    -w, --what-if        Run what-if analysis only
    -h, --help           Display this help message

EXAMPLES:
    $0 -e dev
    $0 -e prod -l westus2
    $0 -e test --what-if

NOTE: Resource groups are now managed by Bicep (subscription-level deployment)

EOF
    exit 1
}

# Parse command line arguments
ENVIRONMENT=""
LOCATION="eastus"
WHAT_IF=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -l|--location)
            LOCATION="$2"
            shift 2
            ;;
        -w|--what-if)
            WHAT_IF=true
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

# Validate required parameters
if [ -z "$ENVIRONMENT" ]; then
    log_error "Environment is required"
    usage
fi

# Validate environment value
if [[ ! "$ENVIRONMENT" =~ ^(dev|test|prod)$ ]]; then
    log_error "Environment must be one of: dev, test, prod"
    exit 1
fi

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
PARAM_FILE="$INFRA_DIR/parameters/${ENVIRONMENT}.bicepparam"
MAIN_BICEP="$INFRA_DIR/main.bicep"

# Validate files exist
if [ ! -f "$PARAM_FILE" ]; then
    log_error "Parameter file not found: $PARAM_FILE"
    exit 1
fi

if [ ! -f "$MAIN_BICEP" ]; then
    log_error "Main bicep file not found: $MAIN_BICEP"
    exit 1
fi

log_info "Starting deployment for environment: $ENVIRONMENT"
log_info "Location: $LOCATION"
log_info "Parameter File: $PARAM_FILE"

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    log_error "Not logged in to Azure. Please run 'az login' first"
    exit 1
fi

# Display current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
log_info "Using Azure subscription: $SUBSCRIPTION"

# Note: Resource group is now created by Bicep (subscription-level deployment)
log_info "Resource group 'rg-nba-stats-$ENVIRONMENT' will be created by Bicep deployment"

# Get required secrets from environment variables or Azure CLI
if [ -z "$POSTGRES_ADMIN_PASSWORD" ]; then
    log_warn "POSTGRES_ADMIN_PASSWORD not set in environment"
    log_info "Generating random password for PostgreSQL admin"
    POSTGRES_ADMIN_PASSWORD=$(openssl rand -base64 24)
fi

if [ -z "$NBA_API_KEY" ]; then
    log_error "NBA_API_KEY environment variable is required"
    log_error "Please set it before running this script"
    exit 1
fi

# Run what-if analysis
if [ "$WHAT_IF" = true ]; then
    log_info "Running what-if analysis..."
    az deployment sub what-if \
        --location "$LOCATION" \
        --template-file "$MAIN_BICEP" \
        --parameters "$PARAM_FILE" \
        --parameters location="$LOCATION" \
        --parameters postgresAdminPassword="$POSTGRES_ADMIN_PASSWORD" \
        --parameters nbaApiKey="$NBA_API_KEY"
    
    log_info "What-if analysis complete"
    exit 0
fi

# Deploy infrastructure
log_info "Deploying infrastructure..."
DEPLOYMENT_NAME="nba-stats-infra-$(date +%Y%m%d-%H%M%S)"

az deployment sub create \
    --name "$DEPLOYMENT_NAME" \
    --location "$LOCATION" \
    --template-file "$MAIN_BICEP" \
    --parameters "$PARAM_FILE" \
    --parameters location="$LOCATION" \
    --parameters postgresAdminPassword="$POSTGRES_ADMIN_PASSWORD" \
    --parameters nbaApiKey="$NBA_API_KEY" \
    --output json > deployment-output.json

if [ $? -eq 0 ]; then
    log_info "Deployment successful!"
    
    # Extract and display important outputs
    log_info "Deployment Outputs:"
    jq -r '.properties.outputs | to_entries[] | "\(.key): \(.value.value)"' deployment-output.json
    
    # Save outputs for later use
    OUTPUTS_FILE="$INFRA_DIR/outputs/${ENVIRONMENT}-outputs.json"
    mkdir -p "$INFRA_DIR/outputs"
    jq '.properties.outputs' deployment-output.json > "$OUTPUTS_FILE"
    log_info "Outputs saved to: $OUTPUTS_FILE"
    
else
    log_error "Deployment failed!"
    exit 1
fi

log_info "Deployment complete for environment: $ENVIRONMENT"
