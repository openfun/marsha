import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { appState } from '../../types/AppData';
import { InstructorView } from '../InstructorView';
import { InstructorWrapper } from './InstructorWrapper';

describe('<InstructorWrapper />', () => {
  it('wraps its children in an instructor view if the current user is an instructor', () => {
    const wrapper = shallow(
      <InstructorWrapper ltiState={appState.INSTRUCTOR}>
        <div className="some-child" />
      </InstructorWrapper>,
    );

    expect(wrapper.find(InstructorView).exists()).toBe(true);
    expect(
      wrapper
        .find(InstructorView)
        .containsMatchingElement(<div className="some-child" />),
    ).toBe(true);
  });

  it('just renders the children if the current user is not an instructor', () => {
    const wrapper = shallow(
      <InstructorWrapper ltiState={appState.STUDENT}>
        <div className="some-child" />
      </InstructorWrapper>,
    );

    expect(wrapper.find(InstructorView).exists()).not.toBe(true);
    expect(
      wrapper.containsMatchingElement(<div className="some-child" />),
    ).toBe(true);
  });
});
