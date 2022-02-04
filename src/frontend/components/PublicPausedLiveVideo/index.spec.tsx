import { Grommet } from 'grommet';
import { DateTime } from 'luxon';
import React from 'react';
import { act, render, screen } from '@testing-library/react';

import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { PublicPausedLiveVideo } from '.';

describe('PublicPausedLiveVideo', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with the timer', () => {
    const video = videoMockFactory({
      live_info: {
        paused_at: `${DateTime.now().minus({ seconds: 5 }).toSeconds()}`,
      },
    });
    const videoNode = document.createElement('video');

    render(
      wrapInIntlProvider(
        <Grommet>
          <PublicPausedLiveVideo video={video} videoNodeRef={videoNode} />
        </Grommet>,
      ),
    );

    screen.getByText('Webinar is paused');
    screen.getByText(
      'The webinar is paused. When resumed, the video will start again.',
    );
    const waitingSentence = screen.getByText(/the webinar is paused since/i);
    expect(waitingSentence).toHaveTextContent(
      'The webinar is paused since 00:00:05',
    );
  });

  it('renders the component without timer', () => {
    const video = videoMockFactory();
    const videoNode = document.createElement('video');

    render(
      wrapInIntlProvider(
        <Grommet>
          <PublicPausedLiveVideo video={video} videoNodeRef={videoNode} />
        </Grommet>,
      ),
    );

    screen.getByText('Webinar is paused');
    screen.getByText(
      'The webinar is paused. When resumed, the video will start again.',
    );
    expect(
      screen.queryByText(/the webinar is in paused since/i),
    ).not.toBeInTheDocument();
  });

  it('displays day and time when live is paused since more than 24 hours', () => {
    jest.useFakeTimers();
    const video = videoMockFactory({
      live_info: {
        paused_at: `${DateTime.now().minus({ days: 1, hours: 3 }).toSeconds()}`,
      },
    });
    const videoNode = document.createElement('video');

    render(
      wrapInIntlProvider(
        <Grommet>
          <PublicPausedLiveVideo video={video} videoNodeRef={videoNode} />
        </Grommet>,
      ),
    );

    screen.getByText('Webinar is paused');
    screen.getByText(
      'The webinar is paused. When resumed, the video will start again.',
    );
    const waitingSentence = screen.getByText(/the webinar is paused since/i);
    expect(waitingSentence).toHaveTextContent(
      'The webinar is paused since 1 day + 03:00:00',
    );
  });

  it('resets the Clock and displays day when the live overtakes 24 hours', async () => {
    const video = videoMockFactory({
      live_info: {
        paused_at: `${DateTime.now()
          .minus({ hours: 23, minutes: 59, seconds: 59 })
          .toSeconds()}`,
      },
    });
    const videoNode = document.createElement('video');

    render(
      wrapInIntlProvider(
        <Grommet>
          <PublicPausedLiveVideo video={video} videoNodeRef={videoNode} />
        </Grommet>,
      ),
    );

    await screen.findByText('Webinar is paused');
    screen.getByText(
      'The webinar is paused. When resumed, the video will start again.',
    );
    const waitingSentence = await screen.findByText(
      /the webinar is paused since/i,
    );
    expect(waitingSentence).toHaveTextContent(
      'The webinar is paused since 23:59:59',
    );

    act(() => {
      // advance time by 5 seconds and few milliseconds to avoid the
      // div added by the component Clock while digits are changing
      jest.advanceTimersByTime(5600);
    });

    const newWaitingSentence = await screen.findByText(
      /the webinar is paused since 1 day +/i,
    );
    expect(newWaitingSentence).toHaveTextContent(
      'The webinar is paused since 1 day + 00:00:03',
    );
  });
});
