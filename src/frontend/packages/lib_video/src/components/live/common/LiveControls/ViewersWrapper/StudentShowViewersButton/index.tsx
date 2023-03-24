import { Button, ViewersSVG } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

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

interface StudentShowViewersButtonProps {
  nbrOfOnStageRequests?: number;
}
export const StudentShowViewersButton = ({
  nbrOfOnStageRequests,
}: StudentShowViewersButtonProps) => {
  const intl = useIntl();
  const { setPanelVisibility } = useLivePanelState((state) => ({
    setPanelVisibility: state.setPanelVisibility,
  }));

  return (
    <Button
      badge={
        nbrOfOnStageRequests !== 0
          ? nbrOfOnStageRequests?.toString()
          : undefined
      }
      label={intl.formatMessage(messages.viewers)}
      Icon={ViewersSVG}
      onClick={() => {
        setPanelVisibility(true, LivePanelItem.VIEWERS_LIST);
      }}
      title={intl.formatMessage(messages.showViewers)}
    />
  );
};
