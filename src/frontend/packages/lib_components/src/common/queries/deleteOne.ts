import { useJwt } from 'hooks/stores/useJwt';

import { fetchWrapper } from './fetchWrapper';

export const deleteOne = async ({
  name,
  id,
}: {
  name: string;
  id: string;
}): Promise<undefined> => {
  const jwt = useJwt.getState().jwt;
  const response = await fetchWrapper(`/api/${name}/${id}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    method: 'DELETE',
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw { code: 'invalid', ...(await response.json()) };
    }

    throw { code: 'exception' };
  }

  return undefined;
};
