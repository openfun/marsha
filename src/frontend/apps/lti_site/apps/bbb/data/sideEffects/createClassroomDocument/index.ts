import { useJwt } from 'data/stores/useJwt';
import { API_ENDPOINT } from 'settings';

import { ClassroomDocument, modelName } from 'apps/bbb/types/models';

export const createClassroomDocument = async (file: {
  filename: string;
  size: number;
}) => {
  const response = await fetch(
    `${API_ENDPOINT}/${modelName.CLASSROOM_DOCUMENTS}/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(file),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to create a new classroom document.');
  }

  const classroomDocument: ClassroomDocument = await response.json();

  return classroomDocument;
};
