# 'ADR 0004 - Soft deletion'

## Status

Accepted

## Context

We have users and objects, and everything is tied together. Deleting
something may cause some problems, like deleting other things in
cascade, or losing some relatioship, like not knowing who is the author
of a video.

## Decision

We don't want things to be deleted, instead we'll keep them in the
database in a "deleted" state, so that they won't show up anywhere.

Looking at the [Safe/Soft/Logical deletion/trashing and
restoration/undeletion](https://djangopackages.org/grids/g/deletion/)
page on djangopackages, we can make a choice with these constraints:

-   support for python 3 and django 2
-   simple, not over-featured
-   can manage relationships
-   supports the django admin
-   is maintained

Regarding this, we choose
[django-safedelete](https://django-safedelete.readthedocs.io/en/latest/)
which proposes many options to handle deletion, and so will fit our
needs.

## Consequences

If the correct deletion options are used, depending on the
relationships, we won't lose data.

No new code to write to handle soft-deletion.

As a cons: one more dependency, but it seems maintained so it should be
ok.
