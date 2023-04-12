import { Box, Text } from 'grommet';
import { StyledLink } from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { routes } from 'routes';

import Videos from './Videos';

const messages = defineMessages({
  MyVideos: {
    defaultMessage: 'My Videos',
    description: 'My contents page, my videos title',
    id: 'features.Contents.features.VideoContents.MyVideos',
  },
  SeeEverything: {
    defaultMessage: 'See Everything',
    description: 'Label to see all the cards',
    id: 'features.Contents.features.VideoContents.SeeEverything',
  },
});

const BoxText = styled(Box)`
  color: #002c84;
`;

interface VideoContentsProps {
  playlistId?: string;
}

const VideoContents = ({ playlistId }: VideoContentsProps) => {
  const intl = useIntl();
  const amountContents = 4;
  const queryParam = playlistId ? `?playlist=${playlistId}` : '';

  return (
    <Box margin={{ top: 'medium' }}>
      <BoxText direction="row" justify="between" margin={{ bottom: 'small' }}>
        <Text weight="bolder">{intl.formatMessage(messages.MyVideos)}</Text>
        <Text weight="bolder">
          <StyledLink
            to={{
              pathname: `${routes.CONTENTS.subRoutes.VIDEO.path}`,
              search: queryParam,
            }}
          >
            › {intl.formatMessage(messages.SeeEverything)}
          </StyledLink>
        </Text>
      </BoxText>
      <Videos
        withPagination={false}
        limit={amountContents}
        playlistId={playlistId}
        withFilter={false}
      />
    </Box>
  );
};

export default VideoContents;
