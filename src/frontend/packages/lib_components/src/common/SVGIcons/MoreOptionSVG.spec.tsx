import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { MoreOptionSVG } from './MoreOptionSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<MoreOptionSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders svg [screenshot]', async () => {
    await renderIconSnapshot(
      <MoreOptionSVG
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
