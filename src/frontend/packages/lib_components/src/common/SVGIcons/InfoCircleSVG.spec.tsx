import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { InfoCircleSVG } from './InfoCircleSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<InfoCircleSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders InfoCircleSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <InfoCircleSVG
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
