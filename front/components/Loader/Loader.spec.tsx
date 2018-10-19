import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { Loader } from './Loader';

describe('<Loader />', () => {
  it('renders', () => {
    expect(shallow(<Loader />).html()).toContain('div');
  });
});
