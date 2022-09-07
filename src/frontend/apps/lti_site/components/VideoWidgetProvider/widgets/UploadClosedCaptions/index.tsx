import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { LocalizedTimedTextTrackUpload } from 'components/LocalizedTimedTextTrackUpload';
import { FoldableItem } from 'components/graphicals/FoldableItem';
import { timedTextMode } from 'types/tracks';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you upload closed captions for the video.',
    description: 'Info of the widget used for uploading closed captions.',
    id: 'components.UploadClosedCaptions.info',
  },
  title: {
    defaultMessage: 'Closed captions',
    description: 'Title of the widget used for uploading closed captions.',
    id: 'components.UploadClosedCaptions.title',
  },
});

export const UploadClosedCaptions = () => {
  const intl = useIntl();

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <LocalizedTimedTextTrackUpload
        timedTextModeWidget={timedTextMode.CLOSED_CAPTIONING}
      />
    </FoldableItem>
  );
};
