import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

// Mock the state context before we import RedirectOnLoad. We'll be able to mutate the
// context object to vary it for every test
const context = { state: '', video: {} };
jest.doMock('../..', () => {
  return {
    AppDataContext: {
      Consumer: (props: any) => props.children(context),
    },
  };
});

import { RedirectOnLoad } from './RedirectOnLoad';

describe('<RedirectOnLoad />', () => {
  it('redirects to /errors/lti on LTI error', () => {
    context.state = 'error';
    const wrapper = shallow(<RedirectOnLoad />).dive();

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual('/errors/lti');
  });

  it('redirects instructors to /player when the video is ready', () => {
    context.state = 'instructor';
    context.video = { status: 'ready' };
    const wrapper = shallow(<RedirectOnLoad />).dive();

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual('/player');
  });

  it('redirects students to /player when the video is ready', () => {
    context.state = 'student';
    context.video = { status: 'ready' };
    const wrapper = shallow(<RedirectOnLoad />).dive();

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual('/player');
  });

  it('redirects instructors to /form when the video is not ready', () => {
    context.state = 'instructor';
    context.video = { status: 'not_ready' };
    const wrapper = shallow(<RedirectOnLoad />).dive();

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual('/form');
  });

  it('redirects students to /errors/not_found when the video is not ready', () => {
    context.state = 'student';
    context.video = { status: 'not_ready' };
    const wrapper = shallow(<RedirectOnLoad />).dive();

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual('/errors/not_found');
  });
});
