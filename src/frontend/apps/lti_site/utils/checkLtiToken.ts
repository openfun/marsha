import { DecodedJwt } from 'lib-components';

export const checkLtiToken = (jwt: DecodedJwt) => {
  return !!(
    jwt.context_id &&
    jwt.consumer_site &&
    jwt.user !== undefined &&
    jwt.user.id
  );
};
