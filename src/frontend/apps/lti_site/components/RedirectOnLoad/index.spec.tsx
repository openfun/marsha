import { cleanup } from '@testing-library/react';
import {
  useCurrentResourceContext,
  FULL_SCREEN_ERROR_ROUTE,
  useAppConfig,
  appState,
  modelName,
  uploadState,
} from 'lib-components';
import React from 'react';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { PLAYER_ROUTE } from 'components/routes';
import { SELECT_CONTENT_ROUTE } from 'components/SelectContent/route';

import render from 'utils/tests/render';

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

      const { getByText } = render(<RedirectOnLoad />, {
        routerOptions: {
          routes: [
            {
              path: PLAYER_ROUTE(modelName.VIDEOS),
              render: () => <span>video player</span>,
            },
          ],
        },
      });

      getByText('video player');
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

      const { getByText } = render(<RedirectOnLoad />, {
        routerOptions: {
          routes: [
            {
              path: PLAYER_ROUTE(modelName.DOCUMENTS),
              render: () => <span>document player</span>,
            },
          ],
        },
      });

      getByText('document player');
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

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: DASHBOARD_ROUTE(),
            render: ({ match }) => (
              <span>{`dashboard ${match.params.objectType}`}</span>
            ),
          },
        ],
      },
    });

    getByText('dashboard videos');
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

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: DASHBOARD_ROUTE(),
            render: ({ match }) => (
              <span>{`dashboard ${match.params.objectType}`}</span>
            ),
          },
        ],
      },
    });

    getByText('dashboard documents');
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

  it('redirects users to /select when LTI select data are passed', () => {
    mockedUseAppConfig.mockReturnValue({
      lti_select_form_data: { key: 'value' },
    } as any);
    mockedUseCurrentResource.mockReturnValue([
      { permissions: { can_update: undefined } },
    ] as any);

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: SELECT_CONTENT_ROUTE(),
            render: () => <span>Select LTI content</span>,
          },
        ],
      },
    });

    getByText('Select LTI content');
  });

  it('redirects to portability if app state requires it', async () => {
    mockedUseAppConfig.mockReturnValue({
      state: appState.PORTABILITY,
    } as any);

    const { getByText } = render(<RedirectOnLoad />, {
      routerOptions: {
        routes: [
          {
            path: RESOURCE_PORTABILITY_REQUEST_ROUTE(),
            render: () => <span>Portability request</span>,
          },
        ],
      },
    });

    getByText('Portability request');
  });
});
