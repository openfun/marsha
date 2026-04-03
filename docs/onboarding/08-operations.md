# Operations Guide

How to operate Marsha in production — management commands, monitoring, releases,
and common tasks.

## Management Commands

These Django management commands are available for operational tasks:

### Video Management

| Command | Purpose |
|---------|---------|
| `check_harvested` | Check status of videos that were harvested from live to VOD |
| `check_live_state` | Monitor the state of live streams |
| `delete_outdated_videos` | Archive videos past their retention date |
| `update_video_information` | Refresh video metadata (duration, size) |
| `transcript_videos` | Bulk-generate transcripts for existing videos |

### Infrastructure Cleanup

| Command | Purpose |
|---------|---------|
| `clean_aws_elemental_stack` | Remove orphaned AWS MediaLive channels |
| `clean_medialive_dev_stack` | Clean up dev-only MediaLive resources |
| `clean_mediapackages` | Remove orphaned MediaPackage channels |
| `delete_transcoding_temp_files` | Clean temporary transcoding files from S3 |

### Communication

| Command | Purpose |
|---------|---------|
| `send_reminders` | Send scheduled webinar reminder emails |
| `send_vod_convert_reminders` | Notify instructors about VOD conversion |

### Other

| Command | Purpose |
|---------|---------|
| `rename_documents` | Batch rename documents |
| `sync_medialive_video` | Sync video metadata to MediaLive |
| `dev_simulate_reminders` | Test reminder system (dev only) |

Run commands in production:
```bash
# Via kubectl (if using Kubernetes)
kubectl exec -it <pod-name> -- python manage.py <command>

# Via Docker
docker compose exec app python manage.py <command>
```

## Celery Tasks

These tasks run asynchronously via Celery workers:

| Task | Trigger | What it does |
|------|---------|-------------|
| `launch_video_transcoding` | Video upload completes | Dispatches to PeerTube Runner |
| `launch_video_transcript` | Manual or auto trigger | Generates transcript via Whisper |
| `compute_video_information` | After transcoding | Extracts duration and file size |
| `copy_video_recording` | BBB recording ready | Downloads BBB recording to S3 |

Monitor Celery:
```bash
# Local development
docker compose logs -f celery

# Check Redis queue length
redis-cli -h <redis-host> LLEN celery
```

## Monitoring

### Sentry

Error tracking is configured via the `SENTRY_DSN` environment variable. Both the
Django backend and the Node.js WebTorrent tracker report to Sentry.

Check Sentry for:
- Unhandled exceptions
- Failed Celery tasks
- API errors (4xx/5xx rates)
- WebSocket connection failures

### Health Check

The Django app exposes a health endpoint via
[python-dockerflow](https://github.com/mozilla-services/python-dockerflow):
- `/__heartbeat__` — checks database connectivity
- `/__lbheartbeat__` — simple load balancer check
- `/__version__` — returns `version.json` with build info

## Feature Flags

Features can be toggled via environment variables:

| Variable | Default | Feature |
|----------|---------|---------|
| `BBB_ENABLED` | `False` | BigBlueButton classrooms |
| `DEPOSIT_ENABLED` | `False` | File deposit system |
| `MARKDOWN_ENABLED` | `False` | Markdown documents |
| `LIVE_RAW_ENABLED` | `False` | Raw RTMP live streaming |
| `LIVE_CHAT_ENABLED` | `False` | Chat during live sessions |
| `P2P_ENABLED` | `False` | WebTorrent P2P delivery |

Disabling a feature hides the corresponding URL routes and API endpoints.

## Release Process

### 1. Update Version

These files must be updated:
- `src/backend/setup.cfg` → `version = X.Y.Z`
- `arnold.yml` → `version: X.Y.Z`
- `src/frontend/package.json` → `"version": "X.Y.Z"`
- `src/webtorrent/package.json` → `"version": "X.Y.Z"`
- `CHANGELOG.md` → add release section

### 2. Update Changelog

Follow the [Keep a Changelog](https://keepachangelog.com/) format:
```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...
```

Lines must not exceed 80 characters (enforced by CI).

### 3. Tag and Push

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

CircleCI will automatically:
- Build the Docker image
- Run the full test suite
- Push to Docker Hub as `fundocker/marsha:vX.Y.Z`

### 4. Deploy

Deployment is handled via Arnold. Update the version in the environment's
configuration and trigger a deployment.

## Common Operational Tasks

### Creating an LTI Passport

Via Django admin (`/admin/`):
1. Go to "LTI Passports"
2. Create new passport
3. Associate with a ConsumerSite or Playlist
4. Share the `oauth_consumer_key` and `shared_secret` with the LMS admin

Or via Django shell:
```python
from marsha.core.models import ConsumerSite, LTIPassport
site = ConsumerSite.objects.get(domain="courses.example.edu")
passport = LTIPassport.objects.create(consumer_site=site)
print(f"Key: {passport.oauth_consumer_key}")
print(f"Secret: {passport.shared_secret}")
```

### Creating a Superuser

```bash
# Local
make superuser

# Production
python manage.py createsuperuser
```

### XMPP Admin

```bash
# Local
make prosody-admin

# This creates a Prosody admin user for chat management
```

### Storage Cleanup

S3 lifecycle rules handle most cleanup automatically:
- `tmp/` files expire after 21 days
- `deleted/` files expire after the configured retention period

For manual cleanup:
```bash
python manage.py delete_transcoding_temp_files
python manage.py delete_outdated_videos
```

### Checking Live Stream Health

```bash
python manage.py check_live_state
python manage.py clean_aws_elemental_stack  # remove orphaned channels
```

## Dependency Management

Dependencies are managed with [Renovate](https://github.com/renovatebot/renovate),
configured in `renovate.json`. Some updates are intentionally blocked:

- Django is capped at `<5.1.0`
- Major JS dependency updates are disabled for stability
- The configuration extends `github>openfun/renovate-configuration`

Review Renovate PRs carefully — the CI pipeline validates all changes.
