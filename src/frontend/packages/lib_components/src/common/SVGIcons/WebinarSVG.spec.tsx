import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { WebinarSVG } from './WebinarSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<WebinarSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders WebinarSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<WebinarSVG iconColor="blue-focus" />);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
