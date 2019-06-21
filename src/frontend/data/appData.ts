import jwt_decode from 'jwt-decode';

import { DecodedJwt } from '../types/jwt';
import { parseDataElements } from '../utils/parseDataElements/parseDataElements';

export const appData = {
  ...parseDataElements(
    // Spread to pass an array instead of a NodeList
    [...document.querySelectorAll('.marsha-frontend-data')],
  ),
};

// Jwt is lazily decoded only when needed
let cacheDecodedJwt: DecodedJwt;
export const getDecodedJwt = () =>
  cacheDecodedJwt || (cacheDecodedJwt = jwt_decode(appData.jwt));
