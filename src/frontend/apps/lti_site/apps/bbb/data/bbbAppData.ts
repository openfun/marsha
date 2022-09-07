import { parseDataElements } from 'apps/bbb/utils/parseDataElements/parseDataElements';

export const bbbAppData = parseDataElements(
  document.getElementById('marsha-frontend-data')!,
);
