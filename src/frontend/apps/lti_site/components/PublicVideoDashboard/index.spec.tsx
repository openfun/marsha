import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  ErrorComponents,
  builderFullScreenErrorRoute,
  uploadState,
  useJwt,
} from 'lib-components';
import { liveMockFactory, videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';

import PublicVideoDashboard from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  getResource: jest.fn().mockResolvedValue(null),
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  }),
  useCurrentResourceContext: () => [
    {
      permissions: {
        can_update: false,
      },
    },
  ],
  decodeJwt: () => ({}),
}));

jest.mock('lib-video', () => ({
  ...jest.requireActual('lib-video'),
  LiveStudentDashboard: () => <span>live student</span>,
  VODStudentDashboard: () => <span>vod student</span>,
}));

describe('<PublicVideoDashboard />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some jwt',
    });
  });

  afterEach(() => {
    fetchMock.restore();
    jest.clearAllMocks();
  });

  it('renders live component when video is a live', () => {
    const live = liveMockFactory();

    render(<PublicVideoDashboard video={live} playerType="some_player" />);

    expect(screen.getByText('live student')).toBeInTheDocument();
  });

  it('renders vod component when video is a vod', () => {
    const video = videoMockFactory();

    render(<PublicVideoDashboard video={video} playerType="some_player" />);

    expect(screen.getByText('vod student')).toBeInTheDocument();
  });

  it('redirects to the error page when vod is deleted', () => {
    const video = videoMockFactory({ upload_state: uploadState.DELETED });

    render(<PublicVideoDashboard video={video} playerType="some_player" />, {
      routerOptions: {
        routes: [
          {
            path: builderFullScreenErrorRoute(ErrorComponents.videoDeleted),
            element: <span>error page</span>,
          },
        ],
      },
    });

    expect(screen.getByText('error page')).toBeInTheDocument();
  });
});
