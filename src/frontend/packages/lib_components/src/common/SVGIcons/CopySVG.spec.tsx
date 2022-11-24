import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { CopySVG } from './CopySVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<CopySVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders CopySVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <CopySVG
        containerStyle={{
          height: '25px',
          width: '20px',
        }}
        iconColor="blue-active"
      />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
