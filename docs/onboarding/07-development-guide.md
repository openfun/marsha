# Development Guide

How to get Marsha running on your machine and start working on it.

> This guide walks you through the initial setup. For the full reference
> on development commands and conventions, see [docs/dev.md](../dev.md).

## Prerequisites

- Docker and Docker Compose
- Make
- Git

That's it. Everything else runs in containers.

## First-Time Setup

```bash
# Clone the repo
git clone https://github.com/openfun/marsha.git
cd marsha

# Build containers and initialize everything
make bootstrap
```

`make bootstrap` runs: `build`, `run`, `migrate`, `i18n-compile-back`,
`install-mails`, `build-mails`, `prosody-admin`, `install-webtorrent`.

### Environment File

Copy the distributed environment files if they don't exist yet:

```bash
cp -n env.d/development.dist env.d/development
cp -n env.d/localtunnel.dist env.d/localtunnel
```

Then edit `env.d/development` as needed — most variables have sensible defaults.

See [Environment Variables](../env.md) for the full list.

## Running the Project

```bash
# Start all development services
make run
```

This starts: Django app (port 8060), Celery worker, Prosody (XMPP), WebTorrent
tracker, PeerTube runner.

### Access Points

| Service | URL |
|---------|-----|
| Django app | http://localhost:8060 |
| Django admin | http://localhost:8060/admin/ |
| Mailcatcher | http://localhost:1080 |
| PostgreSQL | localhost:5452 |

### Create a Superuser

```bash
make superuser
```

## Key Makefile Targets

### Daily Development

| Command | What it does |
|---------|-------------|
| `make run` | Start development services |
| `make stop` | Stop services |
| `make logs` | Follow Django app logs |
| `make shell` | Bash shell inside the app container |
| `make migrate` | Run database migrations |
| `make resetdb` | Destroy and recreate the database |

### Code Quality

| Command | What it does |
|---------|-------------|
| `make check` | Run all linters + Django checks + migration check |
| `make lint` | Run all linters (isort, black, flake8, pylint, bandit) |
| `make lint-black` | Auto-format Python code |
| `make lint-isort` | Auto-sort Python imports |

### Testing

| Command | What it does |
|---------|-------------|
| `make test` | Run Django test suite (pytest, excludes e2e) |
| `make e2e` | Run all e2e tests (Firefox, WebKit, Chromium) |
| `make e2e-ff` | Run e2e tests on Firefox only |
| `make build-e2e` | Build the e2e test container |

To run specific tests, use `bin/pytest` directly:

```bash
# Run a specific test file
bin/pytest marsha/core/tests/api/video/test_update.py

# Run with verbose output
bin/pytest marsha --ignore=marsha/e2e -v
```

### Frontend

| Command | What it does |
|---------|-------------|
| `make build-front` | Build TypeScript + SASS |
| `make watch-front` | Build and watch for changes (LTI site) |
| `make clean-front` | Remove node_modules |

For the standalone site, work directly with yarn:

```bash
# Enter the node container or use local Node.js
cd src/frontend
yarn install
yarn start-site    # Dev server at http://localhost:3000
```

### Translations

| Command | What it does |
|---------|-------------|
| `make i18n-generate` | Extract translation strings (backend + frontend) |
| `make i18n-compile` | Compile translations |
| `make crowdin-upload` | Upload source strings to Crowdin |
| `make crowdin-download` | Download translations from Crowdin |

Full workflow before a release:
```bash
make i18n-generate-and-upload  # Extract and upload to Crowdin
# Wait for translators...
make i18n-download-and-compile # Download and compile
```

## Project Structure for Development

### Backend Changes

1. Models: `src/backend/marsha/core/models/`
2. Create migration: `make makemigrations`
3. Apply migration: `make migrate`
4. API: `src/backend/marsha/core/api/`
5. Tests: `src/backend/marsha/core/tests/`

Django auto-reloads on Python file changes.

### Frontend Changes

The LTI site requires a rebuild (`make watch-front` for auto-rebuild).
The standalone site has hot reload via `yarn start-site`.

### Adding a New Django App

There's a cookiecutter template. See [Development Conventions](../dev.md) for the
scaffolding process.

## Database

PostgreSQL runs in Docker on port 5452 (not the standard 5432, to avoid conflicts).

```bash
# Connect directly
psql -h localhost -p 5452 -U marsha_user -d marsha

# Reset everything
make resetdb

# Check for missing migrations
make check-migrations
```

## Debugging

### Django Shell

```bash
make shell
# Then inside the container:
python manage.py shell_plus
```

### Celery Tasks

Celery runs as a separate container. To debug tasks:

```bash
# Check celery logs
docker compose logs -f celery

# Run a task synchronously in Django shell
from marsha.core.tasks.video import launch_video_transcoding
launch_video_transcoding.apply(args=[video_pk, stamp, domain])
```

### WebSocket

WebSocket connections go through Django Channels. The consumer is at
`src/backend/marsha/websocket/consumers.py`. Redis is used as the channel layer.

### Local Tunnel

For testing LTI integration with an external LMS, you need your local instance
to be accessible from the internet:

```bash
make tunnel
```

This starts a [localtunnel](https://localtunnel.me) instance.

## Code Conventions

See [Development Conventions](../dev.md) for:
- Black formatting (line length, etc.)
- Flake8 and Pylint rules
- Django model naming conventions
- Test organization
- Frontend ESLint/Prettier rules
