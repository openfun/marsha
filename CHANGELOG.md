# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic
Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Improve admin pages for the video model
- Add unicity constraints on the playlist and video models
- Improve string representation for the a playlist model

### Fixed

- Add unicity test timed text tracks to confirm soft deleted records are ignored
- Copy related tracks correctly when duplicating a video
- Replace the `upload-policy` API endpoint by `initiate-upload` that reset the upload
  state and returns the AWS S3 upload policy in a single POST query
- Add field `is_ready_to_play` to compensate removing field `state`
- Rename `state` field to `upload_state` as it does not represent the state of the object
  anymore but the state of the latest upload attempted on this object
- Enforce read-only on `upload_state` and `active_stamp` fields as they should only be
  updated by AWS via the `update-state` API endpoint.

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

[unreleased]: https://github.com/openfun/marsha/compare/v1.1.2...master
[1.1.2]: https://github.com/openfun/marsha/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/openfun/marsha/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/openfun/marsha/compare/v1.0.0...v1.1.0
