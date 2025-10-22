---
goal: "Plan Azure infrastructure (Bicep) and Azure DevOps CI/CD deployment strategy for NBA stats microservices"
version: 1.0
date_created: 2025-10-22
last_updated: 2025-10-22
owner: "nba-stats-platform-engineering"
status: Planned
tags: [infrastructure, azure, deployment, bicep, pipelines, microservices]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This deployment-focused plan defines the Azure infrastructure stack (provisioned using Bicep) and Azure DevOps Pipelines required to build, package, scan, and deploy the NBA stats microservices (`frontend` and `api`). The plan is deterministic and lists all artifacts, pipeline stages, environment separation, security controls, and validation criteria. No code is included—only structured implementation steps.

## 1. Requirements & Constraints

- **REQ-001**: Use Bicep for infrastructure-as-code stored under `/infra/bicep/`.
- **REQ-002**: Support three environments: `dev`, `staging`, `prod` with separate parameter files.
- **REQ-003**: Provision Azure Container Registry (ACR) for container images.
- **REQ-004**: Deploy API service using Azure Container Apps (initial target) with option to pivot to AKS later (deferred module).
- **REQ-005**: Deploy frontend via Azure Static Web Apps (primary) OR fallback Azure Storage Static Website + Azure CDN (alternative module prepared).
- **REQ-006**: Centralized secrets management through Azure Key Vault.
- **REQ-007**: Observability: Azure Log Analytics Workspace + Application Insights linked to Container Apps and optionally Static Web App diagnostics.
- **REQ-008**: Implement network isolation (virtual network + internal environment for Container Apps; restrict ACR public access with private endpoint later - Phase 2).
- **REQ-009**: CI/CD via Azure DevOps Pipelines (`azure-pipelines/*.yml`) with separate build and infra deploy pipelines.
- **REQ-010**: Enforce container image scanning (Trivy or Microsoft Defender for Containers baseline) in build pipeline.
- **REQ-011**: Use semantic version tagging + git SHA for images and annotate deployments.
- **REQ-012**: Support rollback strategy (retain N previous revisions in Container Apps; pipeline manual approval for prod).
- **REQ-013**: Provide automated validation (smoke test job) post-deployment invoking health endpoints.
- **REQ-014**: Parameter files must avoid secrets; secrets resolved from Key Vault references at deploy time.
- **REQ-015**: Idempotent deployments (re-runs produce no drift) validated via `what-if` mode before apply.
- **REQ-016**: Separation of duties: infra pipeline requires approver for prod (Azure DevOps Environment approval gate).
- **REQ-017**: Artifacts retention policy defined (14 days for build artifacts in dev, 30 days staging, 90 days prod images).

- **SEC-001**: Enable Managed Identity for API (system-assigned) to access Key Vault secrets.
- **SEC-002**: Restrict Key Vault access policies to pipeline service principal + Container Apps managed identity.
- **SEC-003**: Enable HTTPS-only across services (SWA automatic; Container Apps ingress TLS).
- **SEC-004**: Enforce content security headers in frontend deployment (Phase 2 config file injection).
- **SEC-005**: Configure ACR scanning (Defender) in Phase 2.

- **NET-001**: Virtual Network module defines subnets: `containerapps-snet`, `monitoring-snet` (future expansion), `reserved-snet`.
- **NET-002**: Limit outbound egress with future firewall module (Phase 2 placeholder).

- **MON-001**: Application Insights instrumentation key exported as secret reference to API.
- **MON-002**: Log retention: 30 days dev, 60 staging, 120 prod (parameterized).

- **CON-001**: Initial scope excludes AKS cluster to reduce complexity; AKS module stub present but not deployed.
- **CON-002**: Use only ARM-supported regions (e.g., `eastus` primary, `westus` secondary in Phase 2 failover plan).

- **GUD-001**: Modular Bicep design: each resource in dedicated file under `/infra/bicep/modules/`.
- **GUD-002**: All modules expose explicit outputs consumed by `main.bicep`.
- **GUD-003**: Parameter files keep naming conventions consistent: `main.<env>.parameters.json`.
- **GUD-004**: Prefer Managed Identity over service principals where supported.

- **PAT-001**: Blue/Green (Container Apps revision splitting) readiness for prod (Phase 2).
- **PAT-002**: Canary traffic strategy: allocate initial 10% to new revision (Phase 2 pipeline toggle).
- **PAT-003**: Immutable image deploy (no in-place patching).

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Establish core infrastructure modules, baseline pipelines, image build and deploy flow for `dev` environment.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Create Bicep module file `/infra/bicep/modules/acr.bicep` (params: name, sku, retentionDays, output: loginServer, resourceId) |  |  |
| TASK-002 | Create Bicep module `/infra/bicep/modules/loganalytics.bicep` (params: workspaceName, retentionInDays; output: workspaceId) |  |  |
| TASK-003 | Create Bicep module `/infra/bicep/modules/appinsights.bicep` (params: name, workspaceId; output: instrumentationKey, connectionString) |  |  |
| TASK-004 | Create Bicep module `/infra/bicep/modules/keyvault.bicep` (params: name, sku, enabledForDeployment; outputs: vaultUri) |  |  |
| TASK-005 | Create Bicep module `/infra/bicep/modules/network.bicep` (params: vnetName, addressSpace, subnets[]; outputs: subnetIds[]) |  |  |
| TASK-006 | Create Bicep module `/infra/bicep/modules/containerapps-env.bicep` (depends on loganalytics) |  |  |
| TASK-007 | Create Bicep module `/infra/bicep/modules/containerapp-api.bicep` (params: name, image, cpu, memory, envVars[], secrets[], ingress) |  |  |
| TASK-008 | Create Bicep module `/infra/bicep/modules/staticwebapp.bicep` (params: name, location, sku) |  |  |
| TASK-009 | Create root orchestration `/infra/bicep/main.bicep` wiring modules & exporting outputs (frontendEndpoint, apiUrl, keyVaultUri) |  |  |
| TASK-010 | Add parameter file `/infra/bicep/main.dev.parameters.json` (dev values) |  |  |
| TASK-011 | Add placeholder parameter files `/infra/bicep/main.staging.parameters.json`, `/infra/bicep/main.prod.parameters.json` |  |  |
| TASK-012 | Create pipeline file `/azure-pipelines/build-api.yml` (stages: build, test, scan, publish image) |  |  |
| TASK-013 | Create pipeline file `/azure-pipelines/build-frontend.yml` (stages: build, test, static artifact publish) |  |  |
| TASK-014 | Create infra pipeline `/azure-pipelines/infra-deploy.yml` (jobs: validate (what-if), deploy dev, record outputs) |  |  |
| TASK-015 | Define release pipeline `/azure-pipelines/release.yml` (staging + prod with approvals) |  |  |
| TASK-016 | Document service connections `/docs/azure/service-connections.md` (ACR, subscription, Key Vault) |  |  |
| TASK-017 | Add artifact naming conventions `/docs/azure/artifacts.md` |  |  |
| TASK-018 | Add deployment flow diagram `/docs/azure/deployment-flow.md` |  |  |
| TASK-019 | Create smoke test spec `/docs/azure/smoke-tests.md` (curl endpoints list) |  |  |
| TASK-020 | Add rollback procedure `/docs/azure/rollback.md` (Container Apps revision reassign steps) |  |  |
| TASK-021 | Add tagging policy doc `/docs/azure/tagging.md` (tags: env, owner, costCenter, version) |  |  |
| TASK-022 | Add Key Vault secrets manifest `/infra/secrets/dev-secrets.json` (non-secret placeholders referencing names) |  |  |
| TASK-023 | Create validation checklist `/docs/azure/validation.md` (ACR exists, API reachable, logs flowing) |  |  |
| TASK-024 | Add pipeline variable group plan doc `/docs/azure/variables.md` (group names: NBA-DEV, NBA-STAGING, NBA-PROD) |  |  |
| TASK-025 | Add image tagging policy `/docs/azure/image-tags.md` (format: <service>:<semver>-<sha>-<env>) |  |  |

### Implementation Phase 2

- GOAL-002: Enhance security, resilience, multi-environment deploy, observability, optimization (cost + performance), and canary/blue-green strategy.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-026 | Implement Key Vault secret injection into Container Apps (module update + pipeline variable substitution) |  |  |
| TASK-027 | Add Bicep module `/infra/bicep/modules/redis.bicep` (Azure Cache for Redis for API caching) |  |  |
| TASK-028 | Add Bicep module `/infra/bicep/modules/frontdoor.bicep` (global routing + WAF) |  |  |
| TASK-029 | Introduce traffic splitting config in containerapp module (revisions 90/10) |  |  |
| TASK-030 | Implement metric alerts module `/infra/bicep/modules/alerts.bicep` (CPU > 70%, latency > 800ms) |  |  |
| TASK-031 | Add diagnostic settings linking resources to Log Analytics |  |  |
| TASK-032 | Add AKS stub module `/infra/bicep/modules/aks.bicep` (not deployed; readiness for scale) |  |  |
| TASK-033 | Add security scanning stage for dependencies (OSS license + vuln) in build pipelines |  |  |
| TASK-034 | Add container image signed provenance step (cosign or Notation) |  |  |
| TASK-035 | Add pipeline job for canary deploy (new revision -> subset) then promote |  |  |
| TASK-036 | Implement automated rollback script `/scripts/infra/rollback.sh` (revision selection) |  |  |
| TASK-037 | Add cost monitoring doc `/docs/azure/cost-optimization.md` |  |  |
| TASK-038 | Add DR failover plan doc `/docs/azure/dr-failover.md` (region pair strategy) |  |  |
| TASK-039 | Introduce performance load test pipeline stage (k6 container) |  |  |
| TASK-040 | Add policy compliance doc `/docs/azure/policy.md` (deny public IP, enforce tags) |  |  |
| TASK-041 | Add Key Vault access review automation plan `/docs/azure/access-review.md` |  |  |
| TASK-042 | Add environment lock gating (prod requires manual approval + artifact provenance check) |  |  |
| TASK-043 | Add Blue/Green strategy doc `/docs/azure/blue-green.md` |  |  |
| TASK-044 | Add log query samples `/docs/azure/log-queries.md` (Kusto queries) |  |  |
| TASK-045 | Add synthetic monitoring plan `/docs/azure/synthetic-monitoring.md` |  |  |

## 3. Alternatives

- **ALT-001**: Terraform instead of Bicep (rejected: Bicep faster in Azure-native context, simpler dependency graph for team).
- **ALT-002**: GitHub Actions instead of Azure DevOps Pipelines (rejected for organizational existing Azure DevOps usage and environment approvals).
- **ALT-003**: AKS from start (rejected due to unnecessary operational overhead early).
- **ALT-004**: Frontend served by Azure Container Apps Nginx container (rejected; Static Web Apps offers integrated CDN, auth capabilities, simplicity).

## 4. Dependencies

- **DEP-001**: Azure Subscription with required provider registrations (Microsoft.Web, Microsoft.App, Microsoft.ContainerRegistry).
- **DEP-002**: Azure DevOps Project with pipeline agent pool (Ubuntu agents).
- **DEP-003**: Service Connection (Azure Resource Manager) named `SC-NBA-INFRA`.
- **DEP-004**: Service Connection (Container Registry) named `SC-NBA-ACR`.
- **DEP-005**: External NBA stats API availability for smoke tests.
- **DEP-006**: Trivy or equivalent container scanner available in pipeline.
- **DEP-007**: Cosign or Notation CLI for image signing (Phase 2).

## 5. Files

- **FILE-001**: `/infra/bicep/main.bicep` – Orchestrates all modules.
- **FILE-002**: `/infra/bicep/main.dev.parameters.json` – Dev parameter values.
- **FILE-003**: `/infra/bicep/main.staging.parameters.json` – Staging parameter values.
- **FILE-004**: `/infra/bicep/main.prod.parameters.json` – Prod parameter values.
- **FILE-005**: `/infra/bicep/modules/acr.bicep` – ACR module.
- **FILE-006**: `/infra/bicep/modules/loganalytics.bicep` – Log Analytics workspace.
- **FILE-007**: `/infra/bicep/modules/appinsights.bicep` – Application Insights.
- **FILE-008**: `/infra/bicep/modules/keyvault.bicep` – Key Vault.
- **FILE-009**: `/infra/bicep/modules/network.bicep` – Virtual Network + Subnets.
- **FILE-010**: `/infra/bicep/modules/containerapps-env.bicep` – Container Apps environment.
- **FILE-011**: `/infra/bicep/modules/containerapp-api.bicep` – API container app.
- **FILE-012**: `/infra/bicep/modules/staticwebapp.bicep` – Frontend deployment (SWA).
- **FILE-013**: `/azure-pipelines/build-api.yml` – API build pipeline.
- **FILE-014**: `/azure-pipelines/build-frontend.yml` – Frontend build pipeline.
- **FILE-015**: `/azure-pipelines/infra-deploy.yml` – Infrastructure deploy pipeline.
- **FILE-016**: `/azure-pipelines/release.yml` – Promotion pipeline (staging -> prod).
- **FILE-017**: `/docs/azure/deployment-flow.md` – Visual flow.
- **FILE-018**: `/docs/azure/rollback.md` – Rollback procedure.
- **FILE-019**: `/docs/azure/tagging.md` – Tagging standards.
- **FILE-020**: `/infra/secrets/dev-secrets.json` – Placeholder secret manifest (non-sensitive).

## 6. Testing

- **TEST-001**: Infrastructure validation (Bicep `what-if`) in `infra-deploy.yml` ensures changes match expectation (no destructive operations for dev).
- **TEST-002**: Post-deploy smoke test job hitting `api /health` and frontend root returns HTTP 200.
- **TEST-003**: Key Vault access test (API managed identity retrieves placeholder secret) Phase 2.
- **TEST-004**: Log ingestion test (emit sample structured log; query via Kusto) Phase 2.
- **TEST-005**: Container image scan stage passes with zero high/critical vulnerabilities.
- **TEST-006**: Canary deployment traffic distribution validated (revision weight matches spec) Phase 2.
- **TEST-007**: Rollback simulation (switch revision) executed in non-prod.
- **TEST-008**: Parameter drift test (re-run pipeline with unchanged parameters => no updates) confirming idempotency.

## 7. Risks & Assumptions

- **RISK-001**: Misconfigured network could block observability ingestion—mitigation: validate diagnostic settings early.
- **RISK-002**: Key Vault secret rotation not automated—mitigation: Phase 2 add rotation plan.
- **RISK-003**: Image scan false positives delaying deploy—mitigation: allow override with approval gate.
- **RISK-004**: Region outage—mitigation: DR failover plan Phase 2 and cross-region replicable modules.
- **RISK-005**: Cost escalation due to unused revisions—mitigation: scheduled cleanup policy.

- **ASSUMPTION-001**: Organization permits use of Managed Identities and Key Vault.
- **ASSUMPTION-002**: Azure DevOps project has necessary permissions to deploy resources.
- **ASSUMPTION-003**: Container images built in pipelines are pushed to ACR before infra deployment referencing them.

## 8. Related Specifications / Further Reading

- Azure Bicep Docs: https://learn.microsoft.com/azure/azure-resource-manager/bicep/
- Azure Container Apps: https://learn.microsoft.com/azure/container-apps/
- Azure Static Web Apps: https://learn.microsoft.com/azure/static-web-apps/
- Azure Key Vault: https://learn.microsoft.com/azure/key-vault/
- Azure DevOps Pipelines: https://learn.microsoft.com/azure/devops/pipelines/
- Container Registry: https://learn.microsoft.com/azure/container-registry/
- Application Insights: https://learn.microsoft.com/azure/azure-monitor/app/
- Log Analytics: https://learn.microsoft.com/azure/azure-monitor/logs/