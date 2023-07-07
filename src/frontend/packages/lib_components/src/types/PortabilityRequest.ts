import { Nullable } from 'lib-common';

import { ConsumerSite } from './ConsumerSite';
import { User } from './User';
import { PlaylistLite } from './tracks';

export enum PortabilityRequestState {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export interface PortabilityRequest {
  created_on: string;
  id: string;
  for_playlist: PlaylistLite;
  from_lti_consumer_site: Nullable<ConsumerSite>;
  from_lti_user_id: Nullable<string>;
  from_playlist: PlaylistLite;
  from_user: Nullable<User>;
  state: PortabilityRequestState;
  updated_by_user: Nullable<User>;
  can_accept_or_reject: boolean;
}
