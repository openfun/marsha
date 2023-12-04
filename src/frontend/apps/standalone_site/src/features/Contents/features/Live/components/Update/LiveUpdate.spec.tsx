import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { videoMockFactory } from 'lib-components/tests';
import { Deferred, render } from 'lib-tests';
import { useParams } from 'react-router-dom';

import LiveUpdate from './LiveUpdate';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useRouteMatch: () => ({ url: '/my-contents/webinars/123456' }),
}));

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;

jest.mock('lib-video', () => ({
  ...jest.requireActual('lib-video'),
  DashboardVideoWrapper: () => <div>My DashboardVideoWrapper</div>,
  converseCleanup: jest.fn(),
}));

describe('<LiveUpdate />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  test('render without liveId', () => {
    mockUseParams.mockReturnValue({
      liveId: '',
    });
    render(<LiveUpdate />);

    expect(
      screen.getByText(/There is no webinar to display./i),
    ).toBeInTheDocument();
  });

  test('render with success api response', async () => {
    const deferred = new Deferred();
    fetchMock.mock('/api/videos/123456/', deferred.promise);

    mockUseParams.mockReturnValue({
      liveId: '123456',
    });
    render(<LiveUpdate />);

    deferred.resolve(
      videoMockFactory({
        id: '123456',
      }),
    );

    expect(screen.getByLabelText('loader')).toBeInTheDocument();
    expect(
      await screen.findByText(/My DashboardVideoWrapper/i),
    ).toBeInTheDocument();
  });

  test('render with failed api response', async () => {
    const deferred = new Deferred();
    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());
    fetchMock.mock('/api/videos/123456/', deferred.promise);

    mockUseParams.mockReturnValue({
      liveId: '123456',
    });
    render(<LiveUpdate />);

    deferred.resolve(500);

    expect(screen.getByLabelText('loader')).toBeInTheDocument();
    expect(
      await screen.findByText(/Sorry, an error has occurred./i),
    ).toBeInTheDocument();
  });

  test('render with 404 api response', async () => {
    const deferred = new Deferred();
    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());
    fetchMock.mock('/api/videos/123456/', deferred.promise);

    mockUseParams.mockReturnValue({
      liveId: '123456',
    });
    render(<LiveUpdate />);

    deferred.resolve(404);

    expect(screen.getByLabelText('loader')).toBeInTheDocument();
    expect(
      await screen.findByText(
        /We didn't find the webinar you are looking for./i,
      ),
    ).toBeInTheDocument();
  });
});
