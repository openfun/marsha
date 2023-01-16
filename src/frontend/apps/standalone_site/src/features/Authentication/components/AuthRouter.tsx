import { Route, Switch } from 'react-router-dom';

import { routes } from 'routes';

import { BaseAuthenticationPage } from './BaseAuthenticationPage';
import { Login } from './Login';
import { PasswordReset, PasswordResetConfirm } from './PasswordReset';

const AuthRouter = () => {
  return (
    <BaseAuthenticationPage>
      <Switch>
        <Route path={routes.LOGIN.path} exact>
          <Login />
        </Route>
        <Route path={routes.PASSWORD_RESET.path} exact>
          <PasswordReset />
        </Route>
        <Route path={routes.PASSWORD_RESET_CONFIRM.path} exact>
          <PasswordResetConfirm />
        </Route>
      </Switch>
    </BaseAuthenticationPage>
  );
};

export default AuthRouter;
