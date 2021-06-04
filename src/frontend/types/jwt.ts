import { Nullable } from '../utils/types';

export interface DecodedJwt {
  context_id: string;
  email: string;
  roles: string[];
  session_id: string;
  resource_id: string;
  locale: string;
  permissions: {
    can_access_dashboard: boolean;
    can_update: boolean;
  };
  maintenance: boolean;
  user?: {
    id: string;
    username: Nullable<string>;
  };
}
