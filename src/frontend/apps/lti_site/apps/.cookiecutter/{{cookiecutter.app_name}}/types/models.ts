import { Playlist, Resource } from 'lib-components';
import { Nullable } from 'utils/types';

export enum {{cookiecutter.model}}ModelName {
  {{cookiecutter.model_plural_capitalized}} = '{{cookiecutter.model_name}}',
}

export interface {{cookiecutter.model}} extends Resource {
  playlist: Playlist;
  title: Nullable<string>;
  description: Nullable<string>;
  lti_url: string;
}
