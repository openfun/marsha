import { IntlShape, defineMessages } from 'react-intl';

import { PlaylistRole } from '../types/playlistAccess';

const messages = defineMessages({
  adminLabel: {
    defaultMessage: 'Administrator',
    description: 'Administrator role label in playlist access select.',
    id: 'features.Playlist.features.UpdatePlaylist.components.UserRoleOptions.adminLabel',
  },
  instructorLabel: {
    defaultMessage: 'Instructor',
    description: 'Instructor role label in playlist access select.',
    id: 'features.Playlist.features.UpdatePlaylist.components.UserRoleOptions.instructorLabel',
  },
  studentLabel: {
    defaultMessage: 'Student',
    description: 'Student role label in playlist access select.',
    id: 'features.Playlist.features.UpdatePlaylist.components.UserRoleOptions.studentLabel',
  },
});

export const userRoleOptions = (intl: IntlShape) => [
  {
    label: intl.formatMessage(messages.adminLabel),
    key: PlaylistRole.ADMINISTRATOR,
  },
  {
    label: intl.formatMessage(messages.instructorLabel),
    key: PlaylistRole.INSTRUCTOR,
  },
  {
    label: intl.formatMessage(messages.studentLabel),
    key: PlaylistRole.STUDENT,
  },
];
