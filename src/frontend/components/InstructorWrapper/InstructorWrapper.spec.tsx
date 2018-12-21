import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { appState } from '../../types/AppData';
import { InstructorViewConnected } from '../InstructorViewConnected/InstructorViewConnected';
import { InstructorWrapper } from './InstructorWrapper';

describe('<InstructorWrapper />', () => {
  it('wraps its children in an instructor view if the current user is an instructor', () => {
    const wrapper = shallow(
      <InstructorWrapper ltiState={appState.INSTRUCTOR}>
        <div className="some-child" />
      </InstructorWrapper>,
    );

    expect(wrapper.find(InstructorViewConnected).exists()).toBe(true);
    expect(
      wrapper
        .find(InstructorViewConnected)
        .containsMatchingElement(<div className="some-child" />),
    ).toBe(true);
  });

  it('just renders the children if the current user is not an instructor', () => {
    const wrapper = shallow(
      <InstructorWrapper ltiState={appState.STUDENT}>
        <div className="some-child" />
      </InstructorWrapper>,
    );

    expect(wrapper.find(InstructorViewConnected).exists()).not.toBe(true);
    expect(
      wrapper.containsMatchingElement(<div className="some-child" />),
    ).toBe(true);
  });
});
