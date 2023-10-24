import { Checkbox } from '@openfun/cunningham-react';
import { Box, ContentCard, StyledLink, Text, Video } from 'lib-components';
import { useEffect, useState } from 'react';

import { ReactComponent as LiveIcon } from 'assets/svg/iko_live.svg';
import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';
import { useSelectFeatures } from 'features/Contents/store/selectionStore';

import routes from '../../routes';

const Live = ({ live }: { live: Video }) => {
  const livePath = `${routes.LIVE.path}/${live.id}`;
  const thumbnail = live.thumbnail?.urls?.[240] || live.urls?.thumbnails?.[240];
  const { isSelectionEnabled, selectedItems, selectItem } = useSelectFeatures();
  const [isLiveSelected, setIsLiveSelected] = useState<boolean>(
    selectedItems.includes(live.id) || false,
  );

  useEffect(() => {
    if (!isSelectionEnabled) {
      setIsLiveSelected(false);
    }
  }, [isSelectionEnabled]);

  useEffect(() => {
    setIsLiveSelected(selectedItems.includes(live.id) || false);
  }, [live.id, selectedItems]);

  return (
    <StyledLink to={isSelectionEnabled ? '#' : `${livePath}`}>
      <ContentCard
        style={
          isLiveSelected
            ? {
                boxShadow:
                  'inset 0px 0px 0px 0px #45a3ff, #81ade6 1px 1px 1px 9px',
              }
            : undefined
        }
        onClick={() => selectItem(live.id, isLiveSelected)}
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
            style={{ position: 'relative' }}
          >
            <Box
              style={{
                position: 'absolute',
                top: '21px',
                left: '21px',
              }}
            >
              {isSelectionEnabled && <Checkbox checked={isLiveSelected} />}
            </Box>
            <LiveIcon width={80} height={80} color="white" />
          </Box>
        }
        footer={
          <Box gap="small" align="center" direction="row">
            <VueListIcon width={20} height={20} color="blue-active" />
            <Text size="tiny" weight="bold">
              {live.playlist.title}
            </Text>
          </Box>
        }
        title={live.title || ''}
      >
        {live.description && (
          <Text size="small" truncate={5} color="grey" title={live.description}>
            {live.description}
          </Text>
        )}
      </ContentCard>
    </StyledLink>
  );
};

export default Live;
