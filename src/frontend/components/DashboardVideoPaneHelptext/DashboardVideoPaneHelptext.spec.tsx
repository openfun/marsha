import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { uploadState } from '../../types/tracks';
import { DashboardVideoPaneHelptext } from './DashboardVideoPaneHelptext';

describe('<DashboardHelptext />', () => {
  it('displays the relevant helptext for each state', () => {
    expect(
      shallow(<DashboardVideoPaneHelptext state={uploadState.ERROR} />).html(),
    ).toContain('There was an error with your video');
    expect(
      shallow(<DashboardVideoPaneHelptext state={uploadState.PENDING} />).html(),
    ).toContain('There is currently no video to display.');
    expect(
      shallow(
        <DashboardVideoPaneHelptext state={uploadState.PROCESSING} />,
      ).html(),
    ).toContain('Your video is currently processing');
    expect(
      shallow(<DashboardVideoPaneHelptext state={uploadState.READY} />).html(),
    ).toContain('Your video is ready to play');
    expect(
      shallow(
        <DashboardVideoPaneHelptext state={uploadState.UPLOADING} />,
      ).html(),
    ).toContain('Upload in progress');
  });
});
