import { normalizeColor } from 'grommet/utils';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { UploadableObject, uploadState } from '../../types/tracks';
import { theme } from '../../utils/theme/theme';
import { UploadManagerStatus, useUploadManager } from '../UploadManager';

const messages = defineMessages({
  [uploadState.ERROR]: {
    defaultMessage: 'Error',
    description:
      'Badge text for an uploadable object that encountered an error.',
    id: 'components.UploadableObjectStatusBadge.error',
  },
  [uploadState.PENDING]: {
    defaultMessage: 'Pending',
    description:
      'Badge text for an uploadable object that has no file at all and is still pending.',
    id: 'components.UploadableObjectStatusBadge.pending',
  },
  [uploadState.PROCESSING]: {
    defaultMessage: 'Processing',
    description:
      'Badge text for an uploadable object that is currently processing',
    id: 'components.UploadableObjectStatusBadge.processing',
  },
  [uploadState.READY]: {
    defaultMessage: 'Ready',
    description: 'Badge text for an uploadable object that is ready.',
    id: 'components.UploadableObjectStatusBadge.ready',
  },
  uploading: {
    defaultMessage: 'Uploading',
    description:
      'Badge text for an uploadable object that is currently uploading.',
    id: 'components.UploadableObjectStatusBadge.uploading',
  },
});

interface BadgeProps {
  background: string;
}

const Badge = styled.div`
  display: inline-block;
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 4px;

  background-color: ${({ background }: BadgeProps) =>
    normalizeColor(background, theme)};
`;

interface UploadableObjectStatusBadgeProps {
  object: UploadableObject;
}

export const UploadableObjectStatusBadge = ({
  object,
}: UploadableObjectStatusBadgeProps) => {
  const { uploadManagerState } = useUploadManager();

  switch (object.upload_state) {
    case uploadState.READY:
      return (
        <Badge background="status-ok">
          <FormattedMessage {...messages[uploadState.READY]} />
        </Badge>
      );

    case uploadState.PROCESSING:
      return (
        <Badge background="brand">
          <FormattedMessage {...messages[uploadState.PROCESSING]} />
        </Badge>
      );

    case uploadState.ERROR:
      return (
        <Badge background="status-error">
          <FormattedMessage {...messages[uploadState.ERROR]} />
        </Badge>
      );

    case uploadState.PENDING:
      switch (uploadManagerState[object.id]?.status) {
        case UploadManagerStatus.INIT:
        case UploadManagerStatus.UPLOADING:
          return (
            <Badge background="brand">
              <FormattedMessage {...messages.uploading} />
            </Badge>
          );

        case UploadManagerStatus.ERR_POLICY:
        case UploadManagerStatus.ERR_UPLOAD:
          return (
            <Badge background="status-error">
              <FormattedMessage {...messages[uploadState.ERROR]} />
            </Badge>
          );

        case UploadManagerStatus.SUCCESS:
          return (
            <Badge background="brand">
              <FormattedMessage {...messages[uploadState.PROCESSING]} />
            </Badge>
          );

        default:
          return (
            <Badge background="dark-5">
              <FormattedMessage {...messages[uploadState.PENDING]} />
            </Badge>
          );
      }
  }

  throw new Error('Unexpected object status in object status badge.');
};
