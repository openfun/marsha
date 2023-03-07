import { Box, Heading, Text } from 'grommet';
import { Nullable } from 'lib-common';
import {
  AnonymousUser,
  StyledLink,
  useCurrentUser,
  useResponsive,
} from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { ClassRooms } from 'features/Contents';
import { routes } from 'routes';

const BoxText = styled(Box)`
  color: #002c84;
`;

const messages = defineMessages({
  header: {
    defaultMessage: 'My profile',
    description: "Profile page's title.",
    id: 'feature.Profile.ProfilePage.header',
  },
  MyClassrooms: {
    defaultMessage: 'My Classrooms',
    description: 'HomePage title',
    id: 'features.Contents.Contents.MyClassrooms',
  },
  SeeEverything: {
    defaultMessage: 'See Everything',
    description: 'Label to see all the cards',
    id: 'features.Contents.Contents.SeeEverything',
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
      <Text color={value === null ? 'bg-grey' : undefined} truncate>
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
      <Heading>{intl.formatMessage(messages.header)}</Heading>
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

      <Box margin={{ top: 'medium' }}>
        <BoxText direction="row" justify="between" margin={{ bottom: 'small' }}>
          <Text weight="bolder">
            {intl.formatMessage(messages.MyClassrooms)}
          </Text>
          <Text weight="bolder">
            <StyledLink to={`${routes.CONTENTS.subRoutes.CLASSROOM.path}`}>
              › {intl.formatMessage(messages.SeeEverything)}
            </StyledLink>
          </Text>
        </BoxText>

        <ClassRooms />
      </Box>
    </Box>
  );
};
