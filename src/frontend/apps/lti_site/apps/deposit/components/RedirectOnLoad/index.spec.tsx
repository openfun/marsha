import { screen } from '@testing-library/react';
import {
  FULL_SCREEN_ERROR_ROUTE,
  WithParams,
  appState,
  useAppConfig,
  useFlags,
} from 'lib-components';
import { render } from 'lib-tests';

import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';

import { DASHBOARD_ROUTE } from '../Dashboard/route';

import { RedirectOnLoad } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: jest.fn(),
}));
const mockedUseAppConfig = useAppConfig as jest.MockedFunction<
  typeof useAppConfig
>;

const initFlags = useFlags.getState().flags;

describe('<RedirectOnLoad />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    useFlags.getState().setFlags(initFlags);
  });

  it('redirects users to the error view on LTI error', () => {
    mockedUseAppConfig.mockReturnValue({
      state: appState.ERROR,
    } as any);
    useFlags.getState().setFlags({ deposit: true });

    render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code!}`}</span>}
              </WithParams>
            ),
          },
        ],
      },
    });

    expect(screen.getByText('Error Component: lti')).toBeInTheDocument();
  });

  it('shows not found error when feature is disabled', () => {
    mockedUseAppConfig.mockReturnValue({
      state: appState.SUCCESS,
    } as any);
    useFlags.getState().setFlags({ deposit: false });

    render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code!}`}</span>}
              </WithParams>
            ),
          },
        ],
      },
    });

    expect(screen.getByText('Error Component: notFound')).toBeInTheDocument();
  });

  it('shows dashboard', () => {
    mockedUseAppConfig.mockReturnValue({
      state: appState.SUCCESS,
    } as any);
    useFlags.getState().setFlags({ deposit: true });

    render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: DASHBOARD_ROUTE,
            element: <span>Dashboard</span>,
          },
        ],
      },
    });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('redirects to portability if app state requires it', () => {
    mockedUseAppConfig.mockReturnValue({
      state: appState.PORTABILITY,
    } as any);
    useFlags.getState().setFlags({ deposit: true });

    render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: RESOURCE_PORTABILITY_REQUEST_ROUTE,
            element: <span>Portability request</span>,
          },
        ],
      },
    });

    expect(screen.getByText('Portability request')).toBeInTheDocument();
  });
});
