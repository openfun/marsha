import React from 'react';
import { Box, Button, Paragraph } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { defineMessages, useIntl } from 'react-intl';

import { theme } from 'utils/theme/theme';
import { SpeakerActiveSVG } from 'components/SVGIcons/SpeakerActiveSVG';

const messages = defineMessages({
  showSpeaker: {
    defaultMessage: 'Speaker',
    description: 'Title for the speaker button',
    id: 'components.StudentShowSpeakerButton.showSpeaker',
  },
});

export const StudentShowSpeakerButton = () => {
  const intl = useIntl();

  return (
    <Box
      align="center"
      direction="column"
      margin={{ right: 'xsmall', left: 'xsmall' }}
    >
      <Button
        a11yTitle={intl.formatMessage(messages.showSpeaker)}
        icon={
          <SpeakerActiveSVG
            backgroundColor={normalizeColor('blue-focus', theme)}
            baseColor={normalizeColor('white', theme)}
            width={'54'}
            height={'54'}
            title={intl.formatMessage(messages.showSpeaker)}
          />
        }
        margin={{ bottom: '6px' }}
        onClick={() => {}}
        style={{ padding: '0', textAlign: 'center' }}
      />
      <Paragraph color="blue-active" margin="none" size="12px">
        {intl.formatMessage(messages.showSpeaker)}
      </Paragraph>
    </Box>
  );
};
