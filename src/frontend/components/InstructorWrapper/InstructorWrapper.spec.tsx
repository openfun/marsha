import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

// Mock the state context before we import InstructorWrapper. We'll be able to mutate the
// context object to vary it for every test
const context: {
  state: string;
} = { state: '' };
jest.doMock('../App/App', () => {
  return {
    AppDataContext: {
      Consumer: (props: any) => props.children(context),
    },
  };
});

import { appState } from '../../types/AppData';
import { InstructorView } from '../InstructorView/InstructorView';
import { InstructorWrapper } from './InstructorWrapper';

describe('<InstructorWrapper />', () => {
  it('wraps its children in an instructor view if the current user is an instructor', () => {
    context.state = appState.INSTRUCTOR;
    const wrapper = shallow(
      <InstructorWrapper>
        <div className="some-child" />
      </InstructorWrapper>,
    );

    expect(
      wrapper
        .dive()
        .find(InstructorView)
        .exists(),
    ).toBe(true);
    expect(
      wrapper
        .dive()
        .find(InstructorView)
        .containsMatchingElement(<div className="some-child" />),
    ).toBe(true);
  });

  it('just renders the children if the current user is not an instructor', () => {
    context.state = appState.STUDENT;
    const wrapper = shallow(
      <InstructorWrapper>
        <div className="some-child" />
      </InstructorWrapper>,
    );

    expect(
      wrapper
        .dive()
        .find(InstructorView)
        .exists(),
    ).not.toBe(true);
    expect(
      wrapper.dive().containsMatchingElement(<div className="some-child" />),
    ).toBe(true);
  });
});
