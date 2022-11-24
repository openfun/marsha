import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { SendButtonSVG } from './SendButtonSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<SendButtonSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders SendButtonSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <SendButtonSVG height={22} width={25} iconColor="blue-chat" />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
