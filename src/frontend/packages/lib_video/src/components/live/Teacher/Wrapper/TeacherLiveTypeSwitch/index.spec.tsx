import { screen } from '@testing-library/react';
import { useJwt, videoMockFactory, LiveModeType } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { LiveFeedbackProvider } from 'hooks/useLiveFeedback';
import { wrapInVideo } from 'utils/wrapInVideo';

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

    expect(screen.getByText('Raw')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '' })).toBeInTheDocument();
    expect(screen.getByText('Jitsi')).toBeInTheDocument();
  });
});
