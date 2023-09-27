import { Box } from 'grommet';
import { Nullable } from 'lib-common';
import {
  AnonymousUser,
  Heading,
  Text,
  useCurrentUser,
  useResponsive,
} from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';

import { Contents } from 'features/Contents';

const messages = defineMessages({
  header: {
    defaultMessage: 'My profile',
    description: "Profile page's title.",
    id: 'feature.Profile.ProfilePage.header',
  },
});

interface FieldProps {
  value: Nullable<string>;
  defaultMessage: string;
}

const Field = ({ value, defaultMessage }: FieldProps) => {
  return (
    <Box
      flex
      pad={{ vertical: 'xsmall', horizontal: 'medium' }}
      background="#edf5fa"
      round="8px"
    >
      <Text color={value === null ? 'clr-greyscale-400' : undefined}>
        {value || defaultMessage}
      </Text>
    </Box>
  );
};

export const ProfilePage = () => {
  const { currentUser } = useCurrentUser();
  const { breakpoint } = useResponsive();
  const intl = useIntl();

  const userWithData =
    currentUser && currentUser !== AnonymousUser.ANONYMOUS ? currentUser : null;

  return (
    <Box>
      <Heading level={1}>{intl.formatMessage(messages.header)}</Heading>
      <Box
        background="#daeeff"
        margin={{ vertical: 'small' }}
        pad="medium"
        round="8px"
      >
        <Box
          background="white"
          direction="column"
          pad="medium"
          round="8px"
          elevation="even"
        >
          <Box
            direction={breakpoint === 'large' ? 'row' : 'column'}
            gap="medium"
          >
            <Field
              value={userWithData?.full_name || null}
              defaultMessage="No name provided"
            />
            <Field
              value={userWithData?.email || null}
              defaultMessage="No email provided"
            />
          </Box>
        </Box>
      </Box>
      <Contents />
    </Box>
  );
};
