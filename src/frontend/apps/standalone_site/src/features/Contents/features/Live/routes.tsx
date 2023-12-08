import { FormattedMessage, defineMessages } from 'react-intl';

import LiveIcon from 'assets/svg/iko_live.svg?react';
import { LoadSVG } from 'components/Assets';
import { RouteRequired } from 'routes';

const messages = defineMessages({
  menuContentsLivesLabel: {
    defaultMessage: 'Webinars',
    description: 'Label for the webinars link in the content navigation menu',
    id: 'Contents.Live.routes.menuContentsLivesLabel',
  },
});

enum ELIVESubRouteNames {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
}

const routes: Record<'LIVE', RouteRequired<ELIVESubRouteNames>> = {
  LIVE: {
    label: <FormattedMessage {...messages.menuContentsLivesLabel} />,
    path: `/my-contents/webinars`,
    pathKey: 'webinars',
    menuIcon: (
      <LoadSVG
        Icon={LiveIcon}
        aria-label="svg-menu-my-contents-live"
        title={messages.menuContentsLivesLabel}
      />
    ),
    subRoutes: {
      CREATE: {
        path: `/my-contents/webinars/create`,
        pathKey: 'create',
      },
      UPDATE: {
        path: `/my-contents/webinars/:liveId`,
        pathKey: ':liveId',
      },
    },
    isNavStrict: true,
  },
};

export default routes;
