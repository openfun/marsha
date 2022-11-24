import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { CameraOnSVG } from './CameraOnSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<CameraOnSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders svg [screenshot]', async () => {
    await renderIconSnapshot(
      <CameraOnSVG
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
