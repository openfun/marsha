import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { ValidSVG } from './ValidSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<ValidSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders ValidSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<ValidSVG iconColor="#035ccd" />);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('renders ValidSVG focus [screenshot]', async () => {
    await renderIconSnapshot(
      <ValidSVG iconColor="white" focusColor="#035ccd" />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
