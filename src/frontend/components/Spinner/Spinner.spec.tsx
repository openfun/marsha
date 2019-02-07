import { Meter } from 'grommet';
import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { Spinner } from './Spinner';

describe('<Spinner />', () => {
  it('renders', () => {
    expect(shallow(<Spinner />).find(Meter).length).toBe(1);
  });
});
