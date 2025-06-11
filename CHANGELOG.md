# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic
Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Use feature flags to control visibility of LTI video/webinar buttons
- Fix storage location field for existing files stored on AWS S3:
  - markdown images
  - deposited files
  - clasroom documents

## [5.8.0] - 2025-06-06

### Added

- Add feature flags to enable/disable core resources for the whole site
- Add support for storing markdown images on Scaleway S3
- Add support for storing deposited files on Scaleway S3
- Add support for storing classroom documents on Scaleway S3

### Fixed

- Fix timeout increase on Nginx for peertube runner success request

## [5.7.0] - 2025-04-08

### Added

- Add Celery task to fetch recording from Scalelite API
- Add Peertube pipeline for BBB recordings

### Fixed

- Restore download, transcription and shared media icons on the video player

## [5.6.0] - 2025-03-06

### Added

- Add SCW_EDGE_SERVICE_DOMAIN setting for serving videos with SCW Edge Services

### Changed

- Increase connection timeout on Nginx for peertube runner success request
- Allow disabling Cloudfront signed URLs

## [5.5.3] - 2025-01-09

### Fixed

- Fix blackboard LTI roles parsing

## [5.5.2] - 2024-12-19

### Added

- Support for the IMS LIS role format in the LTI launch

## [5.5.1] - 2024-11-29

### Fixed

- Use a big int for video size field

## [5.5.0] - 2024-11-28

### Added

- Reject transcoding job for video with too high resolution
- Add fields to video to store its size and duration
- Display in admin video duration and size

### Changed

- Upgrade to django 5.0

### Fixed

- Authorize ended live to initiate a transcription

## [5.4.0] - 2024-11-13

### Changed

- Allow to configure transcoding resolutions
- Upgrade to python 3.12
- Redirect video url instead of streaming it on /transcript-source

## [5.3.1] - 2024-11-07

### Fixed

- Ignore XAPI statements from public view without consumer_site

## [5.3.0] - 2024-11-04

### Added

- Cleanup transcoding temp files

### Changed

- Connect runner to ws pods in tray

### Fixed

- Enable join classroom button if username is populated from local storage
- Use domain from lti jwt token when no consumer site used

## [5.2.0] - 2024-10-22

### Added

- Allow all users created via shibboleth to have their own playlist

## [5.1.0] - 2024-10-09

### Added

- Add peertube transcript generation
- Manage feature flags in /api/config endpoint

### Changed

- Split websocket and asgi apps in tray
- Remove websocket connection in VOD student dashboard
- Remove useIsFeatureEnabled and use new store useFlags instead

### Fixed

- Allow to change username if one is persisted on classroom join
- Webkit e2e tests in CI

## [5.0.3] - 2024-08-01

### Fixed

- Manage subtitles content starting with a BOM

## [5.0.2] - 2024-07-30

### Changed

- Compute hls url based on video resolutions available

## [5.0.1] - 2024-07-04

### Fixed

- Manage playlist constraint with DRF 3.15

## [5.0.0] - 2024-06-24

### Added

- Add scaleway storage configuration
- Add Peertube pipeline to VOD
- Celery task queue
- Refactor video S3 deletion
- Add thumbnail celery task
- Add shared live media celery task
- Add timed text track celery task
- Add form submission with enter key when entering a classroom
- Persist username used on classroom join

### Changed

- Replace CRA by Vite (#2530)
- Replace grommet Image and Grid component (#2518)
- Optimized apps bundle (#2528)
- Launch transcoding through a celery task

### Fixed

- Correctly set startime with filtering medialive logs
- Remove non existing fields in PortabilityRequestAdmin
- Correctly send xapi statement to a configured LRS
- Correctly send xapi video download statements

## [4.9.0] - 2023-12-04

### Added

- Disable lti nonce and timestamp validation

## [4.8.1] - 2023-11-29

### Fixed

- Fix invite links on BBB (#2521)

## [4.8.0] - 2023-11-29

### Added

- Meta description and meta title on the website from the API (#2516)
- Retrieve BBB learning analytics and send them through API
- Classroom attendance analytics (#2499) 
- Add a language picker for the invite link on the website (#2504)

### Changed

- Replace grommet DropButton component (#2513)
- On live, can now share resource when one is already shared (#2512)
- Remove persistency on token from invite link (#2505)
- Replace grommet Cards / Footer/ Anchor / Tip / Nav (#2503)
- Refacto widgets SharedLiveMedia (#2504)
- Replace grommet Button (#2453)
- Replace grommet Box (#2484)
- Replace grommet TextArea (#2500)
- Update psycopg to version 3
- Update node to version 20
- Replace pylti with oauthlib for LTI request validation
- Replace faker with @faker-js/faker (frontend)

### Fixed

- Blocking error when shared document is deleted (#2504)
- Improve render sharing picture in live (#2508)

## [4.7.0] - 2023-10-19

### Added

- Generic video LTI url
- Display complete error message in frontend
- Generic classroom LTI url
- Generic LTI cartridge (xml configuration)
- Display LTI warning message for generic urls regarding course copy
- configure homepage banner using SiteConfig model
- setting BBB_INVITE_TOKEN_BANNED_LIST
- Add transcode_pipeline property to video model

### Changed

- Replace ngrok with localtunnel to serve marsha on a public domain with
  stable urls and allow to run multiple tunnels at the same time
- Replace all the loaders by Cunningham Loader (#2436)
- Replace grommet Text (#2427)
- Replace grommet Paragraph (#2435)
- Remove cross on login image (#2451)
- Replace grommet Checkbox and Pagination (#2437)

### Fixed

- Markdown save sent previously saved content
- Force to end BBB meeting when creation fail

## [4.6.0] - 2023-10-02

### Added

- Send an email when a live stream is ready to be converted to VOD
- Send an email when a live stream is converted to VOD
- Send an email when a live stream is about to be deleted

### Changed

- Replace grommet Heading (#2410)
- Replace all the loaders by Cunningham Loader (#2436)
- Replace grommet Text (#2427)
- Replace grommet Paragraph (#2435)
- Upgrade to python 3.11
- Upgrade channels and channels-redis to version 4

### Fixed

- force bbb user_id uniqueness in join url

## [4.5.0] - 2023-09-15

### Changed

- Disable classroom convert button when converting
- Replace grommet Select by Cunningham Select (#2400)

### Fixed

- Save license when a video is created
- Show an error when a resource has been deleted
- Allow depositedfiles to have unicode characters in their filename
- Correctly redirect a user when a resource is deleted (#2419)
- Checkbox to delete resource remains displayed on others pages (#2416)
- Remove a non-existent attribute which breaks classroom document admin view
- Change color of a disabled button in the deposit file student dashboard
- Remove multiple primary buttons in the deposit file dashboard
- Remove multiple calls of playlist is-claimed endpoint

## [4.4.0] - 2023-09-08

### Added

- Add playlist is_claimable attribute
- Add the Accept-Language header to most of the http request (#2394)

### Changed

- Replace grommet TextInput by Cunningham Input (#2374)
- Save classroom recording urls in a cache and remove access from db column

## [4.3.1] - 2023-08-31

### Fixed

- Display claim link only when is-claimed request is in success

## [4.3.0] - 2023-08-29

### Added

- Create a default playlist for new shibboleth user
- Add Cunningham design system (#2297)
- Lifecycle rule on source bucket to expire uploaded
  object after 21 days.
- Add P2p feature on videojs player
- Webtorrent tracker for P2P video feature
- eslint sort the modules name (#2338)
- Add retention date and s3 lifecycle rules to classroom / video
- Add a command to delete expired classrooms / videos
- Add retention duration on playlist form
- Add retention date widget to video and classroom
- Add a download-video widget directly in the video player
- Configure sentry in the webtorrent application
- Add custom frontend site management
- Manage multiple ingresses
- Manage shibboleth config per site config
- Add a shared media widget directly in the video player
- Add a transcript plugin to the video player
- Add a link to LTI resources to retrieve them in the standalone website
- Add Language Picker in the standalone website (#2366)
- Add xapi statements cache to avoid duplicate statements
- Add variable to override PVC in arnold deployment

### Changed

- Replace xAPI downloading statements category related activity value
- Upgrade frontend to React 18 (#2280)
- Upgrade to django 4.2
- `DJANGO_STATICFILES_STORAGE` environment variable is replaced by
  `DJANGO_STORAGES_STATICFILES_BACKEND`
- Use alpine for installing mediainfo in lambda docker images
- Add compatibility with docker compose 2
- tslint is replaced by eslint in lti app (#2321)
- refactor videojs id3 tags handling as videojs plugin
- refactor videojs xapi handling as videojs plugin
- upgrade react-query to @tanstack/react-query (v4) (#2340)
- Replace component SortableTable by Cunningham DataGrid (#2311)
- Replace grommet DatePicker by Cunningham DatePicker (#2359)

### Fixed

- Video player reset when attributes update (#2300)
- Fix panel closing and resizing on live video player chat (#2310)
- Fix download video button when video is not downloadable

## [4.2.1] - 2023-06-20

### Fixed

- Upgrade logging-ldp to be compatible with logging-gelf
- clean_aws_elemental_stack command removes unreferenced medialive stacks

## [4.2.0] - 2023-06-15

### Added

- Add checkbox of recording consent (#2259)
- Setting for instructor classroom invitation link expiration
- Add a downloadable ICS file to scheduled student classrooms
- frontend bulk delete for videos, webinars and classrooms
- Can choose inactive resource by site (#2276)
- Setting for instructor classroom invitation link expiration
- ClassroomRecording Delete API
  - delete BBB recordings
  - delete ClassroomsRecording
- Delete BBB recording when VOD from a ClassroomRecording is created
- Add an attribute to consumer site to deactivate classroom recording
  conversion to VOD
- Filter dockerflow healthcheck in sentry before_send_transaction

### Changed

- Restrict video list endpoint to organisation admin
  and playlist admin or instructor
- Refacto classroom invite link. the invite token is saved in
  the classroom model and no access token is generated in the serializer

### Fixed

- remove initial / from page slug to use it in the API fetch
- Blacklist the refresh token on the frontend side (#2265)
- Legale pages not accessible from url (#2266)
- Remove old svg from the back to the front application (#1485)
- Sync medialive command deletes medialive stack when video not found

### Changed

- Refacto routes contents website (#2253)
- Change names of Classroom/Live/Video Create components into Manage

## [4.1.0] - 2023-05-23

### Added

- bulk delete for video and classroom
- iframe code to copy to clipboard in dashboard VOD and webinar (#2221)
- lti code to copy to clipboard in dashboard VOD and webinar (#2227)
- Standalone website:
  - Integrate footer (#2205)
  - Display an error when renater auth fails(#2240)
  - 404 page (#2244)
- Configure SOCIAL_AUTH_LOGIN_ERROR_URL setting
- Convert classroom recording to vod
- Add a middleware to deal with social auth exception

### Changed

- use batch/v1 api in cronjob_pipeline manifest
- Use jammy for e2e tests
- Homogenize modal use between standalone_site and LTI
- Nest frontend api routes of video related objects
  (thumbnails, timed_text_track, shared_live_media...) (#2228)
- Change wording on modals
- use existing setting DEFAULT_FROM_EMAIL instead of EMAIL_FROM
- enable sentry performance and profiling in django

### Fixed

- Wrong usage of reduce index in xapiVideo mergeSegments
- Allow to delete a video with an active shared live media
- Fix a closing/reopening bug on modals
- Allow to delete in cascade classroom recording
- Allow to delete in cascade classroom document

## [4.0.0] - 2023-05-02

### Added

- Standalone website:
  - Filter contents by playlist (#2176)
  - Add playlist contents on playlist page (#2182)
  - Add a button to create a playlist from any resource creation form
  - new widget for video and classroom dashboard that enables resource deletion
  - Add a button on playlist edition view to delete the playlist
- Add a command to sync media channel states and video states
- pages model api for standalone footer TOS or some legal notices

### Changed

- Standalone website:
  - Improve architecture Contents feature (#2183)
- Move edition icon on title input at the begining of the input
- Increase description textarea min height
- Marsha permission core split files

### Removed

- start date under the title on the BBB dashboard

### Fixed

- Standalone website:
  - Correctly display creation form when there is no playlist

## [4.0.0-beta.20] - 2023-04-20

### Fixed

- Downgrade python social auth to version 4.3.0 (#2197)

## [4.0.0-beta.19] - 2023-04-19

### Added

- standalone website:
  - Integrate VOD dashboard (#2086)
  - List the lives in the contents section (#2104)
  - Live session model
  - Livesession backend rewrite
  - Add sentry
  - Create a live from the website (#2134)
  - Integrate webinar dashboard (#2135)
- Add a License Manager widget for LTI VOD view
- Add a title to the classroom file dropzone
- Add can_edit property on a serialized video
- Add an attribute to consumer site to deactivate resources in LTI select
- live transpilation on lib-video (#2150)
- live transpilation on lib-classroom (#2157)
- live transpilation on lib-markdown (#2160)
- live transpilation on lib-components (#2161)
- live transpilation on lib-tests (#2163)
- live transpilation on lib-common (#2164)
- Add a widget provider for the classroom creation form
- Allow delete playlist resources
  - FileDepository
  - Classroom
  - Document
  - Markdown
- Allow delete playlist
- add routes related URL:
  - thumbnails
  - timed_text_track
  - shared_live_media
- Add classroom widgets :
  - InfoBar
  - Description
  - Scheduling
  - Invite links
  - Support sharing
  - Recordings
- Add classroom invite link for an instructor
- Add a "Tools & Applications" widget for classrooms

### Changed

- Update live sessions API to use nested video ID route
- Move generic widget components from lib-video to lib-components
- Make video dashboard collapsed by default
- improve the dropdown languages positionning in the dashboard (#2138)
- Make video dashboard visible by default, and collapsed when using the
  Moodle atto plugin
- Update live_session api to use mixin to prevent url crafting
- standalone website:
  - put the creating ressource form submit button disabled when the
    form is invalid (#2175)

### Fixed

- redirect to error page when VOD is deleted
- Manage disconnection when multiple tabs were open on standalone site
- synchronisation between pages for the VOD description widget
- tooltip position on the website context dashboard (#2136)
- thumbnail not reset correctly on the video player (#2137)
- display title / description when a classroom is not scheduled and not started
- correctly fetch transcript content in TranscriptReader
- remove unused 'initiate-live' permissions
- increase debounce time in classroom description widget
- remove id3 tags upload when live channel is not ready
- add an invitation link for moderators in a launched classroom if available

## [4.0.0-beta.18] - 2023-03-06

### Changed

- Manage xapi request without consumer_site

### Fixed

- rounded button style (#2118)

## [4.0.0-beta.17] - 2023-03-03

### Added

- Add Markdown wizard in LTI context
- Add subtitles download for teacher
- standalone website:
  - List the VOD in the contents section
  - Integrate creation VOD
  - Add playlist access management
- Add 'is_live' property to video object

### Changed

- Allow playlist instructor to manage shared live media through API
- Allow playlist instructor to manage timed text tracks through API
- Rework Markdown UI
- Allow playlist admin/instructor to manage thumbnails through API

### Fixed

- Bug on chat messages synchronisation
- Static files exclusion
- Impossible to decode JWT token, there is no jwt to decode
- Add refresh token in the challenge response

### Removed

- Remove unused STATIC_POSTPROCESS_MAP_IGNORE_REGEX setting

## [4.0.0-beta.16] - 2023-02-17

### Added

- remove lib folder before rollup build to avoid stale files
- Add stats page on VOD
- Create lib-markdown package
- Add a check on timedtexttrack file size when uploading content
- Add a check on deposited file size when uploading content
- helpers frontend api error handling
- Add accepted formats in the subtitles uploaders helptext
- Standalone website:
  - Add "video" management API endpoints permissions
  - Update playlists and playlist accesses
- Add a check on thumbnail file size when uploading content

### Changed

- lti:
  - position modal above tooltip
- mutualize all CronJob in a CronJobList
- make all packages shakeable
- use lib-common theme in LTI
- change docker base image to use a debian lite one
- Allow public resource to be embedded in a iframe
- use live video Id3 tags to share document and end stream

### Fixed

- the Renater IdP sort is case-insensitive
- bug on the textarea description of the live video
- aws fargate loggroup region
- fix recording action buttons style
- student live polling a stopped live beeing restarted

## [4.0.0-beta.15] - 2023-02-02

### Added

- wrapper around fetch to handle 401 errors and refresh the access token
- configure wantNameId and allowRepeatAttributeName for saml_fer
  security settings
- Add a lti link to classroom in the standalone website
- Invite link for classroom available in every context
- Configure teachers role lookup to create organization access
- LTI link for classroom available in every context
- standalone website:
  - banner homepage with dynamic text
  - add "playlist access" management API endpoints
  - add "user" management API endpoints
- Arnold tray to manage definition directly in marsha repository
- Install and configure scoutapm

### Changed

- change xapi endpoints status code when no LRS from 501 to 200

### Fixed

- lti:
  - jwt store initialization concurrency issue with access jwt
- ui calendar
- standalone website:
  - prefill input label hidden

### Removed

- service worker from lti site and standalone site

## [4.0.0-beta.14] - 2023-01-25

### Added

- Add a configuration for jwt state preservation with localstorage

### Fixed

- standalone website:
  - Authentication renater select crashing the site on scroll
  - Consider local storage is optional depending on browser settings
  - Fix firefox chunk CDN invite mode
- Return 404 for missing static files

## [4.0.0-beta.13] - 2023-01-23

### Added

- standalone website:
  - Display current user full name instead of John Doe
  - service worker 401 reconnect
  - Password reset views & API
  - Renater IdP's logo display on login page
  - Allow organization instructors to create playlists
  - profile page and update password form in settings
  - Select an organization by default in create playlist form
- Allow instructors to download recorded BBB classroom sessions

- lti:
  - service worker 401 reconnect
  - Add a check on video file size when uploading content

### Changed

- Remove deprecated params from BBB API calls
- Keep resource property in AppData
- Create a lib to handle all components for video (VOD and live)
- Optimize LTI images

### Fixed

- Set unique storage name for useJwt hook for LTI
- Fix BBB resizable text areas that could overlap with the image
- Fix formfield label with long label that could go beyond the container
- lti_site:
  - Live parameters sync between users
  - Display valid webinar url when creating one with LTI select content
  - Bundle size polyfill
  - White band under video player on student side
- standalone website:
  - fix renater select box on smaller screens
- Stabilize flaky e2e tests

## [4.0.0-beta.12] - 2022-12-28

### Added

- standalone website:
  - classroom (list/create/update)
  - Add a new "invite" JWT in classroom API to allow
    students to join a classroom through a link
  - Manage portability requests (list/accept/reject)
  - dynamic content in homepage
  - page my-contents
  - access site visitor mode
  - login page
- Add new elements to the teacher VOD Dashboard :
  - Attendances from live session
- Allow to store link between an LTI user and a "site" user
- Allow LTI users to request for a playlist portability
- Enable recording when creating a BBB room instance
- Mutualize Eslint configuration
- Shareable classroom link
- Endpoint fetching jitsi info for a specific video
  (/api/videos/{video_id}/jitsi/)
- Reopen chatrooms in readonly mode when converting a live to a vod

### Changed

- Number of viewer doesn't include the instructor accounts
- Move title edition on the title itself
- Move record toggle
- standalone website:
  - mutualize modals and styles
  - fine tune UI
  - guess ISO15897 locale code
- Filtered classroom list
- Filtered deposit list
- Filtered markdown document list
- Use a lite serializer for classroom resource on list endpoint
- Rework of the TimedTextTrackLanguageChoices hook
- Adapt lib-components with eslint rules
- Adapt lib-classroom with eslint rules
- The full name replaces the first and last names in the
  user's profile API
- Always show the "use subtitle as transcript" toggle in the
  UploadSubtitles widget

### Fixed

- Remove hangup button
- Fix overlap display of the modal to end live on mobile view
- Fix recording button bugs
- Fix recording button bug on small display
- Change permission on retrieve endpoints
- Deal with webinar without thumbnail
- Force to save the starting live state on the start action
- Update gitlint_emoji.py

## [4.0.0-beta.11] - 2022-11-08

### Added

- Migrate app classroom from LTI to lib-classroom package
- Create lib-classroom package
- Add SharedLiveMedia widget to public and teacher VOD Dashboard
- Add new elements to the public VOD Dashboard :
  - Transcript reader
  - Video download
- standalone website:
  - playlists page
  - create playlist form
- install and configure drf-spectacular to serve a swagger ui
- Management command clean_aws_elemental_stack

### Changed

- Allow site users to manage classroom documents, deposited files,
  and markdown images through API.
- Site url serve the build generated by CRA
- Enrich playlist serializer with organization and consumer site infos
- Refactor check_live_state management command to use the live started_at
  timestamp to filter logs instead of using video creation date.

### Fixed

- Fix permission for classroom creation
- Fix permission for filedepository creation
- Fix permission for markdown document creation

## [4.0.0-beta.10] - 2022-10-19

### Changed

- Administrators and teachers can now have access to
  a "not ready" resource which belongs to a playlist
  with portability.

### Fixed

- Downgrade channels-redis to version <4

## [4.0.0-beta.9] - 2022-10-18

### Added

- Standalone website:
  - Add router to the layout
  - Add menu interaction
  - Integrate internationalisation library (react-intl)
  - ESLint Fragment mandatory rule
  - ESlint better import order rule
- Integrate design Homepage in the standalone website:
  - Menu
  - Header
  - Homepage
- Catch and design error with react-error-boundary
- Enable visibility widget in VOD dashboard
- Introduce initialized upload state
- Add BBB presentation upload
- Authenticate the user in the standalone site
- Allow to target a specific resource in LTI Select

### Changed

- Move the lti data queries to the lib_components package
- Call api update-state with an error when the
  timed text track format is not supported by
  @openfun/subsrt
- Rename front application bbb in classroom
- Rename lti/filedepositories in lti/deposits

### Fixed

- Fix deposit app translations
- Fix video dashboard translations
- Fix deposit app UI
- Use video title in creation wizard if it exists
- Skip screen choice between live and vod when coming back from
  LTI select
- Fix subtitles upload
- Fix debounce time too low in the classroom creation form
- Fix icons urls in LTI xml configuration

## [4.0.0-beta.8] - 2022-09-15

### Added

- Display total amount of participants for a webinar
- Add missing ended webinar screens
  and scheduled is in the past
- Allow to disable chrome sandboxing in puppeteer.
  To disable it set DISABLE_PUPPETEER_SANDBOX=1
- Add endpoint to list attendances for a video
- Add a custom render method for our tests, it is based on
  react-testing-library and wrap the test component in most of
  the common application contexts (grommet, intl, react-router,
  react-query, react-hot-toast, breadcrumb, styled-components)
- Add a link to generate an ics file on the scheduled page
- Manage tags on video resource
- Manage license on video resource
- Add a new instructor dashboard VOD composed with widgets:
  - Widget for modifying video's title & description.
  - Widget for uploading a new video
  - Widget for uploading a new thumbnail
  - Widget for downloading the video in the desired
    quality
  - Widgets to upload timed text tracks
- Add toggle to use subtitle as transcript
- Add toggle to allow download or not on the VOD dashboard.
- Notify students when a recording is started
- Avoid record length lower than a video segment length
- Add a video creation wizard to help instructor through
  VOD & Live creation processus
- Use the new dashboard VOD instead of the old one
- Add image upload for Markdown documents
- Add a file depository app

### Changed

- Rename meetings to classrooms (no database change yet)
- Remove chat & viewers buttons from control bar and add a notification for
  managing on-stage request
- Rework lti app configuration, replaced global variable by stores
- Collect frontend applications components under a directory
- Update AWS lambda nodejs image to version 16

### Fixed

- Missing migration to migrate key format of live_attendance
  field of liveSession
- Redirect to VOD dashboard when the live_state is ENDED and the
  upload_state is pending
- Upgrade cairo version in lambda-convert to generate better SVG

## [4.0.0-beta.7] - 2022-06-27

### Added

- Allow instructor to share a video and use breakout rooms
- Add resizing feature to the picture in picture mode

### Changed

- stopped_at is deleted and started_at is reinitialized when the
  live is restarted
- Display number of anonymous instead of their pseudos
- Rename markdown route in markdown-documents

### Fixed

- Missing migration to migrate video upload_state and live_state data

## [4.0.0-beta.6] - 2022-06-20

### Added

- Add a widget for the instructor to upload thumbnail
- Add video stats from configurable grafana backend
- Add shared media support for the teacher
- Manage live media sharing with picture-in-picture on student side
- Add a webinar tab to the LTI select view

### Fixed

- A thumbnail resource can be deleted and recreated.

## [4.0.0-beta.5] - 2022-06-07

### Added

- Push attendance when a student is on stage
- Add Legacy LTI configuration XML
- Add an instructor widget to modify join the discussion mode
- Prevent join API calls in join mode denied
- Add a forced join mode which automatically joins students to the discussion
- Add user login through Renater "Éducation-Recherche" federation (SAML v2)

### Changed

- Use custom policy to generate cloudfront signed url
- Upgrade front and mail apps to node version 16, the current LTS
- On LTI select request, only send title and description for existing resources
- Adding a new resource through LTI select (deeplinking) now creates it
  with data from Moodle activity titles and description.
- Fetch video data after websocket reconnection
- Use Roboto-Regular by default in our UI

### Fixed

- Do not execute start streaming in jitsi for non moderator
- Prevent scroll when hovering a select on an iframe

### Removed

- Remove storybook

## [4.0.0-beta.4] - 2022-05-17

### Added

- Add a control pane destined to contain widgets for the instructor to
  control the live
- Add a widget to modify live title and allow / disallow live recording
- Add a widget to schedule live and modify description
- Add a widget to hide / unhide the chat, for the instructor and for its
  students
- Add Markdown document edition (new feature)
- Add a widget to make live publicly available and get the shareable url
- New field deleted_by_cascade on all model inheriting from SafeDeleteModel
  Field added in django-safedelete version 1.2.0
- CLOUDFRONT_SIGNED_PUBLIC_KEY_ID settings is added. It contains the
  public key id created on AWS cloudfront public keys
- Push attendances for students watching a live
- Add a login page to authenticate Marsha users
- Allow live restarting after harvesting
- Add a widget to upload and manage shared supports

### Changed

- Move appairing device component in the widget dashboard
- Use cloudfront key groups to sign urls instead of using root AWS ssh key

### Removed

- CLOUDFRONT_ACCESS_KEY_ID settings is removed

## [4.0.0-beta.3] - 2022-04-22

### Added

- Add BBB meeting scheduling
- Save current language of a livesession
- Send emails in current livesession's language
- Load livesession's language in the JWT token for direct access
  from email

### Fixed

- patch video to publish it once harvested
- mjml files format not to break `trans` instructions
- configure path for translated files in the backend

### Removed

- Presence activity in the chat

## [4.0.0-beta.2] - 2022-04-13

### Added

- Add a view to cancel reminder mails, link added in the footer of mails
- Prevent multiple join to BBB meetings
- Introduce anonymous_id mechanism
- Create a direct access to a video out of an LMS context for a public
  or LTI ressource, based on a liveregistration
- Auto-set in the localstorage anonymousId if it's set in the JWT token
- Persist live video participants
- Add a vertical slider on the live view, to resize the panel on the
  right (and close / open it)
- Add PATCH endpoint to update a LiveSession
- Add start and stop live recording
- Generate a JWT token to connect to jitsi
- Save livesession registration date

### Changed

- rename LiveRegistration model in LiveSession
- Disable jitsi prejoin page
- Admin can access all LiveSession belonging to a video
- Move on-stage request functional (in Instructor view) from under
  the video to the ViewersList in the right panel
- Prevent students from joining the discussion anonymously

### Fixed

- Allow to configure converse persistent store
- Show a specific message to students when BBB meeting ended
- Remove cancel button in student meeting join form
- Replace automatic meeting joining by a button
- Allow generated links in Django admin for objects in other applications
- Do not install the `marsha` Python package in `site-packages`
- Do not allow a lti user to change his email when he registers to a scheduled
  live
- Expose XMPP info for a live once this one started
- Continue stopping live even if input waiter fails
- Dispatch video in the websocket when start/stop recording
- Send registration email when livesession is updated and is_registered
  set to True
- Stop trying to start recording jitsi when this one is already live
- Live layout for teacher on smartphone
- Live recording actions visibility

### Removed

- Remove email when the webinar started earlier
- Remove video constraint video_unique_idx

## [4.0.0-beta.1] - 2022-02-15

### Added

- Add model and API endpoints to manage a shared live media
- Add component to display chat, viewers and apps during a live in a panel
- Add `consumer_site` in JWT token
- Allow CORS headers configuration
- Extract SVG pages from PDF files for shared live media in lambda-convert
- Add fields `is_registered`,`live_attendance`,`username` for liveRegistration
- Add DRF endpoint to start attendance monitoring using liveRegistration model
- Add a new chat, using react components and design complying with the mockup
- Add anonymous_id and display_name in LiveRegistration model
- Add new endpoint to set display_name
- Add API endpoints to start, navigate and end a live media sharing
- Add fields `allow_recording`, `estimated_duration`, `has_chat` and
  `has_live_media` for Video model and API
- Manage websocket using django channels
- New video consumer able to send serialized video to all clients connected
  to the websocket when a video is updated through the API
- Add email settings and configure `mailcatcher` in docker-compose stack
- Transform `mjml` files (email's template files) to html and plaintext
- Add a participants tab, listing all users connected to the chat
- Add an authentificatin pop-up in the chat
- Add a default config file for the chat
- Add 'joined' and 'left' labels in the chat for users arrivals and departures
- Send updated video to clients connected to the websocket for all
  events related to the live workflow (start, pause, end, shared live medias)
- Send email when registering for a scheduled webinar
- Management command sending reminders for scheduled webinars
- Implement a way to address prosody controls on the nickname entered in the
  chat
- settings DEFAULT_LTI_LAUNCH_PRESENTATION_LOCALE as fallback value when
  launch_presentation_locale missing in the LTI request
- allow to configure CSRF_TRUSTED_ORIGINS django setting
- send email when the date of a scheduled video is changed

### Changed

- docker image use python 3.10
- Rename lambda-encode to lambda-convert
- Registrations of a scheduled video from LTI are now based on
  `lti_user_id`, `consumer_site`, and `context_id`
- Converse.js UI is not used anymore, react components are used instead
- Add anonymous_id parameter to register a user to a scheduled webinar
- Update live layout for students
- Use websocket to update video resource instead of polling the API
- Improvement of emails templates for scheduled webinars
- Use websocket in the VOD dashboard and stop polling resources
- Display chat and viewers list in the tabs panel
- Upgrade to Django 4
- Integrate live advertisement in live layout
- Disable jitsi deeplinking
- Update live layout for teacher
- Update live registration form for students

### Removed

- Remove user id in prosody JWT token

## [3.27.0] - 2021-12-07

### Added

- Prepare backend to manage apps
- Prepare frontend to manage apps
- Add BBB backend app
- Add BBB frontend app
- Add configuration to filter app with feature flags
- Start and stop a live
- Add a form to create a scheduled video on the Dashboard
- Add frontend components to register an email for scheduled webinars
- Add API endpoints to pair an external device to Jitsi live videos
- Add a store in the frontend to control live layout
- Add frontend components to pair an external device to Jitsi live videos
- Add public availability to video api

### Changed

- Postpone AWS creation stack to the first live start action
- Scheduled videos have a live_state set to IDLE
- Allow access to videos with a scheduled date past

### Fixed

- Users with empty email in their token can register to scheduled webinars
- Users with wrong email in token is properly detected as registered
- Users waiting on the registration page are redirected if video is started
  earlier
- Update store in the WaitingLiveVideo component
- Set specific timeout to 30 seconds in pollForLive to update the store
- Fix registration to scheduled events

### Removed

- check_live_idle management command
- Remove validate_date_is_future validator on Video model

## [3.26.0] - 2021-10-22

### Added

- Add video and document downloading xAPI events
- Video model add a `starting_at` field and the notion is_scheduled
- Add email in JWT token
- Add liveRegistration model to save registrations to scheduled events
- Add DRF read and create liveRegistration endpoints
- Allow DRF list action for liveRegistration endpoint
- Use existing username in jitsi if defined

### Changed

- Redirect participant to the player once jitsi conference left
- Redirect instructor to the waiting jitsi page once conference left
- Only a webinar using jitsi can be created
- Hide timed text pane when video is not a VOD
- On app load instructor is redirected to the dashboard when the video
  is a live

### Fixed

- Implement useTranscriptTimeSelector with videojs

### Removed

- IE11 is no longer supported
- JITSI_ENABLED feature flag

## [3.25.0] - 2021-09-29

### Added

- Enable smacks in converse conf when websocket is used
  https://modules.prosody.im/mod_smacks

### Changed

- Request initial MUC config before modifying it

### Fixed

- Trigger XAPI initialized action before a first play
  for a live video
- Listen video play event instead of playing to send the XAPI played event

## [3.24.1] - 2021-09-14

### Fixed

- Add missing translations
- Erase `context_id` key from the token generated in a public context

## [3.24.0] - 2021-09-13

### Added

- Playlist portability management through LTI (resource sharing between courses)
- Command to clean all development environments having a living stack on AWS
  medialive and mediapackage
- Allow a participant to join a Jitsi conference

### Changed

- Merge overlapping played segments for xAPI events

## [3.23.0] - 2021-08-23

### Added

- Add user group to admin site

### Changed

- Do not create an harvest job if no manifest is created

### Fixed

- Add aws permission to list mediapackage harvest jobs
  (fixes unusable 3.22.0 version)

## [3.22.0] - 2021-08-19

### Added

- Add a confirmation before starting or stopping a live
- Use a tabbed navigation on LTI resource views
- Only jitsi moderators can start a live
- Management command deleting orphan mediapackage channel

## [3.21.0] - 2021-07-05

### Added

- Add a beta label on live configuration buttons

### Removed

- VIDEO_LIVE Waffle switch

## [3.20.1] - 2021-06-23

### Fixed

- Redirect instructor to the dashboard when live is stopped

## [3.20.0] - 2021-06-18

### Added

- Display chat in dashboard during a jitsi live
- Use chat when a live is publicly available
- Set chat nickname when user is connected
- Display a waiting message while live is not available
- Add Playrwright testing (with basic cloud storage mocking)
- Update circleci config to version 2.1
- Add a parametrized cicrcleci job to run e2e tests on 3 browsers
  (chromium, firefox and webkit)
- Move DevelopmentLTIView to a new development directory
- Add a variable to set frontend video polling interval
- Add a component responsible to manage public video dashboard
- Add a waiting workflow while a live is not ready
- Allow to play a youtube video in jitsi

### Changed

- Switch from classic to jitsi live when a classic is created
- Use conversejs concord theme

### Fixed

- Prevent to display a deleted video
- Disable video speed menu for live video
- Manage jitsi recording interruption

### Removed

- Remove plyr player

## [3.19.0] - 2021-05-10

### Added

- Jitsi streamed in marsha live

### Fixed

- Fetch fresh resource data after initiate-upload endpoint called
- Reset upload manager state before starting a new upload

## [3.18.0] - 2021-05-10

### Added

- Chat feature implementing XMPP protocol
- Add a prosody server in docker-compose stack
- Add a LTI select view to allow LTI consumers to add a LTI content through
  Deep Linking
- Display chat box without video player
- Add a tests.utils module to share LTI request signature and refactor related
  tests
- Install storybook
- Add a button to easily copy RTMP infos

### Changed

- The `lti_id` field is optional on Videos and Documents.
- Open Video related API endpoints to playlist and org admins.
- Clean built frontend files before each build
- Variabilize live conf related to latency
- Upgrade node to version 14, the current LTS

### Fixed

- Frontend video type now allows Nullable urls.
- Fix js public path on LTI select view.
- Replace LTI verification in lti/respond view by JWT verification
- Fix URLs schemes returned by LTI select view

## [3.17.1] - 2021-03-26

### Added

- Add a series of components to power breadcrumbs.
- Add a frontend component to use SVG icons in Marsha.
- Add ngrok to serve marsha on a public domain and automate CloudFront
  configuration via terraform when needed

### Fixed

- Avoid blank page when feature flags are not set.

### Changed

- Use a new `<UploadManager />` for uploads to prepare a common tool
  between the LTI app and the Marsha site.

## [3.17.0] - 2021-03-04

### Added

- Create a new lambda (lamba-mediapackage) called when an harvest job is done
- Create a harvest job when a live is ended
- Component to switch a live to VOD
- Switch to enable sentry in front application
- Management command checking live stuck in IDLE
- Add new live state CREATING
- Open retrieve endpoints for organizations & playlists

### Changed

- Medialive profiles use 24FPS instead of 30
- Increase Medialive profiles segment to 4 seconds
- Increase Mediapackage endpoint segment to 4 seconds
- Rollback Medialive control rate mode to CBR
- Static files are managed using whitenoise

### Fixed

- Display higher resolution thumbnail available

## [3.16.1] - 2021-02-23

### Fixed

- Disable native audio and video tracks in Videojs conf
- Remove HLS source in <VideoPlayer />

## [3.16.0] - 2021-02-17

### Added

- Create a videojs plugin to manage MP4 selection
- Create a CRUD video management site for Marsha, only open
  in development until release.

### Changed

- Enable videojs useDevicePixelRatio VHS option
- Update the frontend <Loader /> with a <Spinner /> sidekick and
  make some accessibility improvements.

## [3.15.0] - 2021-02-04

### Changed

- Switch to QVBR rate control mode in live profiles

### Fixed

- Handle Django ValidationError as an accepted exception

### Removed

- Dash endpoint in mediapackage channel
- Useless medialive profiles
- All dash usage

## [3.14.0] - 2020-12-22

### Added

- Publicly access video or document, bypassing LTI check

### Fixed

- revert removal of mediaconvert presets configuration
- use absolute path to register presets in lambda-configure function

## [3.13.1] - 2020-12-15

### Fixed

- Enable videojs override native feature except on safari

## [3.13.0] - 2020-12-02

### Added

- Choose video player with the setting VIDEO_PLAYER
- New player videojs as an alternative to plyr
- Add a fleature flag to control video live streams activation

### Changed

- Dockerize lambda functions

## [3.12.1] - 2020-11-25

### Fixed

- Allow to serialize a timed text track without extension

## [3.12.0] - 2020-11-24

### Added

- Manage live streaming using AWS Elemental
- Download timed text track in video dashboard
- Create shared resources between terraform workspaces

### Changed

- use input to execute lambda_migrate intead of env var
- copy document from s3 source to s3 destination in lambda copying document

### Fixed

- manage ready clauses in LTI resource finder
- Change preset container by CMFC

## [3.11.0] - 2020-10-08

### Changed

- Rework front i18n workflow
- docker image use python 3.9

### Removed

- Remove usage of react-intl-po

### Fixed

- Fix admin video search
- Rework sentry configuration to have environment and version info

## [3.10.2] - 2020-09-29

### Fixed

- Remove usage of scrollIntoView to synchronize active transcript sentence

## [3.10.1] - 2020-08-27

### Changed

- Use formatjs/cli to manage message extraction and don't
  rely anymore on babel react-intl plugin.

### Fixed

- Manage case where info are missing in mediainfo result

## [3.10.0] - 2020-08-18

### Added

- Synchronize scroll with active transcript sentence
- Sideload Playlist in Video and Document resources

### Fixed

- Use `UploadableFileMixin` on `AbstractImage` model
- Fix dashboard read versus update permissions in situations
  of playlist portability

## [3.9.1] - 2020-06-24

### Fixed

- Fallback on default audio bitrate when absent in mediainfo

## [3.9.0] - 2020-06-08

### Added

- Detect original video framerate and use it in lambda encode
- Limit video encoding resolution to that of the source

## [3.8.1] - 2020-05-18

### Fixed

- Move video title in object.definition property in xapi statement

## [3.8.0] - 2020-05-18

### Added

- Video title in xapi statement

### Changed

- Replace `random` with `secrets` to generate random strings

### Fixed

- Remove `assert` statements and prepare codebase for activation of `bandit`
  linter

## [3.7.1] - 2020-05-11

### Fixed

- Referer can match ALLOWED_HOSTS as a valid passport domain name

## [3.7.0] - 2020-05-05

### Added

- Use subtitles as transcript when no transcript has been uploaded
- Register xapi statements in a logger

## [3.6.0] - 2020-04-15

### Added

- Allow defining playlist portability to a precise list of other playlists

## [3.5.1] - 2020-03-30

### Fixed

- update @openfun/subsrt to 1.0.4 to get a bug fix.

## [3.5.0] - 2020-03-16

### Added

- Allow to change video quality while using ABR

## [3.4.0] - 2020-02-06

### Changed

- Upgrade to Django 3
- Upgrade to python 3.8
- Set SECURE_REFERRER_POLICY setting to same-origin

### Fixed

- Force thumbnail to be displayed while the video is not played

## [3.3.0] - 2019-12-17

### Added

- New setting MAINTENANCE_MODE to disable the dashboard when Marsha is
  in maintenance

### Changed

- Upgrade django-storages to 1.8 and remove the workaround introduced in
  marsha 2.8.1 to ensure compatibility with ManifestStaticFilesStorage.

### Security

- Regenerate frontend yarn lockfile to get new version of vulnerable package
  `serialize-javascript`.

## [3.2.1] - 2019-11-28

### Fixed

- Videos uploaded in other formats than 16/9 were distorted to fit that
  ratio. We now do our best to respect their format during encoding and
  also in the player.

## [3.2.0] - 2019-11-22

### Added

- Load third party js script using EXTERNAL_JAVASCRIPT_SCRIPTS setting

## [3.1.7] - 2019-11-05

### Fixed

- Start ABR at a lower level corresponding to 480p
- Let the user choose video quality when ABR is disabled
- Initialize xapi module only when all video data are available

## [3.1.6] - 2019-10-24

### Fixed

- move defaults settings to settings file

## [3.1.5] - 2019-10-22

### Fixed

- Firefox does not interpret html entities in subtitles. Only transcripts
  are encoded.

## [3.1.4] - 2019-10-16

### Fixed

- Fetch a resource based on the uploaded_on field and not on its upload_state

## [3.1.3] - 2019-10-14

### Changed

- Host plyr's icons SVG on Marsha's infrastructure.

### Fixed

- Correctly load Intl polyfill
- XAPI timestamp is set in the backend.

## [3.1.2] - 2019-10-09

### Added

- Polyfill Intl API for browsers not supporting this API.

### Fixed

- Fix video event tracking in Internet Explorer 11.

## [3.1.1] - 2019-10-08

### Fixed

- Fix errors in lambda-migrate function. The timed text tracks migrations can
  lead to an infinite loop.
- Authorize LTI requests that have an empty HTTP referer.

## [3.1.0] - 2019-10-07

### Added

- Support critical features (video & document playback) in IE 11.
- Introduce a new setting AWS_BASE_NAME to prefix all AWS settings in the
  project.
- Use sentry to track errors in the front application.
- New lambda responsible to migrate migrations on AWS.

### Changed

- Using HTML entities in timed text tracks is allowed. Every tag used
  will be escaped and rendered in the web page without being executed.
- Use node 10 engine to run AWS lambdas.

## [3.0.0] - 2019-09-24

### Added

- Add document management
- Cache database queries and serialization in LTI views for students

### Changed

- Move all permission flags to a "permissions" object in the JWT token
- Refactor the LTI view to be generic for all the resources we want to manage
- Video model is a special File model
- pluralize thumbnail url
- Simplify template to frontend communication by using JSON instead of
  multiple data-attributes
- Rename all is*ready_to*\* model properties to is_ready_to_show
- Change filename pattern when a user downloads a resource.
  For video: {playlist title}_{uploaded timestamp}.mp4
  For document: {playlist_title}_{document_title}.{document_extension}
- Change gunicorn configuration to increase number of threads, worker class
  and worker tmpdir
- Upgrade @openfun/subsrt in lambda-encode. Patched version parses most of srt
  files (a critical feature for us)
- Upgrade crowdin image used in circle-ci to version 2.0.31 including tar
  command
- Upgrade to python 3.7
- Refactor resource models to share code

### Removed

- Redundant setting `STATICFILES_AWS_ENABLED`
- Everything related to the OpenEDX LTI view. This a BC break
- Deprecated settings. This is a BC break

### Security

- Update the mixin-deep and set-value packages to safe versions.

## [2.10.2] - 2019-09-11

### Fixed

- Change gunicorn configuration to increase number of threads, worker class
  and worker tmpdir
- Upgrade @openfun/subsrt in lambda-encode. Patched version parses most of srt
  files (a critical feature for us)

## [2.10.1] - 2019-08-13

### Fixed

- Fix first thumbnail creation.
- create a property `RESOURCE_NAME` on models having a url to make it DRY

## [2.10.0] - 2019-08-12

### Added

- Add the `show_download` flag to the video admin view.
- Translate plyr interface.
- Seek the video to the time corresponding to a transcript sentence
  when a user click on it.

### Changed

- Hide dashboard button in instructor view when a video is in read only.
- Reactivate HLS support.
- Only one play button in the plyr is active for a screen reader.
- Remove usage of react-redux
- Change seek time to 5 seconds in plyr configuration.

### Fixed

- Fix an issue that prevented replacement videos from being shown as "ready"
  in the dashboard.
- Add time in interacted xapi payload.
- Pin Terraform to version 0.11.14.
- Change arial-label on play button when its state changes.

### Security

- Update `handlebars` and `lodash` packages to safe versions.

## [2.9.0] - 2019-06-11

### Added

- Compute a completion threshold when xapi is initialized.
- Detect when a user leaves the page to send terminated statement.
- Avoid losing an upload by asking to the user if he really
  wants to leave the page.

## [2.8.4] - 2019-06-06

### Fixed

- xapi: be sure to send completed event when progress has reached 100%

### Security

- front: add a resolution for js-yaml package to avoid using a version
  with a security risk
- aws: add a resolution for handlebars package to avoid using a version
  with a security risk

## [2.8.3] - 2019-06-05

### Changed

- Use secure cookie only in production.
- Refactor the `getResourceList` saga into a simple side-effect.

### Fixed

- xapi: played segments list should not contain skipped segments (seek event)
- xapi: completed event is sent when the progression reaches 100%

## [2.8.2] - 2019-05-21

### Changed

- Configure django core settings to pass all heartbeat checks

## [2.8.1] - 2019-05-17

### Fixed

- Allow to use newer version of django-storages
- Force to display captions on firefox.

## [2.8.0] - 2019-05-15

### Added

- Automate python dependencies upgrade with pyup.
- Create command bin/pytest.

### Changed

- Use pytest to run backend tests.
- Rename lambda-update-state lambda to lambda-complete.
- Keep only one docker-compose file.
- Move gitlint directory into lib directory.
- Upgrade to django 2.2
- Remove docker alpine images
- Standardize the project's `Makefile` to make it more easily maintainable by
  our peers
- Copy pylint config from Richie project.

## [2.7.1] - 2019-04-29

### Fixed

- Correctly load static js chunks from cloud-front CDN

## [2.7.0] - 2019-04-24

### Added

- LRS credentials can be configured at the consumer site level.
- Configure in the consumer site admin panel if by default videos can show
  a download link.
- Do not allow video modification when the consumer site used is not the one
  used to create the video.

### Changed

- Translations are loaded dynamically in frontend application.
- Locale mapping is now made in the backend application.

## [2.6.0] - 2019-04-01

### Added

- Upload a custom video thumbnail
- use S3 to store and Cloudfront to distribute static files

### Fixed

- Replace the `CLOUDFRONT_URL` setting by a `CLOUDFRONT_DOMAIN` setting to
  uniformize with what django-storages is doing and share the same settings.
- Downgrade django-storages to 1.6.3, the last version compatible with
  ManifestStaticFilesStorage

## [2.5.0] - 2019-03-25

### Added

- Manage translations with Crowdin and build them in the CI.

### Fixed

- Remove HLS video support for iOS platforms.

## [2.4.0] - 2019-03-14

### Added

- Ease video download for user. It is possible to click on a link to download
  a video.

### Fixed

- Video on iphone were broken, dashjs is not used anymore on this device.

## [2.3.1] - 2019-03-06

### Security

- Upgrade `merge` to version 1.2.1 in AWS lambda.

## [2.3.0] - 2019-02-22

### Added

- Replace shaka-player by dashjs.
- Play timed text tracks in player.
- Enable timed text tracks in dashboard.
- Display transcripts alongside the video.

### Changed

- Real languages display in the player (captions section).
- Language choices are fetch once and then cached in the redux store.

## [2.2.1] - 2019-02-06

### Added

- Enable redux devtools

### Fixed

- Run `webpack` in production mode for builds that will be deployed; shaves
  75+% on the bundle size

## [2.2.0] - 2019-02-05

### Added

- Improve admin views (show/search ID, configure site portability,
  performance,...)
- Log a warning on LTI exceptions for easier diagnostic
- Introduce Saga and use it to get timed text tracks

### Fixed

- Fix logging and make it configurable by environment variables

## [2.1.0] - 2019-01-30

### Added

- Manage xAPI statements in backend application.
- Listen to plyr player events and send xAPI statements to the backend
  application.
- Installation of Grommet in the front application. Will be used to theme our
  application.
- Display upload progress when a resource is uploaded.
- Configure application healthcheck.
- Show a thumbnail of the video on the Dashboard when it is ready to play.

### Fixed

- Remove the `styledComponentWithProps` we used to type styled components
  thanks to a newer version of the library
- Rework `Jest` config to use babel
- Replace our button with Grommet's.

## [2.0.1] - 2019-01-22

### Fixed

- Fix database migration that was removing the `resource_id` field a bit too
  fast and replace
  it by just a data migration ensuring backward compatibility
- Hide the timed text track pane from the dashboard

## [2.0.0] - 2019-01-21

### Added

- Refactor LTI to include video UUID in the launch url. The new endpoint
  is of the form /lti/videos/<uuid>
- Write an actual README.md file
- Add renovate.json to follow frontend dependencies
- Add a link to the dashboard on the instructor view
- Add a TimedText pane to let users manage tracks in Dashboard
- Allow resource deletion in the `resourceById` reducer

### Fixed

- Rework the video dashboard to make it more compact
- Fix and improve Typescript types

## [1.2.1] - 2019-01-16

### Fixed

- Fix initiate upload to update only the targeted object and not the whole
  database table

## [1.2.0] - 2019-01-15

### Added

- Add automatic portability between consumer sites for friend websites or
  different environments of the same website
- Enforce either the `consumer site` or the `playlist` field is set on a LTI
  passport, and not both
- Improve admin pages for the playlist and video models
- Add unicity constraints on the playlist and video models
- Improve string representation for the a playlist model

### Fixed

- Improve test to secure portability of a video to the same playlist on another
  site, making sure it has precedence over a video linked to another playlist
  on the other site
- Isolate route definitions to avoid circular dependencies in the frontend
- Add unicity test timed text tracks to confirm soft deleted records are ignored
- Copy related tracks correctly when duplicating a video
- Replace the `upload-policy` API endpoint by `initiate-upload` that reset the
  upload
  state and returns the AWS S3 upload policy in a single POST query
- Add field `is_ready_to_play` to compensate removing field `state`
- Rename `state` field to `upload_state` as it does not represent the state of
  the object anymore but the state of the latest upload attempted on this
  object
- Enforce read-only on `upload_state` and `active_stamp` fields as they should
  only be updated by AWS via the `update-state` API endpoint

## [1.1.2] - 2019-01-11

### Fixed

- Fix logging in the lambda-encode after submitting job to MediaConvert
- Fix duplicating videos for playlist/site portability (`resource_id` field
  was not set from the origin video as it should)

## [1.1.1] - 2019-01-10

### Added

- Allow video token holders to delete related timedtexttracks

### Fixed

- Remove usage of lis_person_contact_email_primary in the LTI request
- Make user_id optional in JWT

## [1.1.0] - 2019-01-08

### Added

- Prepare the app to handle timedtexttracks (full functionality yet to come)
- Add an API schema view
- Extend timed text track language choices to all Django languages
- Create a JWT token for every roles not just instructors (needed to add
  context to xAPI requests)
- Allow timed text track list GET requests on the API (permissions are fixed
  in a separate commit)
- Switch to redux for frontend state management
- Add a link to the dashboard from the video form
- Split Dashboard video matters into a separate component
- Run yarn install in docker node to use node 8

### Fixed

- Minor fixes and improvements on features and tests

[unreleased]: https://github.com/openfun/marsha/compare/v5.8.0...master
[5.8.0]: https://github.com/openfun/marsha/compare/v5.7.0...v5.8.0
[5.7.0]: https://github.com/openfun/marsha/compare/v5.6.0...v5.7.0
[5.6.0]: https://github.com/openfun/marsha/compare/v5.5.3...v5.6.0
[5.5.3]: https://github.com/openfun/marsha/compare/v5.5.2...v5.5.3
[5.5.2]: https://github.com/openfun/marsha/compare/v5.5.1...v5.5.2
[5.5.1]: https://github.com/openfun/marsha/compare/v5.5.0...v5.5.1
[5.5.0]: https://github.com/openfun/marsha/compare/v5.4.0...v5.5.0
[5.4.0]: https://github.com/openfun/marsha/compare/v5.3.1...v5.4.0
[5.3.1]: https://github.com/openfun/marsha/compare/v5.3.0...v5.3.1
[5.3.0]: https://github.com/openfun/marsha/compare/v5.2.0...v5.3.0
[5.2.0]: https://github.com/openfun/marsha/compare/v5.1.0...v5.2.0
[5.1.0]: https://github.com/openfun/marsha/compare/v5.0.3...v5.1.0
[5.0.3]: https://github.com/openfun/marsha/compare/v5.0.2...v5.0.3
[5.0.2]: https://github.com/openfun/marsha/compare/v5.0.1...v5.0.2
[5.0.1]: https://github.com/openfun/marsha/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/openfun/marsha/compare/v4.9.0...v5.0.0
[4.9.0]: https://github.com/openfun/marsha/compare/v4.8.1...v4.9.0
[4.8.1]: https://github.com/openfun/marsha/compare/v4.8.0...v4.8.1
[4.8.0]: https://github.com/openfun/marsha/compare/v4.7.0...v4.8.0
[4.7.0]: https://github.com/openfun/marsha/compare/v4.6.0...v4.7.0
[4.6.0]: https://github.com/openfun/marsha/compare/v4.5.0...v4.6.0
[4.5.0]: https://github.com/openfun/marsha/compare/v4.4.0...v4.5.0
[4.4.0]: https://github.com/openfun/marsha/compare/v4.3.1...v4.4.0
[4.3.1]: https://github.com/openfun/marsha/compare/v4.3.0...v4.3.1
[4.3.0]: https://github.com/openfun/marsha/compare/v4.2.1...v4.3.0
[4.2.1]: https://github.com/openfun/marsha/compare/v4.2.0...v4.2.1
[4.2.0]: https://github.com/openfun/marsha/compare/v4.1.0...v4.2.0
[4.1.0]: https://github.com/openfun/marsha/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/openfun/marsha/compare/v4.0.0-beta.20...v4.0.0
[4.0.0-beta.20]: https://github.com/openfun/marsha/compare/v4.0.0-beta.19...v4.0.0-beta.20
[4.0.0-beta.19]: https://github.com/openfun/marsha/compare/v4.0.0-beta.18...v4.0.0-beta.19
[4.0.0-beta.18]: https://github.com/openfun/marsha/compare/v4.0.0-beta.17...v4.0.0-beta.18
[4.0.0-beta.17]: https://github.com/openfun/marsha/compare/v4.0.0-beta.16...v4.0.0-beta.17
[4.0.0-beta.16]: https://github.com/openfun/marsha/compare/v4.0.0-beta.15...v4.0.0-beta.16
[4.0.0-beta.15]: https://github.com/openfun/marsha/compare/v4.0.0-beta.14...v4.0.0-beta.15
[4.0.0-beta.14]: https://github.com/openfun/marsha/compare/v4.0.0-beta.13...v4.0.0-beta.14
[4.0.0-beta.13]: https://github.com/openfun/marsha/compare/v4.0.0-beta.12...v4.0.0-beta.13
[4.0.0-beta.12]: https://github.com/openfun/marsha/compare/v4.0.0-beta.11...v4.0.0-beta.12
[4.0.0-beta.11]: https://github.com/openfun/marsha/compare/v4.0.0-beta.10...v4.0.0-beta.11
[4.0.0-beta.10]: https://github.com/openfun/marsha/compare/v4.0.0-beta.9...v4.0.0-beta.10
[4.0.0-beta.9]: https://github.com/openfun/marsha/compare/v4.0.0-beta.8...v4.0.0-beta.9
[4.0.0-beta.8]: https://github.com/openfun/marsha/compare/v4.0.0-beta.7...v4.0.0-beta.8
[4.0.0-beta.7]: https://github.com/openfun/marsha/compare/v4.0.0-beta.6...v4.0.0-beta.7
[4.0.0-beta.6]: https://github.com/openfun/marsha/compare/v4.0.0-beta.5...v4.0.0-beta.6
[4.0.0-beta.5]: https://github.com/openfun/marsha/compare/v4.0.0-beta.4...v4.0.0-beta.5
[4.0.0-beta.4]: https://github.com/openfun/marsha/compare/v4.0.0-beta.3...v4.0.0-beta.4
[4.0.0-beta.3]: https://github.com/openfun/marsha/compare/v4.0.0-beta.2...v4.0.0-beta.3
[4.0.0-beta.2]: https://github.com/openfun/marsha/compare/v4.0.0-beta.1...v4.0.0-beta.2
[4.0.0-beta.1]: https://github.com/openfun/marsha/compare/v3.27.0...v4.0.0-beta.1
[3.27.0]: https://github.com/openfun/marsha/compare/v3.26.0...v3.27.0
[3.26.0]: https://github.com/openfun/marsha/compare/v3.25.0...v3.26.0
[3.25.0]: https://github.com/openfun/marsha/compare/v3.24.1...v3.25.0
[3.24.1]: https://github.com/openfun/marsha/compare/v3.24.0...v3.24.1
[3.24.0]: https://github.com/openfun/marsha/compare/v3.23.0...v3.24.0
[3.23.0]: https://github.com/openfun/marsha/compare/v3.22.0...v3.23.0
[3.22.0]: https://github.com/openfun/marsha/compare/v3.21.0...v3.22.0
[3.21.0]: https://github.com/openfun/marsha/compare/v3.20.1...v3.21.0
[3.20.1]: https://github.com/openfun/marsha/compare/v3.20.0...v3.20.1
[3.20.0]: https://github.com/openfun/marsha/compare/v3.19.0...v3.20.0
[3.19.0]: https://github.com/openfun/marsha/compare/v3.18.0...v3.19.0
[3.18.0]: https://github.com/openfun/marsha/compare/v3.17.1...v3.18.0
[3.17.1]: https://github.com/openfun/marsha/compare/v3.17.0...v3.17.1
[3.17.0]: https://github.com/openfun/marsha/compare/v3.16.1...v3.17.0
[3.16.1]: https://github.com/openfun/marsha/compare/v3.16.0...v3.16.1
[3.16.0]: https://github.com/openfun/marsha/compare/v3.15.0...v3.16.0
[3.15.0]: https://github.com/openfun/marsha/compare/v3.14.0...v3.15.0
[3.14.0]: https://github.com/openfun/marsha/compare/v3.13.1...v3.14.0
[3.13.1]: https://github.com/openfun/marsha/compare/v3.13.0...v3.13.1
[3.13.0]: https://github.com/openfun/marsha/compare/v3.12.1...v3.13.0
[3.12.1]: https://github.com/openfun/marsha/compare/v3.12.0...v3.12.1
[3.12.0]: https://github.com/openfun/marsha/compare/v3.11.0...v3.12.0
[3.11.0]: https://github.com/openfun/marsha/compare/v3.10.2...v3.11.0
[3.10.2]: https://github.com/openfun/marsha/compare/v3.10.1...v3.10.2
[3.10.1]: https://github.com/openfun/marsha/compare/v3.10.0...v3.10.1
[3.10.0]: https://github.com/openfun/marsha/compare/v3.9.1...v3.10.0
[3.9.1]: https://github.com/openfun/marsha/compare/v3.9.0...v3.9.1
[3.9.0]: https://github.com/openfun/marsha/compare/v3.8.1...v3.9.0
[3.8.1]: https://github.com/openfun/marsha/compare/v3.8.0...v3.8.1
[3.8.0]: https://github.com/openfun/marsha/compare/v3.7.1...v3.8.0
[3.7.1]: https://github.com/openfun/marsha/compare/v3.7.0...v3.7.1
[3.7.0]: https://github.com/openfun/marsha/compare/v3.6.0...v3.7.0
[3.6.0]: https://github.com/openfun/marsha/compare/v3.5.1...v3.6.0
[3.5.1]: https://github.com/openfun/marsha/compare/v3.5.0...v3.5.1
[3.5.0]: https://github.com/openfun/marsha/compare/v3.4.0...v3.5.0
[3.4.0]: https://github.com/openfun/marsha/compare/v3.3.0...v3.4.0
[3.3.0]: https://github.com/openfun/marsha/compare/v3.2.1...v3.3.0
[3.2.1]: https://github.com/openfun/marsha/compare/v3.2.0...v3.2.1
[3.2.0]: https://github.com/openfun/marsha/compare/v3.1.7...v3.2.0
[3.1.7]: https://github.com/openfun/marsha/compare/v3.1.6...v3.1.7
[3.1.6]: https://github.com/openfun/marsha/compare/v3.1.5...v3.1.6
[3.1.5]: https://github.com/openfun/marsha/compare/v3.1.4...v3.1.5
[3.1.4]: https://github.com/openfun/marsha/compare/v3.1.3...v3.1.4
[3.1.3]: https://github.com/openfun/marsha/compare/v3.1.2...v3.1.3
[3.1.2]: https://github.com/openfun/marsha/compare/v3.1.1...v3.1.2
[3.1.1]: https://github.com/openfun/marsha/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/openfun/marsha/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/openfun/marsha/compare/v2.10.2...v3.0.0
[2.10.2]: https://github.com/openfun/marsha/compare/v2.10.1...v2.10.2
[2.10.1]: https://github.com/openfun/marsha/compare/v2.10.0...v2.10.1
[2.10.0]: https://github.com/openfun/marsha/compare/v2.9.0...v2.10.0
[2.9.0]: https://github.com/openfun/marsha/compare/v2.8.4...v2.9.0
[2.8.4]: https://github.com/openfun/marsha/compare/v2.8.3...v2.8.4
[2.8.3]: https://github.com/openfun/marsha/compare/v2.8.2...v2.8.3
[2.8.2]: https://github.com/openfun/marsha/compare/v2.8.1...v2.8.2
[2.8.1]: https://github.com/openfun/marsha/compare/v2.8.0...v2.8.1
[2.8.0]: https://github.com/openfun/marsha/compare/v2.7.1...v2.8.0
[2.7.1]: https://github.com/openfun/marsha/compare/v2.7.0...v2.7.1
[2.7.0]: https://github.com/openfun/marsha/compare/v2.6.0...v2.7.0
[2.6.0]: https://github.com/openfun/marsha/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/openfun/marsha/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/openfun/marsha/compare/v2.3.1...v2.4.0
[2.3.1]: https://github.com/openfun/marsha/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/openfun/marsha/compare/v2.2.1...v2.3.0
[2.2.1]: https://github.com/openfun/marsha/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/openfun/marsha/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/openfun/marsha/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/openfun/marsha/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/openfun/marsha/compare/v1.2.1...v2.0.0
[1.2.1]: https://github.com/openfun/marsha/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/openfun/marsha/compare/v1.1.2...v1.2.0
[1.1.2]: https://github.com/openfun/marsha/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/openfun/marsha/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/openfun/marsha/compare/v1.0.0...v1.1.0
