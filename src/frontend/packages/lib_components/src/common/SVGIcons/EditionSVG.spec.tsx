import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { EditionSVG } from './EditionSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<EditionSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders EditinSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <EditionSVG
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
