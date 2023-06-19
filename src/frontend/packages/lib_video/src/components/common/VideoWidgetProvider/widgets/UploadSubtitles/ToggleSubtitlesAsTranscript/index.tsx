import {
  ToggleInput,
  Video,
  report,
  timedTextMode,
  useTimedTextTrack,
} from 'lib-components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateVideo } from '@lib-video/api/useUpdateVideo';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

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
  const [disabledToggle, setDisabledToggle] = useState(false);

  const { mutate } = useUpdateVideo(video.id, {
    onSuccess: (videoUpdated: Video) => {
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
    mutate({
      should_use_subtitle_as_transcript:
        !video.should_use_subtitle_as_transcript,
    });
  }, [video.should_use_subtitle_as_transcript, mutate]);

  const transcripts = useMemo(
    () =>
      timedTextTracks
        .filter((track) => track.is_ready_to_show)
        .filter((track) => timedTextMode.TRANSCRIPT === track.mode),
    [timedTextTracks],
  );

  const subtitles = useMemo(
    () =>
      timedTextTracks
        .filter((track) => track.is_ready_to_show)
        .filter((track) => timedTextMode.SUBTITLE === track.mode),
    [timedTextTracks],
  );

  /**
   * - Disable and uncheck toggle if there is already an uploaded file for transcript
   * - Enable toggle if there is at least one subtitle file that can be used as transcript and no existing transcript file
   */
  useEffect(() => {
    if ((!subtitles.length || transcripts.length) && !disabledToggle) {
      setDisabledToggle(true);
      if (video.should_use_subtitle_as_transcript) {
        onToggleChange();
      }
    } else if (subtitles.length && !transcripts.length && disabledToggle) {
      setDisabledToggle(false);
    }
  }, [
    subtitles.length,
    transcripts.length,
    video.should_use_subtitle_as_transcript,
    disabledToggle,
    onToggleChange,
  ]);

  return (
    <ToggleInput
      disabled={disabledToggle}
      checked={video.should_use_subtitle_as_transcript}
      onChange={onToggleChange}
      label={intl.formatMessage(messages.useTranscriptToggleLabel)}
      truncateLabel={false}
    />
  );
};
