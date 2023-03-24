import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  InfoWidgetModalProvider,
  useJwt,
  videoMockFactory,
  liveState,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { LivePairing } from '.';

describe('LivePairing', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });
  it('displays the appairing button', () => {
    const video = videoMockFactory({
      live_state: liveState.IDLE,
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <LivePairing />
        </InfoWidgetModalProvider>,
        video,
      ),
    );

    expect(
      screen.queryByRole('button', {
        name: /pair an external device/i,
      }),
    ).not.toBeInTheDocument();

    // open the widget
    const openButton = screen.getByRole('button', {
      name: 'External broadcast sources',
    });
    userEvent.click(openButton);

    screen.getByRole('button', {
      name: /pair an external device/i,
    });
  });
});
