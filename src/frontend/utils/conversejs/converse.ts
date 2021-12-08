import 'converse.js/dist/converse.min.css';
import 'converse.js/dist/converse.min.js';
import 'converse.js/dist/emojis.js';
import 'converse.js/dist/icons.js';

import { getDecodedJwt } from 'data/appData';
import { XMPP } from 'types/XMPP';
import { converse } from 'utils/window';

import { chatPlugin } from './converse-plugins/chatPlugin';
import { logoutPlugin } from './converse-plugins/logoutPlugin';
import { marshaJoinDiscussionPlugin } from './converse-plugins/marshaJoinDiscussionPlugin';

export const converseMounter = () => {
  let hasBeenInitialized = false;

  return (containerName: string, xmpp: XMPP) => {
    if (hasBeenInitialized) {
      converse.insertInto(document.querySelector(containerName)!);
    } else {
      chatPlugin.addPlugin(xmpp);
      logoutPlugin.addPlugin();
      marshaJoinDiscussionPlugin.addPlugin(xmpp);

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
        muc_instant_rooms: false,
        muc_show_join_leave: false,
        nickname: getDecodedJwt().user?.username,
        root: document.querySelector(containerName),
        show_client_info: false,
        singleton: true,
        theme: 'concord',
        view_mode: 'embedded',
        visible_toolbar_buttons: {
          call: false,
          emoji: true,
          spoiler: false,
          toggle_occupants: false,
        },
        websocket_url: xmpp.websocket_url,
        whitelisted_plugins: [
          chatPlugin.name,
          logoutPlugin.name,
          marshaJoinDiscussionPlugin.name,
        ],
      });
    }
    hasBeenInitialized = true;
  };
};
