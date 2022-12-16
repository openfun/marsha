import { timedTextMode } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { FoldableItem } from '../../FoldableItem';
import { LocalizedTimedTextTrackUpload } from '../../LocalizedTimedTextTrackUpload';

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
