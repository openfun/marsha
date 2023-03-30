import { DecodedJwt } from '@lib-components/types/jwt';

export const checkLtiToken = (jwt: DecodedJwt) => {
  return !!(
    jwt.context_id &&
    jwt.consumer_site &&
    jwt.user !== undefined &&
    jwt.user.id
  );
};
