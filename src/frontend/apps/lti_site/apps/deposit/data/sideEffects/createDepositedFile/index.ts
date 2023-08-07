import {
  API_ENDPOINT,
  DepositedFile,
  fetchResponseHandler,
  fetchWrapper,
  FileDepositoryModelName as modelName,
  useJwt,
} from 'lib-components';

export const createDepositedFile = async (
  file: {
    size: number;
    filename: string;
  },
  fileDepositoryId: string,
): Promise<DepositedFile> => {
  const jwt = useJwt.getState().getJwt();

  if (!jwt) {
    throw new Error('No JWT found.');
  }

  const response = await fetchWrapper(
    `${API_ENDPOINT}/${modelName.FileDepositories}/${fileDepositoryId}/${modelName.DepositedFiles}/`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(file),
    },
  );

  return await fetchResponseHandler(response);
};
