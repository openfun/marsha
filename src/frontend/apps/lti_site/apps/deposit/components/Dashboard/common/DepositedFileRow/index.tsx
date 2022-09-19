import { Anchor, Box, ResponsiveContext, Text } from 'grommet';
import React, { useContext } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { DateTime } from 'luxon';

import { useUpdateDepositedFile } from 'apps/deposit/data/queries';
import { DepositedFile } from 'apps/deposit/types/models';
import { bytesToSize } from 'apps/deposit/utils/bytesToSize';
import { truncateFilename } from 'apps/deposit/utils/truncateFilename';

const messages = defineMessages({
  labelDownload: {
    defaultMessage: 'Download',
    description: 'Button label for downloading a deposited file.',
    id: 'component.DashboardFileDepositoryStudent.labelDownload',
  },
});

interface DepositedFileProps {
  file: DepositedFile;
}

export const DepositedFileRow = ({ file }: DepositedFileProps) => {
  const intl = useIntl();
  const size = useContext(ResponsiveContext);
  const uploadedOn = file.uploaded_on
    ? DateTime.fromISO(file.uploaded_on)
    : null;
  const uploadedOnDate = uploadedOn ? uploadedOn.toFormat('dd/MM/yyyy') : null;
  const uploadedOnTime = uploadedOn ? uploadedOn.toFormat('HH:mm') : null;

  const { mutate } = useUpdateDepositedFile(file.id);
  const markFileAsRead = () => {
    const callback = () => {
      mutate(
        { read: true },
        {
          onSuccess: (updatedFile: DepositedFile) => {
            file = updatedFile;
          },
        },
      );
      window.removeEventListener('blur', callback);
    };

    if (!file.read) {
      window.addEventListener('blur', callback);
    }
  };

  return (
    <Box
      align="baseline"
      background={file.read ? '#F2F7FD' : 'white'}
      border={
        file.read
          ? false
          : { color: 'blue-active', side: 'all', size: 'xsmall' }
      }
      fill
      margin={{ top: 'xxsmall' }}
      pad="medium"
      round="small"
    >
      <Box direction="row" fill>
        <Box justify="start" gap="small" flex>
          <Text size="medium">{file.author_name}</Text>
        </Box>
        {uploadedOn && (
          <Box justify="start" flex="shrink">
            <Text
              size="small"
              wordBreak="keep-all"
              margin={{ right: 'xxsmall' }}
            >
              {uploadedOnDate}&nbsp;{uploadedOnTime}
            </Text>
          </Box>
        )}
        <Box align="end" justify="end" gap="small" flex>
          <Box
            justify="end"
            background={
              file.upload_state === 'ready' ? 'blue-active' : undefined
            }
            pad={{
              horizontal: file.upload_state === 'ready' ? 'medium' : undefined,
              vertical: 'xsmall',
            }}
            round="xsmall"
          >
            {file.upload_state === 'ready' ? (
              <Anchor
                onClick={markFileAsRead}
                download
                color="white"
                a11yTitle={intl.formatMessage(messages.labelDownload)}
                label={intl.formatMessage(messages.labelDownload)}
                style={{ fontFamily: 'Roboto-Medium' }}
                title={intl.formatMessage(messages.labelDownload)}
                href={file.url}
              />
            ) : (
              <Text>{file.upload_state}</Text>
            )}
          </Box>
        </Box>
      </Box>

      <Box direction="row" fill>
        <Box justify="start" flex>
          <Text title={file.filename} weight={file.read ? 'normal' : 'bolder'}>
            {size === 'medium'
              ? truncateFilename(file.filename, 40)
              : size === 'large'
              ? truncateFilename(file.filename, 60)
              : file.filename}
          </Text>
        </Box>
        <Box align="end" justify="end" flex="shrink">
          <Text size="small">{bytesToSize(file.size)}</Text>
        </Box>
      </Box>
    </Box>
  );
};
