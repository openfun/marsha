import { Route, Routes } from 'react-router-dom';

import { Text404 } from 'components/Text';
import { routes } from 'routes';

import { ProfilePage } from './ProfilePage';
import { SettingsProfilePage } from './SettingsProfilePage';

export const ProfileRouter = () => {
  return (
    <Routes>
      <Route path="" element={<ProfilePage />} />
      <Route
        path={routes.PROFILE.subRoutes.PROFILE_SETTINGS.pathKey}
        element={<SettingsProfilePage />}
      />

      <Route path="*" element={<Text404 />} />
    </Routes>
  );
};
