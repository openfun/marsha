import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { DownloadSVG } from './DownloadSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<DownloadSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders DownloadSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <DownloadSVG
        containerStyle={{
          height: '24px',
          width: '24px',
        }}
        iconColor="blue-active"
      />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
