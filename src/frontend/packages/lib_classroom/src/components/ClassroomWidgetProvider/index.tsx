import {
  InfoWidgetModalProvider,
  UploadManager,
  WidgetProps,
  WidgetsContainer,
  WidgetSize,
} from 'lib-components';
import React from 'react';

import { ClassroomDescriptionWidget } from './widgets/ClassroomDescriptionWidget';

enum WidgetType {
  DESCRIPTION = 'DESCRIPTION',
}

const widgetLoader: { [key in WidgetType]: WidgetProps } = {
  [WidgetType.DESCRIPTION]: {
    component: <ClassroomDescriptionWidget />,
    size: WidgetSize.DEFAULT,
  },
const classroomWidgets: WidgetType[] = [
  WidgetType.DESCRIPTION,
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
