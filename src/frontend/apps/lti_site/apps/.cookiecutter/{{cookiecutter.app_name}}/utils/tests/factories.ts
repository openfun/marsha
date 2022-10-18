import * as faker from 'faker';
import { playlistMockFactory } from 'lib-components';

import { {{cookiecutter.model}} } from 'apps/{{cookiecutter.app_name}}/types/models';

export const {{cookiecutter.model_lower}}MockFactory = ({{cookiecutter.model_lower}}: Partial<{{cookiecutter.model}}> = {}): {{cookiecutter.model}} => {
  return {
    id: faker.datatype.uuid(),
    playlist: playlistMockFactory(),
    title: faker.name.title(),
    description: faker.lorem.paragraph(),
    lti_url: faker.internet.url(),
    ...{{cookiecutter.model_lower}},
  };
};
