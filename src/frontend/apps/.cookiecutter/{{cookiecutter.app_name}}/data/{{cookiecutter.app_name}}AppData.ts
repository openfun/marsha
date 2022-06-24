import { parseDataElements } from 'apps/{{cookiecutter.app_name}}/utils/parseDataElements/parseDataElements';

export const {{cookiecutter.app_name}}AppData = parseDataElements(
  document.getElementById('marsha-frontend-data')!,
);
