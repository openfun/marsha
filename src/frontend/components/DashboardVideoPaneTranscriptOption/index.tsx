import { Box, CheckBox, Form, Text } from 'grommet';
import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { updateResource } from '../../data/sideEffects/updateResource';
import { useTimedTextTrack } from '../../data/stores/useTimedTextTrack';
import { useVideo } from '../../data/stores/useVideo';
import { modelName } from '../../types/models';
import { timedTextMode, Video } from '../../types/tracks';
import { useAsyncEffect } from '../../utils/useAsyncEffect';

const messages = defineMessages({
  updateVideoFail: {
    defaultMessage: 'Failed to update your video. Please try again later.',
    description: 'Failed to update download permission on your video.',
    id: 'component.DashboardVideoPaneTranscriptOption.updateVideoFail',
  },
  useTranscript: {
    defaultMessage: 'Use subtitles as transcripts',
    description: '',
    id: 'component.DashboardVideoPaneTranscriptOption.useTranscript',
  },
});

interface DashboardVideoPaneTranscriptOptionProps {
  video: Video;
}

export const DashboardVideoPaneTranscriptOption = ({
  video,
}: DashboardVideoPaneTranscriptOptionProps) => {
  const timedTextTracks = useTimedTextTrack((state) =>
    state.getTimedTextTracks(),
  );
  const { updateVideo } = useVideo((state) => ({
    updateVideo: state.addResource,
  }));
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState(
    video.should_use_subtitle_as_transcript,
  );

  useAsyncEffect(async () => {
    if (checked !== video.should_use_subtitle_as_transcript) {
      try {
        const newVideo = await updateResource(
          {
            ...video,
            should_use_subtitle_as_transcript: checked,
          },
          modelName.VIDEOS,
        );
        updateVideo(newVideo);
      } catch (e) {
        setChecked(!checked);
        setError(true);
      }
    }
  }, [checked]);

  // if there is no timed text track, do not display this component.
  if (timedTextTracks.length === 0) {
    return null;
  }

  const transcripts = timedTextTracks
    .filter((track) => track.is_ready_to_show)
    .filter((track) => timedTextMode.TRANSCRIPT === track.mode);

  const subtitles = timedTextTracks
    .filter((track) => track.is_ready_to_show)
    .filter((track) => timedTextMode.SUBTITLE === track.mode);

  // Transcripts are already uploaded or there is no subtitle uploaded.
  // Do not display this component.
  if (transcripts.length > 0 || subtitles.length === 0) {
    return null;
  }

  // There is no transcript but subtitles available
  return (
    <Box align={'center'} direction={'row'} pad={{ top: 'small' }}>
      <Form>
        <CheckBox
          id={'useTranscript'}
          onChange={() => setChecked(!checked)}
          checked={checked}
          label={<FormattedMessage {...messages.useTranscript} />}
          reverse={true}
          toggle
        />
        {error && (
          <Text id={'updateVideoFail'} color="status-error">
            <FormattedMessage {...messages.updateVideoFail} />
          </Text>
        )}
      </Form>
    </Box>
  );
};
