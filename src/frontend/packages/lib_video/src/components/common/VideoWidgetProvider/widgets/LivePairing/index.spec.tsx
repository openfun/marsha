import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfoWidgetModalProvider, liveState, useJwt } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { LivePairing } from '.';

describe('LivePairing', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });
  it('displays the appairing button', async () => {
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
    await userEvent.click(openButton);

    screen.getByRole('button', {
      name: /pair an external device/i,
    });
  });
});
