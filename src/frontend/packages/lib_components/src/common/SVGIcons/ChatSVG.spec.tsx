import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { ChatSVG } from './ChatSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<ChatSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders ChatSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<ChatSVG iconColor="#035ccd" />);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('renders ChatSVG focus [screenshot]', async () => {
    await renderIconSnapshot(
      <ChatSVG iconColor="white" focusColor="#035ccd" />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
