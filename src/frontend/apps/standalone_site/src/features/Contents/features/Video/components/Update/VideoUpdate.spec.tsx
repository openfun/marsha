import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { videoMockFactory } from 'lib-components';
import { Deferred, render } from 'lib-tests';
import { useParams } from 'react-router-dom';

import VideoUpdate from './VideoUpdate';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useRouteMatch: () => ({ url: '/my-contents/videos/123456' }),
}));

const mockUseParams = useParams as jest.MockedFunction<
  typeof useParams<{ videoId: string }>
>;

jest.mock('lib-video', () => ({
  ...jest.requireActual('lib-video'),
  DashboardVideoWrapper: () => <div>My DashboardVideoWrapper</div>,
}));

describe('<VideoUpdate />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  test('render without videoId', () => {
    mockUseParams.mockReturnValue({
      videoId: '',
    });
    render(<VideoUpdate />);

    expect(
      screen.getByText(/There is no video to display./i),
    ).toBeInTheDocument();
  });

  test('render with videoId and success api response', async () => {
    const deferred = new Deferred();
    fetchMock.mock('/api/videos/123456/', deferred.promise);

    mockUseParams.mockReturnValue({
      videoId: '123456',
    });
    render(<VideoUpdate />);

    deferred.resolve(
      videoMockFactory({
        id: '123456',
      }),
    );

    expect(screen.getByRole('alert', { name: /spinner/i })).toBeInTheDocument();
    expect(
      await screen.findByText(/My DashboardVideoWrapper/i),
    ).toBeInTheDocument();
  });

  test('render with videoId and failed api response', async () => {
    const deferred = new Deferred();
    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());
    fetchMock.mock('/api/videos/123456/', deferred.promise);

    mockUseParams.mockReturnValue({
      videoId: '123456',
    });
    render(<VideoUpdate />);

    deferred.resolve(500);

    expect(screen.getByRole('alert', { name: /spinner/i })).toBeInTheDocument();
    expect(
      await screen.findByText(/Sorry, an error has occurred./i),
    ).toBeInTheDocument();
  });

  test('render with videoId and 404 api response', async () => {
    const deferred = new Deferred();
    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());
    fetchMock.mock('/api/videos/123456/', deferred.promise);

    mockUseParams.mockReturnValue({
      videoId: '123456',
    });
    render(<VideoUpdate />);

    deferred.resolve(404);

    expect(screen.getByRole('alert', { name: /spinner/i })).toBeInTheDocument();
    expect(
      await screen.findByText(/We don't find the video you are looking for./i),
    ).toBeInTheDocument();
  });
});
