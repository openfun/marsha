import '../../testSetup';

import { shallow } from 'enzyme';
import React from 'react';

import {
  DashboardVideoPaneProgress,
  StyledMeter,
} from './DashboardVideoPaneProgress';

describe('<DashboardVideoPaneProgress />', () => {
  it('renders and displays the current progress', () => {
    const wrapper = shallow(<DashboardVideoPaneProgress progress={51} />);
    expect(
      wrapper
        .dive()
        .find(StyledMeter)
        .prop('values'),
    ).toEqual([{ color: 'brand', label: '51%', value: 51 }]);
    expect(
      wrapper
        .dive()
        .childAt(1)
        .html(),
    ).toContain('51%');
  });
});
