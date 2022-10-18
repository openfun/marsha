import { useJwt } from 'lib-components';

import { API_ENDPOINT } from 'settings';

import {
  DepositedFile,
  FileDepositoryModelName as modelName,
} from 'lib-components';

export const createDepositedFile = async (file: {
  size: number;
  filename: string;
}) => {
  const response = await fetch(`${API_ENDPOINT}/${modelName.DepositedFiles}/`, {
    headers: {
      Authorization: `Bearer ${useJwt.getState().jwt}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(file),
  });

  if (!response.ok) {
    throw new Error('Failed to create a new deposited file.');
  }

  const depositedFile: DepositedFile = await response.json();

  return depositedFile;
};
