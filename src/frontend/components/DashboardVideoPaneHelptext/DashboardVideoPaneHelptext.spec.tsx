import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { trackState } from '../../types/tracks';
import { DashboardVideoPaneHelptext } from './DashboardVideoPaneHelptext';

describe('<DashboardHelptext />', () => {
  it('displays the relevant helptext for each state', () => {
    expect(
      shallow(<DashboardVideoPaneHelptext state={trackState.ERROR} />).html(),
    ).toContain('There was an error with your video');
    expect(
      shallow(<DashboardVideoPaneHelptext state={trackState.PENDING} />).html(),
    ).toContain('There is currently no video to display here.');
    expect(
      shallow(
        <DashboardVideoPaneHelptext state={trackState.PROCESSING} />,
      ).html(),
    ).toContain('Your video is currently processing');
    expect(
      shallow(<DashboardVideoPaneHelptext state={trackState.READY} />).html(),
    ).toContain('Your video is ready to play');
    expect(
      shallow(
        <DashboardVideoPaneHelptext state={trackState.UPLOADING} />,
      ).html(),
    ).toContain('Upload in progress');
  });
});
