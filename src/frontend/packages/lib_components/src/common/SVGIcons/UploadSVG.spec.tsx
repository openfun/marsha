import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { UploadSVG } from './UploadSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<UploadSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders UploadSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<UploadSVG iconColor="#035ccd" />);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
