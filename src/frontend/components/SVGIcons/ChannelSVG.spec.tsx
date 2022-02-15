import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { ChannelSVG } from './ChannelSVG';

describe('<ChannelSVG />', () => {
  it('renders ChannelSVG correctly', async () => {
    await renderIconSnapshot(<ChannelSVG iconColor="#035ccd" />);
  });

  it('renders ChannelSVG focus', async () => {
    await renderIconSnapshot(
      <ChannelSVG iconColor="white" focusColor="#035ccd" />,
    );
  });
});
