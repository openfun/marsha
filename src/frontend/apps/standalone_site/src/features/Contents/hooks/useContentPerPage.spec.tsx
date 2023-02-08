import { screen } from '@testing-library/react';
import { ResponsiveContext } from 'grommet';
import { render } from 'lib-tests';

import { getFullThemeExtend } from 'styles/theme.extend';

import useContentPerPage from './useContentPerPage';

const fullTheme = getFullThemeExtend();

const TestComponent = () => {
  const contentPerPage = useContentPerPage();
  return <div>My content per page is:{contentPerPage}</div>;
};

describe('useResponsive', () => {
  it('checks the content per page when responsive is xxsmall', () => {
    render(
      <ResponsiveContext.Provider value="xxsmall">
        <TestComponent />
      </ResponsiveContext.Provider>,
      {
        grommetOptions: {
          theme: fullTheme,
        },
      },
    );
    expect(screen.getByText(/My content per page is:4/i)).toBeInTheDocument();
  });

  it('checks the content per page when responsive is small', () => {
    render(
      <ResponsiveContext.Provider value="small">
        <TestComponent />
      </ResponsiveContext.Provider>,
      {
        grommetOptions: {
          theme: fullTheme,
        },
      },
    );
    expect(screen.getByText(/My content per page is:8/i)).toBeInTheDocument();
  });

  it('checks the content per page when responsive is large', () => {
    render(
      <ResponsiveContext.Provider value="large">
        <TestComponent />
      </ResponsiveContext.Provider>,
      {
        grommetOptions: {
          theme: fullTheme,
        },
      },
    );
    expect(screen.getByText(/My content per page is:20/i)).toBeInTheDocument();
  });
});
