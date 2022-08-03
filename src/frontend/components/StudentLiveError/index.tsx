import { Box, Heading, Paragraph, ResponsiveContext, Stack } from 'grommet';
import React, { CSSProperties, useContext } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ThumbnailDisplayer } from 'components/DashboardLive/DashboardLiveControlPane/widgets/DashboardLiveWidgetThumbnail/ThumbnailDisplayer';
import { AdvertisingBox } from 'components/StudentLiveAdvertising/AdvertisingBox';
import { useAppConfig } from 'data/stores/useAppConfig';

const messages = defineMessages({
  title: {
    defaultMessage: 'Impossible to configure the webinar',
    description: 'Title used in the StudentLiveError component',
    id: 'components.StudentLiveError.title',
  },
  default: {
    defaultMessage:
      'We are not able to configure the webinar. You can refresh your browser in few minutes to try to reconnect.',
    description:
      'default message used by the StudentLiveError component if none provided',
    id: 'components.StudentLiveError.default',
  },
});

interface StudentLiveAdvertisingProps {
  error?: string;
}

export const StudentLiveError = ({ error }: StudentLiveAdvertisingProps) => {
  const appData = useAppConfig();
  const size = useContext(ResponsiveContext);
  const intl = useIntl();

  let containerStyle: CSSProperties;
  if (size === 'small') {
    containerStyle = { width: '90%', maxWidth: '400px' };
  } else {
    containerStyle = { maxWidth: '40%', minWidth: '600px' };
  }
  return (
    <Stack guidingChild="last">
      <Box width="100%" height="100%">
        <ThumbnailDisplayer
          fitted
          urlsThumbnail={{ 1080: appData.static.img.liveErrorBackground }}
        />
      </Box>

      <Box
        margin="auto"
        pad={{ horizontal: 'none', vertical: 'large' }}
        style={containerStyle}
      >
        <AdvertisingBox
          margin={{ bottom: 'small', horizontal: 'auto', top: 'none' }}
          pad="large"
        >
          <Heading level={3} margin="auto">
            {intl.formatMessage(messages.title)}
          </Heading>
          <Box margin={{ top: 'small' }}>
            <Paragraph margin="auto">
              {error || intl.formatMessage(messages.default)}
            </Paragraph>
          </Box>
        </AdvertisingBox>
      </Box>
    </Stack>
  );
};
