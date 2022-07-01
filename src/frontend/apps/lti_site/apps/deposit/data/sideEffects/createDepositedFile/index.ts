import { useJwt } from 'data/stores/useJwt';
import { API_ENDPOINT } from 'settings';

import { DepositedFile, modelName } from 'apps/deposit/types/models';

export const createDepositedFile = async () => {
  const response = await fetch(`${API_ENDPOINT}/${modelName.DepositedFiles}/`, {
    headers: {
      Authorization: `Bearer ${useJwt.getState().jwt}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to create a new deposited file.');
  }

  const depositedFile: DepositedFile = await response.json();

  return depositedFile;
};
