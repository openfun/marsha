import { Grommet, Main, Page } from 'grommet';
import { BrowserRouter } from 'react-router-dom';

import { Authenticator } from 'features/Authentication';
import { AppRoutes } from 'routes';
import { themeExtend } from 'styles/theme.extend';

import './App.css';

const App = () => {
  return (
    <Grommet theme={themeExtend}>
      <BrowserRouter>
        <Authenticator>
          <Main>
            <Page kind="full">
              <AppRoutes />
            </Page>
          </Main>
        </Authenticator>
      </BrowserRouter>
    </Grommet>
  );
};

export default App;
