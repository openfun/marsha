import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { ViewDocumentSVG } from './ViewDocumentSVG';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<ViewDocumentSVG />', () => {
  afterAll(() => {
    consoleError.mockClear();
  });

  it('renders ViewDocumentSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<ViewDocumentSVG iconColor="#035ccd" />);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('renders ViewDocumentSVG focus [screenshot]', async () => {
    await renderIconSnapshot(
      <ViewDocumentSVG iconColor="white" focusColor="#035ccd" />,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
