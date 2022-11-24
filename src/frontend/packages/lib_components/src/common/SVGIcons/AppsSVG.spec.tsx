import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { AppsSVG } from './AppsSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<AppsSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders AppsSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<AppsSVG iconColor="#035ccd" />);

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('renders AppsSVG focus [screenshot]', async () => {
    await renderIconSnapshot(
      <AppsSVG iconColor="white" focusColor="blue-focus" />,
    );

    expect(consoleError).not.toHaveBeenCalled();
  });
});
