import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardVideoLiveWidgetTemplate } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetTemplate';
import { timedTextMode } from 'types/tracks';
import { UploadWidgetGeneric } from '../UploadWidgetGeneric';

const messages = defineMessages({
  info: {
    defaultMessage: 'This widget allows you upload transcripts for the video.',
    description: 'Info of the widget used for uploading transcripts.',
    id: 'components.InstructorDashboardVODWidgetUploadTranscripts.info',
  },
  title: {
    defaultMessage: 'Transcripts',
    description: 'Title of the widget used for uploading transcripts.',
    id: 'components.InstructorDashboardVODWidgetUploadTranscripts.title',
  },
});

export const InstructorDashboardVODWidgetUploadTranscripts = () => {
  const intl = useIntl();

  return (
    <DashboardVideoLiveWidgetTemplate
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <UploadWidgetGeneric timedTextModeWidget={timedTextMode.TRANSCRIPT} />
    </DashboardVideoLiveWidgetTemplate>
  );
};
