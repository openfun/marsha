import { screen } from '@testing-library/react';
import React, { Suspense } from 'react';

import { Loader } from 'components/Loader';
import { modelName } from 'types/models';
import render from 'utils/tests/render';

import PlaylistPage from './index';

const mockedAppName = modelName.VIDEOS;
jest.mock('data/appData', () => ({
  appData: {
    modelName: mockedAppName,
    video: {
      id: 'dd44',
      thumbnail: null,
      timed_text_tracks: [],
      upload_state: 'processing',
    },
  },
  getDecodedJwt: () => ({
    maintenance: false,
    permissions: {
      can_update: true,
    },
  }),
}));
const appDataMock = jest.requireMock('data/appData');

describe('<PlaylistPage />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it('renders with video', async () => {
    appDataMock.appData = {
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
    };

    render(
      <Suspense fallback={<Loader />}>
        <PlaylistPage />
      </Suspense>,
    );

    await screen.findByText('Dashboard');
    screen.getByText('Loading playlist...');
  });

  it('renders with document', async () => {
    appDataMock.appData = {
      document: {
        id: 'doc1',
        upload_state: 'processing',
        playlist: {
          id: 'playlist_id',
        },
      },
      modelName: modelName.DOCUMENTS,
    };

    render(
      <Suspense fallback={<Loader />}>
        <PlaylistPage />
      </Suspense>,
    );

    await screen.findByText('Dashboard');
    screen.getByText('Loading playlist...');
  });
});
