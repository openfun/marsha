import jwt_decode from 'jwt-decode';

import { DecodedJwt } from '../types/jwt';
import { parseDataElements } from '../utils/parseDataElements/parseDataElements';

export const appData = parseDataElements(
  document.getElementById('marsha-frontend-data')!,
);

// Jwt is lazily decoded only when needed and available
let cacheDecodedJwt: DecodedJwt;
export const getDecodedJwt = () => {
  if (appData.jwt) {
    return cacheDecodedJwt || (cacheDecodedJwt = jwt_decode(appData.jwt));
  }

  throw new Error(
    'Impossible to decode JWT token, none present in the app state',
  );
};
