export interface DecodedJwtPermission {
  can_access_dashboard: boolean;
  can_update: boolean;
}

export interface ResourceContext {
  context_id?: string;
  consumer_site?: string;
  permissions: DecodedJwtPermission;
  playlist_id?: string;
  resource_id: string;
  roles: string[];
}
