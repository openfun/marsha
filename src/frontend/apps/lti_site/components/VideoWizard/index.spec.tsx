import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  videoMockFactory,
  modelName,
  LiveModeType,
  liveState,
} from 'lib-components';
import React from 'react';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import render from 'utils/tests/render';

import VideoWizard from '.';

const mockedVideo = videoMockFactory({ live_state: null });
jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  WizardLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'path/to/image.png',
      },
    },
    video: mockedVideo,
  }),
}));

describe('<VideoWizard />', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    fetchMock.mock(
      `/api/videos/`,
      {
        actions: { POST: { license: { options: [] } } },
      },
      { method: 'OPTIONS' },
    );
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders VideoWizard and clicks on CreateVODButton', async () => {
    render(<VideoWizard />);

    screen.getByText(
      'You can choose between creating a video and uploading one, or creating a live, that you will be able to schedule if needed.',
    );
    screen.getByText('What are you willing to do ?');
    const createVODButton = screen.getByRole('button', {
      name: 'Create a video',
    });
    screen.getByRole('button', { name: 'Start a live' });

    await userEvent.click(createVODButton);

    expect(
      await screen.findByText(
        'Use this wizard to create a new video, that you will be able to share with your students.',
      ),
    ).toBeInTheDocument();
  });

  it('renders VideoWizard and clicks on ConfigureLiveButton', async () => {
    fetchMock.mock(
      `/api/videos/${mockedVideo.id}/initiate-live/`,
      JSON.stringify({
        ...mockedVideo,
        live_state: liveState.IDLE,
        live_type: LiveModeType.JITSI,
      }),
      { method: 'POST' },
    );

    render(<VideoWizard />, {
      routerOptions: {
        routes: [
          {
            path: DASHBOARD_ROUTE(modelName.VIDEOS),
            render: () => <p>live dashboard</p>,
          },
        ],
      },
    });

    screen.getByText(
      'You can choose between creating a video and uploading one, or creating a live, that you will be able to schedule if needed.',
    );
    screen.getByText('What are you willing to do ?');
    screen.getByRole('button', { name: 'Create a video' });
    const configureLiveButton = screen.getByRole('button', {
      name: 'Start a live',
    });

    userEvent.click(configureLiveButton);

    await screen.findByText('live dashboard');
  });
});
