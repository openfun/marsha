import 'converse.js/dist/converse.min.css';
import 'converse.js/dist/converse.min.js';
import 'converse.js/dist/emojis.js';
import 'converse.js/dist/icons.js';
import { Box } from 'grommet';
import React, { useEffect } from 'react';

import { XMPP } from '../../types/tracks';
import { converse } from '../../utils/window';

interface ChatProps {
  xmpp: XMPP;
}

export const Chat = ({ xmpp }: ChatProps) => {
  useEffect(() => {
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
      discover_connection_methods: false,
      hide_muc_participants: true,
      jid: xmpp.jid,
      modtools_disable_assign: true,
      singleton: true,
      view_mode: 'embedded',
      visible_toolbar_buttons: {
        call: false,
        emoji: true,
        spoiler: false,
        toggle_occupants: false,
      },
    });
  }, []);

  return (
    <Box align="start" direction="row" height="large" pad={{ top: 'small' }}>
      <div id="conversejs"></div>
    </Box>
  );
};
