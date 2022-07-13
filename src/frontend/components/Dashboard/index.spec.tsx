import { screen } from '@testing-library/react';
import React, { Suspense } from 'react';

import { Loader } from 'components/Loader';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { Document } from 'types/file';
import { modelName } from 'types/models';
import { liveState } from 'types/tracks';
import render from 'utils/tests/render';

import Dashboard from './index';

const mockUseCurrentVideo = useCurrentVideo;
jest.mock('components/DashboardVideo', () => ({
  DashboardVideo: () => {
    const video = mockUseCurrentVideo();

    return <span title={video.id} />;
  },
}));
jest.mock(
  'components/DashboardDocument',
  () => (props: { document: Document }) => <span title={props.document.id} />,
);

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

describe('<Dashboard /> videos', () => {
  it('renders with video', async () => {
    appDataMock.appData = {
      modelName: modelName.VIDEOS,
      video: {
        id: 'dd44',
        thumbnail: null,
        timed_text_tracks: [],
        upload_state: 'processing',
        live_state: liveState.IDLE,
      },
    };

    render(
      <Suspense fallback={<Loader />}>
        <Dashboard />
      </Suspense>,
    );

    await screen.findByText('Dashboard');
    screen.getByTitle('dd44');
  });

  it('renders with document', async () => {
    appDataMock.appData = {
      document: {
        id: 'doc1',
        upload_state: 'processing',
      },
      modelName: modelName.DOCUMENTS,
    };

    render(
      <Suspense fallback={<Loader />}>
        <Dashboard />
      </Suspense>,
    );

    await screen.findByText('Dashboard');
    screen.getByTitle('doc1');
  });
});
