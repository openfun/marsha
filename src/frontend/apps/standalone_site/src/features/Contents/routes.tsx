import { defineMessages, FormattedMessage } from 'react-intl';

import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';
import { LoadSVG } from 'components/Assets';
import { RouteRequired } from 'routes';

import { useContentFeatures } from './store/contentsStore';

const messages = defineMessages({
  menuMyContentsLabel: {
    defaultMessage: 'My Contents',
    description: 'Label for the MyContents link in the main navigation menu',
    id: 'Contents.routes.menuMyContentsLabel',
  },
});

const routesContent = useContentFeatures.getState().featureRoutes;

const routes: Record<'CONTENTS', RouteRequired> = {
  CONTENTS: {
    label: <FormattedMessage {...messages.menuMyContentsLabel} />,
    path: `/my-contents`,
    menuIcon: (
      <LoadSVG
        Icon={VueListIcon}
        aria-label="svg-menu-my-contents"
        title={messages.menuMyContentsLabel}
      />
    ),
    subRoutes: {
      ...routesContent,
    },
  },
};

export default routes;
