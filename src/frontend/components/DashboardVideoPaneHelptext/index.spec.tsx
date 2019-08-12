import { render } from '@testing-library/react';
import * as React from 'react';

import { DashboardVideoPaneHelptext } from '.';
import { uploadState } from '../../types/tracks';
import { wrapInIntlProvider } from '../../utils/tests/intl';

describe('<DashboardVideoPaneHelptext />', () => {
  it('displays the relevant helptext for each state', () => {
    const { getByText, rerender } = render(
      wrapInIntlProvider(
        <DashboardVideoPaneHelptext state={uploadState.ERROR} />,
      ),
    );
    getByText(
      'There was an error with your video. Retry or upload another one.',
    );

    rerender(
      wrapInIntlProvider(
        <DashboardVideoPaneHelptext state={uploadState.PENDING} />,
      ),
    );
    getByText('There is currently no video to display.');

    rerender(
      wrapInIntlProvider(
        <DashboardVideoPaneHelptext state={uploadState.PROCESSING} />,
      ),
    );
    getByText(
      'Your video is currently processing. This may take up to an hour. Please come back later.',
    );

    rerender(
      wrapInIntlProvider(
        <DashboardVideoPaneHelptext state={uploadState.READY} />,
      ),
    );
    getByText('Your video is ready to play.');

    rerender(
      wrapInIntlProvider(
        <DashboardVideoPaneHelptext state={uploadState.UPLOADING} />,
      ),
    );
    getByText('Upload in progress... Please do not close or reload this page.');
  });
});
