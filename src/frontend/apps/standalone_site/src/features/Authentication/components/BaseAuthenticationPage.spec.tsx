import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { ResponsiveContext } from 'grommet';
import { render } from 'lib-tests';

import { getFullThemeExtend } from 'styles/theme.extend';

import { BaseAuthenticationPage } from './BaseAuthenticationPage';

const fullTheme = getFullThemeExtend();

describe('<BaseAuthenticationPage />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('checks render.', () => {
    render(
      <BaseAuthenticationPage>
        <div>My content</div>
      </BaseAuthenticationPage>,
    );

    expect(screen.getByLabelText(/Marsha logo/i)).toBeInTheDocument();
    expect(screen.getByText(/My content/i)).toBeInTheDocument();
  });

  it('checks responsive layout', () => {
    render(
      <ResponsiveContext.Provider value="xsmall">
        <BaseAuthenticationPage>
          <div>My content</div>
        </BaseAuthenticationPage>
      </ResponsiveContext.Provider>,
      {
        grommetOptions: {
          theme: fullTheme,
        },
      },
    );

    expect(screen.queryByLabelText(/Marsha logo/i)).not.toBeInTheDocument();
    expect(screen.getByText(/My content/i)).toBeInTheDocument();
  });
});
