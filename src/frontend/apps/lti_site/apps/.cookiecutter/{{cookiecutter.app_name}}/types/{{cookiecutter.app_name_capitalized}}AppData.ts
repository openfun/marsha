import { Nullable } from 'utils/types';
import { AppData } from 'types/AppData';
import { {{cookiecutter.model}}, modelName } from './models';

export interface {{cookiecutter.app_name_capitalized}}AppData extends Omit<AppData, 'modelName'> {
  modelName: modelName.{{cookiecutter.model_plural_capitalized}};
  {{cookiecutter.model_lower}}?: Nullable<{{cookiecutter.model}}>;
}
