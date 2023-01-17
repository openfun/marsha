import { Suspense } from 'react';
import { Route, Switch } from 'react-router-dom';

import { ContentSpinner } from 'components/Spinner';
import { routes } from 'routes';

import { ProfilePage } from './ProfilePage';
import { SettingsProfilePage } from './SettingsProfilePage';

export const ProfileRouter = () => {
  return (
    <Switch>
      <Route path={routes.PROFILE.path} exact>
        <Suspense fallback={<ContentSpinner />}>
          <ProfilePage />
        </Suspense>
      </Route>

      <Route path={routes.PROFILE.subRoutes.PROFILE_SETTINGS.path}>
        <Suspense fallback={<ContentSpinner />}>
          <SettingsProfilePage />
        </Suspense>
      </Route>
    </Switch>
  );
};
