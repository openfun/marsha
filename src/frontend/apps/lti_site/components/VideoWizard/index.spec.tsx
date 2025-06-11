import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  LiveModeType,
  builderDashboardRoute,
  liveState,
  modelName,
  useFlags,
} from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import {
  VIDEO_WIZARD_ROUTE,
  builderVideoWizzardRoute,
} from 'components/routes';

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

useFlags.getState().setFlags({
  video: true,
  document: true,
  webinar: true,
  classroom: true,
  deposit: true,
});

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
    render(<VideoWizard />, {
      routerOptions: {
        componentPath: `/${VIDEO_WIZARD_ROUTE.all}`,
        history: [builderVideoWizzardRoute()],
      },
    });

    await screen.findByText(
      'You can choose how you want to share your content using the options below.',
    );
    screen.getByText('What would you like to do?');
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
        componentPath: `/${VIDEO_WIZARD_ROUTE.all}`,
        history: [builderVideoWizzardRoute()],
        routes: [
          {
            path: builderDashboardRoute(modelName.VIDEOS),
            element: <p>live dashboard</p>,
          },
        ],
      },
    });

    await screen.findByText(
      'You can choose how you want to share your content using the options below.',
    );
    screen.getByText('What would you like to do?');
    screen.getByRole('button', { name: 'Create a video' });
    const configureLiveButton = screen.getByRole('button', {
      name: 'Start a live',
    });

    await userEvent.click(configureLiveButton);

    expect(await screen.findByText('live dashboard')).toBeInTheDocument();
  });
  it('renders VideoWizard with the CreateVODButton only', async () => {
    useFlags.getState().setFlags({
      webinar: false,
    });
    render(<VideoWizard />, {
      routerOptions: {
        componentPath: `/${VIDEO_WIZARD_ROUTE.all}`,
        history: [builderVideoWizzardRoute()],
      },
    });
    await screen.findByText(
      'You can choose how you want to share your content using the options below.',
    );
    screen.getByText('What would you like to do?');
    screen.getByRole('button', {
      name: 'Create a video',
    });
    expect(
      screen.queryByRole('button', { name: 'Start a live' }),
    ).not.toBeInTheDocument();
  });
});

useFlags.getState().setFlags({
  video: true,
  document: true,
  webinar: true,
  classroom: true,
  deposit: true,
});
