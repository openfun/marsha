import { Anchor, Box, Button, Main, Nav, Sidebar, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import {
  AnonymousUser,
  useCurrentUser,
} from '../../data/stores/useCurrentUser';
import { OrganizationAccessRole } from '../../types/User';
import { theme } from '../../utils/theme/theme';
import { Icon } from '../Icon';
import { Loader } from '../Loader';
import { SidebarUploadsIndicator } from '../SidebarUploadsIndicator';
import { withLink } from '../withLink/withLink';

const messages = defineMessages({
  logInBtn: {
    defaultMessage: 'Log in',
    description: 'Text for the login button in the header of the marsha site',
    id: 'components.SiteHeader.logInBtn',
  },
});

const TitleLink = withLink(Anchor);
const SidebarLink = styled(Link)`
  &,
  &:active {
    text-decoration: none;
    color: inherit;
  }

  &:hover {
    background: white;
    text-decoration: underline;
    color: ${normalizeColor('brand', theme)};
  }
`;

export const SiteLayout: React.FC = ({ children }) => {
  const currentUser = useCurrentUser().getCurrentUser();

  return (
    <Box direction="row" pad="none" height="full">
      <Sidebar
        width="16rem"
        height="full"
        flex={false}
        background="light-1"
        border={{ color: 'light-6', side: 'right' }}
        pad={{ horizontal: 'none', vertical: 'small' }}
      >
        <Box direction="column" gap="medium">
          <Box pad={{ vertical: 'small' }} align="center">
            <TitleLink to="/" size="large" color="white">
              marsha.education
            </TitleLink>
          </Box>
          {currentUser ? (
            currentUser === AnonymousUser.ANONYMOUS ? (
              <Button>
                <FormattedMessage {...messages.logInBtn} />
              </Button>
            ) : (
              <Box direction="row" pad="medium" gap="small" align="center">
                <Icon name="icon-person-outline" />
                <Text>{currentUser.email}</Text>
              </Box>
            )
          ) : (
            <Loader />
          )}
          <Nav>
            {currentUser && currentUser !== AnonymousUser.ANONYMOUS ? (
              <React.Fragment>
                <SidebarUploadsIndicator />
                {currentUser.organization_accesses
                  .filter(
                    (orgAccess) =>
                      orgAccess.role === OrganizationAccessRole.ADMINISTRATOR,
                  )
                  .map((orgAccess) => (
                    <SidebarLink
                      key={orgAccess.organization}
                      to={`/organization/${orgAccess.organization}`}
                    >
                      <Box
                        direction="row"
                        pad={{ horizontal: 'medium', vertical: 'small' }}
                        gap="small"
                        align="center"
                      >
                        <Icon name="icon-organization" />
                        <Text>{orgAccess.organization_name}</Text>
                      </Box>
                    </SidebarLink>
                  ))}
              </React.Fragment>
            ) : null}
          </Nav>
        </Box>
      </Sidebar>
      <Main overflow="auto" width="calc(100% - 16rem)">
        {children}
      </Main>
    </Box>
  );
};
