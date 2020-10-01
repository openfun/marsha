import { fireEvent, render } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { act } from 'react-dom/test-utils';

import { DashboardVideoPaneDownloadOption } from '.';
import { uploadState } from '../../types/tracks';
import { Deferred } from '../../utils/tests/Deferred';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';

jest.mock('../../data/appData', () => ({
  appData: {},
}));

describe('<DashboardVideoPaneDownloadOption />', () => {
  afterEach(() => fetchMock.restore());

  const video = videoMockFactory({
    id: '442',
    show_download: false,
    upload_state: uploadState.READY,
  });

  it('renders with checkbox not checked', () => {
    const { getByLabelText } = render(
      wrapInIntlProvider(
        <React.Fragment>
          {' '}
          <DashboardVideoPaneDownloadOption video={video} />
        </React.Fragment>,
      ),
    );

    expect(getByLabelText('Allow video download')).toHaveProperty(
      'checked',
      false,
    );
  });

  it('updates the checkbox and the video record when the user clicks the checkbox', async () => {
    const deferred = new Deferred();
    fetchMock.mock('/api/videos/442/', deferred.promise, { method: 'PUT' });
    const { getByLabelText } = render(
      wrapInIntlProvider(
        <React.Fragment>
          {' '}
          <DashboardVideoPaneDownloadOption video={video} />
        </React.Fragment>,
      ),
    );

    expect(getByLabelText('Allow video download')).toHaveProperty(
      'checked',
      false,
    );

    await act(async () => {
      fireEvent.click(getByLabelText('Allow video download'));
      return deferred.resolve({ ...video, show_download: true });
    });

    expect(getByLabelText('Allow video download')).toHaveProperty(
      'checked',
      true,
    );
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/442/');
    expect(fetchMock.lastCall()![1]!.body).toEqual(
      JSON.stringify({
        ...video,
        show_download: true,
      }),
    );
  });
});
