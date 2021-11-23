import React from 'react';
import { Box, Button, Paragraph } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import styled from 'styled-components';
import { defineMessages, useIntl } from 'react-intl';

import { theme } from 'utils/theme/theme';

const BadgeViewers = styled(Box)`
  background-color: white;
  border: 1px solid ${normalizeColor('blue-active', theme)};
  border-radius: 6px;
  bottom: -1px;
  color: ${normalizeColor('blue-active', theme)};
  font-size: 10px;
  font-weight: bold;
  line-height: normal;
  position: absolute !important;
  padding: 3px 6px;
  left: 3px;
`;

const messages = defineMessages({
  showViewers: {
    defaultMessage: 'Viewers',
    description: 'Title for the viewers button',
    id: 'components.StudentShowViewersButton.showViewers',
  },
});

import { ViewersInactiveSVG } from 'components/SVGIcons/ViewersInactiveSVG';

export const StudentShowViewersButton = () => {
  const intl = useIntl();

  return (
    <Box
      align="center"
      direction="column"
      margin={{ right: 'xsmall', left: 'xsmall' }}
      style={{ position: 'relative' }}
    >
      <Button
        a11yTitle={intl.formatMessage(messages.showViewers)}
        icon={
          <ViewersInactiveSVG
            backgroundColor="none"
            baseColor={normalizeColor('blue-active', theme)}
            title={intl.formatMessage(messages.showViewers)}
            width={'54'}
            height={'54'}
          />
        }
        badge={<BadgeViewers>53</BadgeViewers>}
        margin={{ bottom: '6px' }}
        onClick={() => {}}
        style={{ padding: '0', textAlign: 'center' }}
      />
      <Paragraph color="blue-active" margin="none" size="12px">
        {intl.formatMessage(messages.showViewers)}
      </Paragraph>
    </Box>
  );
};
