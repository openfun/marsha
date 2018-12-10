import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { videoState } from '../../types/Video';
import { DashboardVideoPaneHelptext } from './DashboardVideoPaneHelptext';

describe('<DashboardHelptext />', () => {
  it('displays the relevant helptext for each state', () => {
    expect(
      shallow(<DashboardVideoPaneHelptext state={videoState.ERROR} />).html(),
    ).toContain('There was an error with your video');
    expect(
      shallow(<DashboardVideoPaneHelptext state={videoState.PENDING} />).html(),
    ).toContain('There is currently no video to display here.');
    expect(
      shallow(
        <DashboardVideoPaneHelptext state={videoState.PROCESSING} />,
      ).html(),
    ).toContain('Your video is currently processing');
    expect(
      shallow(<DashboardVideoPaneHelptext state={videoState.READY} />).html(),
    ).toContain('Your video is ready to play');
    expect(
      shallow(
        <DashboardVideoPaneHelptext state={videoState.UPLOADING} />,
      ).html(),
    ).toContain('Upload in progress');
  });
});
