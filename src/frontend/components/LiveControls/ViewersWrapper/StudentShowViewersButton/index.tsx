import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Button } from 'components/Button';
import { ViewersSVG } from 'components/SVGIcons/ViewersSVG';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';

const messages = defineMessages({
  viewers: {
    defaultMessage: 'Viewers',
    description: 'Label for the viewer button',
    id: 'components.StudentShowViewerButton.viewer',
  },
  showViewers: {
    defaultMessage: 'Show viewers',
    description: 'Title for the viewer button',
    id: 'components.StudentShowViewerButton.showViewer',
  },
});

export const StudentShowViewersButton = () => {
  const intl = useIntl();
  const { setPanelVisibility } = useLivePanelState((state) => ({
    setPanelVisibility: state.setPanelVisibility,
  }));

  return (
    <Button
      label={intl.formatMessage(messages.viewers)}
      Icon={ViewersSVG}
      onClick={() => {
        setPanelVisibility(true, LivePanelItem.VIEWERS_LIST);
      }}
      title={intl.formatMessage(messages.showViewers)}
    />
  );
};
