import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { ChannelSVG } from './ChannelSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<ChannelSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders ChannelSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<ChannelSVG iconColor="#035ccd" />);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('renders ChannelSVG focus [screenshot]', async () => {
    await renderIconSnapshot(
      <ChannelSVG iconColor="white" focusColor="#035ccd" />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
