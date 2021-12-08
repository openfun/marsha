import { Participant } from 'types/Participant';
import { Video } from 'types/tracks';
import { XMPP } from 'types/XMPP';
import { Nullable } from 'utils/types';

export as namespace converse;
export = converse;

// tslint:disable-next-line:no-namespace
declare namespace converse {
  export interface Converse {
    acceptParticipantToJoin: (participant: Participant, video: Video) => void;
    askParticipantToJoin: (username?: string) => Promise<void>;
    kickParticipant: (participant: Participant) => void;
    rejectParticipantToJoin: (participant: Participant) => void;
    participantLeaves: () => void;
    insertInto: (container: HTMLElement) => void;
    initialize: (options: Options) => void;
    sendMessage: (message: string) => void;
    env: any;
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
      add: (name: string, plugin: any) => void;
    };
  }

  interface Options {
    allow_contact_requests?: boolean;
    allow_logout?: boolean;
    allow_message_corrections?: 'all' | 'last';
    allow_message_retraction?: 'all' | 'moderator' | 'own';
    allow_muc_invitations?: boolean;
    allow_registration?: boolean;
    authentication?: 'anonymous' | 'external' | 'login' | 'prebind';
    auto_login?: boolean;
    auto_join_rooms?: sintrg[];
    bosh_service_url?: Nullable<string>;
    clear_cache_on_logout?: boolean;
    discover_connection_methods?: boolean;
    enable_smacks?: boolean;
    hide_muc_participants?: boolean;
    jid?: string;
    loglevel?: string;
    modtools_disable_assign?: boolean;
    muc_instant_rooms?: boolean;
    muc_nickname_from_jid?: boolean;
    muc_show_join_leave?: boolean;
    nickname?: Nullable<string>;
    root?: Nullable<Element>;
    show_client_info?: boolean;
    singleton?: boolean;
    theme?: 'concord' | 'default';
    view_mode?: 'embedded' | 'fullscreen' | 'mobile' | 'overlayed';
    visible_toolbar_buttons?: {
      call?: boolean;
      emoji?: boolean;
      spoiler?: boolean;
      toggle_occupants?: boolean;
    };
    websocket_url?: Nullable<string>;
    whitelisted_plugins?: string[];
  }
}
