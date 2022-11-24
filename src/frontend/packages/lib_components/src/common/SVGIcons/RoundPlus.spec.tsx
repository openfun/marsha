import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { RoundPlusSVG } from './RoundPlusSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<RoundPlusSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders RoundPlus correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <RoundPlusSVG
        containerStyle={{
          height: '20px',
          width: '20px',
        }}
        iconColor="blue-focus"
      />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
