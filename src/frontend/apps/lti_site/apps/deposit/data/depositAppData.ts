import { parseDataElements } from 'apps/deposit/utils/parseDataElements/parseDataElements';

export const depositAppData = parseDataElements(
  document.getElementById('marsha-frontend-data'),
);
