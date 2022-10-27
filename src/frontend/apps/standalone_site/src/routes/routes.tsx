import { defineMessages, FormattedMessage } from 'react-intl';

import { ReactComponent as AvatarIcon } from 'assets/svg/iko_avatarsvg.svg';
//import { ReactComponent as CheckListIcon } from 'assets/svg/iko_checklistsvg.svg';
import { ReactComponent as HomeIcon } from 'assets/svg/iko_homesvg.svg';
import { ReactComponent as StarIcon } from 'assets/svg/iko_starsvg.svg';
import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';
import { ReactComponent as ClassroomsIcon } from 'assets/svg/iko_webinairesvg.svg';

const messages = defineMessages({
  menuHomePageLabel: {
    defaultMessage: 'Dashboard',
    description: 'Label for the homepage link in the main navigation menu',
    id: 'routes.routes.menuHomePageLabel',
  },
  menuFavoritesLabel: {
    defaultMessage: 'Favorites',
    description: 'Label for the favorites link in the main navigation menu',
    id: 'routes.routes.menuFavoritesLabel',
  },
  menuMyProfileLabel: {
    defaultMessage: 'My Profile',
    description: 'Label for the My Profile link in the main navigation menu',
    id: 'routes.routes.menuMyProfileLabel',
  },
  menuPlaylistLabel: {
    defaultMessage: 'My Playlists',
    description: 'Label for the My playlists link in the main navigation menu',
    id: 'routes.routes.menuPlaylistLabel',
  },
  menuMyOrganizationsLabel: {
    defaultMessage: 'My Organizations',
    description:
      'Label for the My Organizations link in the main navigation menu',
    id: 'routes.routes.menuMyOrganizationsLabel',
  },
  menuMyContentsLabel: {
    defaultMessage: 'My Contents',
    description: 'Label for the MyContents link in the main navigation menu',
    id: 'routes.routes.menuMyContentsLabel',
  },
  menuContentsVideosLabel: {
    defaultMessage: 'Videos',
    description: 'Label for the video link in the content navigation menu',
    id: 'routes.routes.menuContentsVideosLabel',
  },
  menuContentsLivesLabel: {
    defaultMessage: 'Lives',
    description: 'Label for the lives link in the content navigation menu',
    id: 'routes.routes.menuContentsLivesLabel',
  },
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
    id: 'routes.routes.menuContentsLessonsLabel',
  },
});

enum ERouteNames {
  HOMEPAGE = 'HOMEPAGE',
  FAVORITE = 'FAVORITE',
  PORTABILITY_REQUESTS = 'PORTABILITY_REQUESTS',
  PROFILE = 'PROFILE',
  PLAYLIST = 'PLAYLIST',
  ORGANIZATION = 'ORGANIZATION',
  CONTENTS = 'CONTENTS',
}
enum EMyContentsSubRouteNames {
  //VIDEO = 'VIDEO',
  //LIVE = 'LIVE',
  CLASSROOM = 'CLASSROOM',
  //LESSON = 'LESSON',
}

type BasicRoute = Omit<Route, 'subRoutes'>;

export interface Route {
  label?: React.ReactNode;
  path: string;
  alias?: string[];
  menuIcon?: React.ReactNode;
  isNavStrict?: boolean; // if true, all the subroutes will be active in the menu
  subRoutes?: { [key in string]: Route };
}

type Routes = {
  [key in ERouteNames as Exclude<ERouteNames, 'CONTENTS'>]: BasicRoute;
} & {
  [ERouteNames.CONTENTS]: Route & {
    subRoutes: {
      [key in EMyContentsSubRouteNames]: Route;
    };
  };
};

export const routes: Routes = {
  HOMEPAGE: {
    label: <FormattedMessage {...messages.menuHomePageLabel} />,
    path: `/`,
    menuIcon: (
      <HomeIcon
        width={30}
        height={30}
        role="img"
        aria-label="svg-menu-homepage"
      />
    ),
  },
  FAVORITE: {
    label: <FormattedMessage {...messages.menuFavoritesLabel} />,
    path: `/favorites`,
    menuIcon: (
      <StarIcon
        width={30}
        height={30}
        role="img"
        aria-label="svg-menu-favorites"
      />
    ),
  },
  PORTABILITY_REQUESTS: {
    path: `/portability-requests/:state?`,
  },
  PROFILE: {
    label: <FormattedMessage {...messages.menuMyProfileLabel} />,
    path: `/my-profile`,
    menuIcon: (
      <AvatarIcon
        width={30}
        height={30}
        role="img"
        aria-label="svg-menu-my-profile"
      />
    ),
  },
  PLAYLIST: {
    label: <FormattedMessage {...messages.menuPlaylistLabel} />,
    path: `/my-playlists`,
    menuIcon: (
      <VueListIcon
        width={30}
        height={30}
        role="img"
        aria-label="svg-menu-my-playlists"
      />
    ),
  },
  ORGANIZATION: {
    label: <FormattedMessage {...messages.menuMyOrganizationsLabel} />,
    path: `/my-organizations`,
    menuIcon: (
      <VueListIcon
        width={30}
        height={30}
        role="img"
        aria-label="svg-menu-my-organizations"
      />
    ),
  },
  CONTENTS: {
    label: <FormattedMessage {...messages.menuMyContentsLabel} />,
    path: `/my-contents`,
    menuIcon: (
      <VueListIcon
        width={30}
        height={30}
        role="img"
        aria-label="svg-menu-my-contents"
      />
    ),
    subRoutes: {
      // VIDEO: {
      //   label: <FormattedMessage {...messages.menuContentsVideosLabel} />,
      //   path: `/my-contents/videos`,
      //   menuIcon: (
      //     <CheckListIcon
      //       width={30}
      //       height={30}
      //       role="img"
      //       aria-label="svg-menu-my-contents-videos"
      //     />
      //   ),
      // },
      // LIVE: {
      //   label: <FormattedMessage {...messages.menuContentsLivesLabel} />,
      //   path: `/my-contents/lives`,
      //   menuIcon: (
      //     <CheckListIcon
      //       width={30}
      //       height={30}
      //       role="img"
      //       aria-label="svg-menu-my-contents-live"
      //     />
      //   ),
      // },
      CLASSROOM: {
        label: <FormattedMessage {...messages.menuContentsClassroomLabel} />,
        path: `/my-contents/classroom`,
        menuIcon: (
          <ClassroomsIcon
            width={30}
            height={30}
            role="img"
            aria-label="svg-menu-my-contents-classroom"
          />
        ),
        subRoutes: {
          CREATE: {
            label: (
              <FormattedMessage
                {...messages.menuContentsClassroomCreateLabel}
              />
            ),
            path: `/my-contents/classroom/create`,
          },
          UPDATE: {
            path: `/my-contents/classroom/:classroomId`,
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

export const CREATE_PLAYLIST_MODALE = `${routes.PLAYLIST.path}/create`;
