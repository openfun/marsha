import { Box, Button } from 'grommet';
import {
  FoldableItem,
  TimedText,
  TimedTextTrackState,
  TimedTextTranscript,
  timedTextMode,
  useTimedTextTrack,
} from 'lib-components';
import React, { useCallback, useMemo } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

import { TranscriptReader } from './TranscriptReader';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to read and downloads transcripts for the video.',
    description: 'Info of the widget used for uploading transcripts.',
    id: 'components.UploadTranscripts.info',
  },
  title: {
    defaultMessage: 'Transcripts',
    description: 'Title of the widget used for read and download transcripts.',
    id: 'components.UploadTranscripts.title',
  },
  hideTranscript: {
    defaultMessage: 'Hide transcript',
    description: 'Text to hide a displayed transcript',
    id: 'components.Transcripts.hideTranscript',
  },
  transcriptDownload: {
    defaultMessage: 'Download transcript',
    description: 'Download Transcript',
    id: 'components.Transcripts.download',
  },
});

/*
 * Component. Displays the available choices for transcripts and plays a transcript when the user selects it.
 */
export const Transcripts = () => {
  const intl = useIntl();
  const video = useCurrentVideo();
  const { selectedTranscript } = useTimedTextTrack((state) => state);
  const timeTextFetcher = useCallback(
    (state: TimedTextTrackState) => state.getTimedTextTracks(),
    [],
  );
  const timedTextTracks: TimedText[] = useTimedTextTrack(timeTextFetcher);

  const transcripts = useMemo(() => {
    return timedTextTracks
      .filter((track) => track.is_ready_to_show)
      .filter((track) =>
        video.has_transcript === false &&
        video.should_use_subtitle_as_transcript
          ? timedTextMode.SUBTITLE === track.mode
          : timedTextMode.TRANSCRIPT === track.mode,
      ) as TimedTextTranscript[];
  }, [
    timedTextTracks,
    video.has_transcript,
    video.should_use_subtitle_as_transcript,
  ]);

  if (!selectedTranscript || !transcripts || transcripts.length === 0) {
    return null;
  }

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue={true}
      title={intl.formatMessage(messages.title)}
    >
      <Box
        direction="row"
        gap="small"
        style={{
          marginTop: '0.75rem',
          marginBottom: '0.75rem',
        }}
      >
        <Button
          a11yTitle={intl.formatMessage(messages.transcriptDownload)}
          download
          disabled={!selectedTranscript}
          label={intl.formatMessage(messages.transcriptDownload)}
          href={
            (selectedTranscript && selectedTranscript.source_url) ?? undefined
          }
          target="_blank"
          rel="noopener noreferrer"
          primary
          title={intl.formatMessage(messages.transcriptDownload)}
          style={{ height: '50px' }}
        />
      </Box>
      {selectedTranscript && (
        <Box>
          <TranscriptReader
            transcript={selectedTranscript}
            key={selectedTranscript.id}
          />
        </Box>
      )}
    </FoldableItem>
  );
};
