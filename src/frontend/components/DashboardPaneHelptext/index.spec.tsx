import { render } from '@testing-library/react';
import * as React from 'react';

import { DashboardPaneHelptext } from '.';
import { modelName } from '../../types/models';
import { uploadState } from '../../types/tracks';
import { wrapInIntlProvider } from '../../utils/tests/intl';

describe('<DashboardPaneHelptext />', () => {
  it('displays the relevant helptext for each state', () => {
    const { getByText, rerender } = render(
      wrapInIntlProvider(
        <DashboardPaneHelptext
          objectType={modelName.VIDEOS}
          state={uploadState.ERROR}
        />,
      ),
    );
    getByText(
      'There was an error with your video. Retry or upload another one.',
    );

    rerender(
      wrapInIntlProvider(
        <DashboardPaneHelptext
          objectType={modelName.VIDEOS}
          state={uploadState.PENDING}
        />,
      ),
    );
    getByText('There is currently no video to display.');

    rerender(
      wrapInIntlProvider(
        <DashboardPaneHelptext
          objectType={modelName.VIDEOS}
          state={uploadState.PROCESSING}
        />,
      ),
    );
    getByText(
      'Your video is currently processing. This may take up to an hour. Please come back later.',
    );

    rerender(
      wrapInIntlProvider(
        <DashboardPaneHelptext
          objectType={modelName.VIDEOS}
          state={uploadState.READY}
        />,
      ),
    );
    getByText('Your video is ready to play.');

    rerender(
      wrapInIntlProvider(
        <DashboardPaneHelptext
          objectType={modelName.VIDEOS}
          state={uploadState.UPLOADING}
        />,
      ),
    );
    getByText('Upload in progress... Please do not close or reload this page.');
  });
});
