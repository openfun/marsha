import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { appState } from '../../types/AppData';
import { modelName } from '../../types/models';
import { trackState } from '../../types/tracks';
import { ROUTE as DASHBOARD_ROUTE } from '../Dashboard/Dashboard';
import { ROUTE as ERROR_ROUTE } from '../ErrorComponent/ErrorComponent';
import { ROUTE as FORM_ROUTE } from '../UploadForm/UploadForm';
import { ROUTE as PLAYER_ROUTE } from '../VideoPlayer/VideoPlayer';
import { RedirectOnLoad } from './RedirectOnLoad';

describe('<RedirectOnLoad />', () => {
  it('redirects to the error view on LTI error', () => {
    const wrapper = shallow(
      <RedirectOnLoad ltiState={appState.ERROR} video={{} as any} />,
    );

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(ERROR_ROUTE('lti'));
  });

  it('redirects instructors to the player when the video is ready', () => {
    const wrapper = shallow(
      <RedirectOnLoad
        ltiState={appState.INSTRUCTOR}
        video={{ state: trackState.READY } as any}
      />,
    );

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(PLAYER_ROUTE());
  });

  it('redirects students to /player when the video is ready', () => {
    const wrapper = shallow(
      <RedirectOnLoad
        ltiState={appState.STUDENT}
        video={{ state: trackState.READY } as any}
      />,
    );

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(PLAYER_ROUTE());
  });

  it('redirects instructors to /form when there is no video yet', () => {
    const wrapper = shallow(
      <RedirectOnLoad
        ltiState={appState.INSTRUCTOR}
        video={{ id: '42', state: trackState.PENDING } as any}
      />,
    );

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(FORM_ROUTE(modelName.VIDEOS, '42'));
  });

  it('redirects instructors to /dashboard when there is a video undergoing processing', () => {
    const wrapper = shallow(
      <RedirectOnLoad
        ltiState={appState.INSTRUCTOR}
        video={{ state: trackState.PROCESSING } as any}
      />,
    );

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(DASHBOARD_ROUTE());
  });

  it('redirects students to the error view when the video is not ready', () => {
    const wrapper = shallow(
      <RedirectOnLoad
        ltiState={appState.STUDENT}
        video={{ state: 'not_ready' } as any}
      />,
    );

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(ERROR_ROUTE('notFound'));
  });

  it('redirects students to the error view when the video is null', () => {
    const wrapper = shallow(
      <RedirectOnLoad ltiState={appState.STUDENT} video={null} />,
    );

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual(ERROR_ROUTE('notFound'));
  });
});
