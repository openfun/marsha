import { fireEvent, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  useJwt,
  timedTextMockFactory,
  useTimedTextTrack,
  timedTextMode,
  uploadState,
} from 'lib-components';
import React from 'react';

import render from 'utils/tests/render';

import { TimedTextListItem } from '.';

describe('<TimedTextListItem />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'foo',
    });

    fetchMock.mock(
      '/api/timedtexttracks/',
      {
        actions: {
          POST: {
            language: {
              choices: [
                { display_name: 'English', value: 'en' },
                { display_name: 'French', value: 'fr' },
              ],
            },
          },
        },
      },
      { method: 'OPTIONS' },
    );
  });

  afterEach(() => {
    jest.clearAllTimers();
    fetchMock.restore();
  });

  it('renders a track, showing its language and status', async () => {
    render(
      <TimedTextListItem
        track={{
          active_stamp: 28271937429,
          id: '42',
          is_ready_to_show: true,
          language: 'fr',
          mode: timedTextMode.SUBTITLE,
          title: 'foo',
          upload_state: uploadState.READY,
          source_url: 'https://example.com/timedtext/source/42',
          url: 'https://example.com/timedtext/42.vtt',
          video: '142',
        }}
      />,
    );

    await screen.findByText('French');
    screen.getByText((content) => content.startsWith('Ready'));
    const downloadLink = screen.getByRole('link', { name: 'Download' });
    expect(downloadLink.getAttribute('href')).toEqual(
      'https://example.com/timedtext/source/42',
    );
  });

  describe('delete link', () => {
    it('issues a deleteTimedTextTrack request and deletes the track from the store', async () => {
      fetchMock.delete('/api/timedtexttracks/42/', 204);
      const track = timedTextMockFactory({
        active_stamp: 28271937429,
        id: '42',
        is_ready_to_show: true,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        title: 'foo',
        upload_state: uploadState.READY,
        source_url: 'https://example.com/timedtext/source/42',
        url: 'https://example.com/timedtext/42.vtt',
        video: '142',
      });
      useTimedTextTrack.getState().addResource(track);

      const { getByText } = render(<TimedTextListItem track={track} />);

      expect(useTimedTextTrack.getState().getTimedTextTracks()).toEqual([
        track,
      ]);

      fireEvent.click(getByText('Delete'));
      await waitFor(() =>
        expect(
          fetchMock.called('/api/timedtexttracks/42/', { method: 'DELETE' }),
        ),
      );
      expect(useTimedTextTrack.getState().getTimedTextTracks()).toHaveLength(0);
    });
  });
});
