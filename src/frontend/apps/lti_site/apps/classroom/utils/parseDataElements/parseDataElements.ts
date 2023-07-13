import { ClassroomAppData } from 'lib-classroom';
import { Nullable } from 'lib-common';
import { ClassroomModelName } from 'lib-components';

export const parseDataElements = (
  element: Nullable<Element>,
): ClassroomAppData => {
  if (!element) {
    throw new Error('Classroom appdata is missing from DOM.');
  }

  const dataContext = element.getAttribute('data-context');

  if (!dataContext) {
    throw new Error('Classroom data-context is missing from DOM.');
  }

  const context = JSON.parse(dataContext) as ClassroomAppData;

  context.resource_id = context.resource?.id;
  if (context.modelName === ClassroomModelName.CLASSROOMS) {
    context.classroom = context.resource as ClassroomAppData['classroom'];
    delete context.resource;
  }
  return context;
};
