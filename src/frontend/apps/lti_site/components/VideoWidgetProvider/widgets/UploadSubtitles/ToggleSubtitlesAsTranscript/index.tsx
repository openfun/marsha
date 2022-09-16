import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { ToggleInput } from 'components/graphicals/ToggleInput';
import { useUpdateVideo } from 'data/queries';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { useTimedTextTrack } from 'data/stores/useTimedTextTrack';
import { timedTextMode, Video } from 'types/tracks';
import { report } from 'utils/errors/report';

const messages = defineMessages({
  useTranscriptToggleLabel: {
    defaultMessage: 'Use subtitles as transcripts',
    description: 'Label of the toggle used to use subtitles as transcripts.',
    id: 'component.ToggleSubtitlesAsTranscript.useTranscriptToggleLabel',
  },
  useTranscriptToggleSuccess: {
    defaultMessage: 'Use subtitles as transcripts activated.',
    description:
      'Message displayed when use subtitles as transcripts succeded.',
    id: 'components.ToggleSubtitlesAsTranscript.useTranscriptToggleSuccess',
  },
  unuseTranscriptToggleSuccess: {
    defaultMessage: 'Use subtitles as transcripts deactivated.',
    description:
      'Message displayed when unuse subtitles as transcripts succeded.',
    id: 'components.ToggleSubtitlesAsTranscript.unuseTranscriptToggleSuccess',
  },
  useTranscriptoggleFail: {
    defaultMessage: 'Update failed, try again.',
    description:
      'Message displayed when use subtitles as transcripts has failed.',
    id: 'components.ToggleSubtitlesAsTranscript.useTranscriptoggleFail',
  },
});

export const ToggleSubtitlesAsTranscript = () => {
  const intl = useIntl();

  const timedTextTracks = useTimedTextTrack((state) =>
    state.getTimedTextTracks(),
  );

  const video = useCurrentVideo();

  const [toggleUseTranscript, setToggleUseTranscript] = useState(
    video.should_use_subtitle_as_transcript,
  );

  useEffect(() => {
    setToggleUseTranscript(video.should_use_subtitle_as_transcript);
  }, [video.should_use_subtitle_as_transcript]);

  const [disabledToggle, setDisabledToggle] = useState(false);

  const videoMutation = useUpdateVideo(video.id, {
    onSuccess: (videoUpdated: Video) => {
      setToggleUseTranscript(videoUpdated.should_use_subtitle_as_transcript);
      toast.success(
        intl.formatMessage(
          videoUpdated.should_use_subtitle_as_transcript
            ? messages.useTranscriptToggleSuccess
            : messages.unuseTranscriptToggleSuccess,
        ),
        {
          position: 'bottom-center',
        },
      );
    },
    onError: (err) => {
      report(err);
      toast.error(intl.formatMessage(messages.useTranscriptoggleFail), {
        position: 'bottom-center',
      });
    },
    onMutate: () => {
      setDisabledToggle(true);
    },
    onSettled: () => {
      setDisabledToggle(false);
    },
  });

  const onToggleChange = useCallback(() => {
    videoMutation.mutate({
      should_use_subtitle_as_transcript:
        !video.should_use_subtitle_as_transcript,
    });
  }, [video.should_use_subtitle_as_transcript, videoMutation]);

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

  if (transcripts.length > 0 || subtitles.length === 0) {
    return null;
  }

  return (
    <ToggleInput
      disabled={disabledToggle}
      checked={toggleUseTranscript}
      onChange={onToggleChange}
      label={intl.formatMessage(messages.useTranscriptToggleLabel)}
      truncateLabel={false}
    />
  );
};
