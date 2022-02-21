import { Nullable } from '../utils/types';

export interface DecodedJwt {
  context_id?: string;
  consumer_site?: string;
  locale: string;
  maintenance: boolean;
  permissions: {
    can_access_dashboard: boolean;
    can_update: boolean;
  };
  playlist_id?: string;
  resource_id: string;
  roles: string[];
  session_id: string;
  user?: {
    email: Nullable<string>;
    id: string;
    username: Nullable<string>;
    user_fullname: Nullable<string>;
  };
}
