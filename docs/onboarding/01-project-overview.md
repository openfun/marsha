# Project Overview

## What is Marsha?

Marsha is a self-hosted video and document management platform built for education.
Think of it as a private YouTube that integrates directly into learning management
systems (LMS) like Open edX or Moodle.

It was created by [France Universite Numerique (FUN)](https://www.fun-mooc.fr/), a
French public institution that operates one of the largest MOOC platforms in Europe.

**Repository:** https://github.com/openfun/marsha
**License:** MIT
**Current version:** 5.12.2

## The Problem it Solves

Universities and online education platforms need to host video content for their
courses. They could use YouTube, but that raises privacy, control, and availability
concerns. They need a solution that:

- Lets instructors upload videos directly from their course authoring tools
- Automatically transcodes videos to multiple resolutions
- Streams video with adaptive bitrate (HLS)
- Supports subtitles, closed captions, and transcripts for accessibility
- Embeds seamlessly in any LMS via the LTI standard
- Provides live streaming and virtual classrooms
- Can be self-hosted and fully controlled

Marsha does all of this.

## Key Features

- **Video management** — Upload, transcode (via PeerTube Runner), stream with adaptive bitrate
- **Live streaming** — Real-time video with chat (XMPP/Prosody), participant management
- **LTI integration** — Embeds as an iframe in any LMS (Open edX, Moodle, etc.)
- **Virtual classrooms** — BigBlueButton integration for live teaching sessions
- **Document hosting** — Upload and distribute course documents
- **Accessibility** — Subtitles, closed captions, transcripts, AI-powered transcription (Whisper)
- **P2P delivery** — WebTorrent-based peer-to-peer streaming to reduce CDN costs
- **Standalone site** — Public-facing website for content that doesn't require an LMS
- **Multi-tenant** — Organizations, playlists, fine-grained role-based access control

## Who Uses It

| Actor | What they do |
|-------|-------------|
| **Instructors** | Upload videos/documents, manage live sessions, view attendance |
| **Students/Learners** | Watch videos, attend live sessions, download documents |
| **Organization admins** | Manage playlists, users, and access control |
| **Platform operators** | Deploy and maintain the infrastructure |

## How it's Deployed

Marsha runs as Docker containers, typically deployed on Kubernetes using
[Arnold](https://github.com/openfun/arnold) (an Ansible-based orchestration tool).
Media files are stored on Scaleway S3-compatible object storage with Edge CDN for
delivery.

## Tech Stack at a Glance

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, Django 5, Django REST Framework, Celery |
| Frontend | TypeScript, React 18, Zustand, React Query, Grommet |
| Database | PostgreSQL 16 |
| Cache/Broker | Redis |
| Video processing | PeerTube Runner, FFmpeg, Whisper (transcription) |
| Object storage | Scaleway S3 |
| Live streaming | AWS MediaLive/MediaPackage |
| Chat | Prosody (XMPP) |
| P2P | WebTorrent |
| Classrooms | BigBlueButton |
| CI/CD | CircleCI |
| Infrastructure | Terraform, Docker, Kubernetes |
