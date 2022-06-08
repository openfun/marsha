import { Box, Heading, Paragraph, ResponsiveContext } from 'grommet';
import React, { CSSProperties, useContext } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { AdvertisingBox } from 'components/StudentLiveAdvertising/AdvertisingBox';
import { StudentLiveDescription } from 'components/StudentLiveAdvertising/StudentLiveDescription';
import { InputDisplayName } from 'components/Chat/SharedChatComponents/InputDisplayName';
import { appData } from 'data/appData';
import { Video } from 'types/tracks';

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

interface StudentLiveWaitingRoomProps {
  video: Video;
}

export const StudentLiveWaitingRoom = ({
  video,
}: StudentLiveWaitingRoomProps) => {
  const size = useContext(ResponsiveContext);
  let containerStyle: CSSProperties;
  if (size === 'small') {
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
          <StudentLiveDescription video={video} />
        </AdvertisingBox>
      </Box>
    </Box>
  );
};
