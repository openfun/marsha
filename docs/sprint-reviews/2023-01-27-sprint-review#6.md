# Marsha sprint review #5 of January 27, 2023

## Achievements

- Issues on the service worker for handling of JWT token: remove it and replace it by a wrapper
  around fetch that catches 401 and renews the token
- Improved Shibboleth authentication:
    * refresh tokens
    * add image to organizations in Shibboleth select list
- BBB:
    - Added recordings
    - Added LTI links for easy integration to a LMS from the website
    - Added maximum size to uploaded documents
- Prepared the VOD/Live for the standalone site
- Added permissions to allow instructors to create playlists

## Next

- Document permissions and add description of permissions to each endpoint
- Banner image and text should be customizable (by a developper for now)
- Add VOD/Live to the standalone site as soon as available
- Start using [Cunningham](https://github.com/openfun/cunningham) as soon as possible
- Add footer with legal mentions and general conditions
- Display home page even when anonymous
- Fix date picker issue
- Rework Markdown module
- Continue extracting remaining modules to standalone site: Documents, Deposits, Markdown
- Refactor to differentiate Course (= LTI context) from Playlists and allow multiple playlists
   for a resource
- C&P to add user documentation to Zendesk
- Allow teachers to download the subtitles on the dashboard of their own videos
- Blocking point for VOD in Moodle: must be able to embed a video to WYSIWYG content:
    * Allow embedding iframes (permission to be given on a per consumer site basis)
    * Finalize generic LTI plugins for Moodle (activity and WYSIWYG)
- Solve Shibboleth issues:
    * Security configuration
    * Presence/quality of fields => handle all cases and display information pages instead of failing with 500
- Add student consent for recording:
  * check what already exists for consent on the BBB API
  * checkbox for the teacher to activate recording
  * input text for the teacher to explain what the recording is for, and how long the recording
    will be kept when recording is activated
  * explanation + checkbox for the student each time recording is activated
  * store recordings for a limited time

# Also discussed

- Allow activating/deactivating modules for each organization
- Allow mass uploads
- Organize design workshop on the deposit module to see how it can evolve toward a full homework
  submission app.
- Integrate downloading videos in the videojs skin
- LRS configuration: should be consumer site OR organization. Is this exclusive? Is the event
  sent twice?
- Improve onboarding of new backend developpers:
  * Permissions
  * Events synchronization
