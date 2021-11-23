import React from 'react';
import renderer from 'react-test-renderer';
import { ViewDocActiveSVG } from './ViewDocActiveSVG';

it('renders ViewDocActiveSVG correctly', () => {
  const ViewDocActiveSVGSnapshot = renderer
    .create(
      <ViewDocActiveSVG
        backgroundColor={'#0249a4'}
        baseColor={'white'}
        height={'54'}
        title={'View document'}
        width={'54'}
      />,
    )
    .toJSON();
  expect(ViewDocActiveSVGSnapshot).toMatchSnapshot();
});
