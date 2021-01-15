import { Anchor, Nav, Sidebar } from 'grommet';
import React from 'react';

import {
  AnonymousUser,
  useCurrentUser,
} from '../../data/stores/useCurrentUser';
import { OrganizationAccessRole } from '../../types/User';
import { withLink } from '../withLink/withLink';

const SidebarLink = withLink(Anchor);

export const SiteSidebar: React.FC = () => {
  const currentUser = useCurrentUser().getCurrentUser();

  return (
    <Sidebar gridArea="sidebar" background="dark-3" width="medium">
      <Nav>
        {currentUser && currentUser !== AnonymousUser.ANONYMOUS ? (
          <React.Fragment>
            {currentUser.organization_accesses
              .filter(
                (orgAccess) =>
                  orgAccess.role === OrganizationAccessRole.ADMINISTRATOR,
              )
              .map((orgAccess) => (
                <SidebarLink
                  to={`/organization/${orgAccess.organization}`}
                  margin={{ horizontal: 'medium', vertical: 'small' }}
                >
                  {orgAccess.organization_name}
                </SidebarLink>
              ))}
          </React.Fragment>
        ) : null}
      </Nav>
    </Sidebar>
  );
};
