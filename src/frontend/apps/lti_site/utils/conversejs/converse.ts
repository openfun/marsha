import './entry.js';

import { Video } from 'types/tracks.js';
import { XMPP } from 'types/XMPP';
import { generateAnonymousNickname } from 'utils/chat/chat';
import { Nullable } from 'utils/types.js';
import { converse } from 'utils/window';

import { chatPlugin } from './converse-plugins/chatPlugin';
import { logoutPlugin } from './converse-plugins/logoutPlugin';
import { marshaJoinDiscussionPlugin } from './converse-plugins/marshaJoinDiscussionPlugin';
import { nicknameManagementPlugin } from './converse-plugins/nicknameManagementPlugin';
import { participantsTrackingPlugin } from './converse-plugins/participantsTrackingPlugin';

let isChatInitialized = false;
export const converseMounter = () => {
  return (xmpp: XMPP, video: Video, displayName?: Nullable<string>) => {
    if (!isChatInitialized) {
      chatPlugin.addPlugin(xmpp);
      logoutPlugin.addPlugin();
      marshaJoinDiscussionPlugin.addPlugin(xmpp, video);
      nicknameManagementPlugin.addPlugin(xmpp);
      participantsTrackingPlugin.addPlugin();

      const nickname = displayName || generateAnonymousNickname();
      // Converse Initialization
      converse.initialize({
        authentication: 'anonymous',
        auto_login: true,
        auto_join_rooms: [xmpp.conference_url],
        bosh_service_url: xmpp.bosh_url,
        clear_cache_on_logout: true,
        discover_connection_methods: false,
        enable_smacks: !!xmpp.websocket_url,
        idle_presence_timeout: 0,
        i18n: 'en',
        jid: xmpp.jid,
        loglevel: 'error',
        muc_history_max_stanzas: 0,
        muc_instant_rooms: false,
        nickname,
        persistent_store: xmpp.converse_persistent_store,
        ping_interval: 20,
        websocket_url: xmpp.websocket_url,
        whitelisted_plugins: [
          chatPlugin.name,
          logoutPlugin.name,
          marshaJoinDiscussionPlugin.name,
          nicknameManagementPlugin.name,
          participantsTrackingPlugin.name,
        ],
      });

      isChatInitialized = true;
    }
  };
};
