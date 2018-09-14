import * as React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { colors } from '../../utils/theme/theme';

const messages = defineMessages({
  uploading: {
    defaultMessage: 'Uploading...',
    description:
      'Animated text loader displayed while the video is being uploaded.',
    id: 'components.VideoForm.UploadingLoader.uploading',
  },
});

const UploadingLoaderStyled = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  background: ${colors.mediumGray.contrast};
`;

const UploadingLoaderText = styled.div`
  position: relative;
  font-size: 2.5rem;
  font-weight: 800;
  color: white;

  &:before {
    content: attr(data-content);
    position: absolute;
    overflow: hidden;
    color: ${colors.darkGray.main};
    animation: filling 10s infinite;
  }

  @keyframes filling {
    0% {
      width: 0%;
    }
    50% {
      width: 100%;
    }
    100% {
      width: 0%;
    }
  }
`;

export const UploadingLoader = injectIntl(props => (
  <UploadingLoaderStyled>
    <UploadingLoaderText
      data-content={props.intl.formatMessage(messages.uploading)}
    >
      <FormattedMessage {...messages.uploading} />
    </UploadingLoaderText>
  </UploadingLoaderStyled>
));
