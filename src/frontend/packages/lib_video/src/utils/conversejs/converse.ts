/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import './entry.js';
import { Nullable } from 'lib-common';
import { Video, XMPP } from 'lib-components';

import { generateAnonymousNickname } from '@lib-video/utils/chat/chat';
import { converse } from '@lib-video/utils/window';

import { chatPlugin } from './converse-plugins/chatPlugin';
import { logoutPlugin } from './converse-plugins/logoutPlugin';
import { marshaJoinDiscussionPlugin } from './converse-plugins/marshaJoinDiscussionPlugin';
import { nicknameManagementPlugin } from './converse-plugins/nicknameManagementPlugin';
import { participantsTrackingPlugin } from './converse-plugins/participantsTrackingPlugin';

let isChatInitialized = false;
let isPluginInitialized = false;
export const converseMounter = () => {
  return (xmpp: XMPP, video: Video, displayName?: Nullable<string>) => {
    if (!isPluginInitialized) {
      chatPlugin.addPlugin(xmpp);
      logoutPlugin.addPlugin();
      marshaJoinDiscussionPlugin.addPlugin(xmpp, video);
      nicknameManagementPlugin.addPlugin(xmpp);
      participantsTrackingPlugin.addPlugin();

      isPluginInitialized = true;
    }
    if (!isChatInitialized) {
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

export const converseCleanup = async () => {
  isChatInitialized = false;
  await converse.logout?.();
};
