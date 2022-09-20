import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import React, { PropsWithChildren } from 'react';

import { useTimedTextTrack } from 'data/stores/useTimedTextTrack';
import { timedTextMode } from 'types/tracks';
import { timedTextMockFactory, videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { ToggleSubtitlesAsTranscript } from '.';

const mockSetInfoWidgetModal = jest.fn();
const mockedVideo = videoMockFactory();
const toggleLabel = 'Use subtitles as transcripts';
const mockedTimedTextTrackSubtitle = timedTextMockFactory({
  language: 'fr-FR',
  is_ready_to_show: true,
  mode: timedTextMode.SUBTITLE,
});

jest.mock('data/stores/useInfoWidgetModal', () => ({
  useInfoWidgetModal: () => [
    { isVisible: false, text: null, title: null },
    mockSetInfoWidgetModal,
  ],
  InfoWidgetModalProvider: ({ children }: PropsWithChildren<{}>) => children,
}));

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

describe('<ToggleSubtitlesAsTranscript />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.reset();
  });

  it('check component render depend the timedTextTrack state', async () => {
    const mockedTimedTextTrackTranscript = timedTextMockFactory({
      language: 'fr-FR',
      is_ready_to_show: true,
      mode: timedTextMode.TRANSCRIPT,
    });

    render(wrapInVideo(<ToggleSubtitlesAsTranscript />, mockedVideo));

    expect(
      screen.queryByRole('checkbox', {
        name: toggleLabel,
      }),
    ).not.toBeInTheDocument();

    // Update the state with a timed text track in subtitle mode
    act(() => {
      useTimedTextTrack.getState().addResource(mockedTimedTextTrackSubtitle);
    });

    expect(
      screen.getByRole('checkbox', {
        name: toggleLabel,
      }),
    ).toBeInTheDocument();

    // Update the state with a timed text track in transcript mode
    act(() => {
      useTimedTextTrack.getState().addResource(mockedTimedTextTrackTranscript);
    });

    expect(
      screen.queryByRole('checkbox', {
        name: toggleLabel,
      }),
    ).not.toBeInTheDocument();
  });

  it('check disable attribute', async () => {
    const toggleFailLabel = 'Update failed, try again.';

    render(wrapInVideo(<ToggleSubtitlesAsTranscript />, mockedVideo));

    // Update the state with a timed text track in subtitle mode
    act(() => {
      useTimedTextTrack.getState().addResource(mockedTimedTextTrackSubtitle);
    });

    const toggle = screen.getByRole('checkbox', {
      name: toggleLabel,
    });

    userEvent.click(toggle);

    await waitFor(() => {
      expect(toggle).toBeDisabled();
    });

    expect(await screen.findByText(toggleFailLabel)).toBeInTheDocument();

    expect(toggle).not.toBeDisabled();
  });

  it('check failed update', async () => {
    const toggleFailLabel = 'Update failed, try again.';

    render(wrapInVideo(<ToggleSubtitlesAsTranscript />, mockedVideo));

    // Update the state with a timed text track in subtitle mode
    act(() => {
      useTimedTextTrack.getState().addResource(mockedTimedTextTrackSubtitle);
    });

    const toggle = screen.getByRole('checkbox', {
      name: toggleLabel,
    });

    expect(screen.queryByText(toggleFailLabel)).not.toBeInTheDocument();

    userEvent.click(toggle);

    expect(await screen.findByText(toggleFailLabel)).toBeInTheDocument();
  });

  it('check toggle success use subtitle as transcript', async () => {
    const toggleSuccessLabel = 'Use subtitles as transcripts activated.';
    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      should_use_subtitle_as_transcript: true,
    });

    render(wrapInVideo(<ToggleSubtitlesAsTranscript />, mockedVideo));

    // Update the state with a timed text track in subtitle mode
    act(() => {
      useTimedTextTrack.getState().addResource(mockedTimedTextTrackSubtitle);
    });

    const toggle = screen.getByRole('checkbox', {
      name: toggleLabel,
    });

    expect(screen.queryByText(toggleSuccessLabel)).not.toBeInTheDocument();

    userEvent.click(toggle);

    expect(await screen.findByText(toggleSuccessLabel)).toBeInTheDocument();

    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer json web token',
      },
      method: 'PATCH',
      body: '{"should_use_subtitle_as_transcript":true}',
    });
  });

  it('check toggle success unuse subtitle as transcript', async () => {
    const mockedVideoSubAsTrans = videoMockFactory({
      should_use_subtitle_as_transcript: true,
    });
    const toggleSuccessLabel = 'Use subtitles as transcripts deactivated.';
    fetchMock.patch(`/api/videos/${mockedVideoSubAsTrans.id}/`, {
      ...mockedVideoSubAsTrans,
      should_use_subtitle_as_transcript: false,
    });

    render(wrapInVideo(<ToggleSubtitlesAsTranscript />, mockedVideoSubAsTrans));

    // Update the state with a timed text track in subtitle mode
    act(() => {
      useTimedTextTrack.getState().addResource(mockedTimedTextTrackSubtitle);
    });

    const toggle = screen.getByRole('checkbox', {
      name: toggleLabel,
    });

    expect(screen.queryByText(toggleSuccessLabel)).not.toBeInTheDocument();

    userEvent.click(toggle);

    expect(await screen.findByText(toggleSuccessLabel)).toBeInTheDocument();

    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer json web token',
      },
      method: 'PATCH',
      body: '{"should_use_subtitle_as_transcript":false}',
    });
  });
});
