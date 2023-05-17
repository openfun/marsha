import { defineMessages, FormattedMessage } from 'react-intl';

import { ReactComponent as ClassroomsIcon } from 'assets/svg/iko_webinairesvg.svg';
import { LoadSVG } from 'components/Assets';
import { RouteRequired } from 'routes';

const messages = defineMessages({
  menuContentsClassroomLabel: {
    defaultMessage: 'Classrooms',
    description: 'Label for the Classroom link in the content navigation menu',
    id: 'Contents.Classroom.routes.menuContentsClassroomsLabel',
  },
});

enum ECLASSROOMSubRouteNames {
  CREATE = 'CREATE',
  INVITE = 'INVITE',
  UPDATE = 'UPDATE',
}

const routes: Record<'CLASSROOM', RouteRequired<ECLASSROOMSubRouteNames>> = {
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
};

export default routes;
