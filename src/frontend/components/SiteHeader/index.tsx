import { Anchor, Button, Header, Text } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import {
  AnonymousUser,
  useCurrentUser,
} from '../../data/stores/useCurrentUser';
import { Loader } from '../Loader';
import { withLink } from '../withLink/withLink';

const messages = defineMessages({
  logInBtn: {
    defaultMessage: 'Log in',
    description: 'Text for the login button in the header of the marsha site',
    id: 'components.SiteHeader.logInBtn',
  },
});

const TitleLink = withLink(Anchor);

export const SiteHeader: React.FC = () => {
  const currentUser = useCurrentUser().getCurrentUser();

  return (
    <Header
      gridArea="header"
      direction="row"
      align="center"
      justify="between"
      pad={{ horizontal: 'medium', vertical: 'small' }}
      background="dark-2"
    >
      <TitleLink to="/" size="large" color="white">
        marsha.education
      </TitleLink>
      {currentUser ? (
        currentUser === AnonymousUser.ANONYMOUS ? (
          <Button>
            <FormattedMessage {...messages.logInBtn} />
          </Button>
        ) : (
          <Text>{currentUser.email}</Text>
        )
      ) : (
        <Loader />
      )}
    </Header>
  );
};
