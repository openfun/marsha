import { Box } from 'grommet';
import { Fragment } from 'react';
import { Route, Routes } from 'react-router-dom';

import { Footer } from 'features/Footer';
import { routes } from 'routes';

import { BaseAuthenticationPage } from './BaseAuthenticationPage';
import { Login } from './Login';
import { PasswordReset, PasswordResetConfirm } from './PasswordReset';

const AuthRouter = () => {
  return (
    <Fragment>
      <BaseAuthenticationPage>
        <Routes>
          <Route path={`${routes.PASSWORD_RESET.path}/*`}>
            <Route path="" element={<PasswordReset />} />
            <Route
              path={routes.PASSWORD_RESET.subRoutes.CONFIRM.pathKey}
              element={<PasswordResetConfirm />}
            />
            <Route path="*" element={<Login />} />
          </Route>
          <Route path="*" element={<Login />} />
        </Routes>
      </BaseAuthenticationPage>
      <Box style={{ position: 'absolute', bottom: '0' }} width="100%">
        <Footer />
      </Box>
    </Fragment>
  );
};

export default AuthRouter;
