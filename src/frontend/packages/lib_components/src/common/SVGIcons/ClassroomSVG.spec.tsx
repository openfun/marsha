import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { ClassroomSVG } from './ClassroomSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<ClassroomSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders ClassroomSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<ClassroomSVG iconColor="blue-focus" />);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
