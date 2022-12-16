import { Nullable } from 'lib-common';

import { converse } from './libs/converse';

/* XMPP representation */
export interface XMPP {
  bosh_url: Nullable<string>;
  converse_persistent_store: converse.Options['persistent_store'];
  conference_url: string;
  jid: string;
  prebind_url: string;
  websocket_url: Nullable<string>;
}

export enum MessageType {
  EVENT = 'event',
  GROUPCHAT = 'groupchat',
}

export enum EventType {
  ACCEPT = 'accept',
  ACCEPTED = 'accepted',
  KICK = 'kick',
  KICKED = 'kicked',
  LEAVE = 'leave',
  PARTICIPANT_ASK_TO_JOIN = 'participantAskToJoin',
  REJECT = 'reject',
  REJECTED = 'rejected',
}

export enum PersistentStore {
  BROWSEREXTLOCAL = 'BrowserExtLocal',
  BROWSEREXTSYNC = 'BrowserExtSync',
  LOCALSTORAGE = 'localStorage',
  INDEXEDDB = 'IndexedDB',
  SESSIONSTORAGE = 'sessionStorage',
}
