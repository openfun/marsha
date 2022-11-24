import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { ExitCrossSVG } from './ExitCrossSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<ExitCrossSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders ExitCrossSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <ExitCrossSVG
        containerStyle={{
          height: '20px',
          width: '20px',
        }}
        iconColor="blue-focus"
      />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
