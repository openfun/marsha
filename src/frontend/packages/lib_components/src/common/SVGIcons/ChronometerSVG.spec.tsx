import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { ChronometerSVG } from './ChronometerSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<ChronometerSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders ChronometerSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<ChronometerSVG iconColor="#035ccd" />);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
