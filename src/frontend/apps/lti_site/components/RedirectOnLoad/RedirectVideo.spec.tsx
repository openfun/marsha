import { screen } from '@testing-library/react';
import {
  FULL_SCREEN_ERROR_ROUTE,
  LiveModeType,
  WithParams,
  builderDashboardRoute,
  modelName,
  uploadState,
  useCurrentResourceContext,
} from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';

import {
  VIDEO_WIZARD_ROUTE,
  VideoWizzardSubPage,
  builderPlayerRoute,
  builderVideoWizzardRoute,
} from 'components/routes';

import { RedirectVideo } from './RedirectVideo';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useCurrentResourceContext: jest.fn(),
}));
const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

describe('RedirectVideo', () => {
  beforeEach(() => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_update: true,
        },
      },
    ] as any);
  });

  it('redirects to the dashboard when the video is a live and user has update permission', () => {
    const video = videoMockFactory({
      is_ready_to_show: true,
      live_type: LiveModeType.JITSI,
    });

    render(<RedirectVideo video={video} />, {
      routerOptions: {
        routes: [
          {
            path: builderDashboardRoute(modelName.VIDEOS),
            element: <span>dashboard</span>,
          },
          {
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code!}`}</span>}
              </WithParams>
            ),
          },
          {
            path: builderPlayerRoute(modelName.VIDEOS),
            element: <span>video player</span>,
          },
          { path: VIDEO_WIZARD_ROUTE.base, element: <span>wizard</span> },
        ],
      },
    });

    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('redirects to the player when the video is ready to show', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_update: false,
        },
      },
    ] as any);
    const liveTypes = [null, LiveModeType.JITSI];
    const video = videoMockFactory({
      is_ready_to_show: true,
      live_type: liveTypes[Math.floor(Math.random() * liveTypes.length)],
    });

    render(<RedirectVideo video={video} />, {
      routerOptions: {
        routes: [
          {
            path: builderDashboardRoute(modelName.VIDEOS),
            element: <span>dashboard</span>,
          },
          {
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code!}`}</span>}
              </WithParams>
            ),
          },
          {
            path: builderPlayerRoute(modelName.VIDEOS),
            element: <span>video player</span>,
          },
          {
            path: builderVideoWizzardRoute(),
            element: <span>wizard</span>,
          },
        ],
      },
    });

    expect(screen.getByText('video player')).toBeInTheDocument();
  });

  it('redirects to the wizard when the user has update permission', () => {
    const video = videoMockFactory({
      is_ready_to_show: false,
      title: null,
    });

    render(<RedirectVideo video={video} />, {
      routerOptions: {
        routes: [
          {
            path: builderDashboardRoute(modelName.VIDEOS),
            element: <span>dashboard</span>,
          },
          {
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code!}`}</span>}
              </WithParams>
            ),
          },
          {
            path: builderPlayerRoute(modelName.VIDEOS),
            element: <span>video player</span>,
          },
          {
            path: builderVideoWizzardRoute(),
            element: <span>wizard</span>,
          },
          {
            path: builderVideoWizzardRoute(VideoWizzardSubPage.createVideo),
            element: <span> VOD creation</span>,
          },
        ],
      },
    });

    expect(screen.getByText('wizard')).toBeInTheDocument();
  });

  it('redirects to the wizard VOD creation when the video update state is initialized', () => {
    const video = videoMockFactory({
      is_ready_to_show: false,
      title: 'Not blank title',
      upload_state: uploadState.INITIALIZED,
    });

    render(<RedirectVideo video={video} />, {
      routerOptions: {
        routes: [
          {
            path: builderDashboardRoute(modelName.VIDEOS),
            element: <span>dashboard</span>,
          },
          {
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code!}`}</span>}
              </WithParams>
            ),
          },
          {
            path: builderPlayerRoute(modelName.VIDEOS),
            element: <span>video player</span>,
          },
          {
            path: builderVideoWizzardRoute(),
            element: <span>wizard</span>,
          },
          {
            path: builderVideoWizzardRoute(VideoWizzardSubPage.createVideo),
            element: <span>VOD creation</span>,
          },
        ],
      },
    });

    expect(screen.getByText('VOD creation')).toBeInTheDocument();
  });

  it('redirects to the error view when the user has no update permission and the video is not ready to show', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_update: false,
        },
      },
    ] as any);
    const video = videoMockFactory({
      is_ready_to_show: false,
    });

    render(<RedirectVideo video={video} />, {
      routerOptions: {
        routes: [
          {
            path: builderDashboardRoute(modelName.VIDEOS),
            element: <span>dashboard</span>,
          },
          {
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code!}`}</span>}
              </WithParams>
            ),
          },
          {
            path: builderPlayerRoute(modelName.VIDEOS),
            element: <span>video player</span>,
          },
          {
            path: builderVideoWizzardRoute(),
            element: <span>wizard</span>,
          },
        ],
      },
    });

    expect(screen.getByText('Error Component: notFound')).toBeInTheDocument();
  });

  it('redirects to the error view when the video is deleted', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_update: false,
        },
      },
    ] as any);
    const video = videoMockFactory({
      upload_state: uploadState.DELETED,
      is_ready_to_show: false,
    });

    render(<RedirectVideo video={video} />, {
      routerOptions: {
        routes: [
          {
            path: builderDashboardRoute(modelName.VIDEOS),
            element: <span>dashboard</span>,
          },
          {
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code!}`}</span>}
              </WithParams>
            ),
          },
          {
            path: builderPlayerRoute(modelName.VIDEOS),
            element: <span>video player</span>,
          },
          {
            path: builderVideoWizzardRoute(),
            element: <span>wizard</span>,
          },
        ],
      },
    });

    expect(
      screen.getByText('Error Component: videoDeleted'),
    ).toBeInTheDocument();
  });

  it('redirects to the player view when the starting date is set to past', () => {
    const startingAtPast = new Date();
    startingAtPast.setFullYear(startingAtPast.getFullYear() - 10);
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_update: false,
        },
      },
    ] as any);
    const video = videoMockFactory({
      is_ready_to_show: false,
      starting_at: startingAtPast.toISOString(),
    });

    render(<RedirectVideo video={video} />, {
      routerOptions: {
        routes: [
          {
            path: builderDashboardRoute(modelName.VIDEOS),
            element: <span>dashboard</span>,
          },
          {
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code!}`}</span>}
              </WithParams>
            ),
          },
          {
            path: builderPlayerRoute(modelName.VIDEOS),
            element: <span>video player</span>,
          },
          {
            path: builderVideoWizzardRoute(),
            element: <span>wizard</span>,
          },
        ],
      },
    });

    expect(screen.getByText('video player')).toBeInTheDocument();
  });

  it('redirects to the player view when the starting date is set to future', () => {
    const startingAt = new Date();
    startingAt.setDate(startingAt.getDate() + 10);
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_update: false,
        },
      },
    ] as any);
    const video = videoMockFactory({
      is_ready_to_show: false,
      starting_at: startingAt.toISOString(),
    });

    render(<RedirectVideo video={video} />, {
      routerOptions: {
        routes: [
          {
            path: builderDashboardRoute(modelName.VIDEOS),
            element: <span>dashboard</span>,
          },
          {
            path: FULL_SCREEN_ERROR_ROUTE.default,
            element: (
              <WithParams>
                {({ code }) => <span>{`Error Component: ${code!}`}</span>}
              </WithParams>
            ),
          },
          {
            path: builderPlayerRoute(modelName.VIDEOS),
            element: <span>video player</span>,
          },
          {
            path: builderVideoWizzardRoute(),
            element: <span>wizard</span>,
          },
        ],
      },
    });

    expect(screen.getByText('video player')).toBeInTheDocument();
  });
});
