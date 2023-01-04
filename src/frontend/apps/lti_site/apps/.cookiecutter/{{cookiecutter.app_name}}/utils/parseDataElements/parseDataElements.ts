import { {{cookiecutter.app_name_capitalized}}AppData } from 'apps/{{cookiecutter.app_name}}/types/{{cookiecutter.app_name_capitalized}}AppData';
import { {{cookiecutter.model}}ModelName as modelName } from 'lib-components';

export const parseDataElements = (element: Element): {{cookiecutter.app_name_capitalized}}AppData => {
  const context = JSON.parse(element.getAttribute('data-context')!);

  context.resource_id = context.resource?.id;
  if (context.modelName === modelName.{{cookiecutter.model_plural_capitalized}}) {
    context.{{cookiecutter.model_lower}} = context.resource;
    delete context.resource;
  }
  return context;
};
