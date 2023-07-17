import { FoldableItem, timedTextMode } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { LocalizedTimedTextTrackUpload } from '../../LocalizedTimedTextTrackUpload';

import { ToggleSubtitlesAsTranscript } from './ToggleSubtitlesAsTranscript';

const messages = defineMessages({
  info: {
    defaultMessage: `This widget allows you upload subtitles for the video.
    Toggle to use as transcripts can be disabled because there
    is no subtitle or at least one transcript exists.
    Accepted formats : MicroDVD SUB (.sub) - SubRip (.srt) - SubViewer (.sbv)
      - WebVTT (.vtt) - SubStation Alpha (.ssa and .ass) - SAMI (.smi) aka Synchronized 
      Accessible Media Interchange
      - LRC (.lrc) aka LyRiCs - JSON (.json)`,
    description: 'Info of the widget used for uploading subtitles.',
    id: 'components.UploadSubtitles.info',
  },
  title: {
    defaultMessage: 'Subtitles',
    description: 'Title of the widget used for uploading subtitles.',
    id: 'components.UploadSubtitles.title',
  },
});

export const UploadSubtitles = () => {
  const intl = useIntl();

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <ToggleSubtitlesAsTranscript />
      <LocalizedTimedTextTrackUpload
        timedTextModeWidget={timedTextMode.SUBTITLE}
      />
    </FoldableItem>
  );
};
