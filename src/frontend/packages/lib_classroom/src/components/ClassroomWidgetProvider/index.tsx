import {
  InfoWidgetModalProvider,
  UploadManager,
  WidgetProps,
  WidgetsContainer,
  WidgetSize,
} from 'lib-components';
import React from 'react';

import { Description } from './widgets/Description';
import { Invite } from './widgets/Invite';
import { Recordings } from './widgets/Recordings';
import { Scheduling } from './widgets/Scheduling';
import { SupportSharing } from './widgets/SupportSharing';

enum WidgetType {
  DESCRIPTION = 'DESCRIPTION',
  SCHEDULING = 'SCHEDULING',
  INVITE = 'INVITE',
  SUPPORT_SHARING = 'SUPPORT_SHARING',
  RECORDINGS = 'RECORDINGS',
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
};

const classroomWidgets: WidgetType[] = [
  WidgetType.DESCRIPTION,
  WidgetType.SCHEDULING,
  WidgetType.INVITE,
  WidgetType.SUPPORT_SHARING,
  WidgetType.RECORDINGS,
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
