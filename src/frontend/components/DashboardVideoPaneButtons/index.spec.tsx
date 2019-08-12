import { cleanup, render } from '@testing-library/react';
import React from 'react';

import { DashboardVideoPaneButtons } from '.';
import { uploadState, Video } from '../../types/tracks';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = uploadState;

describe('<DashboardVideoPaneButtons />', () => {
  it('only renders the "Watch" button if the video is ready', () => {
    const { getByText } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoPaneButtons
            video={{ upload_state: READY } as Video}
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
            <DashboardVideoPaneButtons
              video={{ upload_state: state } as Video}
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
          <DashboardVideoPaneButtons
            video={{ upload_state: PENDING } as Video}
          />,
        ),
      ),
    );
    getByText('Upload a video');

    for (const state of [ERROR, PROCESSING, UPLOADING, READY]) {
      rerender(
        wrapInIntlProvider(
          wrapInRouter(
            <DashboardVideoPaneButtons
              video={{ upload_state: state } as Video}
            />,
          ),
        ),
      );
      getByText('Replace the video');
    }
  });
});
