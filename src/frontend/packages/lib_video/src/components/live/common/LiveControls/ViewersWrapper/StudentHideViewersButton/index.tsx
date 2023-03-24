import { Button, ViewersSVG } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useLivePanelState } from '@lib-video/hooks/useLivePanelState';

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

interface StudentHideViewersButtonProps {
  nbrOfOnStageRequests?: number;
}

export const StudentHideViewersButton = ({
  nbrOfOnStageRequests,
}: StudentHideViewersButtonProps) => {
  const intl = useIntl();
  const { setPanelVisibility } = useLivePanelState((state) => ({
    setPanelVisibility: state.setPanelVisibility,
  }));

  return (
    <Button
      label={intl.formatMessage(messages.viewers)}
      badge={
        nbrOfOnStageRequests !== 0
          ? nbrOfOnStageRequests?.toString()
          : undefined
      }
      Icon={ViewersSVG}
      onClick={() => {
        setPanelVisibility(false);
      }}
      reversed
      title={intl.formatMessage(messages.hideViewers)}
    />
  );
};
