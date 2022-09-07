import { BbbAppData } from 'apps/bbb/types/BbbAppData';
import { modelName } from 'apps/bbb/types/models';

export const parseDataElements = (element: Element): BbbAppData => {
  const context = JSON.parse(element.getAttribute('data-context')!);

  if (context.modelName === modelName.CLASSROOMS) {
    context.classroom = context.resource;
    delete context.resource;
  }
  return context;
};
