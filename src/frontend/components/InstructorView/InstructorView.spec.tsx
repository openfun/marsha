import '../../testSetup';

import { shallow } from 'enzyme';
import { Button } from 'grommet';
import React from 'react';

import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { InstructorControls, InstructorView, Preview } from './InstructorView';

jest.mock('../withLink/withLink', () => ({
  withLink: (component: React.Component) => component,
}));

describe('<InstructorView />', () => {
  it('renders the children inside a <Preview />', () => {
    const wrapper = shallow(
      <InstructorView videoId={'42'} readOnly={false}>
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
      <InstructorView videoId={'42'} readOnly={false}>
        <div className="some-child" />
      </InstructorView>,
    ).find(InstructorControls);

    expect(controlsWrapper.html()).toContain('Instructor Preview 👆');
    expect(controlsWrapper.html()).toContain('Go to Dashboard');
  });

  it('redirects to the error component when it is missing the video ID', () => {
    const wrapper = shallow(
      <InstructorView videoId={null} readOnly={false}>
        <div />
      </InstructorView>,
    );

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(ERROR_COMPONENT_ROUTE('lti'));
  });

  it('remove the button when read_only is true', () => {
    const wrapper = shallow(
      <InstructorView videoId={'42'} readOnly={true}>
        <div />
      </InstructorView>,
    );

    expect(wrapper.html()).toContain(
      'This video is imported from another playlist. You can go to the original playlist to directly modify this video, or delete it from the current playlist and replace it by a new video.',
    );
    expect(wrapper.exists(Button)).toEqual(false);
  });
});
