import { FormattedMessage, defineMessages } from 'react-intl';

import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';
import { LoadSVG } from 'components/Assets';
import { RouteRequired } from 'routes';

import { useContentFeatures } from '../store/contentsStore';

const messages = defineMessages({
  menuMyContentsLabel: {
    defaultMessage: 'My Contents',
    description: 'Label for the MyContents link in the main navigation menu',
    id: 'Contents.useContentRoutes.menuMyContentsLabel',
  },
});

const useContentRoutes = (): Record<'CONTENTS', RouteRequired> => {
  const { featureRoutes } = useContentFeatures((state) => ({
    featureRoutes: state.featureRoutes,
  }));

  return {
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
        ...featureRoutes,
      },
    },
  };
};

export default useContentRoutes;
