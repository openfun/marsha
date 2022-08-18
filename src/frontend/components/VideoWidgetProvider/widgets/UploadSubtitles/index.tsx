import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { FoldableItem } from 'components/graphicals/FoldableItem';
import { LocalizedTimedTextTrackUpload } from 'components/LocalizedTimedTextTrackUpload';
import { timedTextMode } from 'types/tracks';

const messages = defineMessages({
  info: {
    defaultMessage: 'This widget allows you upload subtitles for the video.',
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
      <LocalizedTimedTextTrackUpload
        timedTextModeWidget={timedTextMode.SUBTITLE}
      />
    </FoldableItem>
  );
};
