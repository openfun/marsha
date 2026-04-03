# Codebase Map

This document helps you answer: "I need to change X — where do I look?"

## Top-Level Structure

```
marsha/
├── src/
│   ├── backend/          # Django application (Python)
│   ├── frontend/         # React applications (TypeScript)
│   ├── aws/              # Terraform infrastructure (Scaleway S3)
│   ├── tray/             # Kubernetes deployment templates (Arnold/Ansible)
│   ├── webtorrent/       # P2P tracker service (Node.js)
│   └── mail/             # Email templates (MJML)
├── docker/               # Docker images (dev, e2e, peertube-runner, webtorrent)
├── docs/                 # Reference documentation
├── env.d/                # Environment variable files
├── lib/                  # Git lint rules
├── Dockerfile            # Production multi-stage build
├── docker-compose.yml    # Local development services
├── Makefile              # Development automation
└── .circleci/            # CI/CD pipeline
```

## Backend (`src/backend/`)

### Django Apps

| App | Path | Purpose |
|-----|------|---------|
| **core** | `marsha/core/` | Main app — videos, documents, playlists, LTI, API |
| **account** | `marsha/account/` | User authentication, SAML/OAuth backends |
| **bbb** | `marsha/bbb/` | BigBlueButton classroom integration |
| **deposit** | `marsha/deposit/` | File deposit/submission system |
| **markdown** | `marsha/markdown/` | Markdown content with LaTeX math support |
| **page** | `marsha/page/` | Static page management |
| **websocket** | `marsha/websocket/` | WebSocket consumers for real-time updates |
| **development** | `marsha/development/` | Dev-only views and LTI test tools |
| **e2e** | `marsha/e2e/` | End-to-end test support |

### Inside the Core App

This is where most of the code lives:

```
marsha/core/
├── models/              # Django models (video, playlist, account, etc.)
├── api/                 # DRF ViewSets and API endpoints
├── serializers/         # DRF serializers
├── permissions/         # Permission classes and mixins
├── lti/                 # LTI launch handling and validation
├── tasks/               # Celery async tasks
├── services/            # Business logic (live sessions, recording, etc.)
├── storage/             # S3/filesystem storage backends
├── utils/               # Utilities (MediaLive, XMPP, Jitsi, S3, etc.)
├── simple_jwt/          # Custom JWT authentication
├── management/commands/ # Django management commands
├── factories.py         # Factory Boy test factories
├── tests/               # Test suite
├── admin.py             # Django admin configuration
├── defaults.py          # Constants and choices (states, roles, etc.)
└── forms.py             # Django forms
```

### Key Backend Files

| What you're looking for | Where to look |
|------------------------|---------------|
| All state constants (PENDING, READY, etc.) | `core/defaults.py` |
| Video model and fields | `core/models/video.py` |
| Organization, User, LTIPassport models | `core/models/account.py` |
| Playlist and access control models | `core/models/playlist.py` |
| REST API endpoints | `core/api/*.py` |
| URL routing | `marsha/urls.py` |
| Django settings | `marsha/settings.py` |
| LTI request handling | `core/lti/__init__.py` |
| Celery task definitions | `core/tasks/*.py` |
| S3 storage backend | `core/storage/s3.py` |
| WebSocket consumers | `websocket/consumers.py` |
| ASGI entry point | `marsha/asgi.py` |

## Frontend (`src/frontend/`)

### Monorepo with Yarn Workspaces

The frontend is a monorepo containing two applications and several shared packages.

### Applications

| App | Path | Build Tool | Purpose |
|-----|------|-----------|---------|
| **LTI Site** | `apps/lti_site/` | Webpack 5 | Embedded in LMS iframes via LTI |
| **Standalone Site** | `apps/standalone_site/` | Vite 6 | Public-facing website |

The LTI site builds output to `src/backend/marsha/static/js/build/lti_site/` (served
by Django). The standalone site builds to its own `dist/` directory.

### Shared Packages

| Package | Path | Purpose |
|---------|------|---------|
| **lib_components** | `packages/lib_components/` | Reusable UI components (40+) |
| **lib_video** | `packages/lib_video/` | Video.js player with HLS + P2P |
| **lib_classroom** | `packages/lib_classroom/` | Classroom/attendance features |
| **lib_markdown** | `packages/lib_markdown/` | CodeMirror markdown editor |
| **lib_common** | `packages/lib_common/` | Theme, types, base styles |
| **lib_tests** | `packages/lib_tests/` | Shared test utilities |
| **marsha-config** | `packages/marsha-config/` | Build config (webpack/jest aliases) |
| **eslint-config-marsha** | `packages/eslint-config-marsha/` | Shared ESLint rules |

### State Management

- **Zustand** — Client-side state (user session, JWT, UI state)
  - Global stores in `packages/lib_components/src/hooks/stores/`
  - Stores: `useCurrentUser`, `useJwt`, `useVideo`, `useAppConfig`, `useFlags`, etc.
- **React Query (TanStack v4)** — Server state (API data fetching and caching)

### Key Frontend Files

| What you're looking for | Where to look |
|------------------------|---------------|
| LTI app entry point | `apps/lti_site/index.tsx` |
| Standalone app entry point | `apps/standalone_site/src/main.tsx` |
| Standalone routing | `apps/standalone_site/src/routes/` |
| Video player component | `packages/lib_video/` |
| Zustand stores | `packages/lib_components/src/hooks/stores/` |
| Webpack config (LTI) | `apps/lti_site/webpack.config.js` |
| Vite config (standalone) | `apps/standalone_site/vite.config.mts` |
| SASS styles | `apps/lti_site/scss/` |
| i18n translations | `apps/*/i18n/` and `packages/*/i18n/` |

## Infrastructure

| What | Where |
|------|-------|
| Terraform (Scaleway S3) | `src/aws/` |
| Terraform wrapper script | `src/aws/bin/terraform` |
| Kubernetes templates | `src/tray/` |
| Arnold config | `arnold.yml` |
| Docker production build | `Dockerfile` |
| Docker dev image | `docker/images/dev/Dockerfile` |
| Docker compose (local dev) | `docker-compose.yml` |
| CircleCI pipeline | `.circleci/config.yml` |
| Environment files | `env.d/` |

## Other Services

| Service | Where | Language |
|---------|-------|----------|
| WebTorrent tracker | `src/webtorrent/` | TypeScript/Node.js |
| Email templates | `src/mail/` | MJML |
| PeerTube runner | `docker/images/peertube/` | Docker config only |

## Configuration

Django settings live in a single file: `src/backend/marsha/settings.py` (~1000 lines).
It uses `django-configurations` with `values.Value()` for environment variable binding.

For the full list of environment variables, see [Environment Variables](../env.md).

For coding conventions and style, see [Development Conventions](../dev.md).
