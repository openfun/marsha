# Infrastructure & Storage

This document covers the current infrastructure state, the AWS-to-Scaleway migration
history, and how Marsha is deployed.

## Current Infrastructure State (as of v5.12)

```
┌──────────────────────────────────────────────────────────┐
│                     Scaleway Cloud                        │
│                                                           │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ S3 Buckets  │───>│  Edge CDN    │───>│   Viewers    │ │
│  │ (storage)   │    │ (delivery)   │    │              │ │
│  └─────────────┘    └──────────────┘    └──────────────┘ │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                        AWS                                │
│                                                           │
│  ┌─────────────┐    ┌──────────────┐                     │
│  │  MediaLive  │───>│ MediaPackage │  (live streaming    │
│  │ (ingest)    │    │ (HLS output) │   only)             │
│  └─────────────┘    └──────────────┘                     │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│               Kubernetes (via Arnold)                     │
│                                                           │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────────────────┐ │
│  │ Django │ │ Celery │ │ Redis   │ │ PostgreSQL       │ │
│  │ (app)  │ │(worker)│ │ (cache) │ │ (database)       │ │
│  └────────┘ └────────┘ └─────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌────────────┐ ┌─────────────────────┐    │
│  │ Prosody  │ │ WebTorrent │ │ PeerTube Runner     │    │
│  │ (XMPP)   │ │ (P2P)      │ │ (transcoding)       │    │
│  └──────────┘ └────────────┘ └─────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Migration History: AWS to Scaleway

Understanding this migration is important because you may encounter references to
both providers in the code and configuration.

| Version | What changed |
|---------|-------------|
| v5.9.0 | Added Scaleway S3 storage support |
| v5.10.0 | Migrated video and classroom doc storage to Scaleway S3 |
| v5.11.0 | Migrated legacy files to Scaleway S3 |
| v5.12.0 | Removed CloudFront and AWS S3 storage — migrated to Scaleway |

**What remains on AWS:** MediaLive and MediaPackage for live streaming.
The backend still contains some AWS Lambda integrations (e.g., `update-state`
callbacks) and references to `AWS_DESTINATION_BUCKET_NAME`. Storage and CDN
are now on Scaleway.

## Object Storage (Scaleway S3)

### Bucket Structure

Each environment (dev, staging, production) has its own S3 bucket, named
`{workspace}-marsha{suffix}`.

Files are organized by prefix:

| Prefix | Contents | Lifecycle |
|--------|----------|-----------|
| `tmp/` | Temporary uploads, in-progress files | Auto-deleted after 21 days |
| `vod/` | Transcoded video files (HLS segments, manifests) | Permanent |
| `classroom/` | Classroom documents | Permanent |
| `deleted/` | Soft-deleted files | Auto-deleted after retention period (default 21 days) |

### Access Control

- Public `GetObject` on `classroom/`, `vod/`, `tmp/` prefixes (for CDN/player access)
- Full permissions for authenticated IAM users (Django app, Celery workers)
- Presigned POST URLs for direct browser-to-S3 uploads

### Django Storage Backends

Three storage backends are available (`STORAGE_BACKEND` setting):

| Backend | Class | Use case |
|---------|-------|----------|
| `marsha.core.storage.s3` | `S3FileStorage` | Production — Scaleway S3 |
| `marsha.core.storage.filesystem` | `FileSystemStorage` | Development — local files |
| `marsha.core.storage.dummy` | `DummyStorage` | Testing — local upload endpoints |

**Key file:** `src/backend/marsha/core/storage/s3.py`

## Terraform

Infrastructure is managed as code with Terraform.

**Location:** `src/aws/`

```
src/aws/
├── provider.tf           # Scaleway provider configuration
├── variables.tf          # Input variables (bucket suffix, retention, etc.)
├── s3_scaleway.tf        # S3 bucket, lifecycle rules, IAM policies
├── output.tf             # Outputs (bucket name)
├── state.tf.dist         # Remote state backend template (copy to state.tf)
├── Makefile              # Apply/destroy shortcuts
├── bin/terraform         # Wrapper script (validates workspace, runs in Docker)
└── env.d/                # Environment-specific Terraform variables
```

**Workspace model:** Terraform workspaces map to environments. The wrapper script
at `bin/terraform` enforces workspace naming conventions:
- `dev-*` — development
- `staging` — staging
- `production` — production

### Common Terraform Operations

```bash
cd src/aws
make init                    # Initialize terraform
make apply                   # Apply changes to current workspace
make apply-shared-resources  # Apply shared resources
make output                  # Show outputs
make destroy                 # Destroy resources (careful!)
```

## CDN: Scaleway Edge Services

Videos and documents are served through Scaleway's Edge CDN. The CDN URL is
configured via the `SCW_EDGE_SERVICE_DOMAIN` environment variable.

The Django `S3FileStorage` class generates URLs pointing to the CDN domain rather
than directly to S3.

## Deployment

### Docker Images

| Image | Source | Registry |
|-------|--------|----------|
| `fundocker/marsha` | `Dockerfile` (root) | Docker Hub |
| `fundocker/marsha-webtorrent` | `docker/images/webtorrent/Dockerfile` | Docker Hub |

The production Dockerfile is a multi-stage build:

```
back-builder    → compile Python deps (including xmlsec for SAML)
front-builder   → build React apps + compile translations
mail-builder    → generate email templates from MJML
link-collector  → collect static files, deduplicate with symlinks
final           → slim runtime image with all assets
```

Runtime: Gunicorn with Uvicorn workers (ASGI), 3 workers, 6 threads each.

### Arnold (Kubernetes Orchestration)

Marsha is deployed to Kubernetes using [Arnold](https://github.com/openfun/arnold),
an Ansible-based tool that renders Jinja2 templates into Kubernetes manifests.

**Configuration:** `arnold.yml` (root) defines the app name and version.
**Templates:** `src/tray/` contains the Kubernetes manifest templates.

Arnold handles:
- Deployments (app, Celery, WebTorrent)
- Services and ingress
- Database migration jobs
- CronJobs for scheduled tasks
- Secrets management

### Version Tracking

The version appears in several places that must stay in sync:
- `src/backend/setup.cfg` → `version = X.Y.Z`
- `arnold.yml` → `version: X.Y.Z`
- `src/frontend/package.json` → `"version": "X.Y.Z"`
- `src/webtorrent/package.json` → `"version": "X.Y.Z"`
- `CHANGELOG.md` → release notes
- Docker image tags

At build time, a `version.json` file is generated in Mozilla Dockerflow format
for runtime version identification.

## CI/CD (CircleCI)

**Configuration:** `.circleci/config.yml`

### Pipeline Overview

```
lint-git ─────────────────────────┐
check-changelog ──────────────────┤
check-renovate-configuration ─────┤
                                  │
build-back ───> lint-back ────────┤
            └─> test-back ────────┤
                                  │
build-front ──> lint-front ───────┤
            └─> test-front ───────┤
                                  │
build-docker ─> test-e2e ─────────┤
                                  │
build-mails ──────────────────────┤
                                  │
                              hub (publish)
                              tray (deploy)
```

### Key Jobs

| Job | What it does |
|-----|-------------|
| `lint-git` | Validates commit messages, checks CONTRIBUTORS.md |
| `build-back` | Installs Python dependencies |
| `test-back` | Runs pytest against PostgreSQL |
| `build-front` | Builds React apps, extracts translations |
| `test-front` | Runs Jest tests (4 parallel shards) |
| `build-docker` | Builds production Docker image, smoke test |
| `test-e2e` | Playwright tests on Firefox, Chromium, WebKit |
| `hub` | Pushes images to Docker Hub (master + tags only) |
| `tray` | Deploys to k3d cluster for validation |

### Publishing Rules

- Docker images are pushed only on `master` branch and version tags (`v*.*`)
- E2E tests run on all branches
- Changelog checks only run on non-master branches

## Environment Configuration

Environment variables are loaded from files in `env.d/`:

| File | Purpose |
|------|---------|
| `env.d/development` | Local development settings |
| `env.d/test` | Test runner settings |
| `env.d/db` | PostgreSQL connection |
| `env.d/peertube_runner` | PeerTube runner config |

For the complete list of available variables, see [Environment Variables](../env.md).
