import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { NoDownloadSVG } from './NoDownloadSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<NoDownloadSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders NoDownloadSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <NoDownloadSVG
        containerStyle={{
          height: '24px',
          width: '24px',
        }}
        iconColor="blue-off"
      />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
