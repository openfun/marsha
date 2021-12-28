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
  Chat: (props: { video: Video; standalone?: boolean }) => (
    <div>
      <span title={props.video.id}>chat component</span>
      <span>standalone: {props.standalone ? 'true' : 'false'}</span>
    </div>
  ),
}));

describe('<DashboardVideoLiveRunning />  displays "show live" and "show chat only" buttons', () => {
  it('shows live', () => {
    const video = videoMockFactory({
      live_type: LiveModeType.RAW,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoLiveRunning video={video} />, [
          {
            path: PLAYER_ROUTE(modelName.VIDEOS),
            element: <span>video player</span>,
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
      live_type: LiveModeType.RAW,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoLiveRunning video={video} />, [
          {
            path: CHAT_ROUTE(),
            element: <span>chat component</span>,
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

  it('shows chat directly during a jitsi live.', () => {
    const video = videoMockFactory({
      live_type: LiveModeType.JITSI,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoLiveRunning video={video} />),
      ),
    );

    screen.getByText('chat component');
  });
});
