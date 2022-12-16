import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { videoMockFactory, LiveModeType, liveState } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import * as pollForLiveModule from 'api/pollForLive';
import { LiveFeedbackProvider } from 'hooks/useLiveFeedback';
import { LivePanelItem, useLivePanelState } from 'hooks/useLivePanelState';
import { wrapInVideo } from 'utils/wrapInVideo';

import { TeacherLiveControlBar } from '.';

const spyedPollForLive = jest.spyOn(pollForLiveModule, 'pollForLive');

describe('<TeacherLiveControlBar />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
    jest.useRealTimers();
  });

  it('renders chat and viewers buttons when live is not running and in mobile view', () => {
    fetchMock.get('some_url', 500);
    useLivePanelState.setState({
      availableItems: [LivePanelItem.CHAT, LivePanelItem.VIEWERS_LIST],
    });

    const mockedVideo = videoMockFactory({
      urls: { manifests: { hls: 'some_url' }, mp4: {}, thumbnails: {} },
      live_state: liveState.IDLE,
    });

    render(
      wrapInVideo(
        <LiveFeedbackProvider value={false}>
          <TeacherLiveControlBar />
        </LiveFeedbackProvider>,
        mockedVideo,
      ),
      { grommetOptions: { responsiveSize: 'small' } },
    );

    screen.getByRole('button', { name: 'Show chat' });
    screen.getByRole('button', { name: 'Show viewers' });
    expect(
      screen.queryByRole('button', { name: 'Show live return' }),
    ).not.toBeInTheDocument();

    expect(spyedPollForLive).not.toHaveBeenCalled();
  });

  it('renders chat and viewers buttons when live is jitsi mode and running and in mobile view', () => {
    fetchMock.get('some_url', 500);
    useLivePanelState.setState({
      availableItems: [LivePanelItem.CHAT, LivePanelItem.VIEWERS_LIST],
    });

    const mockedVideo = videoMockFactory({
      urls: { manifests: { hls: 'some_url' }, mp4: {}, thumbnails: {} },
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
    });

    render(
      wrapInVideo(
        <LiveFeedbackProvider value={false}>
          <TeacherLiveControlBar />
        </LiveFeedbackProvider>,
        mockedVideo,
      ),
      { grommetOptions: { responsiveSize: 'small' } },
    );

    screen.getByRole('button', { name: 'Show chat' });
    screen.getByRole('button', { name: 'Show viewers' });
    expect(
      screen.queryByRole('button', { name: 'Show live return' }),
    ).not.toBeInTheDocument();

    expect(spyedPollForLive).not.toHaveBeenCalled();
  });

  it('polls for live when live is running and show live feedback button', async () => {
    fetchMock.get('some_url', 404);
    useLivePanelState.setState({
      availableItems: [LivePanelItem.CHAT, LivePanelItem.VIEWERS_LIST],
    });

    const mockedVideo = videoMockFactory({
      urls: { manifests: { hls: 'some_url' }, mp4: {}, thumbnails: {} },
      live_state: liveState.RUNNING,
      live_type: LiveModeType.RAW,
    });

    render(
      wrapInVideo(
        <LiveFeedbackProvider value={false}>
          <TeacherLiveControlBar />
        </LiveFeedbackProvider>,
        mockedVideo,
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Show live feedback' }),
    ).not.toBeInTheDocument();

    await waitFor(() => expect(spyedPollForLive).toHaveBeenCalled());

    expect(
      screen.queryByRole('button', { name: 'Show live feedback' }),
    ).not.toBeInTheDocument();

    fetchMock.get('some_url', 200, { overwriteRoutes: true });
    jest.advanceTimersToNextTimer();

    await screen.findByRole('button', { name: 'Show live feedback' });
  });
});
