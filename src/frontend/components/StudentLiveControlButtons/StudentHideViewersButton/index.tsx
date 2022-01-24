import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Button } from 'components/Button';
import { ViewersSVG } from 'components/SVGIcons/ViewersSVG';
import { useLivePanelState } from 'data/stores/useLivePanelState';

const messages = defineMessages({
  viewers: {
    defaultMessage: 'Viewers',
    description: 'Label for the viewers button',
    id: 'components.StudentHideViewersButton.Viewers',
  },
  hideViewers: {
    defaultMessage: 'Hide viewers',
    description: 'Title for the viewers button',
    id: 'components.StudentHideViewersButton.hideViewers',
  },
});

export const StudentHideViewersButton = () => {
  const intl = useIntl();
  const { setPanelVisibility } = useLivePanelState((state) => ({
    setPanelVisibility: state.setPanelVisibility,
  }));

  return (
    <Button
      label={intl.formatMessage(messages.viewers)}
      Icon={ViewersSVG}
      onClick={() => {
        setPanelVisibility(false);
      }}
      reversed
      title={intl.formatMessage(messages.hideViewers)}
    />
  );
};
