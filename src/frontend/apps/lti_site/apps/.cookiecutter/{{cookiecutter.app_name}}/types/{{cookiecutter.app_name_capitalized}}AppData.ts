import { Nullable } from 'utils/types';
import { AppData } from 'lib-components';
import { {{cookiecutter.model}}, {{cookiecutter.model}}ModelName as modelName } from './models';

export interface {{cookiecutter.app_name_capitalized}}AppData extends Omit<AppData, 'modelName'> {
  modelName: modelName.{{cookiecutter.model_plural_capitalized}};
  {{cookiecutter.model_lower}}?: Nullable<{{cookiecutter.model}}>;
  {{ cookiecutter.app_name_lower_plural }}?: {{cookiecutter.model}}[];
  new_{{ cookiecutter.app_name_lower }}_url?: string;
}
