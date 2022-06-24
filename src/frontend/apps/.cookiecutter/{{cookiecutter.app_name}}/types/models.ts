import { Playlist, Resource } from 'types/tracks';
import { Nullable } from 'utils/types';

export enum modelName {
  {{cookiecutter.model_plural_capitalized}} = '{{cookiecutter.model_name}}',
}

export interface {{cookiecutter.model}} extends Resource {
  playlist: Playlist;
  title: Nullable<string>;
  description: Nullable<string>;
  lti_url: string;
}
