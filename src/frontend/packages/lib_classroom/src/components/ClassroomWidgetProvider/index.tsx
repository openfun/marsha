import {
  InfoWidgetModalProvider,
  UploadManager,
  WidgetProps,
  WidgetSize,
  WidgetsContainer,
} from 'lib-components';
import React from 'react';

import { DeleteClassroom } from './widgets/DeleteClassroom';
import { Description } from './widgets/Description';
import { Invite } from './widgets/Invite';
import { Recordings } from './widgets/Recordings';
import { RetentionDate } from './widgets/RetentionDate';
import { Scheduling } from './widgets/Scheduling';
import { SupportSharing } from './widgets/SupportSharing';
import { ToolsAndApplications } from './widgets/ToolsAndApplications';

enum WidgetType {
  DESCRIPTION = 'DESCRIPTION',
  TOOLS_AND_APPLICATIONS = 'TOOLS_AND_APPLICATIONS',
  SCHEDULING = 'SCHEDULING',
  INVITE = 'INVITE',
  SUPPORT_SHARING = 'SUPPORT_SHARING',
  RECORDINGS = 'RECORDINGS',
  DELETE_CLASSROOM = 'DELETE_CLASSROOM',
  RETENTION_DATE = 'RETENTION_DATE',
}

const widgetLoader: { [key in WidgetType]: WidgetProps } = {
  [WidgetType.DESCRIPTION]: {
    component: <Description />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.SCHEDULING]: {
    component: <Scheduling />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.INVITE]: {
    component: <Invite />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.SUPPORT_SHARING]: {
    component: <SupportSharing />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.RECORDINGS]: {
    component: <Recordings />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.TOOLS_AND_APPLICATIONS]: {
    component: <ToolsAndApplications />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.RETENTION_DATE]: {
    component: <RetentionDate />,
    size: WidgetSize.DEFAULT,
  },
  [WidgetType.DELETE_CLASSROOM]: {
    component: <DeleteClassroom />,
    size: WidgetSize.DEFAULT,
  },
};

const classroomWidgets: WidgetType[] = [
  WidgetType.TOOLS_AND_APPLICATIONS,
  WidgetType.DESCRIPTION,
  WidgetType.INVITE,
  WidgetType.SCHEDULING,
  WidgetType.SUPPORT_SHARING,
  WidgetType.RECORDINGS,
  WidgetType.RETENTION_DATE,
  WidgetType.DELETE_CLASSROOM,
];

export const ClassroomWidgetProvider = () => {
  const widgets = classroomWidgets.map(
    (widgetType) => widgetLoader[widgetType],
  );

  return (
    <UploadManager>
      <InfoWidgetModalProvider value={null}>
        <WidgetsContainer>{widgets}</WidgetsContainer>
      </InfoWidgetModalProvider>
    </UploadManager>
  );
};
