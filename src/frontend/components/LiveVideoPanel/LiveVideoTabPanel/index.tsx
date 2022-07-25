import { Box, Stack, Tab, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { RingingBellSVG } from 'components/SVGIcons/RingingBellSVG';
import { getDecodedJwt } from 'data/appData';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { LivePanelItem } from 'data/stores/useLivePanelState';
import { colors as themeColors, theme } from 'utils/theme/theme';

interface StyledTabProps {
  selected?: boolean;
}

const colors = {
  active: themeColors['blue-active'],
  counterPart: themeColors.white,
  disable: themeColors['blue-off'],
  focus: themeColors['blue-focus'],
};

const StyledTab = styled(Tab)`
  background: ${colors.counterPart};
  box-shadow: ${({ selected }: StyledTabProps) =>
    selected
      ? `inset 0 -2px ${colors.active}`
      : `inset 0 -1px ${colors.disable}`};
  flex: 1;
  padding: 3px 10px;

  div span {
    color: ${({ selected }: StyledTabProps) =>
      selected ? colors.active : colors.disable};
  }

  :hover {
    box-shadow: ${({ selected }: StyledTabProps) =>
      selected
        ? `inset 0 -2px ${colors.active}`
        : `inset 0 -2px ${colors.focus}`};

    div span {
      color: ${({ selected }: StyledTabProps) =>
        selected ? colors.active : colors.focus};
    }
  }
  :focus:not(:focus-visible) {
    box-shadow: ${({ selected }: StyledTabProps) =>
      selected
        ? `inset 0 -2px ${colors.active}`
        : `inset 0 -2px ${colors.focus}`};

    div span {
      color: ${({ selected }: StyledTabProps) =>
        selected ? colors.active : colors.focus};
    }
  }
`;

const StyledText = styled(Text)`
  font-family: 'Roboto-Bold';
  font-size: 0.75rem;
  font-weight: bold;
  letter-spacing: -0.23px;
  text-align: center;
  text-transform: uppercase;
`;

const messages = defineMessages({
  [LivePanelItem.APPLICATION]: {
    defaultMessage: 'application',
    description: 'Application tab title in live panel',
    id: 'component.LiveVideoPanel.LiveVideoTabPanel.application',
  },
  [LivePanelItem.CHAT]: {
    defaultMessage: 'chat',
    description: 'Chat tab title in live panel',
    id: 'component.LiveVideoPanel.LiveVideoTabPanel.chat',
  },
  [LivePanelItem.VIEWERS_LIST]: {
    defaultMessage: 'viewers',
    description: 'Viewers and join discussion tab title in live panel',
    id: 'component.LiveVideoPanel.LiveVideoTabPanel.joinDiscussion',
  },
});

interface LiveVideoTabPanelProps {
  item: LivePanelItem;
  selected: boolean;
}

export const LiveVideoTabPanel = ({
  item,
  selected,
}: LiveVideoTabPanelProps) => {
  const video = useCurrentVideo();
  const canUpdate = getDecodedJwt().permissions.can_update;

  const displayRingingBell =
    item === LivePanelItem.VIEWERS_LIST &&
    !selected &&
    canUpdate &&
    !!video.participants_asking_to_join.length;

  return (
    <StyledTab
      title={
        <Box margin="auto">
          <Stack anchor="bottom-right">
            <Box pad={{ horizontal: '20px', vertical: '7px' }}>
              <StyledText>
                <FormattedMessage {...messages[item]} />
              </StyledText>
            </Box>

            {displayRingingBell && (
              <Box
                background="white"
                border={{ color: 'blue-active' }}
                round="8px"
                pad={{ vertical: '1px', horizontal: '3px' }}
                direction="row"
                gap="xxsmall"
              >
                <Text
                  color="blue-active"
                  size="0.650rem"
                  style={{
                    color: normalizeColor('blue-active', theme),
                    fontFamily: 'Roboto-Medium',
                  }}
                >
                  {video.participants_asking_to_join.length}
                </Text>
                <RingingBellSVG
                  iconColor="blue-active"
                  height="15px"
                  width="12px"
                  containerStyle={{ float: 'right', margin: 'auto' }}
                />
              </Box>
            )}
          </Stack>
        </Box>
      }
      plain
      selected={selected}
    />
  );
};
