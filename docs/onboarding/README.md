# Marsha Onboarding Documentation

Welcome to Marsha. This documentation is designed to get a new maintainer up to speed
on the project as quickly as possible.

## Recommended Reading Order

| # | Document | What you'll learn |
|---|----------|-------------------|
| 1 | [Project Overview](01-project-overview.md) | What Marsha is, why it exists, who uses it |
| 2 | [System Architecture](02-architecture.md) | All the components and how they connect |
| 3 | [Codebase Map](03-codebase-map.md) | Where to find things in the code |
| 4 | [Domain Concepts](04-domain-concepts.md) | Business entities, lifecycles, access control |
| 5 | [LTI Deep Dive](05-lti-deep-dive.md) | How Marsha integrates with learning platforms |
| 6 | [Infrastructure](06-infrastructure.md) | Storage, deployment, CI/CD, AWS/Scaleway |
| 7 | [Development Guide](07-development-guide.md) | Getting a local environment running |
| 8 | [Operations](08-operations.md) | Running Marsha in production |

## Existing Reference Documentation

These documents already exist in `docs/` and are referenced throughout the onboarding
guides. Don't start here — they make more sense after reading the onboarding docs.

- [Environment Variables](../env.md) — full list of configuration options
- [Permissions](../permissions.md) — detailed authorization model
- [Development Conventions](../dev.md) — coding style and tooling
- [LTI Reference](../lti.md) — raw LTI request examples
- [Moodle Integration](../moodle.md) — step-by-step Moodle setup
- [Cache](../cache.md) — Redis cache with fallback
- [Internationalization](../i18n.md) — translation workflow
- [Live Sessions](../live_sessions.md) — attendance tracking
- [PeerTube Runner](../peertube-runner.md) — transcoding setup
- [P2P Video Player](../p2p-video-player.md) — peer-to-peer delivery
- [SAML Federation](../renater_federation_saml.md) — Renater/SAML auth
- [Architecture Decision Records](../adr/) — past design decisions
