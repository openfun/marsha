import { AnonymousUser, User, fetchWrapper } from 'lib-components';

const isPresentWithType = (value: unknown, type: 'string' | 'boolean') => {
  return value !== null && value !== undefined && typeof value === type;
};

const isUser = (user: unknown): user is User => {
  if (user && typeof user === 'object') {
    const casted = user as User;
    return (
      isPresentWithType(casted.date_joined, 'string') &&
      isPresentWithType(casted.email, 'string') &&
      isPresentWithType(casted.full_name, 'string') &&
      isPresentWithType(casted.id, 'string') &&
      isPresentWithType(casted.is_staff, 'boolean') &&
      isPresentWithType(casted.is_superuser, 'boolean')
    );
  }

  return false;
};

/**
 * Makes and handles the GET request for the current user.
 * @returns a promise for a request status, so the side effect caller can simply wait for it if needed.
 */
export const getCurrentUser = async (
  jwt: string,
): Promise<User | AnonymousUser> => {
  const response = await fetchWrapper(`/api/users/whoami/`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    return AnonymousUser.ANONYMOUS;
  }

  if (!response.ok) {
    // Push remote errors to the error channel for consistency
    throw new Error(`Failed to get current user : ${response.status}.`);
  }

  const currentUser: unknown = await response.json();
  if (isUser(currentUser)) {
    return currentUser;
  }
  throw new Error('Failed to get current user, format invalid');
};
