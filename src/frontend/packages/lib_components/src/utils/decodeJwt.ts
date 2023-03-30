import jwt_decode from 'jwt-decode';

import { DecodedJwt } from '@lib-components/types/jwt';

const isDecodedJwt = (jwt: unknown): jwt is DecodedJwt => {
  if (jwt && typeof jwt === 'object') {
    const resourceId = (jwt as DecodedJwt).resource_id;
    const playlistId = (jwt as DecodedJwt).playlist_id;
    const userId = (jwt as DecodedJwt).user?.id;
    return (
      // A resource is defined
      (!!resourceId && typeof resourceId === 'string') ||
      // Or we are in a portability request context and a playlist and user ID are mandatory
      (!resourceId && !!playlistId && !!userId)
    );
  }

  return false;
};

export const decodeJwt = (jwtToDecode?: string): DecodedJwt => {
  if (!jwtToDecode) {
    throw new Error(
      'Impossible to decode JWT token, there is no jwt to decode.',
    );
  }

  const jwt = jwt_decode(jwtToDecode);

  if (isDecodedJwt(jwt)) {
    return jwt;
  }

  throw new Error('JWT token is invalid');
};
