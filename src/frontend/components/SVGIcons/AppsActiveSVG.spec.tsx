import React from 'react';
import renderer from 'react-test-renderer';
import { AppsActiveSVG } from './AppsActiveSVG';

it('renders AppsActiveSVG correctly', () => {
  const AppsActiveSVGSnapshot = renderer
    .create(
      <AppsActiveSVG
        backgroundColor={'#0249a4'}
        baseColor={'white'}
        height={'54'}
        title={'Show/Hide Chat'}
        width={'54'}
      />,
    )
    .toJSON();
  expect(AppsActiveSVGSnapshot).toMatchSnapshot();
});
