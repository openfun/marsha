import { Button } from '@openfun/cunningham-react';
import { DownArrowSVG } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { navigateSharingDoc } from '@lib-video/api/navigateSharingDoc';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';
import { useSharedMediaCurrentPage } from '@lib-video/hooks/useSharedMediaCurrentPage';

const messages = defineMessages({
  title: {
    defaultMessage: 'Previous page',
    description: 'Sharing document previous page button title text',
    id: 'components.DashboardLive.TeacherPIPControls.PreviousPageButton.title',
  },
});

const StyledBytton = styled(Button)`
  transform: rotate(90deg);
  padding: 10px;
  &,
  &:hover,
  &:active {
    border-radius: 50%;
  }
`;

export const PreviousPageButton = () => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const [currentPage] = useSharedMediaCurrentPage();

  return (
    <StyledBytton
      aria-label={intl.formatMessage(messages.title)}
      disabled={currentPage.page <= 1}
      icon={<DownArrowSVG iconColor="white" height="30px" width="30px" />}
      onClick={() => {
        navigateSharingDoc(video, currentPage.page - 1);
      }}
    />
  );
};
