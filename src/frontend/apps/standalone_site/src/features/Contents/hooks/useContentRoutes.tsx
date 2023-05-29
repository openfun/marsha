import { defineMessages, FormattedMessage } from 'react-intl';

import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';
import { LoadSVG } from 'components/Assets';
import { RouteRequired } from 'routes';

import { useContentFeatures } from '../store/contentsStore';

const messages = defineMessages({
  menuContentsLessonsLabel: {
    defaultMessage: 'Lessons',
    description: 'Label for the Lessons link in the content navigation menu',
    id: 'Contents.useContentRoutes.menuContentsLessonsLabel',
  },
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
        // LESSON: {
        //   label: <FormattedMessage {...messages.menuContentsLessonsLabel} />,
        //   path: `/my-contents/lessons`,
        //   menuIcon: (
        //     <CheckListIcon
        //       width={30}
        //       height={30}
        //       role="img"
        //       aria-label="svg-menu-my-contents-lessons"
        //     />
        //   ),
        // },
      },
    },
  };
};

export default useContentRoutes;
