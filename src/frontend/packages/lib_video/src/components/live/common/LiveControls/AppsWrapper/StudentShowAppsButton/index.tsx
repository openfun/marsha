import { AppsSVG, Button } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

const messages = defineMessages({
  apps: {
    defaultMessage: 'Apps',
    description: 'Label for the show apps button',
    id: 'components.StudentShowAppsButton.apps',
  },
  showApps: {
    defaultMessage: 'Show apps',
    description: 'Title for the show apps button',
    id: 'components.StudentShowAppsButton.showApps',
  },
});

export const StudentShowAppsButton = () => {
  const intl = useIntl();
  const { setPanelVisibility } = useLivePanelState((state) => ({
    setPanelVisibility: state.setPanelVisibility,
  }));

  return (
    <Button
      label={intl.formatMessage(messages.apps)}
      Icon={AppsSVG}
      onClick={() => {
        setPanelVisibility(true, LivePanelItem.APPLICATION);
      }}
      title={intl.formatMessage(messages.showApps)}
    />
  );
};
