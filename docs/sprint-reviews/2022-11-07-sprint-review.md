# Marsha sprint review #3 of November 7, 2022

## Achievements

- Allow targeting LTI select endpoints to one resource
- Incidents with Jitsi due to Jibri breaking upgrade
  We now run Jibri's default image instead of our own
- Refactorings to make standalone site work
- Fixed Django's Management commands that were broken in production
- Deployed the standalone site to the staging environment
- Add playlist and profile pages
- Make LTI components compatible with the site
- Add a form to create a new classroom
- Port webinar apps to VOD: documents, transcripts, download video
- Sharing between playlists (portability)

## Next sprint

- Change french translation "En direct" to "webinaire"
- Rename playlist to course
- Port attendance to VOD when it comes from a live
- Port Chat to VOD
- Port Webinar and video to website
- Finalize sharing between playlists
- On each user login:
  * if the organization does not exists: create it on the fly
  * if the organization already exists, but the user has no access role on it: create it according to what Shibboleth says: teacher or student
  * if the organization already exists and the user already has an access role: update it with what
  Shibboleth says: teacher or student
- Create playlist: don't ask consumer site and LTI ID

## Discussed

- We could create a personal playlist (to be renamed to context asap) on the fly when creating a
  user to use as default or we could allow the playlist to be empty on a resource
- A teacher in an organization is allowed by default to create a playlist
  and becomes admin of the playlist s.he creates
- Handling organizations: created on the fly from Shibboleth
- Should organization be a context as in github
- Chat in VOD should be either hidden, readonly or open for discussion
- How to display shared documents in VOD?
- How can we add tests to avoid breaking the command line again in the future (cost consequences)
