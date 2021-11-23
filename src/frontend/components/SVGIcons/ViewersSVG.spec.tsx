import React from 'react';
import renderer from 'react-test-renderer';
import { ViewersSVG } from './ViewersSVG';

it('renders ViewersSVG correctly', () => {
  const ViewersSVGSnapshot = renderer
    .create(
      <ViewersSVG
        baseColor={'blue-off'}
        height={'27.08'}
        hoverColor={'blue-active'}
        title={'Show viewers'}
        width={'45.83'}
      />,
    )
    .toJSON();
  expect(ViewersSVGSnapshot).toMatchSnapshot();
});
