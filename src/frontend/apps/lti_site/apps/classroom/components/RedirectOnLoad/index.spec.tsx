import { DASHBOARD_CLASSROOM_ROUTE } from 'lib-classroom';
import {
  FULL_SCREEN_ERROR_ROUTE,
  WithParams,
  appState,
  useAppConfig,
} from 'lib-components';
import { render } from 'lib-tests';

import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';

import { RedirectOnLoad } from '.';

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
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code}`}</span>}
              </WithParams>
            ),
          },
        ],
      },
    });

    expect(getByText('Error Component: lti')).toBeInTheDocument();
  });

  it('shows not found error when feature is disabled', () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { classroom: false },
    } as any);

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code}`}</span>}
              </WithParams>
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
            path: DASHBOARD_CLASSROOM_ROUTE,
            element: <span>Dashboard</span>,
          },
        ],
      },
    });

    getByText('Dashboard');
  });

  it('redirects to portability if app state requires it', async () => {
    mockedUseAppConfig.mockReturnValue({
      flags: { classroom: true },
      state: appState.PORTABILITY,
    } as any);

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: RESOURCE_PORTABILITY_REQUEST_ROUTE,
            element: <span>Portability request</span>,
          },
        ],
      },
    });

    getByText('Portability request');
  });
});
