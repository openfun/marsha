import { Box } from 'grommet';
import { Text } from 'lib-components';
import { PropsWithChildren } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { UserLite } from '../api/useSearchUsers';

const messages = defineMessages({
  anonymous: {
    defaultMessage: 'Anonymous ({id})',
    description:
      'Default name completed with the user id in case the user has no full name',
    id: 'features.Playlist.features.UpdatePlaylist.components.SearchUserListRow.anonymous',
  },
});

interface SearchUserListRowProps {
  hover?: boolean;
  focus?: boolean;
  user: UserLite;
}

export const SearchUserListRow = ({
  hover,
  focus,
  user,
  children,
}: PropsWithChildren<SearchUserListRowProps>) => {
  const intl = useIntl();

  let userLabel = intl.formatMessage(messages.anonymous, { id: user.id });
  if (user.full_name && user.email) {
    userLabel = `${user.full_name} (${user.email})`;
  } else if (user.full_name) {
    userLabel = user.full_name;
  } else if (user.email) {
    userLabel = user.email;
  }

  return (
    <Box
      direction="row"
      fill
      background={{
        color: hover || focus ? 'blue-hover-light' : '#f2f7fd',
      }}
      pad="small"
      round="xsmall"
      align="center"
      justify="between"
      gap="small"
    >
      <Text truncate title={userLabel} style={{ flex: 1 }}>
        {userLabel}
      </Text>
      {children}
    </Box>
  );
};
