import {
  InfoWidgetModalProvider,
  UploadManager,
  WidgetProps,
  WidgetsContainer,
  WidgetSize,
} from 'lib-components';
import React from 'react';

import { ClassroomDescriptionWidget } from './widgets/ClassroomDescriptionWidget';
import { Invite } from './widgets/Invite';
import { Scheduling } from './widgets/Scheduling';

enum WidgetType {
  DESCRIPTION = 'DESCRIPTION',
  SCHEDULING = 'SCHEDULING',
  INVITE = 'INVITE',
}

const widgetLoader: { [key in WidgetType]: WidgetProps } = {
  [WidgetType.DESCRIPTION]: {
    component: <ClassroomDescriptionWidget />,
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
const classroomWidgets: WidgetType[] = [
  WidgetType.DESCRIPTION,
  WidgetType.SCHEDULING,
  WidgetType.INVITE,
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
