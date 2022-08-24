import { screen } from '@testing-library/react';
import React from 'react';

import render from 'utils/tests/render';
import { StudentLiveRecordingInfo } from '.';

describe('<StudentLiveRecordingInfo />', () => {
  it('displays the default Recording message', () => {
    render(<StudentLiveRecordingInfo />);

    screen.getByText('Recording');
  });
});
