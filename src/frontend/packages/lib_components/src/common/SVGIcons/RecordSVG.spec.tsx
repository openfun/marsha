import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { RecordSVG } from './RecordSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<RecordSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders RecordSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <RecordSVG
        containerStyle={{
          height: '100%',
          width: '100%',
        }}
        iconColor="blue-focus"
      />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
