import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { useJwt } from 'data/stores/useJwt';
import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { DashboardLiveWidgetLivePairing } from '.';

describe('DashboardLiveWidgetLivePairing', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
    });
  });
  it('displays the appairing button', () => {
    const video = videoMockFactory({
      live_state: liveState.IDLE,
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DashboardLiveWidgetLivePairing />
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
