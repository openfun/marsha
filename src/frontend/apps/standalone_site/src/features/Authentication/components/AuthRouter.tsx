import { Box, useResponsive } from 'lib-components';
import { Fragment } from 'react';
import { Route, Routes } from 'react-router-dom';

import { Footer } from 'features/Footer';
import { routes } from 'routes';

import { BaseAuthenticationPage } from './BaseAuthenticationPage';
import { Login } from './Login';
import { PasswordReset, PasswordResetConfirm } from './PasswordReset';

const AuthRouter = () => {
  const { breakpoint, isSmallerBreakpoint } = useResponsive();
  const isSmallerXsmedium = isSmallerBreakpoint(breakpoint, 'xsmedium');

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
      <Box
        style={{
          position: isSmallerXsmedium ? 'initial' : 'absolute',
          bottom: '0',
        }}
        fill="horizontal"
      >
        <Footer withoutWave={isSmallerXsmedium} />
      </Box>
    </Fragment>
  );
};

export default AuthRouter;
