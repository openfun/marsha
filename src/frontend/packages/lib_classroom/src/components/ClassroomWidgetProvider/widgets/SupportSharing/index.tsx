import { FoldableItem } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { UploadDocuments } from '@lib-classroom/components/ClassroomWidgetProvider/widgets/SupportSharing/UploadDocuments';
import { useCurrentClassroom } from '@lib-classroom/hooks/useCurrentClassroom';

const messages = defineMessages({
  title: {
    defaultMessage: 'Upload Documents',
    description: 'A title for the widget.',
    id: 'component.SupportSharing.title',
  },
  info: {
    defaultMessage: `All documents uploaded here will be added to the classroom when you will start it. 
      If you upload multiple document you can choose the default one display first when the classroom is started.`,
    description: 'Helptext for the widget.',
    id: 'component.SupportSharing.info',
  },
});

export const SupportSharing = () => {
  const classroom = useCurrentClassroom();
  const intl = useIntl();

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <UploadDocuments classroomId={classroom.id} />
    </FoldableItem>
  );
};
