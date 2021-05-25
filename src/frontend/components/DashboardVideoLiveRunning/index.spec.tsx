import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { CHAT_ROUTE } from '../Chat/route';
import { PLAYER_ROUTE } from '../routes';
import { modelName } from '../../types/models';
import { LiveModeType, Video } from '../../types/tracks';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';
import { DashboardVideoLiveRunning } from '.';

jest.mock('../../data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

jest.mock('../Chat', () => ({
  Chat: (props: { video: Video }) => (
    <span title={props.video.id}>chat component</span>
  ),
}));

describe('<DashboardVideoLiveRunning />  displays "show live" and "show chat only" buttons', () => {
  it('shows live', () => {
    const video = videoMockFactory({
      live_info: {
        type: LiveModeType.RAW,
      },
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoLiveRunning video={video} />, [
          {
            path: PLAYER_ROUTE(modelName.VIDEOS),
            render: () => <span>video player</span>,
          },
        ]),
      ),
    );

    const showLiveButton = screen.getByRole('button', { name: /show live/ });
    screen.getByRole('button', { name: /show chat only/ });

    fireEvent.click(showLiveButton);

    screen.getByText('video player');
  });

  it('shows chat only', () => {
    const video = videoMockFactory({
      live_info: {
        type: LiveModeType.RAW,
      },
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoLiveRunning video={video} />, [
          {
            path: CHAT_ROUTE(),
            render: () => <span>chat component</span>,
          },
        ]),
      ),
    );

    screen.getByRole('button', { name: /show live/ });
    const showChatOnlyButton = screen.getByRole('button', {
      name: /show chat only/i,
    });

    fireEvent.click(showChatOnlyButton);

    screen.getByText('chat component');
  });

  it('shows and hides the chat during a jitsi live.', () => {
    const video = videoMockFactory({
      live_info: {
        type: LiveModeType.JITSI,
      },
    });

    const { debug } = render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoLiveRunning video={video} />),
      ),
    );

    const showChatButton = screen.getByRole('button', { name: /show chat/ });
    expect(screen.queryByText('chat component')).not.toBeInTheDocument();

    // show chat
    fireEvent.click(showChatButton);

    screen.getByText('chat component');

    const hideChatButton = screen.getByRole('button', { name: /hide chat/ });

    // hide chat
    fireEvent.click(hideChatButton);

    expect(screen.queryByText('chat component')).not.toBeInTheDocument();
  });
});
