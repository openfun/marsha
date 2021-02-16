import { API_ENDPOINT } from '../../../settings';
import { RequestStatus } from '../../../types/api';
import { report } from '../../../utils/errors/report';
import { appData } from '../../appData';
import { AnonymousUser } from '../../stores/useCurrentUser';

/**
 * Makes and handles the GET request for the current user.
 * @returns a promise for a request status, so the side effect caller can simply wait for it if needed.
 */
export const getCurrentUser = async (): Promise<RequestStatus> => {
  try {
    const { useCurrentUser } = await import('../../stores/useCurrentUser');

    const response = await fetch(`${API_ENDPOINT}/users/whoami/`, {
      headers: {
        Authorization: `Bearer ${appData.jwt}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      useCurrentUser.getState().setCurrentUser(AnonymousUser.ANONYMOUS);
      return RequestStatus.SUCCESS;
    }

    if (!response.ok) {
      // Push remote errors to the error channel for consistency
      throw new Error(`Failed to get current user : ${response.status}.`);
    }

    const currentUser = await response.json();
    useCurrentUser.getState().setCurrentUser(currentUser);

    return RequestStatus.SUCCESS;
  } catch (error) {
    report(error);
    return RequestStatus.FAILURE;
  }
};
