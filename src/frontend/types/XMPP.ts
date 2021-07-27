import { Nullable } from '../utils/types'

/* XMPP representation */
export interface XMPP {
  bosh_url: Nullable<string>;
  websocket_url: Nullable<string>;
  conference_url: string;
  prebind_url: string;
  jid: string;
}

export enum MessageType {
  GROUPCHAT = 'groupchat',
  EVENT = 'event',
}

export enum EventType {
  ACCEPT = 'accept',
  REJECT = 'reject',
  KICK = 'kick',
  LEAVE = 'leave',
  PARTICIPANTASKTOMOUNT = 'participantAskToMount',
}
