import { screen } from '@testing-library/react';
import { ResponsiveContext } from 'grommet';
import { render } from 'lib-tests';

import { getFullThemeExtend } from 'styles/theme.extend';

import { Login } from './Login';

const fullTheme = getFullThemeExtend();

jest.mock('./LoginForm', () => ({
  LoginForm: () => <div>My LoginForm</div>,
}));

jest.mock('./RenaterAuthenticator', () => ({
  RenaterAuthenticator: () => <div>My RenaterAuthenticator</div>,
}));

jest.mock('features/Header', () => ({
  HeaderLight: () => <div>My HeaderLight</div>,
}));

describe('<Login />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('checks render.', () => {
    render(<Login />);

    expect(screen.getByLabelText(/Marsha logo/i)).toBeInTheDocument();
    expect(screen.getByText(/My LoginForm/i)).toBeInTheDocument();
    expect(screen.getByText(/My RenaterAuthenticator/i)).toBeInTheDocument();
  });

  it('checks responsive layout', () => {
    render(
      <ResponsiveContext.Provider value="xsmall">
        <Login />
      </ResponsiveContext.Provider>,
      {
        grommetOptions: {
          theme: fullTheme,
        },
      },
    );

    expect(screen.queryByLabelText(/Marsha logo/i)).not.toBeInTheDocument();
    expect(screen.getByText(/My HeaderLight/i)).toBeInTheDocument();
    expect(screen.getByText(/My RenaterAuthenticator/i)).toBeInTheDocument();
  });
});
