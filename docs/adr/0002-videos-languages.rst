ADR 0002 - Videos languages
===========================

Status
------

Proposed


Context
-------

We want to think Marsha as accessible from the beginning. At least from the point of view of the videos, which are the main content available.

We can think about a video as a main content, with many auxiliary contents.

Auxiliary contents
~~~~~~~~~~~~~~~~~~

Audio
+++++

We have a main video, with an audio track included. The author could propose many other audio tracks, as audio files, and in the player the viewer can change the one to use.

Subtitles
+++++++++

In addition to audio tracks, many subtitles tracks can be available.

Sign language
+++++++++++++

Some people with disabilities could want a video with the sign language transcript. For this it can be a video incorporated in the original one, or an other video displayed on the site.

As sign languages are not the same for every spoken language, there can be several sign languages videos for a single video.


Decision
--------

We decided to take all these elements into account right from the beginning.

So we have a main Django model named ``Video``, from an author, with the link to to main video file, including the default audio track.

For the other audio tracks, we have ``AudioTrack`` Django model, with a ``ForeignKey`` to the ``Video`` instance, named ``video``, and a ``language`` field (with only one audio track for each video+language)

It's the same for the subtitles, we have a ``SubtitleTrack`` Django model, with the same ``video`` and ``language`` fields, but with an additional ``cc`` field to indicate that this subtitle track is "`closed captioning <https://en.wikipedia.org/wiki/Closed_captioning>`_", ie a subtitles track for deaf or hard of hearing viewers. So there can be two subtitle tracks for each video+language: one with ``cc`` on, one with ``cc`` off.

And finally, for sign-languages videos, it's the same as for audio tracks: a Django model named ``SignTrack`` with the same ``video`` and ``language`` field.


Consequences
------------

Accessibility is implemented from the start. Even if we decide to hide some things, the main concepts are here.

