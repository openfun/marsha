import { FormattedMessage, defineMessages } from 'react-intl';

import AvatarIcon from 'assets/svg/iko_avatarsvg.svg?react';
import HomeIcon from 'assets/svg/iko_homesvg.svg?react';
import VueListIcon from 'assets/svg/iko_vuelistesvg.svg?react';
import { LoadSVG } from 'components/Assets';

const messages = defineMessages({
  menuHomePageLabel: {
    defaultMessage: 'Dashboard',
    description: 'Label for the homepage link in the main navigation menu',
    id: 'routes.routes.menuHomePageLabel',
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
});

enum ERouteNames {
  HOMEPAGE = 'HOMEPAGE',
  PORTABILITY_REQUESTS = 'PORTABILITY_REQUESTS',
  PROFILE = 'PROFILE',

  PLAYLIST = 'PLAYLIST',
  ORGANIZATION = 'ORGANIZATION',
  LOGIN = 'LOGIN',
  PASSWORD_RESET = 'PASSWORD_RESET',
  CLAIM_RESOURCE = 'CLAIM_RESOURCE',
}
enum EPasswordResetSubRoutesNames {
  CONFIRM = 'CONFIRM',
}
enum EMyProfileSubRoutesNames {
  PROFILE_SETTINGS = 'PROFILE_SETTINGS',
}
enum EPlaylistSubRouteNames {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
}

type BasicRoute = Omit<Route, 'subRoutes'>;

export interface Route<TSubRoute extends string = string> {
  label?: React.ReactNode;
  path: string; // when we need a full path
  pathKey?: string; // when we need a relative path
  alias?: string[];
  menuIcon?: React.ReactNode;
  isNavStrict?: boolean; // if true, all the subroutes will be active in the menu
  subRoutes?: Record<TSubRoute, SubRoute>;
}
export type RouteRequired<T extends string = string> = BasicRoute &
  Pick<Required<Route<T>>, 'subRoutes'>;
type SubRoute = Route & { hideSubRoute?: boolean };

export type MainRoutes = {
  [key in ERouteNames]: BasicRoute;
} & {
  [ERouteNames.PASSWORD_RESET]: RouteRequired<EPasswordResetSubRoutesNames>;
  [ERouteNames.PROFILE]: RouteRequired<EMyProfileSubRoutesNames>;
  [ERouteNames.PLAYLIST]: RouteRequired<EPlaylistSubRouteNames>;
};

export const routes: MainRoutes = {
  HOMEPAGE: {
    label: <FormattedMessage {...messages.menuHomePageLabel} />,
    path: `/`,
    menuIcon: (
      <LoadSVG
        Icon={HomeIcon}
        aria-label="svg-menu-homepage"
        title={messages.menuHomePageLabel}
      />
    ),
  },
  LOGIN: {
    path: `/login`,
  },
  PASSWORD_RESET: {
    path: `/auth/password-reset`,
    subRoutes: {
      CONFIRM: {
        path: '/auth/password-reset/confirm/:uid/:token',
        pathKey: 'confirm/:uid/:token',
      },
    },
  },
  CLAIM_RESOURCE: {
    path: `/claim-resource`,
  },
  PORTABILITY_REQUESTS: {
    path: '/portability-requests',
  },
  PROFILE: {
    isNavStrict: true,
    label: <FormattedMessage {...messages.menuMyProfileLabel} />,
    path: `/my-profile`,
    menuIcon: (
      <LoadSVG
        Icon={AvatarIcon}
        aria-label="svg-menu-my-profile"
        title={messages.menuMyProfileLabel}
      />
    ),
    subRoutes: {
      PROFILE_SETTINGS: {
        path: '/my-profile/settings',
        pathKey: 'settings',
      },
    },
  },

  PLAYLIST: {
    isNavStrict: true,
    label: <FormattedMessage {...messages.menuPlaylistLabel} />,
    path: `/my-playlists`,
    menuIcon: (
      <LoadSVG
        Icon={VueListIcon}
        aria-label="svg-menu-my-playlists"
        title={messages.menuPlaylistLabel}
      />
    ),
    subRoutes: {
      CREATE: {
        path: '/my-playlists/create',
        pathKey: 'create',
        hideSubRoute: true,
      },
      UPDATE: {
        path: '/my-playlists/:id/update',
        pathKey: ':id/update',
        hideSubRoute: true,
      },
    },
  },
  ORGANIZATION: {
    label: <FormattedMessage {...messages.menuMyOrganizationsLabel} />,
    path: `/my-organizations`,
    menuIcon: (
      <LoadSVG
        Icon={VueListIcon}
        aria-label="svg-menu-my-organizations"
        title={messages.menuMyOrganizationsLabel}
      />
    ),
  },
};
