/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  useJwt,
  API_ENDPOINT,
  ClassroomDocument,
  ClassroomModelName,
} from 'lib-components';

export const createClassroomDocument = async (file: {
  filename: string;
  size: number;
}) => {
  const response = await fetch(
    `${API_ENDPOINT}/${String(ClassroomModelName.CLASSROOM_DOCUMENTS)}/`,
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
