import {
  Box,
  Document,
  Video,
  builderDashboardRoute,
  modelName,
  uploadState,
  useAppConfig,
  useCurrentResourceContext,
  useDocument,
  useMaintenance,
  useVideo,
} from 'lib-components';
import { FormattedMessage, defineMessages } from 'react-intl';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

import { builderPlaylistRoute } from 'components/PlaylistPortability/route';
import { builderPlayerRoute } from 'components/routes';

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
    <Box align="center" pad="small">
      <Box type="nav" direction="row" gap="medium">
        {canAccessDashboard && (
          <NavItem to={builderDashboardRoute(appData.modelName)}>
            <FormattedMessage {...messages.linkDashboard} />
          </NavItem>
        )}

        {canAccessPreview && (
          <NavItem to={builderPlayerRoute(appData.modelName)}>
            <FormattedMessage {...messages.linkPreview} />
          </NavItem>
        )}

        {canAccessDashboard && (
          <NavItem to={builderPlaylistRoute(appData.modelName)}>
            <FormattedMessage {...messages.linkPlaylist} />
          </NavItem>
        )}
      </Box>
    </Box>
  );
};
