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
    defaultMessage: 'Next page',
    description: 'Sharing document next page button title text',
    id: 'components.DashboardLive.TeacherPIPControls.NextPageButtonProps.title',
  },
});

const StyledButton = styled(Button)`
  border-radius: 50%;
  transform: rotate(-90deg);
  padding: 10px;
  margin-left: 20px;
`;
interface NextPageButtonProps {
  maxPage: number;
}

export const NextPageButton = ({ maxPage }: NextPageButtonProps) => {
  const video = useCurrentVideo();
  const intl = useIntl();
  const [currentPage] = useSharedMediaCurrentPage();

  return (
    <StyledButton
      a11yTitle={intl.formatMessage(messages.title)}
      disabled={currentPage.page === maxPage}
      primary
      label={
        <Box height="30px" width="30px">
          <DownArrowSVG iconColor="white" width="100%" height="100%" />
        </Box>
      }
      onClick={() => {
        navigateSharingDoc(video, currentPage.page + 1);
      }}
    />
  );
};
