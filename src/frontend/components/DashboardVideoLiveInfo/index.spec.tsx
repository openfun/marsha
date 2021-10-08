import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { DashboardVideoLiveInfo } from '.';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { LiveModeType } from '../../types/tracks';

const video = videoMockFactory({
  live_info: {
    medialive: {
      input: {
        endpoints: [
          'rtmp://1.2.3.4:1935/stream-key-primary',
          'rtmp://4.3.2.1:1935/stream-key-secondary',
        ],
      },
    },
  },
  live_type: LiveModeType.JITSI,
});

Object.assign(navigator, {
  clipboard: {
    writeText: () => Promise.resolve(),
  },
});
jest.spyOn(navigator.clipboard, 'writeText');

describe('<DashboardVideoLiveInfo />', () => {
  it('displays rtmp links', () => {
    render(wrapInIntlProvider(<DashboardVideoLiveInfo video={video} />));
    const circleComponent = screen.getByLabelText('CircleInformation');

    fireEvent.mouseOver(circleComponent);

    const link = screen.getByText('rtmp://1.2.3.4:1935/stream-key-primary');
    screen.getByText('rtmp://4.3.2.1:1935/stream-key-secondary');
    fireEvent.click(link);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'rtmp://1.2.3.4:1935/stream-key-primary',
    );
  });
});
