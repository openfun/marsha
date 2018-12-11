import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { trackState } from '../../types/tracks';
import { Dashboard } from './Dashboard';

describe('<Dashboard />', () => {
  it('renders', () => {
    const mockVideo: any = { id: 'dd44', state: trackState.PROCESSING };

    const wrapper = shallow(<Dashboard video={mockVideo} />)
      .dive()
      .dive();
    expect(wrapper.text()).toContain('Dashboard');
  });
});
