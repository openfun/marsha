import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { uploadState } from '../../types/tracks';
import { Dashboard } from './Dashboard';

describe('<Dashboard />', () => {
  it('renders', () => {
    const mockVideo: any = { id: 'dd44', state: uploadState.PROCESSING };
    const wrapper = shallow(<Dashboard video={mockVideo} />).dive();
    expect(wrapper.text()).toContain('Dashboard');
  });
});
