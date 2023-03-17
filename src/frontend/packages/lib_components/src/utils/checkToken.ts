import {
  DecodedJwt,
  DecodedJwtLTI,
  DecodedJwtWeb,
} from '@lib-components/types/jwt';

import { isDecodedJwtLTI, isDecodedJwtWeb } from './decodeJwt';

const checkLtiToken = (jwt: DecodedJwtLTI) => {
  return !!(
    !jwt.roles.includes('none') &&
    jwt.context_id &&
    jwt.consumer_site &&
    jwt.user !== undefined &&
    jwt.user.id
  );
};

const checkWebToken = (jwt: DecodedJwtWeb) => {
  return !!jwt.user_id;
};

export const checkToken = (jwt: DecodedJwt) => {
  return (
    (isDecodedJwtLTI(jwt) && checkLtiToken(jwt)) ||
    (isDecodedJwtWeb(jwt) && checkWebToken(jwt))
  );
};
