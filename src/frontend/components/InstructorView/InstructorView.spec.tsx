import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { InstructorControls, InstructorView, Preview } from './InstructorView';

describe('<InstructorView />', () => {
  it('renders the children inside a <Preview />', () => {
    const wrapper = shallow(
      <InstructorView>
        <div className="some-child" />
      </InstructorView>,
    );

    expect(
      wrapper
        .find(Preview)
        .containsMatchingElement(<div className="some-child" />),
    ).toBe(true);
  });

  it('renders the instructor controls', () => {
    const controlsWrapper = shallow(
      <InstructorView>
        <div className="some-child" />
      </InstructorView>,
    ).find(InstructorControls);

    expect(controlsWrapper.html()).toContain('Instructor Preview 👆');
    expect(controlsWrapper.html()).toContain('Replace the video');
  });
});
