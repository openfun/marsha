import { Box, Button } from 'grommet';
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
  border-radius: 50%;
  transform: rotate(90deg);
  padding: 10px;
`;

export const PreviousPageButton = () => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const [currentPage] = useSharedMediaCurrentPage();

  return (
    <StyledBytton
      a11yTitle={intl.formatMessage(messages.title)}
      disabled={currentPage.page <= 1}
      primary
      label={
        <Box height="30px" width="30px">
          <DownArrowSVG iconColor="white" width="100%" height="100%" />
        </Box>
      }
      onClick={() => {
        navigateSharingDoc(video, currentPage.page - 1);
      }}
    />
  );
};
