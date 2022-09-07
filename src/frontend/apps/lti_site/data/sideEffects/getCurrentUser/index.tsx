import { useJwt } from 'data/stores/useJwt';
import { AnonymousUser } from 'data/stores/useCurrentUser';
import { API_ENDPOINT } from 'settings';
import { requestStatus } from 'types/api';
import { report } from 'utils/errors/report';

/**
 * Makes and handles the GET request for the current user.
 * @returns a promise for a request status, so the side effect caller can simply wait for it if needed.
 */
export const getCurrentUser = async (): Promise<requestStatus> => {
  try {
    const { useCurrentUser } = await import('data/stores/useCurrentUser');

    const response = await fetch(`${API_ENDPOINT}/users/whoami/`, {
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      useCurrentUser.getState().setCurrentUser(AnonymousUser.ANONYMOUS);
      return requestStatus.SUCCESS;
    }

    if (!response.ok) {
      // Push remote errors to the error channel for consistency
      throw new Error(`Failed to get current user : ${response.status}.`);
    }

    const currentUser = await response.json();
    useCurrentUser.getState().setCurrentUser(currentUser);

    return requestStatus.SUCCESS;
  } catch (error) {
    report(error);
    return requestStatus.FAILURE;
  }
};
