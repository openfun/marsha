# Permissions

`marsha` user access and permissions are managed following two different approaches:

- For the LTI part, the authentication and authorization are managed by the LTI consumer site.
  The LTI consumer site is responsible for authenticating the user and determining
  their `role`. The user ID and Role are then passed to `marsha` through the LTI
  request.
- For the standalone site, the authentication and authorization are managed by `marsha`.
  `marsha` can also rely on external SSO (see [renater_federation_saml.md](renater_federation_saml.md)).


## LTI

### Authentication

The user is authenticated by the LTI consumer site, and `marsha` relies on the data provided by the signed LTI request.
Once the first LTI request has been received, `marsha` will provide a pair of access/refresh JWT for the frontend 
to authenticate requests.
These JWT contains the authentication/authorization information provided by the original LTI request.

### Authorization

The user's `role` is provided by the LTI consumer site, and `marsha` relies on the data provided by the signed LTI request.


## Standalone site

### Authentication

The user is authenticated by `marsha` and can be either:

- an "internal" Django user (_i.e._ a user created and managed by `marsha` itself, 
  but for now there is no registration process for external users to use this).
- a user authenticated by an external SSO (see [renater_federation_saml.md](renater_federation_saml.md))

The frontend application provides the login page, the backend will handle the authentication process and 
generate a pair of access/refresh JWT for the frontend to make requests.
These JWT only contains the authentication information (user ID).

### Authorization

Authorizations are built around several models:

- `OrganizationAccess` links a user to an organization and a role for this organization.
- `ConsumerSiteAccess` links a user to a consumer site and a role for this consumer site.
- `PlaylistAccess` links a user to a playlist and a role for this playlist.

For each one, a user can only have one role (_.e.g._ only one link between a user and a playlist).

> **Note:** The 🚧 symbol below indicates that the feature/permission is not yet implemented.

#### Organization access

A user is linked to an organization through the `OrganizationAccess` model. This can provide three roles:

- `ADMIN`: the user is an administrator of the organization.
- `INSTRUCTOR`: the user is an instructor of the organization.
- `STUDENT`: the user is a student of the organization.

##### Organization administrator

The organization administrator should be able to do "everything" regarding the organization. 
Among other things, they can: 

- 🚧 Create and manage (read/write) all the organization's access control.
- Manage (read/write) all the users of the organization.
- Create and manage (read/write) all the playlists of the organization.
- Create and manage (read/write) all the videos of the organization and perform related video actions.
- Create and manage (read/write) all the shared live media of the organization's videos.
- Create and manage (read/write) all the thumbnails of the organization's videos.
- Create and manage (read/write) all the classrooms of the organization.
- Create and manage (read/write) all the classroom documents of the organization.
- 🚧 Create and manage (read/write) all the documents of the organization.
- Create and manage (read/write) all the deposited files of the organization.
- Create and manage (read/write) all the Markdown documents of the organization.
- Manage (read/write) all the portability requests of the organization.

##### Organization instructor

The organization instructor can:

- Create new playlists.
- List users of the organization.

##### Organization student

The organization student has no specific permission for now.

#### Consumer site access

A user is linked to a consumer site through the `ConsumerSiteAccess` model. This can provide three roles:

- `ADMIN`: the user is an administrator of the consumer site.
- `INSTRUCTOR`: the user is an instructor of the consumer site.
- `STUDENT`: the user is a student of the consumer site.

##### Consumer site administrator

The consumer site administrator should be able to do "everything" regarding the consumer site.
They also can:

- Manage (read/write) all the portability requests regarding the consumer site's playlists.

##### Consumer site instructor or student

They have no specific rights for now.

#### Playlist access

A user is linked to a playlist through the `PlaylistAccess` model. This can provide three roles:

- `ADMIN`: the user is an administrator of the playlist.
- `INSTRUCTOR`: the user is an instructor of the playlist.
- `STUDENT`: the user is a student of the playlist.

##### Playlist administrator

When creating a playlist, the user is automatically assigned the `ADMIN` role for this playlist.
A playlist administrator can:

- 🚧 Create and manage (read/write) all the playlist's access control.
- Create and manage (read/write) all the videos of the playlist and perform related video actions.
- Create and manage (read/write) all the shared live media of the playlist's videos.
- Create and manage (read/write) all the timed text track of the playlist's videos.
- Create and manage (read/write) all the thumbnails of the playlist's videos.
- Create and manage (read/write) all the classrooms of the playlist.
- Create and manage (read/write) all the classroom documents of the playlist.
- 🚧 Create and manage (read/write) all the documents of the playlist.
- Create and manage (read/write) all the deposited files of the playlist.
- Create and manage (read/write) all the Markdown documents of the playlist.
- Manage (read/write) all the portability requests regarding the playlist.

##### Playlist instructor

The playlist instructor is added by a playlist administrator. They can:

- 🚧 Read all the playlist's access control.
- Create and manage (read/write) all the videos of the playlist and perform related video actions.
- Create and manage (read/write) all the shared live media of the playlist's videos.
- 🚧 Read all the timed text track of the playlist's videos.
- Create and manage (read/write) all the thumbnails of the playlist's videos.
- 🚧 Read all the classrooms of the playlist.
- 🚧 Read all the classroom documents of the playlist.
- 🚧 Read all the documents of the playlist.
- 🚧 Read all the deposited files of the playlist.
- 🚧 Read all the Markdown documents of the playlist.
- **not** read the portability requests regarding the playlist.

##### Playlist student

The playlist instructor is added by a playlist administrator. They can:

- 🚧 Read all the videos of the playlist.
- 🚧 Read all the timed text track of the playlist's videos.
- 🚧 Read all the classrooms of the playlist.
- 🚧 Read all the classroom documents of the playlist.
- 🚧 Read all the documents of the playlist.
- 🚧 Read all the deposited files of the playlist.
- 🚧 Read all the Markdown documents of the playlist.
