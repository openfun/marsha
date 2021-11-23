import React from 'react';
import { Box, Button, Paragraph } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { defineMessages, useIntl } from 'react-intl';

import { theme } from 'utils/theme/theme';
import { AppsInactiveSVG } from 'components/SVGIcons/AppsInactiveSVG';

const messages = defineMessages({
  showApps: {
    defaultMessage: 'Apps',
    description: 'Title for the apps button',
    id: 'components.StudentShowAppsButton.showApps',
  },
});

export const StudentShowAppsButton = () => {
  const intl = useIntl();

  return (
    <Box
      align="center"
      direction="column"
      margin={{ right: 'xsmall', left: 'xsmall' }}
    >
      <Button
        a11yTitle={intl.formatMessage(messages.showApps)}
        icon={
          <AppsInactiveSVG
            backgroundColor="none"
            baseColor={normalizeColor('blue-active', theme)}
            width={'54'}
            height={'54'}
            title={intl.formatMessage(messages.showApps)}
          />
        }
        margin={{ bottom: '6px' }}
        onClick={() => {}}
        style={{ padding: '0', textAlign: 'center' }}
      />
      <Paragraph color="blue-active" margin="none" size="12px">
        {intl.formatMessage(messages.showApps)}
      </Paragraph>
    </Box>
  );
};
