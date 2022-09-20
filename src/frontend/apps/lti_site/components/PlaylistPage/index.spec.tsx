import { screen } from '@testing-library/react';
import { Loader, useJwt } from 'lib-components';
import React, { Suspense } from 'react';

import { useAppConfig } from 'data/stores/useAppConfig';
import { modelName } from 'types/models';
import render from 'utils/tests/render';

import PlaylistPage from '.';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: jest.fn(),
}));
const mockedUseAppConfig = useAppConfig as jest.MockedFunction<
  typeof useAppConfig
>;

describe('<PlaylistPage />', () => {
  beforeEach(() => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          maintenance: false,
          permissions: {
            can_update: true,
          },
        } as any),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it('renders with video', async () => {
    mockedUseAppConfig.mockReturnValue({
      modelName: modelName.VIDEOS,
      video: {
        id: 'dd44',
        thumbnail: null,
        timed_text_tracks: [],
        upload_state: 'processing',
        playlist: {
          id: 'playlist_id',
        },
      },
    } as any);

    render(
      <Suspense fallback={<Loader />}>
        <PlaylistPage />
      </Suspense>,
    );

    await screen.findByText('Dashboard');
    screen.getByText('Loading playlist...');
  });

  it('renders with document', async () => {
    mockedUseAppConfig.mockReturnValue({
      document: {
        id: 'doc1',
        upload_state: 'processing',
        playlist: {
          id: 'playlist_id',
        },
      },
      modelName: modelName.DOCUMENTS,
    } as any);

    render(
      <Suspense fallback={<Loader />}>
        <PlaylistPage />
      </Suspense>,
    );

    await screen.findByText('Dashboard');
    screen.getByText('Loading playlist...');
  });
});
