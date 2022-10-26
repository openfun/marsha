import { Box, Nav } from 'grommet';
import {
  useCurrentResourceContext,
  useMaintenance,
  useVideo,
  useDocument,
  useAppConfig,
  Document,
  modelName,
  uploadState,
  Video,
} from 'lib-components';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { PLAYLIST_ROUTE } from 'components/PlaylistPortability/route';
import { PLAYER_ROUTE } from 'components/routes';

const messages = defineMessages({
  linkDashboard: {
    defaultMessage: 'Dashboard',
    description: `Title for the dashboard, where the user can see the status of the video/audio/timed text upload
      & processing, and will be able to manage them.`,
    id: 'components.LTINav.linkDashboard',
  },
  linkPreview: {
    defaultMessage: 'Preview',
    description: `Title for the Instructor View. Describes the area appearing right above, which is a preview
      of what the student will see there.`,
    id: 'components.LTINav.linkPreview',
  },
  linkPlaylist: {
    defaultMessage: 'Playlist',
    description: `Title for the playlist view, where the user can see the current playlist id, and will be able to
      manage portability.`,
    id: 'components.LTINav.linkPlaylist',
  },
});

const NavItem = styled(NavLink)`
  cursor: pointer;
  padding: 1rem;
  color: #444444;
  text-decoration: none;
  border-bottom: solid 2px #ededed;

  :hover {
    border-bottom-color: #007bff;
  }

  &.active {
    border-bottom-color: #000000;
  }
`;

/** Props shape for the LTINav component. */
interface LTINavProps {
  object: Video | Document;
}

/** Component. Displays LTI navigation depending on object state and user permissions.
 * @param object The video or document for which the navigation is displayed.
 */

export const LTINav = ({ object: baseObject }: LTINavProps) => {
  const appData = useAppConfig();
  const isMaintenanceOn = useMaintenance((state) => state.isActive);
  const [context] = useCurrentResourceContext();
  const videoState = useVideo();
  const documentState = useDocument();
  const object =
    appData.modelName === modelName.VIDEOS
      ? videoState.getVideo(baseObject as Video)
      : documentState.getDocument(baseObject as Document);

  const canAccessDashboard = context.permissions.can_update && !isMaintenanceOn;
  const canAccessPreview = object.upload_state === uploadState.READY;

  return (
    <Box align="center" alignContent="center" pad="small">
      <Nav direction="row">
        {canAccessDashboard && (
          <NavItem to={DASHBOARD_ROUTE(appData.modelName)}>
            <FormattedMessage {...messages.linkDashboard} />
          </NavItem>
        )}

        {canAccessPreview && (
          <NavItem to={PLAYER_ROUTE(appData.modelName)}>
            <FormattedMessage {...messages.linkPreview} />
          </NavItem>
        )}

        {canAccessDashboard && (
          <NavItem to={PLAYLIST_ROUTE(appData.modelName)}>
            <FormattedMessage {...messages.linkPlaylist} />
          </NavItem>
        )}
      </Nav>
    </Box>
  );
};
