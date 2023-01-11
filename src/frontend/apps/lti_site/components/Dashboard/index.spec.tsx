import { screen } from '@testing-library/react';
import {
  decodeJwt,
  Loader,
  useAppConfig,
  Document,
  modelName,
  liveState,
  uploadState,
  Video,
} from 'lib-components';
import React, { Suspense } from 'react';

import render from 'utils/tests/render';

import Dashboard from '.';

jest.mock('./DashboardVideoWrapper', () => ({
  DashboardVideoWrapper: ({ video }: { video: Video }) => {
    return <span title={video.id} />;
  },
}));
jest.mock(
  'components/DashboardDocument',
  () => (props: { document: Document }) => <span title={props.document.id} />,
);

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useCurrentResourceContext: () => [
    {
      permissions: {
        can_update: true,
      },
    },
  ],
  decodeJwt: jest.fn(),
  useAppConfig: jest.fn(),
}));
const mockedDecodeJwt = decodeJwt as jest.MockedFunction<typeof decodeJwt>;
const mockedUseAppConfig = useAppConfig as jest.MockedFunction<
  typeof useAppConfig
>;

describe('<Dashboard />', () => {
  beforeEach(() => {
    mockedDecodeJwt.mockReturnValue({} as any);
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
