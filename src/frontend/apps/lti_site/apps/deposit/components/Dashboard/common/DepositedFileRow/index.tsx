import { Button } from '@openfun/cunningham-react';
import { Breakpoints, themeTokens } from 'lib-common';
import {
  Box,
  DepositedFile,
  Text,
  truncateFilename,
  useResponsive,
} from 'lib-components';
import { DateTime } from 'luxon';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateDepositedFile } from 'apps/deposit/data/queries';
import { bytesToSize } from 'apps/deposit/utils/bytesToSize';

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
  const { isSmallerBreakpoint, breakpoint } = useResponsive();
  const uploadedOn = file.uploaded_on
    ? DateTime.fromISO(file.uploaded_on)
    : null;
  const uploadedOnDate = uploadedOn ? uploadedOn.toFormat('dd/MM/yyyy') : null;
  const uploadedOnTime = uploadedOn ? uploadedOn.toFormat('HH:mm') : null;

  const { mutate } = useUpdateDepositedFile(file.id, file.file_depository_id);
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
      style={{
        border: file.read
          ? undefined
          : `1px solid ${themeTokens.colors['primary-500']}`,
      }}
      fill
      margin={{ top: 'xxsmall' }}
      pad={{
        all: 'small',
        horizontal: isSmallerBreakpoint(breakpoint, Breakpoints.smedium)
          ? 'small'
          : 'medium',
      }}
      round="xsmall"
    >
      <Box
        direction="row"
        fill
        align="center"
        gap="small"
        justify="space-between"
        flow="wrap"
      >
        <Box>
          <Text weight="medium">{file.author_name}</Text>
          {uploadedOn && (
            <Text size="small" className="mr-t">
              {uploadedOnDate}&nbsp;{uploadedOnTime}
            </Text>
          )}
        </Box>
        <Box align="end" justify="end" gap="small">
          {file.upload_state === 'ready' ? (
            <Button
              onClick={markFileAsRead}
              download
              aria-label={intl.formatMessage(messages.labelDownload)}
              title={intl.formatMessage(messages.labelDownload)}
              href={file.url}
            >
              {intl.formatMessage(messages.labelDownload)}
            </Button>
          ) : (
            <Text>{file.upload_state}</Text>
          )}
        </Box>
      </Box>

      <Box
        direction="row"
        fill
        align="center"
        justify="space-between"
        margin={{ top: 'xsmall' }}
        gap="xsmall"
      >
        <Text title={file.filename} weight={file.read ? 'regular' : 'bold'}>
          {isSmallerBreakpoint(breakpoint, Breakpoints.large)
            ? truncateFilename(file.filename, 40)
            : breakpoint === 'large'
              ? truncateFilename(file.filename, 60)
              : file.filename}
        </Text>
        <Text size="small">{bytesToSize(file.size)}</Text>
      </Box>
    </Box>
  );
};
