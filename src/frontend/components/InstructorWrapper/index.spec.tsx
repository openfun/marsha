import { cleanup, render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { bootstrapStore } from '../../data/bootstrapStore';
import { appState } from '../../types/AppData';
import { uploadState } from '../../types/tracks';
import { InstructorWrapper } from './index';

jest.mock('../InstructorView/index', () => {
  return {
    InstructorView: ({ children }: { children: React.ReactNode }) => (
      <div>
        <span>InstructorView</span>
        {children}
      </div>
    ),
  };
});

describe('<InstructorWrapper />', () => {
  afterEach(cleanup);

  it('wraps its children in an instructor view if the current user is an instructor', () => {
    const mockVideo: any = {
      id: 42,
      thumbnail: null,
      timed_text_tracks: [],
      upload_state: uploadState.PROCESSING,
    };
    const state = {
      state: appState.INSTRUCTOR,
      video: mockVideo,
    } as any;

    const { getByText, getByTitle } = render(
      <Provider store={bootstrapStore(state)}>
        <InstructorWrapper>
          <div title="some-child" />
        </InstructorWrapper>
      </Provider>,
    );

    getByText('InstructorView');
    getByTitle('some-child');
  });

  it('just renders the children if the current user is not an instructor', () => {
    const mockVideo: any = {
      id: 42,
      thumbnail: null,
      timed_text_tracks: [],
      upload_state: uploadState.PROCESSING,
    };
    const state = {
      state: appState.STUDENT,
      video: mockVideo,
    } as any;

    const { getByTitle, queryByText } = render(
      <Provider store={bootstrapStore(state)}>
        <InstructorWrapper>
          <div title="some-child" />
        </InstructorWrapper>
      </Provider>,
    );

    expect(queryByText('InstructorView')).toBeNull();
    getByTitle('some-child');
  });
});
