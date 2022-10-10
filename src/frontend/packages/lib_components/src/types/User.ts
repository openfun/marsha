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
  first_name?: string;
  id?: string;
  is_staff: boolean;
  is_superuser: boolean;
  last_name?: string;
  organization_accesses: OrganizationAccess[];
  username?: string;
  user_fullname?: Nullable<string>;
}
