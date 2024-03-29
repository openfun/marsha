import { Checkbox } from '@openfun/cunningham-react';
import { colorsTokens } from 'lib-common';
import {
  Box,
  ContentCard,
  Video as IVideo,
  StyledLink,
  Text,
} from 'lib-components';
import { useEffect, useState } from 'react';

import VideoIcon from 'assets/svg/iko_next.svg?react';
import VueListIcon from 'assets/svg/iko_vuelistesvg.svg?react';
import { useSelectFeatures } from 'features/Contents/store/selectionStore';

import routes from '../../routes';

const Video = ({ video }: { video: IVideo }) => {
  const videoPath = `${routes.VIDEO.path}/${video.id}`;
  const thumbnail =
    video.thumbnail?.urls?.[240] || video.urls?.thumbnails?.[240];
  const { isSelectionEnabled, selectedItems, selectItem } = useSelectFeatures();
  const [isVideoSelected, setIsVideoSelected] = useState<boolean>(
    selectedItems.includes(video.id) || false,
  );

  useEffect(() => {
    if (!isSelectionEnabled) {
      setIsVideoSelected(false);
    }
  }, [isSelectionEnabled]);

  useEffect(() => {
    setIsVideoSelected(selectedItems.includes(video.id) || false);
  }, [video.id, selectedItems]);

  return (
    <StyledLink to={isSelectionEnabled ? '#' : `${videoPath}`}>
      <ContentCard
        style={
          isVideoSelected
            ? {
                boxShadow:
                  'inset 0px 0px 0px 0px #45a3ff, #81ade6 1px 1px 1px 9px',
              }
            : undefined
        }
        onClick={() => selectItem(video.id, isVideoSelected)}
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
              }}
            >
              {isSelectionEnabled && <Checkbox checked={isVideoSelected} />}
            </Box>
            <VideoIcon width={75} height={75} color="white" />
          </Box>
        }
        footer={
          <Box gap="small" align="center" direction="row">
            <VueListIcon
              width={20}
              height={20}
              color={colorsTokens['info-500']}
            />
            <Text size="tiny" weight="bold">
              {video.playlist.title}
            </Text>
          </Box>
        }
        title={video.title || ''}
      >
        {video.description && (
          <Text
            size="small"
            truncate={5}
            color="grey"
            title={video.description}
          >
            {video.description}
          </Text>
        )}
      </ContentCard>
    </StyledLink>
  );
};

export default Video;
