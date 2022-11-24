import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { CameraOffSVG } from './CameraOffSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<CameraOffSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders svg [screenshot]', async () => {
    await renderIconSnapshot(
      <CameraOffSVG
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
