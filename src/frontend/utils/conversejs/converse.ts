import './entry.js';

import { XMPP } from 'types/XMPP';
import { generateAnonymousNickname } from 'utils/chat/chat';
import { converse } from 'utils/window';
import { chatPlugin } from './converse-plugins/chatPlugin';
import { logoutPlugin } from './converse-plugins/logoutPlugin';
import { marshaJoinDiscussionPlugin } from './converse-plugins/marshaJoinDiscussionPlugin';
import { nicknameManagementPlugin } from './converse-plugins/nicknameManagementPlugin';
import { participantsTrackingPlugin } from './converse-plugins/participantsTrackingPlugin';

export const converseMounter = () => {
  let isChatInitialized = false;

  return (xmpp: XMPP) => {
    if (!isChatInitialized) {
      chatPlugin.addPlugin(xmpp);
      logoutPlugin.addPlugin();
      marshaJoinDiscussionPlugin.addPlugin(xmpp);
      nicknameManagementPlugin.addPlugin(xmpp);
      participantsTrackingPlugin.addPlugin();

      // Converse Initialization
      converse.initialize({
        allow_contact_requests: false,
        allow_logout: false,
        allow_message_corrections: 'last',
        allow_message_retraction: 'all',
        allow_muc_invitations: false,
        allow_registration: false,
        authentication: 'anonymous',
        auto_login: true,
        auto_join_rooms: [xmpp.conference_url],
        bosh_service_url: xmpp.bosh_url,
        clear_cache_on_logout: true,
        discover_connection_methods: false,
        enable_smacks: !!xmpp.websocket_url,
        hide_muc_participants: true,
        jid: xmpp.jid,
        // loglevel: 'debug',
        modtools_disable_assign: true,
        muc_history_max_stanzas: 0,
        muc_instant_rooms: false,
        muc_show_join_leave: false,
        nickname: generateAnonymousNickname(),
        root: null,
        show_client_info: false,
        singleton: true,
        theme: 'concord',
        view_mode: 'embedded',
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
