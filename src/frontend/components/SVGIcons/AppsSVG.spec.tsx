import React from 'react';
import renderer from 'react-test-renderer';
import { AppsSVG } from './AppsSVG';

it('renders AppsSVG correctly', () => {
  const AppsSVGSnapshot = renderer
    .create(<AppsSVG iconColor={'#035ccd'} />)
    .toJSON();
  expect(AppsSVGSnapshot).toMatchSnapshot();
});
