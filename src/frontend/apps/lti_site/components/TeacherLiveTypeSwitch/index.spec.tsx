import { screen } from '@testing-library/react';
import React from 'react';

import { useJwt } from 'data/stores/useJwt';
import { LiveFeedbackProvider } from 'data/stores/useLiveFeedback';
import { LiveModeType } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { TeacherLiveTypeSwitch } from '.';

jest.mock('jwt-decode', () => jest.fn());

describe('<TeacherLiveTypeSwitch />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'cool_token_m8',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders elements', () => {
    const video = videoMockFactory({ live_type: LiveModeType.JITSI });

    render(
      wrapInVideo(
        <LiveFeedbackProvider value={false}>
          <TeacherLiveTypeSwitch />
        </LiveFeedbackProvider>,
        video,
      ),
    );

    screen.getByText('Raw');
    screen.getByRole('checkbox', { name: '' });
    screen.getByText('Jitsi');
  });
});
