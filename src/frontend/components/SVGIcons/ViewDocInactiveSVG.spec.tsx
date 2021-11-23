import React from 'react';
import renderer from 'react-test-renderer';
import { ViewDocInactiveSVG } from './ViewDocInactiveSVG';

it('renders ViewDocInactiveSVG correctly', () => {
  const ViewDocInactiveSVGSnapshot = renderer
    .create(
      <ViewDocInactiveSVG
        backgroundColor={'none'}
        baseColor={'#035ccd'}
        height={'54'}
        title={'View document'}
        width={'54'}
      />,
    )
    .toJSON();
  expect(ViewDocInactiveSVGSnapshot).toMatchSnapshot();
});
