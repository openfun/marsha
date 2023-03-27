import { Nullable } from 'lib-common';

import { Participant } from '@lib-components/types/Participant';
import { PersistentStore } from '@lib-components/types/XMPP';
import { Video } from '@lib-components/types/tracks';

export declare namespace converse {
  export interface Converse {
    acceptParticipantToJoin: (participant: Participant, video: Video) => void;
    askParticipantToJoin: (username?: string) => Promise<void>;
    kickParticipant: (participant: Participant) => void;
    rejectParticipantToJoin: (participant: Participant) => void;
    participantLeaves: () => void;
    logout?: () => Promise<void>;
    initialize: (options: Options) => void;
    sendMessage: (message: string) => void;
    claimNewNicknameInChatRoom: (
      newNickname: string,
      callbackSuccess: () => void,
      callbackError: (stanza: Nullable<HTMLElement>) => void,
    ) => void;
    env: { Promise; Strophe; dayjs; sizzle; _; $build; $iq; $msg; $pres };
    ROOMSTATUS: {
      CONNECTED: 0;
      CONNECTING: 1;
      DESTROYED: 6;
      DISCONNECTED: 4;
      ENTERED: 5;
      NICKNAME_REQUIRED: 2;
      PASSWORD_REQUIRED: 3;
    };
    plugins: {
      add: (name: string, plugin) => void;
    };
  }

  interface Options {
    authentication: 'anonymous' | 'external' | 'login' | 'prebind';
    auto_login: boolean;
    auto_join_rooms: string[];
    bosh_service_url: Nullable<string>;
    clear_cache_on_logout: boolean;
    discover_connection_methods: boolean;
    enable_smacks: boolean;
    idle_presence_timeout: number;
    i18n: string;
    jid: string;
    loglevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    muc_history_max_stanzas: number;
    muc_instant_rooms: boolean;
    nickname: string;
    persistent_store?: PersistentStore;
    ping_interval: number;
    websocket_url: Nullable<string>;
    whitelisted_plugins: string[];
  }
}
