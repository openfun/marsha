# LTI Deep Dive

LTI (Learning Tools Interoperability) is the protocol that allows Marsha to embed
inside learning management systems. If you've never worked with LTI before, this
document will get you up to speed.

## What is LTI?

LTI is a standard by [1EdTech](https://www.1edtech.org/) (formerly IMS Global) that
lets external tools embed inside an LMS. When a student clicks on a video in their
Moodle course, Moodle sends a signed HTTP request to Marsha, which responds with an
HTML page that gets displayed in an iframe.

Think of it like OAuth, but for embedding educational tools.

## LTI Versions in Marsha

Marsha implements **LTI 1.0/1.1** (OAuth1-based). The key concepts:

- **Tool Provider** — Marsha (provides the video player)
- **Tool Consumer** — The LMS (Moodle, Open edX, etc.)
- **Launch** — A signed POST request from the LMS to Marsha
- **Deep Linking** — A flow where instructors can select or create content

## The Launch Flow

Here's what happens when a user clicks a video link in their LMS:

```
┌─────────┐         ┌─────────────┐         ┌─────────────┐
│   LMS   │         │   Django    │         │  React App  │
│(Consumer)│        │  (Provider) │         │  (Frontend) │
└────┬────┘         └──────┬──────┘         └──────┬──────┘
     │                     │                       │
     │ 1. Signed POST      │                       │
     │ (oauth_consumer_key,│                       │
     │  oauth_signature,   │                       │
     │  context_id,        │                       │
     │  resource_link_id,  │                       │
     │  roles, user_id...) │                       │
     │────────────────────>│                       │
     │                     │                       │
     │                     │ 2. Verify signature   │
     │                     │    against LTIPassport│
     │                     │                       │
     │                     │ 3. Find/create user   │
     │                     │    via LtiUserAssociation
     │                     │                       │
     │                     │ 4. Find/create        │
     │                     │    playlist + video   │
     │                     │                       │
     │                     │ 5. Generate JWT       │
     │                     │    with user info     │
     │                     │    and permissions    │
     │                     │                       │
     │  6. HTML page with  │                       │
     │     React app +     │                       │
     │     JWT in app_data │                       │
     │<────────────────────│                       │
     │                     │                       │
     │  7. iframe renders  │                       │
     │     React app       │                       │
     │─────────────────────────────────────────────>
     │                     │                       │
     │                     │  8. REST API calls    │
     │                     │     with JWT bearer   │
     │                     │<──────────────────────│
```

### Step by Step

**1. LMS sends signed POST**

The LMS sends an HTTP POST with OAuth1 signature and LTI parameters:
- `oauth_consumer_key` — identifies which LTIPassport to use
- `oauth_signature` — HMAC signature for verification
- `context_id` — course identifier in the LMS
- `resource_link_id` — specific resource link in the course
- `roles` — user's role (Instructor, Learner, etc.)
- `lis_person_contact_email_primary` — user's email
- `user_id` — user's ID in the LMS

**2-3. Django verifies and authenticates**

The `LTI` class (`core/lti/__init__.py`):
- Looks up the `LTIPassport` by `oauth_consumer_key`
- Verifies the OAuth1 signature using the passport's `shared_secret`
- Checks the request domain matches the `ConsumerSite` domain
- Finds or creates a `User` via `LtiUserAssociation`

**4. Resource resolution**

Based on the URL and LTI parameters, Django:
- Finds or creates a `Playlist` (matched by `context_id` + `consumer_site`)
- Finds or creates the `Video`/`Document` (matched by UUID in the URL)
- Grants appropriate access based on LTI roles

**5-6. JWT generation**

Django generates a JWT token containing:
- User identity and roles
- Playlist and resource IDs
- Permissions for the frontend

This token is embedded in the HTML page as `app_data`.

**7-8. Frontend takes over**

The React LTI app boots, reads the JWT from `app_data`, stores it in the Zustand
`useJwt` store, and uses it as a Bearer token for all subsequent API calls.

## Key Files

| What | Where |
|------|-------|
| LTI class and verification | `src/backend/marsha/core/lti/__init__.py` |
| LTI request validation | `src/backend/marsha/core/lti/validator.py` |
| LTI utility functions | `src/backend/marsha/core/lti/utils.py` |
| LTIPassport model | `src/backend/marsha/core/models/account.py` |
| LtiUserAssociation model | `src/backend/marsha/core/models/account.py` |
| ConsumerSite model | `src/backend/marsha/core/models/account.py` |
| LTI URL patterns | `src/backend/marsha/urls.py` (under `lti/`) |
| LTI views | `src/backend/marsha/core/lti/` |
| JWT authentication | `src/backend/marsha/core/simple_jwt/authentication.py` |
| Frontend JWT store | `src/frontend/packages/lib_components/src/hooks/stores/` |

## Deep Linking

Deep Linking is an LTI flow that lets instructors browse and select (or create)
content from within the LMS course editor.

```
Instructor clicks "Add activity" in LMS
    → LMS sends Deep Linking launch to Marsha
    → Marsha shows a selection interface (list of existing videos)
    → Instructor picks a video (or creates a new one)
    → Marsha sends a Deep Linking response back to the LMS
    → LMS saves the selected resource link
```

The selection interface is served at `lti/select/<resource_kind>`.

## Authentication Architecture

Marsha supports two main authentication paths:

### LTI Authentication (iframe context)
- OAuth1 signature verification on initial launch
- JWT token for subsequent API calls
- Token contains playlist context, user roles, resource permissions
- Custom DRF authentication: `JWTStatelessUserOrPlaylistAuthentication`

### Standalone Authentication (direct access)
- SAML via Renater Federation (French education network) — see
  [SAML docs](../renater_federation_saml.md)
- Social auth (OAuth)
- Challenge-based authentication (`/api/auth/challenge/`)
- Standard JWT (SimpleJWT) for API access

## Common Pitfalls

### iframe and Cookies

Modern browsers restrict third-party cookies in iframes. Since Marsha runs in an
LMS iframe (different domain), cookie-based auth doesn't work reliably. This is why
Marsha uses JWT tokens embedded in the page rather than session cookies.

### Domain Verification

The `ConsumerSite.domain` must match the domain from which LTI requests originate.
If the LMS domain changes, the consumer site record must be updated or launches
will fail.

### Debug Mode Bypass

In development (`DEBUG=True`), LTI signature verification can be bypassed by setting
`BYPASS_LTI_VERIFICATION=True`. This should **never** be enabled in production.

### Passport Scope

An `LTIPassport` can be scoped to either:
- A `ConsumerSite` — used for all playlists from that LMS
- A specific `Playlist` — used for one playlist only

The passport lookup uses `oauth_consumer_key` which is unique across all passports.

## For More Details

- [LTI Reference](../lti.md) — raw LTI request examples from different LMS platforms
- [Moodle Integration](../moodle.md) — step-by-step Moodle configuration guide
- [Permissions](../permissions.md) — how LTI roles map to API permissions
