import { ClassroomAppData } from 'lib-classroom';
import { ClassroomModelName as modelName } from 'lib-components';

export const parseDataElements = (element: Element): ClassroomAppData => {
  const context = JSON.parse(element.getAttribute('data-context')!);

  if (context.modelName === modelName.CLASSROOMS) {
    context.classroom = context.resource;
    delete context.resource;
  }
  return context;
};
