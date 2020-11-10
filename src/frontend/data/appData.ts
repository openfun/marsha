import jwt_decode from 'jwt-decode';

import { DecodedJwt } from '../types/jwt';
import { parseDataElements } from '../utils/parseDataElements/parseDataElements';

export const appData = parseDataElements(
  document.getElementById('marsha-frontend-data')!,
);

// Jwt is lazily decoded only when needed and available
let cacheDecodedJwt: DecodedJwt;
const isDecodedJwt = (jwt: unknown): jwt is DecodedJwt => {
  return (jwt as DecodedJwt).resource_id !== undefined;
};
export const getDecodedJwt = (): DecodedJwt => {
  if (!appData.jwt) {
    throw new Error(
      'Impossible to decode JWT token, none present in the app state',
    );
  }

  if (cacheDecodedJwt) {
    return cacheDecodedJwt;
  }

  const jwt = jwt_decode(appData.jwt);

  if (isDecodedJwt(jwt)) {
    cacheDecodedJwt = jwt;
    return cacheDecodedJwt;
  }

  throw new Error('JWT token is invalid');
};
