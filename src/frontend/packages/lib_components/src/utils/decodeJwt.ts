import jwt_decode from 'jwt-decode';

import {
  DecodedJwt,
  DecodedJwtLTI,
  DecodedJwtWeb,
} from '@lib-components/types/jwt';

export const isDecodedJwtLTI = (jwt: unknown): jwt is DecodedJwtLTI => {
  if (jwt && typeof jwt === 'object') {
    const resourceId = (jwt as DecodedJwtLTI).resource_id;
    const playlistId = (jwt as DecodedJwtLTI).playlist_id;
    const userId = (jwt as DecodedJwtLTI).user?.id;
    return (
      // A resource is defined
      // Or we are in a portability request context and a playlist and user ID are mandatory
      (!!resourceId && typeof resourceId === 'string') ||
      (!resourceId && !!playlistId && !!userId)
    );
  }

  return false;
};

export const isDecodedJwtWeb = (jwt: unknown): jwt is DecodedJwtWeb => {
  if (jwt && typeof jwt === 'object') {
    const thisJwt = jwt as DecodedJwtWeb;

    return (
      typeof thisJwt.token_type === 'string' &&
      typeof thisJwt.exp === 'number' &&
      typeof thisJwt.iat === 'number' &&
      typeof thisJwt.jti === 'string' &&
      typeof thisJwt.user_id === 'string'
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

  if (isDecodedJwtLTI(jwt) || isDecodedJwtWeb(jwt)) {
    return jwt;
  }

  throw new Error('JWT token is invalid');
};
