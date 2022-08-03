import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardLiveWidgetTemplate } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetTemplate';
import { timedTextMode } from 'types/tracks';
import { UploadWidgetGeneric } from '../UploadWidgetGeneric';

const messages = defineMessages({
  info: {
    defaultMessage: 'This widget allows you upload subtitles for the video.',
    description: 'Info of the widget used for uploading subtitles.',
    id: 'components.DashboardVODWidgetUploadSubtitles.info',
  },
  title: {
    defaultMessage: 'Subtitles',
    description: 'Title of the widget used for uploading subtitles.',
    id: 'components.DashboardVODWidgetUploadSubtitles.title',
  },
});

export const DashboardVODWidgetUploadSubtitles = () => {
  const intl = useIntl();

  return (
    <DashboardLiveWidgetTemplate
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <UploadWidgetGeneric timedTextModeWidget={timedTextMode.SUBTITLE} />
    </DashboardLiveWidgetTemplate>
  );
};
