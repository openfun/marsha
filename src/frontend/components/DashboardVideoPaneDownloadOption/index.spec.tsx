import { fireEvent, render } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { act } from 'react-dom/test-utils';

import { DashboardVideoPaneDownloadOption } from '.';
import { uploadState } from '../../types/tracks';
import { Deferred } from '../../utils/tests/Deferred';
import { wrapInIntlProvider } from '../../utils/tests/intl';

jest.mock('../../data/appData', () => ({
  appData: {},
}));

describe('<DashboardVideoPaneDownloadOption />', () => {
  afterEach(() => fetchMock.restore());

  const video = {
    description: 'Some description',
    has_transcript: false,
    id: '442',
    is_ready_to_show: true,
    show_download: false,
    thumbnail: null,
    timed_text_tracks: [],
    title: 'Some title',
    upload_state: uploadState.READY,
    urls: {
      manifests: {
        dash: 'https://example.com/dash.mpd',
        hls: 'https://example.com/hls.m3u8',
      },
      mp4: {
        144: 'https://example.com/144p.mp4',
        240: 'https://example.com/240p.mp4',
        480: 'https://example.com/480p.mp4',
        720: 'https://example.com/720p.mp4',
        1080: 'https://example.com/1080p.mp4',
      },
      thumbnails: {
        144: 'https://example.com/144p.jpg',
        240: 'https://example.com/240p.jpg',
        480: 'https://example.com/480p.jpg',
        720: 'https://example.com/720p.jpg',
        1080: 'https://example.com/1080p.jpg',
      },
    },
    should_use_subtitle_as_transcript: false,
  };

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
    fetchMock.mock(
      '/api/videos/442/',
      deferred.promise,
      { method: 'PUT' },
    );
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
