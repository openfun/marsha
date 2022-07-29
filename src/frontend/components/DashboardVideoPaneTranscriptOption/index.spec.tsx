import { fireEvent } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { act } from 'react-dom/test-utils';

import { useTimedTextTrack } from 'data/stores/useTimedTextTrack';
import { timedTextMode, uploadState } from 'types/tracks';
import { Deferred } from 'utils/tests/Deferred';
import { timedTextMockFactory, videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { DashboardVideoPaneTranscriptOption } from '.';

jest.mock('data/stores/useAppConfig', () => ({}));

describe('<DashboardVideoPaneTranscriptOption />', () => {
  afterEach(jest.resetAllMocks);

  const video = videoMockFactory({
    id: '443',
    timed_text_tracks: [],
    upload_state: uploadState.READY,
    should_use_subtitle_as_transcript: false,
  });

  it('renders nothing if there is no timed text track', () => {
    const { elementContainer: container } = render(
      <DashboardVideoPaneTranscriptOption video={video} />,
    );
    expect(container!.firstChild).toBeNull();
  });

  it('renders nothing if there is already at least a transcript', () => {
    useTimedTextTrack.getState().addMultipleResources([
      timedTextMockFactory({
        id: '42',
        is_ready_to_show: true,
        language: 'fr',
        mode: timedTextMode.TRANSCRIPT,
        upload_state: uploadState.READY,
      }),
    ]);

    const { elementContainer: container } = render(
      <DashboardVideoPaneTranscriptOption video={video} />,
    );
    expect(container!.firstChild).toBeNull();
  });

  it('renders nothing if there is no subtitle', () => {
    useTimedTextTrack.getState().addMultipleResources([
      timedTextMockFactory({
        id: '42',
        is_ready_to_show: true,
        language: 'fr',
        mode: timedTextMode.CLOSED_CAPTIONING,
        upload_state: uploadState.READY,
      }),
    ]);

    const { elementContainer: container } = render(
      <DashboardVideoPaneTranscriptOption video={video} />,
    );
    expect(container!.firstChild).toBeNull();
  });

  it('renders the form if there is at least one subtitle and no transcript', () => {
    useTimedTextTrack.getState().addMultipleResources([
      timedTextMockFactory({
        id: '42',
        is_ready_to_show: true,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
      }),
    ]);

    const { getByLabelText } = render(
      <DashboardVideoPaneTranscriptOption video={video} />,
    );
    expect(getByLabelText('Use subtitles as transcripts')).toHaveProperty(
      'checked',
      false,
    );
  });

  it('updates the checkbox and the video record when the user clicks the checkbox', async () => {
    const deferred = new Deferred();
    fetchMock.mock('/api/videos/443/', deferred.promise, { method: 'PUT' });

    useTimedTextTrack.getState().addMultipleResources([
      timedTextMockFactory({
        id: '42',
        is_ready_to_show: true,
        language: 'fr',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.READY,
      }),
    ]);

    const { getByLabelText } = render(
      <DashboardVideoPaneTranscriptOption video={video} />,
    );
    expect(getByLabelText('Use subtitles as transcripts')).toHaveProperty(
      'checked',
      false,
    );

    await act(async () => {
      fireEvent.click(getByLabelText('Use subtitles as transcripts'));
      return deferred.resolve({
        ...video,
        should_use_subtitle_as_transcript: true,
      });
    });

    expect(getByLabelText('Use subtitles as transcripts')).toHaveProperty(
      'checked',
      true,
    );
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/443/');
    expect(fetchMock.lastCall()![1]!.body).toEqual(
      JSON.stringify({
        ...video,
        should_use_subtitle_as_transcript: true,
      }),
    );
  });
});
