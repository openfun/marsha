import React from 'react';
import { Box, Button, Paragraph } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';
import { theme } from 'utils/theme/theme';
import { ChatActiveSVG } from 'components/SVGIcons/ChatActiveSVG';

const BadgeChat = styled(Box)`
  background-color: white;
  border: 1px solid ${normalizeColor('blue-focus', theme)};
  border-radius: 6px;
  bottom: -1px;
  color: ${normalizeColor('blue-focus', theme)};
  font-size: 10px;
  font-weight: bold;
  line-height: normal;
  position: absolute !important;
  padding: 3px 6px;
  left: 3px;
`;

const messages = defineMessages({
  showChat: {
    defaultMessage: 'Chat',
    description: 'Title for the chat button',
    id: 'components.StudentShowChatButton.showChat',
  },
});

export const StudentShowChatButton = () => {
  const intl = useIntl();

  return (
    <Box
      align="center"
      margin={{ right: 'xsmall', left: 'xsmall' }}
      direction="column"
      style={{ position: 'relative' }}
    >
      <Button
        a11yTitle={intl.formatMessage(messages.showChat)}
        icon={
          <ChatActiveSVG
            backgroundColor={normalizeColor('blue-focus', theme)}
            baseColor={normalizeColor('white', theme)}
            title={intl.formatMessage(messages.showChat)}
            width={'54'}
            height={'54'}
          />
        }
        badge={<BadgeChat>24</BadgeChat>}
        margin={{ bottom: '6px' }}
        onClick={() => {}}
        style={{ padding: '0', textAlign: 'center' }}
      />
      <Paragraph size="12px" color="blue-active" margin="none">
        {intl.formatMessage(messages.showChat)}
      </Paragraph>
    </Box>
  );
};
