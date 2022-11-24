import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { BinSVG } from './BinSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<BinSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders BinSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <BinSVG
        containerStyle={{
          height: '14px',
          width: '18px',
        }}
        iconColor="blue-active"
      />,
    );

    expect(consoleError).not.toHaveBeenCalled();
  });
});
