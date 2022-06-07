import { Box, Button } from 'grommet';
import React from 'react';
import styled from 'styled-components';

import { DownArrowSVG } from 'components/SVGIcons/DownArrowSVG';
import { navigateSharingDoc } from 'data/sideEffects/navigateSharingDoc';
import { useSharedMediaCurrentPage } from 'data/stores/useSharedMediaCurrentPage';
import { Video } from 'types/tracks';

const StyledButton = styled(Button)`
  border-radius: 50%;
  transform: rotate(-90deg);
  padding: 10px;
  margin-left: 20px;
`;
interface NextPageButtonProps {
  video: Video;
  maxPage: number;
}

export const NextPageButton = ({ video, maxPage }: NextPageButtonProps) => {
  const [currentPage] = useSharedMediaCurrentPage();

  return (
    <StyledButton
      data-testid="pip-next-button"
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
