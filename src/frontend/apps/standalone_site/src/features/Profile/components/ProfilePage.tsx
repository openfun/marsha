import { Input } from '@openfun/cunningham-react';
import { AnonymousUser, Box, Heading, useCurrentUser } from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';

import { WhiteCard } from 'components/Cards';
import { Contents } from 'features/Contents';

const messages = defineMessages({
  header: {
    defaultMessage: 'My profile',
    description: "Profile page's title.",
    id: 'feature.Profile.ProfilePage.header',
  },
  noName: {
    defaultMessage: 'No name provided',
    description: "Profile page's when no name is provided.",
    id: 'feature.Profile.ProfilePage.noName',
  },
  noEmail: {
    defaultMessage: 'No email provided',
    description: "Profile page's when no email is provided.",
    id: 'feature.Profile.ProfilePage.noEmail',
  },
  inputLabelName: {
    defaultMessage: 'Your name',
    description: "Profile page's input label name.",
    id: 'feature.Profile.ProfilePage.inputLabelName',
  },
  inputLabelEmail: {
    defaultMessage: 'Your Email',
    description: "Profile page's input label email.",
    id: 'feature.Profile.ProfilePage.inputLabelEmail',
  },
});

export const ProfilePage = () => {
  const { currentUser } = useCurrentUser();
  const intl = useIntl();

  const userWithData =
    currentUser && currentUser !== AnonymousUser.ANONYMOUS ? currentUser : null;

  return (
    <Box>
      <Heading level={1}>{intl.formatMessage(messages.header)}</Heading>
      <WhiteCard gap="small" direction="row">
        <Input
          className="border-none"
          value={userWithData?.full_name || intl.formatMessage(messages.noName)}
          readOnly
          icon={<span className="material-icons">person</span>}
          label={intl.formatMessage(messages.inputLabelName)}
        />
        <Input
          className="border-none"
          value={userWithData?.email || intl.formatMessage(messages.noEmail)}
          readOnly
          icon={<span className="material-icons">mail</span>}
          label={intl.formatMessage(messages.inputLabelEmail)}
        />
      </WhiteCard>
      <Contents />
    </Box>
  );
};
