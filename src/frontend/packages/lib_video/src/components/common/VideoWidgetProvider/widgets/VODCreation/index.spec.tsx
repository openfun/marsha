/* eslint-disable testing-library/no-node-access */
import { cleanup, screen } from '@testing-library/react';
import {
  useJwt,
  videoMockFactory,
  liveState,
  InfoWidgetModalProvider,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { shouldDisplayDefaultMessage } from './utils';

import { VODCreation } from '.';

jest.mock('./utils', () => ({
  shouldDisplayDefaultMessage: jest.fn(),
}));
const mockedShouldDisplayDefaultMessage =
  shouldDisplayDefaultMessage as jest.MockedFunction<
    typeof shouldDisplayDefaultMessage
  >;

describe('VODCreation', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders default widget components', () => {
    const video = videoMockFactory({
      live_state: liveState.STOPPED,
    });
    mockedShouldDisplayDefaultMessage.mockReturnValue(false);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <VODCreation />
        </InfoWidgetModalProvider>,
        video,
      ),
    );

    expect(screen.getByText('VOD')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /help/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        'To transform your recorded session in VOD, you have first to generate it to become available. Then you will be able to download it and convert it in VOD when you will be ready.',
      ),
    ).toBeInTheDocument();
  });

  it('shows harvesting message when live is harvesting', () => {
    const video = videoMockFactory({
      live_state: liveState.HARVESTING,
    });
    mockedShouldDisplayDefaultMessage.mockReturnValue(false);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <VODCreation />
        </InfoWidgetModalProvider>,
        video,
      ),
    );

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

      render(
        wrapInVideo(
          <InfoWidgetModalProvider value={null}>
            <VODCreation />
          </InfoWidgetModalProvider>,
          video,
        ),
      );

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

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <VODCreation />
        </InfoWidgetModalProvider>,
        video,
      ),
    );

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

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <VODCreation />
        </InfoWidgetModalProvider>,
        video,
      ),
    );

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
