import { defineMessages, FormattedMessage } from 'react-intl';

import { ReactComponent as VideoIcon } from 'assets/svg/iko_next.svg';
import { LoadSVG } from 'components/Assets';
import { RouteRequired } from 'routes';

const messages = defineMessages({
  menuContentsVideosLabel: {
    defaultMessage: 'Videos',
    description: 'Label for the video link in the content navigation menu',
    id: 'Contents.Video.routes.menuContentsVideosLabel',
  },
});

enum EVIDEOSubRouteNames {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
}

const routes: Record<'VIDEO', RouteRequired<EVIDEOSubRouteNames>> = {
  VIDEO: {
    label: <FormattedMessage {...messages.menuContentsVideosLabel} />,
    path: `/my-contents/videos`,
    pathKey: 'videos',
    menuIcon: (
      <LoadSVG
        Icon={VideoIcon}
        aria-label="svg-menu-my-contents-videos"
        title={messages.menuContentsVideosLabel}
      />
    ),
    subRoutes: {
      CREATE: {
        path: `/my-contents/videos/create`,
        pathKey: 'create',
      },
      UPDATE: {
        path: `/my-contents/videos/:videoId`,
        pathKey: ':videoId',
      },
    },
    isNavStrict: true,
  },
};

export default routes;
