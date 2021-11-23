import React from 'react';
import { Box, Button, Paragraph } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { defineMessages, useIntl } from 'react-intl';

import { theme } from 'utils/theme/theme';
import { ViewDocInactiveSVG } from 'components/SVGIcons/ViewDocInactiveSVG';

const messages = defineMessages({
  viewDocument: {
    defaultMessage: 'Document',
    description: 'Title for the document button',
    id: 'components.StudentViewDocumentButton.viewDocument',
  },
});

export const StudentViewDocumentButton = () => {
  const intl = useIntl();

  return (
    <Box
      align="center"
      margin={{ right: 'xsmall', left: 'xsmall' }}
      direction="column"
    >
      <Button
        a11yTitle={intl.formatMessage(messages.viewDocument)}
        icon={
          <ViewDocInactiveSVG
            backgroundColor="none"
            baseColor={normalizeColor('blue-active', theme)}
            width={'54'}
            height={'54'}
            title={intl.formatMessage(messages.viewDocument)}
          />
        }
        margin={{ bottom: '6px' }}
        onClick={() => {}}
        style={{ padding: '0', textAlign: 'center' }}
      />
      <Paragraph color="blue-active" margin="none" size="12px">
        {intl.formatMessage(messages.viewDocument)}
      </Paragraph>
    </Box>
  );
};
