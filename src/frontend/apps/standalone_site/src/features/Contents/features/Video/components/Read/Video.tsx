import { Text, Box } from 'grommet';
import { StyledLink, Video as IVideo } from 'lib-components';
import { Fragment } from 'react';
import styled from 'styled-components';

import { ReactComponent as VideoIcon } from 'assets/svg/iko_next.svg';
import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';
import { ContentCard } from 'features/Contents/';
import { routes } from 'routes';

const TextTruncated = styled(Text)`
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Video = ({ video }: { video: IVideo }) => {
  const videoPath = routes.CONTENTS.subRoutes.VIDEO.path;

  return (
    <StyledLink to={`${videoPath}/${video.id}`}>
      <ContentCard
        header={
          <Box
            width="100%"
            height="150px"
            align="center"
            justify="center"
            background={`
              ${
                video.urls?.thumbnails[240]
                  ? `url(${video.urls?.thumbnails[240]}) no-repeat center / cover`
                  : `radial-gradient(ellipse at center, #45a3ff 0%,#2169ff 100%)`
              }
            `}
          >
            <VideoIcon width={80} height={80} color="white" />
          </Box>
        }
        footer={
          <Fragment>
            <Box gap="small" align="center" direction="row">
              <Box>
                <VueListIcon width={20} height={20} color="blue-active" />
              </Box>
              <Text size="0.688rem" weight="bold">
                {video.playlist.title}
              </Text>
            </Box>
          </Fragment>
        }
        title={video.title || ''}
      >
        {video.description && (
          <TextTruncated size="0.688rem" color="grey" title={video.description}>
            {video.description}
          </TextTruncated>
        )}
      </ContentCard>
    </StyledLink>
  );
};

export default Video;
