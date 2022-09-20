import { screen } from '@testing-library/react';
import { DecodedJwt, Loader, useJwt } from 'lib-components';
import React, { Suspense } from 'react';

import { useAppConfig } from 'data/stores/useAppConfig';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { Document } from 'types/file';
import { modelName } from 'types/models';
import { liveState, uploadState } from 'types/tracks';
import render from 'utils/tests/render';

import Dashboard from '.';

const mockUseCurrentVideo = useCurrentVideo;
jest.mock('components/DashboardVOD', () => ({
  DashboardVOD: () => {
    const video = mockUseCurrentVideo();

    return <span title={video.id} />;
  },
}));
jest.mock(
  'components/DashboardDocument',
  () => (props: { document: Document }) => <span title={props.document.id} />,
);

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: jest.fn(),
}));
const mockedUseAppConfig = useAppConfig as jest.MockedFunction<
  typeof useAppConfig
>;

describe('<Dashboard />', () => {
  beforeEach(() => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          maintenance: false,
          permissions: {
            can_update: true,
          },
        } as DecodedJwt),
    });
  });

  it('renders with video', async () => {
    mockedUseAppConfig.mockReturnValue({
      modelName: modelName.VIDEOS,
      video: {
        id: 'dd44',
        thumbnail: null,
        timed_text_tracks: [],
        upload_state: uploadState.PROCESSING,
        live_state: liveState.IDLE,
      },
    } as any);

    render(
      <Suspense fallback={<Loader />}>
        <Dashboard />
      </Suspense>,
    );
    screen.getByTitle('dd44');
  });

  it('renders with document', async () => {
    mockedUseAppConfig.mockReturnValue({
      document: {
        id: 'doc1',
        upload_state: uploadState.PROCESSING,
      },
      modelName: modelName.DOCUMENTS,
    } as any);

    render(
      <Suspense fallback={<Loader />}>
        <Dashboard />
      </Suspense>,
    );

    await screen.findByText('Dashboard');
    screen.getByTitle('doc1');
  });
});
