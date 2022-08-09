import { Text } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { RetryUploadButton } from 'components/common/dashboard/widgets/components/RetryUploadButton';
import { BigDashedBox } from 'components/VideoWizard/CreateVOD/UploadVideoForm/BigDashedBox';

const messages = defineMessages({
  errorOccuredVideoUpload: {
    defaultMessage: 'An error occured when uploading your video. Please retry.',
    description:
      "Button's label offering the user to go validate is form and create a new video.",
    id: 'components.UploadVideoRetry.errorOccuredVideoUpload',
  },
});

interface UploadVideoRetryProps {
  onClickRetry: () => void;
}

export const UploadVideoRetry = ({ onClickRetry }: UploadVideoRetryProps) => {
  const intl = useIntl();

  return (
    <BigDashedBox direction="row">
      <Text color="red-active" size="1rem">
        {intl.formatMessage(messages.errorOccuredVideoUpload)}
      </Text>
      <RetryUploadButton
        color="red-active"
        onClick={() => onClickRetry()}
        size="large"
      />
    </BigDashedBox>
  );
};
