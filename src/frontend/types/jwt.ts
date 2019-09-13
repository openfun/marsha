export interface DecodedJwt {
  context_id: string;
  email: string;
  roles: string[];
  session_id: string;
  user_id: string;
  resource_id: string;
  locale: string;
  permissions: {
    can_access_dashboard: boolean;
    can_update: boolean;
  };
}
