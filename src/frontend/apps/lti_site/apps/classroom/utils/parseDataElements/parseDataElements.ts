import { ClassroomAppData } from 'apps/classroom/types/ClassroomAppData';
import { modelName } from 'apps/classroom/types/models';

export const parseDataElements = (element: Element): ClassroomAppData => {
  const context = JSON.parse(element.getAttribute('data-context')!);

  if (context.modelName === modelName.CLASSROOMS) {
    context.classroom = context.resource;
    delete context.resource;
  }
  return context;
};
