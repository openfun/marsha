import { cleanup, screen } from '@testing-library/react';
import {
  DASHBOARD_ROUTE,
  FULL_SCREEN_ERROR_ROUTE,
  WithParams,
  appState,
  modelName,
  uploadState,
  useAppConfig,
  useCurrentResourceContext,
} from 'lib-components';
import { render } from 'lib-tests';

import { SELECT_CONTENT_ROUTE } from 'components/SelectContent/route';
import { builderPlayerRoute } from 'components/routes';

import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from '../PortabilityRequest/route';

import { RedirectOnLoad } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: jest.fn(),
  useCurrentResourceContext: jest.fn(),
}));
const mockedUseAppConfig = useAppConfig as jest.MockedFunction<
  typeof useAppConfig
>;

const mockedUseCurrentResource =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

describe('<RedirectOnLoad />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('redirects users to the error view on LTI error', () => {
    mockedUseAppConfig.mockReturnValue({
      state: appState.ERROR,
      video: null,
      document: null,
      modelName: modelName.VIDEOS,
    } as any);
    mockedUseCurrentResource.mockReturnValue([
      { permissions: { can_update: undefined } },
    ] as any);

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

  it('redirects users to the error view when there is no resource', () => {
    mockedUseAppConfig.mockReturnValue({
      state: appState.SUCCESS,
      video: null,
      document: null,
      modelName: modelName.VIDEOS,
    } as any);
    mockedUseCurrentResource.mockReturnValue([
      { permissions: { can_update: undefined } },
    ] as any);

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

  it('redirects users to the player when the video can be shown', () => {
    const { DELETED: _deleted, ...displayableUploadState } = uploadState;
    for (const state of Object.values(displayableUploadState)) {
      mockedUseAppConfig.mockReturnValue({
        state: appState.SUCCESS,
        video: { is_ready_to_show: true, upload_state: state },
        document: null,
        modelName: modelName.VIDEOS,
      } as any);
      mockedUseCurrentResource.mockReturnValue([
        { permissions: { can_update: false } },
      ] as any);

      render(<RedirectOnLoad />, {
        routerOptions: {
          routes: [
            {
              path: builderPlayerRoute(modelName.VIDEOS),
              element: <span>video player</span>,
            },
          ],
        },
      });

      expect(screen.getByText('video player')).toBeInTheDocument();
      cleanup();
    }
  });

  it('redirects users to the player when the document can be shown', () => {
    for (const state of Object.values(uploadState)) {
      mockedUseAppConfig.mockReturnValue({
        state: appState.SUCCESS,
        video: null,
        document: { is_ready_to_show: true, upload_state: state },
        modelName: modelName.DOCUMENTS,
      } as any);
      mockedUseCurrentResource.mockReturnValue([
        { permissions: { can_update: false } },
      ] as any);

      render(<RedirectOnLoad />, {
        routerOptions: {
          routes: [
            {
              path: builderPlayerRoute(modelName.DOCUMENTS),
              element: <span>document player</span>,
            },
          ],
        },
      });

      expect(screen.getByText('document player')).toBeInTheDocument();
      cleanup();
    }
  });

  it('redirects users to /dashboard when video is not ready to be shown and it has permissions to update it', () => {
    mockedUseAppConfig.mockReturnValue({
      state: appState.SUCCESS,
      video: {
        is_ready_to_show: false,
        upload_state: uploadState.PROCESSING,
      },
      document: null,
      modelName: modelName.VIDEOS,
    } as any);
    mockedUseCurrentResource.mockReturnValue([
      { permissions: { can_update: true } },
    ] as any);

    render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: DASHBOARD_ROUTE.default,
            element: (
              <WithParams>
                {({ objectType }) => <span>{`dashboard ${objectType!}`}</span>}
              </WithParams>
            ),
          },
        ],
      },
    });

    expect(screen.getByText('dashboard videos')).toBeInTheDocument();
  });

  it('redirects users to /dashboard when document is not ready to be shown and it has permissions to update it', () => {
    mockedUseAppConfig.mockReturnValue({
      state: appState.SUCCESS,
      video: null,
      document: {
        is_ready_to_show: false,
        upload_state: uploadState.PROCESSING,
      },
      modelName: modelName.DOCUMENTS,
    } as any);
    mockedUseCurrentResource.mockReturnValue([
      { permissions: { can_update: true } },
    ] as any);

    render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: DASHBOARD_ROUTE.default,
            element: (
              <WithParams>
                {({ objectType }) => <span>{`dashboard ${objectType!}`}</span>}
              </WithParams>
            ),
          },
        ],
      },
    });

    expect(screen.getByText('dashboard documents')).toBeInTheDocument();
  });

  it('redirects users to /error when video is not ready to be shown and it has no permissions to update it', () => {
    mockedUseAppConfig.mockReturnValue({
      state: appState.SUCCESS,
      video: {
        is_ready_to_show: false,
        upload_state: uploadState.PROCESSING,
      },
      document: null,
      modelName: modelName.VIDEOS,
    } as any);
    mockedUseCurrentResource.mockReturnValue([
      { permissions: { can_update: false } },
    ] as any);

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

  it('redirects users to /error when document is not ready to be shown and it has no permissions to update it', () => {
    mockedUseAppConfig.mockReturnValue({
      state: appState.SUCCESS,
      video: null,
      document: {
        is_ready_to_show: false,
        upload_state: uploadState.PROCESSING,
      },
      modelName: modelName.DOCUMENTS,
    } as any);
    mockedUseCurrentResource.mockReturnValue([
      { permissions: { can_update: false } },
    ] as any);

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

  it('redirects users to /select when LTI select data are passed', () => {
    mockedUseAppConfig.mockReturnValue({
      lti_select_form_data: { key: 'value' },
    } as any);
    mockedUseCurrentResource.mockReturnValue([
      { permissions: { can_update: undefined } },
    ] as any);

    render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: SELECT_CONTENT_ROUTE,
            element: <span>Select LTI content</span>,
          },
        ],
      },
    });

    expect(screen.getByText('Select LTI content')).toBeInTheDocument();
  });

  it('redirects to portability if app state requires it', () => {
    mockedUseAppConfig.mockReturnValue({
      state: appState.PORTABILITY,
    } as any);

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
