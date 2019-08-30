import { cleanup, render } from '@testing-library/react';
import React from 'react';

import { DashboardPaneButtons } from '.';
import { modelName } from '../../types/models';
import { uploadState, Video } from '../../types/tracks';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = uploadState;

describe('<DashboardPaneButtons />', () => {
  it('only renders the "Watch" button if the video is ready', () => {
    const { getByText } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardPaneButtons
            object={{ id: 'vid1', upload_state: READY } as Video}
            objectType={modelName.VIDEOS}
          />,
        ),
      ),
    );
    getByText('Watch');
    cleanup();

    // Can't watch the video before it's ready and uploaded
    for (const state of [ERROR, PENDING, PROCESSING, UPLOADING]) {
      const { queryByText } = render(
        wrapInIntlProvider(
          wrapInRouter(
            <DashboardPaneButtons
              object={{ id: 'vid1', upload_state: state } as Video}
              objectType={modelName.VIDEOS}
            />,
          ),
        ),
      );
      expect(queryByText('Watch')).toBeNull();
      cleanup();
    }
  });

  it('adapts the text of the "Upload" button to the video state', () => {
    const { getByText, rerender } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardPaneButtons
            object={{ id: 'vid1', upload_state: PENDING } as Video}
            objectType={modelName.VIDEOS}
          />,
        ),
      ),
    );
    getByText('Upload a video');

    for (const state of [ERROR, PROCESSING, UPLOADING, READY]) {
      rerender(
        wrapInIntlProvider(
          wrapInRouter(
            <DashboardPaneButtons
              object={{ id: 'vid1', upload_state: state } as Video}
              objectType={modelName.VIDEOS}
            />,
          ),
        ),
      );
      getByText('Replace the video');
    }
  });
});
