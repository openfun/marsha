import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardVideoLiveWidgetTemplate } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetTemplate';
import { timedTextMode } from 'types/tracks';
import { UploadWidgetGeneric } from '../UploadWidgetGeneric';

const messages = defineMessages({
  info: {
    defaultMessage: 'This widget allows you upload subtitles for the video.',
    description: 'Info of the widget used for uploading subtitles.',
    id: 'components.InstructorDashboardVODWidgetUploadSubtitles.info',
  },
  title: {
    defaultMessage: 'Subtitles',
    description: 'Title of the widget used for uploading subtitles.',
    id: 'components.InstructorDashboardVODWidgetUploadSubtitles.title',
  },
});

export const InstructorDashboardVODWidgetUploadSubtitles = () => {
  const intl = useIntl();

  return (
    <DashboardVideoLiveWidgetTemplate
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <UploadWidgetGeneric timedTextModeWidget={timedTextMode.SUBTITLE} />
    </DashboardVideoLiveWidgetTemplate>
  );
};
