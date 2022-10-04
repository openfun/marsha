import { parseDataElements } from 'apps/classroom/utils/parseDataElements/parseDataElements';

export const classroomAppData = parseDataElements(
  document.getElementById('marsha-frontend-data')!,
);
