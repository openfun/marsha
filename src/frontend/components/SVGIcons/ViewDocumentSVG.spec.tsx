import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { ViewDocumentSVG } from './ViewDocumentSVG';

describe('<ViewDocumentSVG />', () => {
  it('renders ViewDocumentSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<ViewDocumentSVG iconColor="#035ccd" />);
  });

  it('renders ViewDocumentSVG focus [screenshot]', async () => {
    await renderIconSnapshot(
      <ViewDocumentSVG iconColor="white" focusColor="#035ccd" />,
    );
  });
});
