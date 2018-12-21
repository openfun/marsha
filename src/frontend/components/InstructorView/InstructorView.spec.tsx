import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { ROUTE as ERROR_ROUTE } from '../ErrorComponent/ErrorComponent';
import { InstructorControls, InstructorView, Preview } from './InstructorView';

describe('<InstructorView />', () => {
  it('renders the children inside a <Preview />', () => {
    const wrapper = shallow(
      <InstructorView videoId={'42'}>
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
      <InstructorView videoId={'42'}>
        <div className="some-child" />
      </InstructorView>,
    ).find(InstructorControls);

    expect(controlsWrapper.html()).toContain('Instructor Preview 👆');
    expect(controlsWrapper.html()).toContain('Replace the video');
  });

  it('redirects to the error component when it is missing the video ID', () => {
    const wrapper = shallow(
      <InstructorView videoId={null}>
        <div />
      </InstructorView>,
    );

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(ERROR_ROUTE('lti'));
  });
});
