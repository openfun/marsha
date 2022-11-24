import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { SwitchToPlayerSVG } from './SwitchToPlayerSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<SwitchToPlayerSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders SwitchToPlayerSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<SwitchToPlayerSVG iconColor="#035ccd" />);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
