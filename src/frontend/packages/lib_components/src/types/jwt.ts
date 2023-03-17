import { Nullable } from 'lib-common';

import { ResourceContext } from './ResourceContext';

export interface DecodedJwtUser {
  anonymous_id?: string;
  email: Nullable<string>;
  id?: string;
  username?: Nullable<string>;
  user_fullname?: Nullable<string>;
}

export type DecodedJwt = DecodedJwtLTI | DecodedJwtWeb;

export interface DecodedJwtLTI extends ResourceContext {
  locale: string;
  maintenance: boolean;
  session_id: string;
  user?: DecodedJwtUser;
}

export interface DecodedJwtWeb {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  user_id: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}
