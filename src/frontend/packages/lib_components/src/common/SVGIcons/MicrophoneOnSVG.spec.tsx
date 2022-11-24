import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { MicrophoneOnSVG } from './MicrophoneOnSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<MicrophoneOnSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders svg [screenshot]', async () => {
    await renderIconSnapshot(
      <MicrophoneOnSVG
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
