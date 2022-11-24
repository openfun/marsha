import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { OpenClosePanelSVG } from './OpenClosePanelSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<OpenClosePanelSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders OpenClosePanelSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <OpenClosePanelSVG
        containerStyle={{
          height: '20px',
          width: '20px',
        }}
        iconColor="white"
      />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
