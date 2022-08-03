import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { WidgetTemplate } from 'components/common/dashboard/widgets/WidgetTemplate';
import { UploadWidgetGeneric } from 'components/DashboardVOD/components/UploadWidgetGeneric';
import { timedTextMode } from 'types/tracks';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you upload closed captions for the video.',
    description: 'Info of the widget used for uploading closed captions.',
    id: 'components.DashboardVODWidgetUploadClosedCaptions.info',
  },
  title: {
    defaultMessage: 'Closed captions',
    description: 'Title of the widget used for uploading closed captions.',
    id: 'components.DashboardVODWidgetUploadClosedCaptions.title',
  },
});

export const DashboardVODWidgetUploadClosedCaptions = () => {
  const intl = useIntl();

  return (
    <WidgetTemplate
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <UploadWidgetGeneric
        timedTextModeWidget={timedTextMode.CLOSED_CAPTIONING}
      />
    </WidgetTemplate>
  );
};
