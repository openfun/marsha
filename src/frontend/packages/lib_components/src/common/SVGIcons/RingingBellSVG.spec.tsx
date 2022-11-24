import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { RingingBellSVG } from './RingingBellSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<RingingBellSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders RingingBellSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <RingingBellSVG
        containerStyle={{
          height: '20px',
          width: '21px',
        }}
        iconColor="blue-active"
      />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
