import jwt_decode from 'jwt-decode';

import { DecodedJwt } from '../types/jwt';

const isDecodedJwt = (jwt: unknown): jwt is DecodedJwt => {
  if (jwt && typeof jwt === 'object') {
    const resourceId = (jwt as DecodedJwt).resource_id;
    return !!resourceId && typeof resourceId === 'string';
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
