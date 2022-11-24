import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { DownArrowSVG } from './DownArrowSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<DownArrowSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders DownArrowSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <DownArrowSVG
        containerStyle={{
          height: '7px',
          width: '12px',
        }}
        iconColor="blue-focus"
      />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
