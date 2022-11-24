import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { PauseSVG } from './PauseSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<PauseSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders PauseSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<PauseSVG iconColor="blue-focus" />);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
