import { defineMessages, FormattedMessage } from 'react-intl';

import { ReactComponent as AvatarIcon } from 'assets/svg/iko_avatarsvg.svg';
import { ReactComponent as CheckListIcon } from 'assets/svg/iko_checklistsvg.svg';
import { ReactComponent as HomeIcon } from 'assets/svg/iko_homesvg.svg';
import { ReactComponent as StarIcon } from 'assets/svg/iko_starsvg.svg';
import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';

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
    defaultMessage: 'My playlists',
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
  menuContentsVirtualClassesLabel: {
    defaultMessage: 'Virtual Classes',
    description:
      'Label for the Virtual Classes link in the content navigation menu',
    id: 'routes.routes.menuContentsVirtualClassesLabel',
  },
  menuContentsLessonsLabel: {
    defaultMessage: 'Lessons',
    description: 'Label for the Lessons link in the content navigation menu',
    id: 'routes.routes.menuContentsLessonsLabel',
  },
});

export interface Route {
  label: React.ReactNode;
  path: string;
  alias?: string[];
  subRoutes?: Route[];
  menuIcon?: React.ReactNode;
}

enum ERouteNames {
  HomePage = 'HomePage',
  Favorites = 'Favorites',
  MyProfile = 'MyProfile',
  MyPlaylist = 'MyPlaylist',
  MyOrganizations = 'MyOrganizations',
  MyContents = 'MyContents',
}

type Routes = {
  [key in ERouteNames]: Route;
};

export const routes: Routes = {
  HomePage: {
    label: <FormattedMessage {...messages.menuHomePageLabel} />,
    path: `/`,
    menuIcon: <HomeIcon width={30} height={30} />,
  },
  Favorites: {
    label: <FormattedMessage {...messages.menuFavoritesLabel} />,
    path: `/favorites`,
    menuIcon: <StarIcon width={30} height={30} />,
  },
  MyProfile: {
    label: <FormattedMessage {...messages.menuMyProfileLabel} />,
    path: `/my-profile`,
    menuIcon: <AvatarIcon width={30} height={30} />,
  },
  MyPlaylist: {
    label: <FormattedMessage {...messages.menuPlaylistLabel} />,
    path: `/my-playlists`,
    menuIcon: <VueListIcon width={30} height={30} />,
  },
  MyOrganizations: {
    label: <FormattedMessage {...messages.menuMyOrganizationsLabel} />,
    path: `/my-organizations`,
    menuIcon: <VueListIcon width={30} height={30} />,
  },
  MyContents: {
    label: <FormattedMessage {...messages.menuMyContentsLabel} />,
    path: `/my-contents`,
    menuIcon: <VueListIcon width={30} height={30} />,
    subRoutes: [
      {
        label: <FormattedMessage {...messages.menuContentsVideosLabel} />,
        path: `/my-contents/videos`,
        menuIcon: <CheckListIcon width={30} height={30} />,
      },
      {
        label: <FormattedMessage {...messages.menuContentsLivesLabel} />,
        path: `/my-contents/lives`,
        menuIcon: <CheckListIcon width={30} height={30} />,
      },
      {
        label: (
          <FormattedMessage {...messages.menuContentsVirtualClassesLabel} />
        ),
        path: `/my-contents/virtual-classes`,
        menuIcon: <CheckListIcon width={30} height={30} />,
      },
      {
        label: <FormattedMessage {...messages.menuContentsLessonsLabel} />,
        path: `/my-contents/lessons`,
        menuIcon: <CheckListIcon width={30} height={30} />,
      },
    ],
  },
};
