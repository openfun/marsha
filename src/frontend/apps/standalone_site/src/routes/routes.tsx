import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

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
  LOGIN = 'LOGIN',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_RESET_CONFIRM = 'PASSWORD_RESET_CONFIRM',
}
enum EMyContentsSubRouteNames {
  //VIDEO = 'VIDEO',
  //LIVE = 'LIVE',
  CLASSROOM = 'CLASSROOM',
  //LESSON = 'LESSON',
}
enum EMyProfileSubRoutesNames {
  PROFILE_SETTINGS = 'PROFILE_SETTINGS',
}
enum EPlaylistSubRouteNames {
  UPDATE_PLAYLIST = 'UPDATE_PLAYLIST',
}

type BasicRoute = Omit<Route, 'subRoutes'>;

export interface Route {
  label?: React.ReactNode;
  path: string;
  alias?: string[];
  menuIcon?: React.ReactNode;
  isNavStrict?: boolean; // if true, all the subroutes will be active in the menu
  subRoutes?: { [key in string]: SubRoute };
}
type SubRoute = Route & { hideSubRoute?: boolean };

type Routes = {
  [key in ERouteNames as Exclude<
    ERouteNames,
    'CONTENTS' | 'PROFILE' | 'PLAYLIST'
  >]: BasicRoute;
} & {
  [ERouteNames.CONTENTS]: Route & {
    subRoutes: {
      [key in EMyContentsSubRouteNames]: SubRoute;
    };
  };
  [ERouteNames.PROFILE]: Route & {
    subRoutes: {
      [key in EMyProfileSubRoutesNames]: SubRoute;
    };
  };
  [ERouteNames.PLAYLIST]: Route & {
    subRoutes: {
      [key in EPlaylistSubRouteNames]: SubRoute;
    };
  };
};

const HomeIconSvg = () => {
  const intl = useIntl();
  return (
    <HomeIcon
      width={30}
      height={30}
      role="img"
      aria-label="svg-menu-homepage"
      title={intl.formatMessage(messages.menuHomePageLabel)}
    />
  );
};

const StarIconSvg = () => {
  const intl = useIntl();
  return (
    <StarIcon
      width={30}
      height={30}
      role="img"
      aria-label="svg-menu-favorites"
      title={intl.formatMessage(messages.menuFavoritesLabel)}
    />
  );
};

const ProfilIconSvg = () => {
  const intl = useIntl();
  return (
    <AvatarIcon
      width={30}
      height={30}
      role="img"
      aria-label="svg-menu-my-profile"
      title={intl.formatMessage(messages.menuMyProfileLabel)}
    />
  );
};

const PlaylistIconSvg = () => {
  const intl = useIntl();
  return (
    <VueListIcon
      width={30}
      height={30}
      role="img"
      aria-label="svg-menu-my-playlists"
      title={intl.formatMessage(messages.menuPlaylistLabel)}
    />
  );
};

const OrganizationIconSvg = () => {
  const intl = useIntl();
  return (
    <VueListIcon
      width={30}
      height={30}
      role="img"
      aria-label="svg-menu-my-organizations"
      title={intl.formatMessage(messages.menuMyOrganizationsLabel)}
    />
  );
};

const ContentIconSvg = () => {
  const intl = useIntl();
  return (
    <VueListIcon
      width={30}
      height={30}
      role="img"
      aria-label="svg-menu-my-contents"
      title={intl.formatMessage(messages.menuMyContentsLabel)}
    />
  );
};

const ClassroomIconSvg = () => {
  const intl = useIntl();
  return (
    <ClassroomsIcon
      width={30}
      height={30}
      role="img"
      aria-label="svg-menu-my-contents-classroom"
      title={intl.formatMessage(messages.menuContentsClassroomLabel)}
    />
  );
};

export const routes: Routes = {
  HOMEPAGE: {
    label: <FormattedMessage {...messages.menuHomePageLabel} />,
    path: `/`,
    menuIcon: <HomeIconSvg />,
  },
  FAVORITE: {
    label: <FormattedMessage {...messages.menuFavoritesLabel} />,
    path: `/favorites`,
    menuIcon: <StarIconSvg />,
  },
  LOGIN: {
    path: `/login`,
  },
  PASSWORD_RESET: {
    path: `/auth/password-reset`,
  },
  PASSWORD_RESET_CONFIRM: {
    path: `/auth/password-reset/confirm/:uid/:token?`,
  },
  PORTABILITY_REQUESTS: {
    path: `/portability-requests/:state?`,
  },
  PROFILE: {
    isNavStrict: true,
    label: <FormattedMessage {...messages.menuMyProfileLabel} />,
    path: `/my-profile`,
    menuIcon: <ProfilIconSvg />,
    subRoutes: {
      PROFILE_SETTINGS: {
        path: '/my-profile/settings',
      },
    },
  },

  PLAYLIST: {
    isNavStrict: true,
    label: <FormattedMessage {...messages.menuPlaylistLabel} />,
    path: `/my-playlists`,
    menuIcon: <PlaylistIconSvg />,
    subRoutes: {
      UPDATE_PLAYLIST: { path: '/my-playlists/:id/update', hideSubRoute: true },
    },
  },
  ORGANIZATION: {
    label: <FormattedMessage {...messages.menuMyOrganizationsLabel} />,
    path: `/my-organizations`,
    menuIcon: <OrganizationIconSvg />,
  },
  CONTENTS: {
    label: <FormattedMessage {...messages.menuMyContentsLabel} />,
    path: `/my-contents`,
    menuIcon: <ContentIconSvg />,
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
        menuIcon: <ClassroomIconSvg />,
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

export const CREATE_PLAYLIST_MODALE = `${routes.PLAYLIST.path}/create`;
