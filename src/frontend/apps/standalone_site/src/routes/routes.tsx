import { defineMessages, FormattedMessage } from 'react-intl';

import { ReactComponent as AvatarIcon } from 'assets/svg/iko_avatarsvg.svg';
import { ReactComponent as HomeIcon } from 'assets/svg/iko_homesvg.svg';
import { ReactComponent as StarIcon } from 'assets/svg/iko_starsvg.svg';
import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';
import { LoadSVG } from 'components/Assets';

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
});

enum ERouteNames {
  HOMEPAGE = 'HOMEPAGE',
  FAVORITE = 'FAVORITE',
  PORTABILITY_REQUESTS = 'PORTABILITY_REQUESTS',
  PROFILE = 'PROFILE',

  PLAYLIST = 'PLAYLIST',
  ORGANIZATION = 'ORGANIZATION',
  LOGIN = 'LOGIN',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_RESET_CONFIRM = 'PASSWORD_RESET_CONFIRM',
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
  path: string;
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
  FAVORITE: {
    label: <FormattedMessage {...messages.menuFavoritesLabel} />,
    path: `/favorites`,
    menuIcon: (
      <LoadSVG
        Icon={StarIcon}
        aria-label="svg-menu-favorites"
        title={messages.menuFavoritesLabel}
      />
    ),
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
      CREATE: { path: '/my-playlists/create', hideSubRoute: true },
      UPDATE: { path: '/my-playlists/:id/update', hideSubRoute: true },
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
