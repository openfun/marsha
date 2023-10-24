import { colorsTokens } from 'lib-common';
import { Box, Text } from 'lib-components';
import { PropsWithChildren } from 'react';
import { IntlShape, defineMessages, useIntl } from 'react-intl';

import { UserLite } from '../api/useSearchUsers';

const messages = defineMessages({
  anonymous: {
    defaultMessage: 'Anonymous ({id})',
    description:
      'Default name completed with the user id in case the user has no full name',
    id: 'features.Playlist.features.UpdatePlaylist.components.SearchUserListRow.anonymous',
  },
});

export const formatUsername = (user: UserLite, intl: IntlShape) => {
  let userLabel = intl.formatMessage(messages.anonymous, { id: user.id });
  if (user.full_name && user.email) {
    userLabel = `${user.full_name} (${user.email})`;
  } else if (user.full_name) {
    userLabel = user.full_name;
  } else if (user.email) {
    userLabel = user.email;
  }

  return userLabel;
};

interface SearchUserListRowProps {
  user: UserLite;
}

export const SearchUserListRow = ({
  user,
  children,
}: PropsWithChildren<SearchUserListRowProps>) => {
  const intl = useIntl();
  const userLabel = formatUsername(user, intl);

  return (
    <Box
      direction="row"
      fill
      background={colorsTokens['primary-100']}
      pad="small"
      round="xsmall"
      align="center"
      justify="space-between"
      gap="small"
    >
      <Text truncate title={userLabel} style={{ flex: 1 }}>
        {userLabel}
      </Text>
      {children}
    </Box>
  );
};
