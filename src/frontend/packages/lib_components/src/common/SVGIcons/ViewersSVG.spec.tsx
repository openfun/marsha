import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { ViewersSVG } from './ViewersSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<ViewersSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders ViewersSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<ViewersSVG iconColor="#035ccd" />);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('renders ViewersSVG focus [screenshot]', async () => {
    await renderIconSnapshot(
      <ViewersSVG iconColor="white" focusColor="#035ccd" />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
