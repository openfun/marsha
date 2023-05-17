import { Text, Box, CheckBox } from 'grommet';
import { StyledLink, Video, ContentCard } from 'lib-components';
import { Fragment, useEffect, useState } from 'react';
import styled from 'styled-components';

import { ReactComponent as LiveIcon } from 'assets/svg/iko_live.svg';
import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';
import { useSelectFeatures } from 'features/Contents/store/selectionStore';
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
  const { isSelectionEnabled, selectedItems, selectItem } = useSelectFeatures();
  const [isLiveSelected, setIsLiveSelected] = useState<boolean>(
    () => selectedItems.includes(live.id) || false,
  );

  useEffect(() => {
    if (!isSelectionEnabled) {
      setIsLiveSelected(false);
    }
  }, [isSelectionEnabled, setIsLiveSelected]);

  return (
    <StyledLink to={isSelectionEnabled ? '#' : `${livePath}/${live.id}`}>
      <ContentCard
        style={
          isLiveSelected
            ? {
                boxShadow:
                  'inset 0px 0px 0px 0px #45a3ff, #81ade6 1px 1px 1px 9px',
              }
            : undefined
        }
        onClick={() => selectItem(live.id, isLiveSelected, setIsLiveSelected)}
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
                background: 'white',
                borderRadius: '6px',
              }}
            >
              {isSelectionEnabled && <CheckBox checked={isLiveSelected} />}
            </Box>
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
