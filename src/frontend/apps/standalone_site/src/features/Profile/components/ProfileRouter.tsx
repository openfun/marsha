import { Route, Switch } from 'react-router-dom';

import { Text404 } from 'components/Text';
import { routes } from 'routes';

import { ProfilePage } from './ProfilePage';
import { SettingsProfilePage } from './SettingsProfilePage';

export const ProfileRouter = () => {
  return (
    <Switch>
      <Route path={routes.PROFILE.path} exact>
        <ProfilePage />
      </Route>

      <Route path={routes.PROFILE.subRoutes.PROFILE_SETTINGS.path}>
        <SettingsProfilePage />
      </Route>

      <Route>
        <Text404 />
      </Route>
    </Switch>
  );
};
