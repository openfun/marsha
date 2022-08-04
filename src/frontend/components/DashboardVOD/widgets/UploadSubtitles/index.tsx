import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { WidgetTemplate } from 'components/common/dashboard/widgets/WidgetTemplate';
import { UploadWidgetGeneric } from 'components/DashboardVOD/components/UploadWidgetGeneric';
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
    <WidgetTemplate
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <UploadWidgetGeneric timedTextModeWidget={timedTextMode.SUBTITLE} />
    </WidgetTemplate>
  );
};
