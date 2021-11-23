import React from 'react';
import renderer from 'react-test-renderer';
import { AppsInactiveSVG } from './AppsInactiveSVG';

it('renders AppsInactiveSVG correctly', () => {
  const AppsInactiveSVGSnapshot = renderer
    .create(
      <AppsInactiveSVG
        backgroundColor={'none'}
        baseColor={'#035ccd'}
        height={'54'}
        title={'Show/Hide Chat'}
        width={'54'}
      />,
    )
    .toJSON();
  expect(AppsInactiveSVGSnapshot).toMatchSnapshot();
});
