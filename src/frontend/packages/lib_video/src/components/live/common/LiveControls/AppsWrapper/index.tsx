import { Switch } from '@openfun/cunningham-react';
import { defineMessages, useIntl } from 'react-intl';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

const messages = defineMessages({
  showApps: {
    defaultMessage: 'Show apps',
    description: 'Title for the show apps button',
    id: 'components.StudentShowAppsButton.showApps',
  },
});

export const AppsWrapper = () => {
  const { currentItem, isPanelVisible } = useLivePanelState((state) => ({
    currentItem: state.currentItem,
    isPanelVisible: state.isPanelVisible,
  }));
  const intl = useIntl();
  const { setPanelVisibility } = useLivePanelState((state) => ({
    setPanelVisibility: state.setPanelVisibility,
  }));

  const isAppPanelVisible =
    currentItem === LivePanelItem.APPLICATION && isPanelVisible;

  return (
    <Switch
      label={intl.formatMessage(messages.showApps)}
      checked={isAppPanelVisible}
      onChange={() =>
        setPanelVisibility(!isAppPanelVisible, LivePanelItem.APPLICATION)
      }
    />
  );
};
