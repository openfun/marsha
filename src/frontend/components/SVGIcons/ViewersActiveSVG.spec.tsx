import React from 'react';
import renderer from 'react-test-renderer';
import { ViewersActiveSVG } from './ViewersActiveSVG';

it('renders ViewersActiveSVG correctly', () => {
  const ViewersActiveSVGSnapshot = renderer
    .create(
      <ViewersActiveSVG
        backgroundColor={'blue-active'}
        baseColor={'white'}
        height={'54'}
        title={'Show viewers'}
        width={'54'}
      />,
    )
    .toJSON();
  expect(ViewersActiveSVGSnapshot).toMatchSnapshot();
});
