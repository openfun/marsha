import { Playlist } from 'lib-components';

export enum PlaylistRole {
  ADMINISTRATOR = 'administrator',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
}

export interface PlaylistAccess {
  id: string;
  playlist: Playlist;
  role: PlaylistRole;
  user: {
    email: string;
    full_name: string;
    id: string;
    is_staff: boolean;
    is_superuser: boolean;
  };
}
