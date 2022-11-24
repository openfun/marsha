import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { SwitchToDocumentSVG } from './SwitchToDocumentSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<SwitchToDocumentSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders SwitchToDocumentSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<SwitchToDocumentSVG iconColor="#035ccd" />);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
