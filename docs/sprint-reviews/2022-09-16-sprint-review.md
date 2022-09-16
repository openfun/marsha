# Marsha sprint review #1 of September 16, 2022

## Team achievements

- propose a first version of the deposit app
- finalise the VOD dashboard and error screens
- prepare the frontend for the standalone site
- add the handling of images in the markdown app
- release v4.0.0-beta.8

## Next sprint

- A new developper will join on October 3
- First priority is the standalone site
- Second priority is customer feedbacks:
    * The resource title is not filled when we come back from an LTI select. It should be
    * Don't show the choice screen "video vs webinar" when we come back from an LTI select and
      chose video or webinar
    * Introduce new LTI select urls that will allow to target a specific resource type
      and not show all available types in the LCMS,
    * Always show the checkbox "use as transcript". When a specific TTT exists for the transcript,
      disable the checkbox and show a tooltip to explain why it is disabled.
    * Add title and duration on the LTI select view,
    * Display default thumbnails (extracted during encoding) on the LTI select view,
- Add language management to markdown app: no language tab by default, "+" sign to add languages
- @sampaccoud:
    * work on Shibboleth activation
    * investigate file deposits max size (20Go requested o_O)
    * initiate documentation based on Docusaurus
    * Ux design for markdown app
- @namfra: work on marketing supports

## Discussed

- Consider automatic S3 expiry for uploaded file deposits
- Video app:
    * Allow downloading transcripts from student view
    * Allow downloading TTT files from dashboard
- Improve time to start and time to stop a live:
    * pre-start channels in a pool at times when conferences are scheduled?
    * what about the pause... we should not leave channels open when stream is not running for
      cost reasons
    * reduce time is the priority but we should also show a progress bar and/or progress steps
- Find a way to fill-in video titles automatically for existing videos now that it is required
