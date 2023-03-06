import { Text, Box } from 'grommet';
import { StyledLink, Video } from 'lib-components';
import { Fragment } from 'react';
import styled from 'styled-components';

import { ReactComponent as LiveIcon } from 'assets/svg/iko_live.svg';
import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';
import { ContentCard } from 'features/Contents/';
import { routes } from 'routes';

const TextTruncated = styled(Text)`
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Live = ({ live }: { live: Video }) => {
  const livePath = routes.CONTENTS.subRoutes.LIVE.path;
  const thumbnail = live.thumbnail?.urls?.[240] || live.urls?.thumbnails?.[240];

  return (
    <StyledLink to={`${livePath}/${live.id}`}>
      <ContentCard
        header={
          <Box
            aria-label="thumbnail"
            role="img"
            width="100%"
            height="150px"
            align="center"
            justify="center"
            background={`
              ${
                thumbnail
                  ? `url(${thumbnail}) no-repeat center / cover`
                  : `radial-gradient(ellipse at center, #96b6db 0%,#4c46ab 100%)`
              }
            `}
          >
            <LiveIcon width={80} height={80} color="white" />
          </Box>
        }
        footer={
          <Fragment>
            <Box gap="small" align="center" direction="row">
              <Box>
                <VueListIcon width={20} height={20} color="blue-active" />
              </Box>
              <Text size="0.688rem" weight="bold">
                {live.playlist.title}
              </Text>
            </Box>
          </Fragment>
        }
        title={live.title || ''}
      >
        {live.description && (
          <TextTruncated size="0.688rem" color="grey" title={live.description}>
            {live.description}
          </TextTruncated>
        )}
      </ContentCard>
    </StyledLink>
  );
};

export default Live;
