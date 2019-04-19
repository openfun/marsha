# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic
Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[unreleased]: https://github.com/openfun/marsha/compare/v2.5.0...master
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
