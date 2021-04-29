# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic
Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Chat feature implementing XMPP protocol
- Add a prosody server in docker-compose stack
- Add a LTI select view to allow LTI consumers to add a LTI content through Deep Linking

### Changed

- The `lti_id` field is optional on Videos and Documents.
- Clean built frontend files before each build

### Fixed

- Frontend video type now allows Nullable urls.
- Fix js public path on LTI select view.

## [3.17.1] - 2021-03-26

### Added

- Add a series of components to power breadcrumbs.
- Add a frontend component to use SVG icons in Marsha.
- Add ngrok to serve marsha on a public domain and automate CloudFront configuration
  via terraform when needed

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
- Introduce a new setting AWS_BASE_NAME to prefix all AWS settings in the project.
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
- Simplify template to frontend communication by using JSON instead of multiple data-attributes
- Rename all is_ready_to_* model properties to is_ready_to_show
- Change filename when a user downloads a resource.
  For video it has the following pattern: {playlist title}_{uploaded timestamp}.mp4
  For document it has the following pattern: {playlist_title}_{document_title}.{document_extension}
- Change gunicorn configuration to increase number of threads, worker class and worker tmpdir
- Upgrade @openfun/subsrt in lambda-encode. Patched version parses most of srt files
  (a critical feature for us)
- Upgrade crowdin image used in circle-ci to version 2.0.31 including tar command
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

- Change gunicorn configuration to increase number of threads, worker class and worker tmpdir
- Upgrade @openfun/subsrt in lambda-encode. Patched version parses most of srt files
  (a critical feature for us)

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
- Configure in the consumer site admin panel if by default videos can show a download link.
- Do not allow video modification when the consumer site used is not the one used
  to create the video.

### Changed

- Translations are loaded dynamically in frontend application.
- Locale mapping is now made in the backend application.

## [2.6.0] - 2019-04-01

### Added

- Upload a custom video thumbnail
- use S3 to store and Cloudfront to distribute static files

### Fixed

- Replace the `CLOUDFRONT_URL` setting by a `CLOUDFRONT_DOMAIN` setting to uniformize with what
  django-storages is doing and share the same settings.
- Downgrade django-storages to 1.6.3, the last version compatible with ManifestStaticFilesStorage

## [2.5.0] - 2019-03-25

### Added

- Manage translations with Crowdin and build them in the CI.

### Fixed

- Remove HLS video support for iOS platforms.

## [2.4.0] - 2019-03-14

### Added

- Ease video download for user. It is possible to click on a link to download a video.

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

- Run `webpack` in production mode for builds that will be deployed; shaves 75+% on the bundle size

## [2.2.0] - 2019-02-05

### Added

- Improve admin views (show/search ID, configure site portability, performance,...)
- Log a warning on LTI exceptions for easier diagnostic
- Introduce Saga and use it to get timed text tracks

### Fixed

- Fix logging and make it configurable by environment variables

## [2.1.0] - 2019-01-30

### Added

- Manage xAPI statements in backend application.
- Listen to plyr player events and send xAPI statements to the backend application.
- Installation of Grommet in the front application. Will be used to theme our application.
- Display upload progress when a resource is uploaded.
- Configure application healthcheck.
- Show a thumbnail of the video on the Dashboard when it is ready to play.

### Fixed

- Remove the `styledComponentWithProps` we used to type styled components thanks to a newer version of the library
- Rework `Jest` config to use babel
- Replace our button with Grommet's.

## [2.0.1] - 2019-01-22

### Fixed

- Fix database migration that was removing the `resource_id` field a bit too fast and replace
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

- Fix initiate upload to update only the targeted object and not the whole database table

## [1.2.0] - 2019-01-15

### Added

- Add automatic portability between consumer sites for friend websites or different environments
  of the same website
- Enforce either the `consumer site` or the `playlist` field is set on a LTI
  passport, and not both
- Improve admin pages for the playlist and video models
- Add unicity constraints on the playlist and video models
- Improve string representation for the a playlist model

### Fixed

- Improve test to secure portability of a video to the same playlist on another site, making sure
  it has precedence over a video linked to another playlist on the other site
- Isolate route definitions to avoid circular dependencies in the frontend
- Add unicity test timed text tracks to confirm soft deleted records are ignored
- Copy related tracks correctly when duplicating a video
- Replace the `upload-policy` API endpoint by `initiate-upload` that reset the upload
  state and returns the AWS S3 upload policy in a single POST query
- Add field `is_ready_to_play` to compensate removing field `state`
- Rename `state` field to `upload_state` as it does not represent the state of the object
  anymore but the state of the latest upload attempted on this object
- Enforce read-only on `upload_state` and `active_stamp` fields as they should only be
  updated by AWS via the `update-state` API endpoint

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
- Create a JWT token for every roles not just instructors (needed to add context to xAPI requests)
- Allow timed text track list GET requests on the API (permissions are fixed in a separate commit)
- Switch to redux for frontend state management
- Add a link to the dashboard from the video form
- Split Dashboard video matters into a separate component
- Run yarn install in docker node to use node 8

### Fixed

- Minor fixes and improvements on features and tests

[unreleased]: https://github.com/openfun/marsha/compare/v3.17.0...master
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
