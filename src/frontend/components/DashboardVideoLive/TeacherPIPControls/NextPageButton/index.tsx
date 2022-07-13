import { Box, Button } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { DownArrowSVG } from 'components/SVGIcons/DownArrowSVG';
import { navigateSharingDoc } from 'data/sideEffects/navigateSharingDoc';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { useSharedMediaCurrentPage } from 'data/stores/useSharedMediaCurrentPage';

const messages = defineMessages({
  title: {
    defaultMessage: 'Next page',
    description: 'Sharing document next page button title text',
    id: 'components.DashboardVideoLive.TeacherPIPControls.NextPageButtonProps.title',
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
      onClick={() => navigateSharingDoc(video, currentPage.page + 1)}
    />
  );
};
