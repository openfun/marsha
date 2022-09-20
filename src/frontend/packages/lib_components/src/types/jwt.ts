import { Nullable } from 'lib-common';

export interface DecodedJwtPermission {
  can_access_dashboard: boolean;
  can_update: boolean;
}

export interface DecodedJwtUser {
  anonymous_id?: string;
  email: Nullable<string>;
  id?: string;
  username?: Nullable<string>;
  user_fullname?: Nullable<string>;
}

export interface DecodedJwt {
  context_id?: string;
  consumer_site?: string;
  locale: string;
  maintenance: boolean;
  permissions: DecodedJwtPermission;
  playlist_id?: string;
  resource_id: string;
  roles: string[];
  session_id: string;
  user?: DecodedJwtUser;
}
