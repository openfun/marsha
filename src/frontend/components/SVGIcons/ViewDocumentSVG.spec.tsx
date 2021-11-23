import React from 'react';
import renderer from 'react-test-renderer';
import { ViewDocumentSVG } from './ViewDocumentSVG';

it('renders ViewDocumentSVG correctly', () => {
  const ViewDocumentSVGSnapshot = renderer
    .create(<ViewDocumentSVG iconColor={'#035ccd'} />)
    .toJSON();
  expect(ViewDocumentSVGSnapshot).toMatchSnapshot();
});
