import { DecodedJwt } from 'types/jwt';

export const checkLtiToken = (jwt: DecodedJwt) => {
  return !!(
    jwt.context_id &&
    jwt.consumer_site &&
    jwt.user !== undefined &&
    jwt.user.id
  );
};
