import { Nullable } from 'lib-common';

export enum OrganizationAccessRole {
  ADMINISTRATOR = 'administrator',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
}

export interface OrganizationAccess {
  organization: string;
  organization_name: string;
  role: OrganizationAccessRole;
  user: string;
}

export interface User {
  anonymous_id?: string;
  date_joined?: string;
  email?: string;
  full_name?: Nullable<string>;
  id?: string;
  is_staff: boolean;
  is_superuser: boolean;
  organization_accesses: OrganizationAccess[];
  username?: string;
}
