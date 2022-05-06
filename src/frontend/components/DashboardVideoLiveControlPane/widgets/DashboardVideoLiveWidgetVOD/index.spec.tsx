import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { DashboardVideoLiveWidgetVOD } from '.';
import { shouldDisplayDefaultMessage } from './utils';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'json web token',
  },
}));
jest.mock('./utils', () => ({
  shouldDisplayDefaultMessage: jest.fn(),
}));
const mockedShouldDisplayDefaultMessage =
  shouldDisplayDefaultMessage as jest.MockedFunction<
    typeof shouldDisplayDefaultMessage
  >;

describe('DashboardVideoLiveWidgetVOD', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders default widget components', () => {
    const video = videoMockFactory({
      live_state: liveState.STOPPED,
    });
    mockedShouldDisplayDefaultMessage.mockReturnValue(false);

    render(wrapInIntlProvider(<DashboardVideoLiveWidgetVOD video={video} />));

    screen.getByText('VOD');
    userEvent.click(screen.getByTitle('help'));
    screen.getByText('This widget allows you to handle live VOD features.');
    screen.getByRole('button', { name: /help/i });
  });

  it('shows harvesting message when live is harvesting', () => {
    const video = videoMockFactory({
      live_state: liveState.HARVESTING,
    });
    mockedShouldDisplayDefaultMessage.mockReturnValue(false);

    render(wrapInIntlProvider(<DashboardVideoLiveWidgetVOD video={video} />));

    screen.getByText('Harvesting in progress...');
    screen.getByRole('button', { name: /help/i });

    expect(
      screen.queryByText(/There is nothing to harvest/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Generate file' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Convert into VOD' }),
    ).not.toBeInTheDocument();
  });

  it('shows message explaining harvesting is not available yet', () => {
    const values = Object.values(liveState).filter(
      (value) =>
        value !== liveState.STOPPED &&
        value !== liveState.HARVESTED &&
        value !== liveState.HARVESTING,
    );
    mockedShouldDisplayDefaultMessage.mockReturnValue(true);
    values.forEach((value) => {
      const video = videoMockFactory({
        live_state: value,
        recording_time: 10,
      });

      render(wrapInIntlProvider(<DashboardVideoLiveWidgetVOD video={video} />));

      screen.getByText(
        /There is nothing to harvest. To create your video, you have to record your stream./,
      );
      screen.getByText(/Harvest will be available at the end of the live./);
      screen.getByRole('button', { name: /help/i });

      expect(
        screen.queryByText('Harvesting in progress...'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Generate file' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Convert into VOD' }),
      ).not.toBeInTheDocument();

      cleanup();
    });
  });

  it('shows harvest button if live is stopped and recorded time is greater than 0', () => {
    const video = videoMockFactory({
      live_state: liveState.STOPPED,
      recording_time: 10,
    });
    mockedShouldDisplayDefaultMessage.mockReturnValue(false);

    render(wrapInIntlProvider(<DashboardVideoLiveWidgetVOD video={video} />));

    screen.getByRole('button', { name: 'Generate file' });
    screen.getByRole('button', { name: /help/i });

    expect(
      screen.queryByText('Harvesting in progress...'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/There is nothing to harvest/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Convert into VOD' }),
    ).not.toBeInTheDocument();
  });

  it('shows publish and download vod buttons when live is harvested and recorded time is greater than 0', () => {
    const video = videoMockFactory({
      live_state: liveState.HARVESTED,
      recording_time: 10,
      urls: {
        manifests: { hls: 'some url' },
        thumbnails: {},
        mp4: { 480: 'my-video-url-480p', 720: 'my-video-url-720p' },
      },
    });
    mockedShouldDisplayDefaultMessage.mockReturnValue(false);

    render(wrapInIntlProvider(<DashboardVideoLiveWidgetVOD video={video} />));

    screen.getByRole('button', { name: 'Convert into VOD' });
    expect(
      screen.getByRole('link', { name: 'Download the video' }).closest('a'),
    ).toHaveAttribute('href', 'my-video-url-720p');
    screen.getByRole('button', { name: /help/i });

    expect(
      screen.queryByText('Harvesting in progress...'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/There is nothing to harvest/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Generate file' }),
    ).not.toBeInTheDocument();
  });
});
