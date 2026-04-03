# Domain Concepts

This document explains the business domain — the entities, their relationships, and
their lifecycles. Understanding these concepts is essential before touching the code.

## Entity Hierarchy

```
Organization
  └── Playlist
        ├── Video
        ├── Document
        ├── Classroom (BBB)
        ├── DepositedFile
        └── MarkdownDocument
```

### Organization

A top-level grouping (typically a university or institution). Organizations contain
playlists and have users with roles.

**Model:** `core/models/account.py` → `Organization`

### Playlist

A container for related resources. A playlist belongs to an organization and defines
who can access its content.

Playlists can be created either:
- **Via LTI** — automatically when an LMS course embeds Marsha for the first time
  (identified by `lti_id` + `consumer_site`)
- **Via the standalone site** — manually by authenticated users
  (identified by `organization` alone)

**Model:** `core/models/playlist.py` → `Playlist`

### Video

The primary resource. A video goes through a lifecycle from upload to playback, and
can also be used for live streaming.

**Model:** `core/models/video.py` → `Video`

### Document

A file resource (PDF, etc.) that can be distributed to learners via LTI or the
standalone site.

**Model:** `core/models/file.py` → `Document`

## Access Control

Access is managed through "Access" junction models that associate users with resources
and assign roles.

### Roles

| Role | Value | Meaning |
|------|-------|---------|
| ADMINISTRATOR | `"administrator"` | Full control over the resource |
| INSTRUCTOR | `"instructor"` | Can manage content, view analytics |
| STUDENT | `"student"` | Can view/consume content |

### Access Models

| Model | Links | Default Role |
|-------|-------|-------------|
| `OrganizationAccess` | User ↔ Organization | INSTRUCTOR |
| `PlaylistAccess` | User ↔ Playlist | INSTRUCTOR |
| `ConsumerSiteAccess` | User ↔ ConsumerSite | ADMINISTRATOR |

An instructor on a playlist can manage its videos. An admin on an organization can
manage all playlists within it.

For the full authorization matrix, see [Permissions](../permissions.md).

## LTI Concepts

### ConsumerSite

Represents an external LMS instance (e.g., "courses.example.edu"). Identified by
domain. Multiple organizations can be linked to one consumer site.

### LTIPassport

Credentials for authenticating LTI requests. Contains:
- `oauth_consumer_key` — public identifier (auto-generated)
- `shared_secret` — private key for OAuth1 signature verification (auto-generated)

A passport can be scoped to either a consumer site or a specific playlist.

### LtiUserAssociation

Maps an LTI user identity (`lti_user_id` + `consumer_site`) to a Marsha `User`.
This ensures the same person in the LMS always maps to the same Marsha user.

### LTI Roles Mapping

LTI roles from the LMS are mapped to Marsha roles:

| LTI role | Marsha role |
|----------|------------|
| `administrator` | ADMINISTRATOR |
| `instructor`, `teacher`, `staff` | INSTRUCTOR |
| `student`, `learner` | STUDENT |
| `none` | NONE |

## Video Lifecycle

### Upload States

```
                    ┌──────────┐
                    │ PENDING  │  (video created, no upload yet)
                    └────┬─────┘
                         │ upload starts
                    ┌────▼─────┐
                    │SCANNING  │  (file uploaded to S3 tmp/)
                    └────┬─────┘
                         │
                ┌────────┼────────┐
                │        │        │
          ┌─────▼──┐ ┌───▼────┐  │
          │INFECTED│ │PROCESSING│ │
          └────────┘ └───┬────┘  │
                         │       │
                    ┌────▼─────┐ │
                    │  READY   │ │
                    └──────────┘ │
                                 │
                           ┌─────▼──┐
                           │ ERROR  │
                           └────────┘
```

### Live States

```
    ┌──────┐
    │ IDLE │  (live session created)
    └──┬───┘
       │ start
    ┌──▼──────┐
    │STARTING │
    └──┬──────┘
       │
    ┌──▼──────┐
    │ RUNNING │  (live and streaming)
    └──┬──────┘
       │ stop
    ┌──▼──────┐
    │STOPPING │
    └──┬──────┘
       │
    ┌──▼──────┐
    │ STOPPED │
    └──┬──────┘
       │ harvest (convert to VOD)
    ┌──▼────────┐
    │HARVESTING │
    └──┬────────┘
       │
    ┌──▼────────┐
    │ HARVESTED │  (VOD available)
    └───────────┘
```

### Live Types

| Type | How it works |
|------|-------------|
| `raw` | Instructor streams via RTMP to AWS MediaLive |
| `jitsi` | WebRTC via Jitsi — no RTMP needed |

## Timed Text Tracks

A video can have multiple associated text tracks for accessibility:

| Mode | Purpose |
|------|---------|
| `subtitle` (st) | Subtitles for translation |
| `closed_caption` (cc) | Closed captions for hearing impaired |
| `transcript` (ts) | Full text transcript |

Each track is associated with a language. See [ADR 0002](../adr/0002-videos-languages.md).

## Soft Deletion

All models use `django-safedelete` with `SOFT_DELETE_CASCADE` policy. When a resource
is "deleted," it is hidden from queries but remains in the database. Files of
soft-deleted resources are moved to the `deleted/` S3 prefix, where lifecycle rules
clean them up after a configurable retention period.

See [ADR 0004](../adr/0004-soft-deletion.md).

## Portability

Playlists and resources can be "portable" — shared across consumer sites or between
playlists. This allows the same video to be used in multiple courses without
duplicating it.

- `is_portable_to_playlist` — can be linked from other playlists
- `is_portable_to_consumer_site` — can be linked from other LMS instances
- `PortabilityRequest` model — tracks requests to share resources

## Feature Flags

Several features are conditionally enabled via settings:

| Setting | Feature |
|---------|---------|
| `BBB_ENABLED` | BigBlueButton classrooms |
| `DEPOSIT_ENABLED` | File deposit system |
| `MARKDOWN_ENABLED` | Markdown documents |
| `LIVE_RAW_ENABLED` | Raw RTMP live streaming |
| `LIVE_CHAT_ENABLED` | Chat during live sessions |
| `P2P_ENABLED` | WebTorrent P2P delivery |

These toggle both URL routes and API behavior.
