import { screen, waitFor } from '@testing-library/react';
import userEventInit from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  useJwt,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { DescriptionWidget } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

const userEvent = userEventInit.setup({
  advanceTimers: jest.advanceTimersByTime,
});

describe('<DescriptionWidget />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  afterAll(() => {
    jest.runAllTimers();
    jest.useRealTimers();
  });

  it('renders the widget', () => {
    const mockedVideo = videoMockFactory({
      title: 'An example title',
      description: 'An example description',
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DescriptionWidget />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('Description');

    const textArea = screen.getByRole('textbox', {
      name: 'Write a description to your video here.',
    });
    expect(textArea).toHaveValue('An example description');
    expect(
      screen.getByText('Write a description to your video here.'),
    ).toBeInTheDocument();
  });

  it('types some text in an empty text area', async () => {
    const mockedVideo = videoMockFactory({
      id: 'video_id',
      description: undefined,
    });

    fetchMock.patch('/api/videos/video_id/', {
      ...mockedVideo,
      description: 'A new description',
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DescriptionWidget />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const textArea = screen.getByRole('textbox', {
      name: 'Write a description to your video here.',
    });
    expect(
      screen.getByText('Write a description to your video here.'),
    ).toBeInTheDocument();
    expect(textArea).toHaveValue('');

    await userEvent.type(textArea, 'A new description');
    expect(textArea).toHaveValue('A new description');

    jest.runOnlyPendingTimers();

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: JSON.stringify({
        description: 'A new description',
      }),
    });
    screen.getByText('Video updated.');
  });

  it('clears the text area', async () => {
    const mockedVideo = videoMockFactory({
      id: 'video_id',
      description: 'An existing description',
    });

    fetchMock.patch('/api/videos/video_id/', {
      ...mockedVideo,
      description: '',
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DescriptionWidget />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const textArea = screen.getByRole('textbox', {
      name: 'Write a description to your video here.',
    });
    expect(textArea).toHaveValue('An existing description');

    await userEvent.clear(textArea);

    jest.runOnlyPendingTimers();

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: JSON.stringify({
        description: '',
      }),
    });
    expect(textArea).toHaveValue('');
    screen.getByText('Video updated.');
  });

  it('modifies the text area, but the API returns an error', async () => {
    const mockedVideo = videoMockFactory({
      id: 'video_id',
      description: 'An existing description',
    });

    fetchMock.patch('/api/videos/video_id/', 500);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DescriptionWidget />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const textArea = screen.getByRole('textbox', {
      name: 'Write a description to your video here.',
    });
    expect(
      screen.getByText('Write a description to your video here.'),
    ).toBeInTheDocument();
    expect(textArea).toHaveValue('An existing description');

    await userEvent.type(textArea, ' and more');

    jest.runOnlyPendingTimers();

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: JSON.stringify({
        description: 'An existing description and more',
      }),
    });
    expect(textArea).toHaveValue('An existing description');
    screen.getByText('Video update has failed !');
  });
});
