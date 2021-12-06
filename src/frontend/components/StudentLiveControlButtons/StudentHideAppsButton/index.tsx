import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Button } from 'components/Button';
import { AppsSVG } from 'components/SVGIcons/AppsSVG';
import { useLivePanelState } from 'data/stores/useLivePanelState';

const messages = defineMessages({
  apps: {
    defaultMessage: 'Apps',
    description: 'Label for the hide apps button',
    id: 'components.StudentHideAppsButton.apps',
  },
  hideApps: {
    defaultMessage: 'Hide apps',
    description: 'Title for the hide apps button',
    id: 'components.StudentHideAppsButton.hideApps',
  },
});

export const StudentHideAppsButton = () => {
  const intl = useIntl();
  const { setPanelVisibility } = useLivePanelState((state) => ({
    setPanelVisibility: state.setPanelVisibility,
  }));

  return (
    <Button
      label={intl.formatMessage(messages.apps)}
      Icon={AppsSVG}
      onClick={() => {
        setPanelVisibility(false);
      }}
      reversed
      title={intl.formatMessage(messages.hideApps)}
    />
  );
};
