import { Text, Box, CheckBox } from 'grommet';
import {
  ContentCard,
  StyledLink,
  TextTruncated,
  Video as IVideo,
} from 'lib-components';
import { Fragment, useEffect, useState } from 'react';

import { ReactComponent as VideoIcon } from 'assets/svg/iko_next.svg';
import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';
import { useSelectFeatures } from 'features/Contents/store/selectionStore';
import { routes } from 'routes';

const Video = ({ video }: { video: IVideo }) => {
  const videoPath = routes.CONTENTS.subRoutes.VIDEO.path;
  const thumbnail =
    video.thumbnail?.urls?.[240] || video.urls?.thumbnails?.[240];
  const { isSelectionEnabled, selectedItems, selectItem } = useSelectFeatures();
  const [isVideoSelected, setIsVideoSelected] = useState<boolean>(
    () => selectedItems.includes(video.id) || false,
  );

  useEffect(() => {
    if (!isSelectionEnabled) {
      setIsVideoSelected(false);
    }
  }, [isSelectionEnabled, setIsVideoSelected]);

  return (
    <StyledLink to={isSelectionEnabled ? '#' : `${videoPath}/${video.id}`}>
      <ContentCard
        style={
          isVideoSelected
            ? {
                boxShadow:
                  'inset 0px 0px 0px 0px #45a3ff, #81ade6 1px 1px 1px 9px',
              }
            : undefined
        }
        onClick={() =>
          selectItem(video.id, isVideoSelected, setIsVideoSelected)
        }
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
                  : `radial-gradient(ellipse at center, #45a3ff 0%,#2169ff 100%)`
              }
            `}
            style={{ position: 'relative' }}
          >
            <Box
              style={{
                position: 'absolute',
                top: '21px',
                left: '21px',
                background: 'white',
                borderRadius: '6px',
              }}
            >
              {isSelectionEnabled && <CheckBox checked={isVideoSelected} />}
            </Box>
            <VideoIcon width={75} height={75} color="white" />
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
