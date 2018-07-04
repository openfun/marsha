# 'ADR 0001 - Actors'


## Status

Accepted

## Context

There are different kinds of actors that need to interact with Marsha.

First we have the people managing a Marsha instance.

Then we have people linking their own website (this website is a
"consumer site") to a Marsha instance, to host videos.

These consumer sites can host many publishers. We call these
"organizations". And these organizations have managers that can
administrate some things about authors, video sharing between authors...

Next we have the video authors, belonging to the organizations.

And finally we have the users coming to watch videos.

## Decision

Let's separate those 5 actors / roles:

### "staff"

#### Purpose

To manage a Marsha instance

#### Implementation

These are simply instances of the Django `User` model, with the flag
`is_staff` set to `True`.

### "admins"

#### Purpose

To manage the link between a consumer site and a Marsha instance, and
the organizations allowed to access this consumer site on the instance.

#### Implementation

To represent a consumer site on a Marsha instance, we have a
`ConsumerSite` Django model. With a `ManyToMany` link to the `User`
model, named `admins` (not a single admin, to avoid having no admin if
the only one existing is not available anymore)).

### "managers"

#### Purpose

To manage the authors in the organization (an organization could be
present on many consumer sites). To allow videos to be private to
authors or public for all authors. And create courses.

#### Implementation

To represent an organization on a Marsha instance, we have an
`Organization` Django model. With a `ManyToMany` link to the `User`
model, named `managers`.

### "authors"

#### Purpose

To post videos on a Marsha instance to be used on a consumer site.

#### Implementation

An author is simply an instance of the `User` model, but has a link to
an `Organization` via a `ManyToMany` link, named `organizations` (we can
imagine an author working for many organizations).

### "viewers"

#### Purpose

To watch videos hosted on a Marsha instance.

#### Implementation

For the viewers we don't need to save anything in the database, so there
is no instances of the `User` Django model for them.

Each time a user does an action to view a video, they access it via a
url containing a unique token, with a limited life span. It's this token
that grant them access to the video.

This is not the scope of this document to address token generations.

To store the user preferences regarding languages, video resolution,
etc, it can simply be done via a cookie.

## Consequences

Roles and authorizations are easy to understand.

The actors hierarchy is simple.
