import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { PictureSVG } from './PictureSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('PictureSVG', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders PictureSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <PictureSVG
        containerStyle={{
          height: '18px',
          width: '18px',
        }}
        iconColor="blue-focus"
      />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
