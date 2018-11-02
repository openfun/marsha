import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { videoState } from '../../types/Video';
import { DashboardHelptext } from './DashboardHelptext';

describe('<DashboardHelptext />', () => {
  it('displays the relevant helptext for each state', () => {
    expect(
      shallow(<DashboardHelptext state={videoState.ERROR} />).html(),
    ).toContain('There was an error with your video');
    expect(
      shallow(<DashboardHelptext state={videoState.PENDING} />).html(),
    ).toContain('There is currently no video to display here.');
    expect(
      shallow(<DashboardHelptext state={videoState.PROCESSING} />).html(),
    ).toContain('Your video is currently processing');
    expect(
      shallow(<DashboardHelptext state={videoState.READY} />).html(),
    ).toContain('Your video is ready to play');
    expect(
      shallow(<DashboardHelptext state={videoState.UPLOADING} />).html(),
    ).toContain('Upload in progress');
  });
});
