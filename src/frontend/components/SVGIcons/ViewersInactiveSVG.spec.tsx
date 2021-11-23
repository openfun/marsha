import React from 'react';
import renderer from 'react-test-renderer';
import { ViewersInactiveSVG } from './ViewersInactiveSVG';

it('renders ViewersInactiveSVG correctly', () => {
  const ViewersInactiveSVGSnapshot = renderer
    .create(
      <ViewersInactiveSVG
        backgroundColor={'none'}
        baseColor={'#035ccd'}
        height={'54'}
        title={'Show viewers'}
        width={'54'}
      />,
    )
    .toJSON();
  expect(ViewersInactiveSVGSnapshot).toMatchSnapshot();
});
