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

import { ROUTE as ERROR_ROUTE } from '../ErrorComponent/ErrorComponent';
import { ROUTE as FORM_ROUTE } from '../VideoForm/VideoForm';
import { ROUTE as PLAYER_ROUTE } from '../VideoPlayer/VideoPlayer';
import { RedirectOnLoad } from './RedirectOnLoad';

describe('<RedirectOnLoad />', () => {
  it('redirects to the error view on LTI error', () => {
    context.state = 'error';
    const wrapper = shallow(<RedirectOnLoad />).dive();

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(ERROR_ROUTE('lti'));
  });

  it('redirects instructors to the player when the video is ready', () => {
    context.state = 'instructor';
    context.video = { status: 'ready' };
    const wrapper = shallow(<RedirectOnLoad />).dive();

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(PLAYER_ROUTE());
  });

  it('redirects students to /player when the video is ready', () => {
    context.state = 'student';
    context.video = { status: 'ready' };
    const wrapper = shallow(<RedirectOnLoad />).dive();

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(PLAYER_ROUTE());
  });

  it('redirects instructors to /form when the video is not ready', () => {
    context.state = 'instructor';
    context.video = { status: 'not_ready' };
    const wrapper = shallow(<RedirectOnLoad />).dive();

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(FORM_ROUTE());
  });

  it('redirects students to the error view when the video is not ready', () => {
    context.state = 'student';
    context.video = { status: 'not_ready' };
    const wrapper = shallow(<RedirectOnLoad />).dive();

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(ERROR_ROUTE('notFound'));
  });
});
