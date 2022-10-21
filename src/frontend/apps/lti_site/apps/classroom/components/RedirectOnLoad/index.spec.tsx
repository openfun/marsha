import React from 'react';

import { FULL_SCREEN_ERROR_ROUTE } from 'lib-components';
import { useAppConfig } from 'lib-components';
import { appState } from 'lib-components';
import render from 'utils/tests/render';

import { RedirectOnLoad } from '.';
import { DASHBOARD_CLASSROOM_ROUTE } from '../DashboardClassroom/route';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: jest.fn(),
}));
const mockedUseAppConfig = useAppConfig as jest.MockedFunction<
  typeof useAppConfig
>;

describe('<RedirectOnLoad />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('redirects users to the error view on LTI error', () => {
    mockedUseAppConfig.mockReturnValue({
      state: appState.ERROR,
      flags: { classroom: true },
    } as any);

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: FULL_SCREEN_ERROR_ROUTE(),
            render: ({ match }) => (
              <span>{`Error Component: ${match.params.code}`}</span>
            ),
          },
        ],
      },
    });

    getByText('Error Component: lti');
  });

  it('shows not found error when feature is disabled', () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { classroom: false },
    } as any);

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: FULL_SCREEN_ERROR_ROUTE(),
            render: ({ match }) => (
              <span>{`Error Component: ${match.params.code}`}</span>
            ),
          },
        ],
      },
    });

    getByText('Error Component: notFound');
  });

  it('shows dashboard', async () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { classroom: true },
    } as any);

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: DASHBOARD_CLASSROOM_ROUTE(),
            render: () => <span>Dashboard</span>,
          },
        ],
      },
    });

    getByText('Dashboard');
  });
});
