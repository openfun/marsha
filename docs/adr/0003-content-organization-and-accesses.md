# 'ADR 0003 - Content organization and accesses'

## Status

Accepted

## Context

We have actors &lt;0001-actors&gt;. And
videos &lt;0002-videos-languages&gt;, with their auxiliary files, that
we'll call for now "content". We want this content to be organized for
actors to manage/view them.

## Decision

Videos are grouped in playlists, which is a Django model named
`Playlist`. A playlist belongs to an organization (`Organization` model
defined in actors &lt;0001-actors&gt;) and is created by someone who can
be a manager of this organization, or an author who belongs to this
organization. This link is materialized by an `author` field on the
`Playlist` model, a `ForeignKey` to the `User` model.

The manager can allow many actors to manage a playlist, so there is a
`ManyToMany` field on the `Playlist` model, named `editors`, pointing to
the `User` model. And instead of relying on the hidden model created by
Django when creating a `ManyToMany`, we'll define this model and use it
via the `through` argument, to be able to add more rights constraints
later if needed.

The author of the playlist is automatically added to this list of
editors. And can be removed from it by a manager, still staying marked
as the author, but being the author itself doesn't involve any rights.

A playlist can be duplicated by a manager, and if it stays in the same
organization, the manager can clear or keep the list of editors. If it
is to be duplicated in another organization, the list of editors will be
cleared of actors not belonging to the new organization, and the manager
will still be able to clear it all or keep the remaining editors.

When duplicated, a new instance of `Playlist` is created, with a link to
the original playlist, keeping the author. We do the same for each
instances of the `Video` linked to this playlist, but we will still
point to the same files (videos/audios/subtitles...) on the hosting
provider, to keep cost manageable.

And finally, there is a flag named `is_public` on the playlist, that can
be toggled by a manager, to tell if the playlist can be viewed by anyone
or only by people who were granted access to it. This kind of access is
not in the scope of this document.

## Consequences

Videos are grouped, which ease search and maintenance.

It is easy to change and check the rights for people to manage such a
playlist.
