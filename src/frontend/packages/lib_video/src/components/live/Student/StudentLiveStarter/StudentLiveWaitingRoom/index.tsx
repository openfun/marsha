import { Box, Heading, Paragraph } from 'grommet';
import { useAppConfig, useResponsive } from 'lib-components';
import React, { CSSProperties } from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';

import { AdvertisingBox } from '@lib-video/components/live/Student/StudentLiveStarter/StudentLiveAdvertising/AdvertisingBox';
import { StudentLiveDescription } from '@lib-video/components/live/Student/StudentLiveStarter/StudentLiveAdvertising/StudentLiveDescription';
import { InputDisplayName } from '@lib-video/components/live/common/InputDisplayName';

const messages = defineMessages({
  title: {
    defaultMessage: 'Live has started',
    description: 'Text title to inform that the event has started',
    id: 'components.StudentLiveWaitingRoom.title',
  },
  infos: {
    defaultMessage: 'You will join the discussion after you entered your name.',
    description:
      'Text title to inform that the user will join the discussion after filling his name.',
    id: 'components.StudentLiveWaitingRoom.infos',
  },
});

export const StudentLiveWaitingRoom = () => {
  const appData = useAppConfig();
  const { isMobile } = useResponsive();
  let containerStyle: CSSProperties;
  if (isMobile) {
    containerStyle = { width: '90%', maxWidth: '400px' };
  } else {
    containerStyle = { maxWidth: '40%', minWidth: '600px' };
  }

  return (
    <Box
      background={{
        image: `url(${appData.static.img.liveBackground})`,
        position: 'top',
        repeat: 'no-repeat',
        size: 'cover',
      }}
      flex="grow"
    >
      <Box
        margin="auto"
        pad={{ horizontal: 'none', vertical: 'large' }}
        style={containerStyle}
      >
        <AdvertisingBox
          margin={{ bottom: 'small', horizontal: 'auto', top: 'none' }}
          pad="large"
        >
          <Heading
            color="blue-active"
            level={1}
            margin={{ bottom: 'small' }}
            size="medium"
            textAlign="center"
          >
            <FormattedMessage {...messages.title} />
          </Heading>
          <Paragraph
            alignSelf="center"
            color="blue-active"
            margin={{ left: 'large', right: 'large' }}
            textAlign="center"
          >
            <FormattedMessage {...messages.infos} />
          </Paragraph>
          <InputDisplayName />
          <StudentLiveDescription />
        </AdvertisingBox>
      </Box>
    </Box>
  );
};
