import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { DoubleArrowResizerSVG } from './DoubleArrowResizerSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<DoubleArrowResizerSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders DoubleArrowResizerSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <DoubleArrowResizerSVG
        containerStyle={{
          height: '28px',
          width: '28px',
        }}
        iconColor="blue-focus"
      />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
