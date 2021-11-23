import React from 'react';
import renderer from 'react-test-renderer';
import { ViewersSVG } from './ViewersSVG';

it('renders ViewersSVG correctly', () => {
  const ViewersSVGSnapshot = renderer
    .create(<ViewersSVG iconColor={'#035ccd'} />)
    .toJSON();
  expect(ViewersSVGSnapshot).toMatchSnapshot();
});
