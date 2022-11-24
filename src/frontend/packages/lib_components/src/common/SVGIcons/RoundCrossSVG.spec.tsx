import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { RoundCrossSVG } from './RoundCrossSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<RoundCrossSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders InfoCircleSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <RoundCrossSVG
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
