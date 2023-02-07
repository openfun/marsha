import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import {
  Spinner,
  UploadManagerStatus,
  useUploadManager,
  StyledLink,
} from 'lib-components';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Icon } from '../Icon';

const messages = defineMessages({
  title: {
    defaultMessage: 'File uploads',
    description: 'Message for the sidebar uploads indicator link.',
    id: 'components.SidebarUploadsIndicator.title',
  },
});

const styledLinkCSS = `
  &:active {
    text-decoration: none;
    color: inherit;
  }

  &:hover {
    background: white;
    color: ${normalizeColor('brand', theme)};

    // Force the underline only on the link part, not on the count
    & .link-underlined-part {
      text-decoration: underline;
    }
  }
`;

const CountContainer = styled.div`
  height: 1rem;
  display: flex;
  align-items: center;
`;

const CountBox = styled(Box)`
  transform: scale(0.8);
  font-weight: 700;
  border-radius: 1.25rem;
`;

export const SidebarUploadsIndicator = () => {
  const { uploadManagerState } = useUploadManager();

  const activeUploadsCount = Object.values(uploadManagerState).filter((state) =>
    [UploadManagerStatus.INIT, UploadManagerStatus.UPLOADING].includes(
      state.status,
    ),
  ).length;

  return (
    <StyledLink to="/uploads" css={styledLinkCSS}>
      <Box
        direction="row"
        pad={{ horizontal: 'medium', vertical: 'small' }}
        gap="small"
        align="center"
      >
        <Icon name="icon-upload" />
        <div className="link-underlined-part">
          <FormattedMessage {...messages.title} />
        </div>
        {activeUploadsCount > 0 ? (
          <CountContainer>
            <CountBox
              direction="row"
              pad={{ horizontal: 'small', vertical: 'xsmall' }}
              gap="small"
              align="center"
              background="accent-2"
            >
              <Spinner size="small" color="white" />
              <span>{activeUploadsCount}</span>
            </CountBox>
          </CountContainer>
        ) : null}
      </Box>
    </StyledLink>
  );
};
