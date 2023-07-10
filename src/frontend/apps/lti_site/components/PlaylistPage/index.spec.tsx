import { screen } from '@testing-library/react';
import { Loader, modelName, useAppConfig } from 'lib-components';
import { render } from 'lib-tests';
import React, { Suspense } from 'react';

import PlaylistPage from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: jest.fn(),
  useCurrentResourceContext: () => [
    {
      permissions: {
        can_update: true,
      },
    },
  ],
}));
const mockedUseAppConfig = useAppConfig as jest.MockedFunction<
  typeof useAppConfig
>;

describe('<PlaylistPage />', () => {
  afterEach(() => {
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

    expect(screen.getByText('Loading playlist...')).toBeInTheDocument();
    await screen.findByText('Dashboard');
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

    expect(screen.getByText('Loading playlist...')).toBeInTheDocument();
    await screen.findByText('Dashboard');
  });
});
