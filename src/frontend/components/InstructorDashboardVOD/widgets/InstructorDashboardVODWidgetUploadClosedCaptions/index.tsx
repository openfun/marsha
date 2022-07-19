import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { DashboardVideoLiveWidgetTemplate } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetTemplate';
import { timedTextMode } from 'types/tracks';
import { UploadWidgetGeneric } from '../UploadWidgetGeneric';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you upload closed captions for the video.',
    description: 'Info of the widget used for uploading closed captions.',
    id: 'components.InstructorDashboardVODWidgetUploadClosedCaptions.info',
  },
  title: {
    defaultMessage: 'Closed captions',
    description: 'Title of the widget used for uploading closed captions.',
    id: 'components.InstructorDashboardVODWidgetUploadClosedCaptions.title',
  },
});

export const InstructorDashboardVODWidgetUploadClosedCaptions = () => {
  const intl = useIntl();

  return (
    <DashboardVideoLiveWidgetTemplate
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <UploadWidgetGeneric
        timedTextModeWidget={timedTextMode.CLOSED_CAPTIONING}
      />
    </DashboardVideoLiveWidgetTemplate>
  );
};
