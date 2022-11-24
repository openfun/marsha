import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { MicrophoneOffSVG } from './MicrophoneOffSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<MicrophoneOffSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders svg [screenshot]', async () => {
    await renderIconSnapshot(
      <MicrophoneOffSVG
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
