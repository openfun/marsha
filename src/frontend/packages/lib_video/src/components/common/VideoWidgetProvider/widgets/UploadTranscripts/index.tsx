import { FoldableItem, timedTextMode } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { LocalizedTimedTextTrackUpload } from '../../LocalizedTimedTextTrackUpload';

const messages = defineMessages({
  info: {
    defaultMessage: `This widget allows you upload transcripts for the video.
    Accepted formats : MicroDVD SUB (.sub) - SubRip (.srt) - SubViewer (.sbv)
      - WebVTT (.vtt) - SubStation Alpha (.ssa and .ass) - SAMI (.smi) aka Synchronized 
      Accessible Media Interchange
      - LRC (.lrc) aka LyRiCs - JSON (.json)`,
    description: 'Info of the widget used for uploading transcripts.',
    id: 'components.UploadTranscripts.info',
  },
  title: {
    defaultMessage: 'Transcripts',
    description: 'Title of the widget used for uploading transcripts.',
    id: 'components.UploadTranscripts.title',
  },
});

export const UploadTranscripts = () => {
  const intl = useIntl();

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <LocalizedTimedTextTrackUpload
        timedTextModeWidget={timedTextMode.TRANSCRIPT}
      />
    </FoldableItem>
  );
};
