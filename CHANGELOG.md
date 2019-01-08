# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic
Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[unreleased]: https://github.com/openfun/marsha/compare/v1.1.0...master
[1.1.0]: https://github.com/openfun/marsha/compare/v1.0.0...v1.1.0
