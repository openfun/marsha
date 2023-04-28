import { Box } from 'grommet';
import { Fragment } from 'react';
import { Route, Switch } from 'react-router-dom';

import { Footer } from 'features/Footer';
import { routes } from 'routes';

import { BaseAuthenticationPage } from './BaseAuthenticationPage';
import { Login } from './Login';
import { PasswordReset, PasswordResetConfirm } from './PasswordReset';

const AuthRouter = () => {
  return (
    <Fragment>
      <BaseAuthenticationPage>
        <Switch>
          <Route path={routes.PASSWORD_RESET.path} exact>
            <PasswordReset />
          </Route>
          <Route path={routes.PASSWORD_RESET_CONFIRM.path} exact>
            <PasswordResetConfirm />
          </Route>
          <Route>
            <Login />
          </Route>
        </Switch>
      </BaseAuthenticationPage>
      <Box style={{ position: 'absolute', bottom: '0' }} width="100%">
        <Footer />
      </Box>
    </Fragment>
  );
};

export default AuthRouter;
