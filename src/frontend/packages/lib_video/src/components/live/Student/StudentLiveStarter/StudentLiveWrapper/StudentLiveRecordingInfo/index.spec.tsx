import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { StudentLiveRecordingInfo } from '.';

describe('<StudentLiveRecordingInfo />', () => {
  it('displays the default Recording message', () => {
    render(<StudentLiveRecordingInfo />);

    expect(screen.getByText('Recording')).toBeInTheDocument();
  });
});
