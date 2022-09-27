import { ReactComponent as AvatarIcon } from 'assets/svg/iko_avatarsvg.svg';
import { ReactComponent as CheckListIcon } from 'assets/svg/iko_checklistsvg.svg';
import { ReactComponent as HomeIcon } from 'assets/svg/iko_homesvg.svg';
import { ReactComponent as StarIcon } from 'assets/svg/iko_starsvg.svg';
import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';

export interface Route {
  label: string;
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
    label: 'Dashboard',
    path: `/`,
    menuIcon: <HomeIcon width={30} height={30} />,
  },
  Favorites: {
    label: 'Favorites',
    path: `/favorites`,
    menuIcon: <StarIcon width={30} height={30} />,
  },
  MyProfile: {
    label: 'My Profile',
    path: `/my-profile`,
    menuIcon: <AvatarIcon width={30} height={30} />,
  },
  MyPlaylist: {
    label: 'My playlists',
    path: `/my-playlists`,
    menuIcon: <VueListIcon width={30} height={30} />,
  },
  MyOrganizations: {
    label: 'My Organizations',
    path: `/my-organizations`,
    menuIcon: <VueListIcon width={30} height={30} />,
  },
  MyContents: {
    label: 'My Contents',
    path: `/my-contents`,
    menuIcon: <VueListIcon width={30} height={30} />,
    subRoutes: [
      {
        label: 'Vidéos',
        path: `/my-contents/videos`,
        menuIcon: <CheckListIcon width={30} height={30} />,
      },
      {
        label: 'Lives',
        path: `/my-contents/lives`,
        menuIcon: <CheckListIcon width={30} height={30} />,
      },
      {
        label: 'Classes virtuelles',
        path: `/my-contents/classes-virtuelles`,
        menuIcon: <CheckListIcon width={30} height={30} />,
      },
      {
        label: 'Leçons',
        path: `/my-contents/lecons`,
        menuIcon: <CheckListIcon width={30} height={30} />,
      },
    ],
  },
};
