import React from 'react';
import { Tab, Text } from 'grommet';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { LivePanelItem } from 'data/stores/useLivePanelState';
import { theme } from 'utils/theme/theme';

interface StyledTabProps {
  selected?: boolean;
}

const colors = {
  active: theme.global.colors['blue-active'],
  counterPart: theme.global.colors.white,
  disable: theme.global.colors['blue-off'],
  focus: theme.global.colors['blue-focus'],
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
  font-size: 10px;
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
  [LivePanelItem.JOIN_DISCUSSION]: {
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
  return (
    <StyledTab
      title={
        <StyledText>
          <FormattedMessage {...messages[item]} />
        </StyledText>
      }
      plain
      selected={selected}
    />
  );
};
