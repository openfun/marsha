import { ClassroomAppData } from 'lib-classroom';
import { ClassroomModelName } from 'lib-components';

export const parseDataElements = (element: Element): ClassroomAppData => {
  const context = JSON.parse(element.getAttribute('data-context')!);

  if (context.modelName === ClassroomModelName.CLASSROOMS) {
    context.classroom = context.resource;
    delete context.resource;
  }
  return context;
};
