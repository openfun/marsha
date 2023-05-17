import { defineMessages, FormattedMessage } from 'react-intl';

import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';
import { ReactComponent as ClassroomsIcon } from 'assets/svg/iko_webinairesvg.svg';
import { LoadSVG } from 'components/Assets';
import { RouteRequired } from 'routes';

import { useContentFeatures } from './store/contentsStore';

const messages = defineMessages({
  menuContentsClassroomLabel: {
    defaultMessage: 'Classrooms',
    description: 'Label for the Classroom link in the content navigation menu',
    id: 'routes.routes.menuContentsClassroomsLabel',
  },
  menuContentsClassroomCreateLabel: {
    defaultMessage: 'Create Classroom',
    description: 'Label for the Create Classrooms link',
    id: 'routes.routes.menuContentsClassroomsCreateLabel',
  },
  menuContentsLessonsLabel: {
    defaultMessage: 'Lessons',
    description: 'Label for the Lessons link in the content navigation menu',
    id: 'Contents.routes.menuContentsLessonsLabel',
  },
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
      CLASSROOM: {
        label: <FormattedMessage {...messages.menuContentsClassroomLabel} />,
        path: `/my-contents/classroom`,
        menuIcon: (
          <LoadSVG
            Icon={ClassroomsIcon}
            aria-label="svg-menu-my-contents-classroom"
            title={messages.menuContentsClassroomLabel}
          />
        ),
        subRoutes: {
          CREATE: {
            path: `/my-contents/classroom/create`,
          },
          UPDATE: {
            path: `/my-contents/classroom/:classroomId`,
          },
          INVITE: {
            path: `/my-contents/classroom/:classroomId/invite/:inviteId`,
          },
        },
        isNavStrict: true,
      },
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

export default routes;
