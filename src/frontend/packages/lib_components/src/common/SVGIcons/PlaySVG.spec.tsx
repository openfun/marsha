import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { PlaySVG } from './PlaySVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<PlaySVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders PlaySVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<PlaySVG iconColor="blue-focus" />);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
