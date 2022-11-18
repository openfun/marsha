# Marsha sprint review #2 of September 30, 2022

## To be discussed

- Refactor folders in `src/backend/marsha

## Achievements

- Rename BBB to `classrooms`
- Upload document to a BBB classroom
- Add API permissions for the site
- Splitting test files that are too long
- Started the website: authentication, i18n, menu, navigation, playlists page
- Refactoring to extract components that we can use in the site
- Started work on link between LTI users and site users
- Started work on asking for a portability from the LTI site
- Started work on the student view for the VOD (let chat and shared document follow from a live)

## Next sprint

- Add deposit to the green button in OpenEdX
- Use deposits in a course in production
- Add playlists and BBB classrooms to the site 
- Work on deep linking to show to a teacher everything he has access to
- Debug switch "everybody on stage" to "streaming"
- Set max file deposit to 1,5Go
- Go live for markdown and deposits: on fun-campus.fr and fun-mooc.fr
- deploy the site frontend to staging
- Configure Shibboleth access
- Continue work on marketing documents

## Discussed

- Review resource names:
  > Ok: Videos, Webinars, Virtual Classrooms
  > To be renamed: Lessons
- We will need to rename the existing `Playlist` to `Context` and introduce a real
  collection feature.
- Remove title and tabs from the student view for the VOD
- Activate token (need to activate Magnify first)
- Jitsi configuration in LMS too small > link
- Allow screen sharing on fun-campus.Fr
