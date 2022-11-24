import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { StopSVG } from './StopSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<StopSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders StopSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<StopSVG iconColor="blue-focus" />);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
