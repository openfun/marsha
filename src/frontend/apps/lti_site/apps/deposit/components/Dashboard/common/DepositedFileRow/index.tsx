import { Anchor, Box, Grid, Text } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { DateTime } from 'luxon';

import { useUpdateDepositedFile } from 'apps/deposit/data/queries';
import { DepositedFile } from 'apps/deposit/types/models';
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
      background="#F2F7FD"
      fill
      margin={{ top: 'small' }}
      pad="medium"
      round="xsmall"
    >
      <Grid
        columns={['xsmall', 'flex', 'xsmall']}
        gap="xxsmall"
        margin="xsmall"
      >
        <Box justify="start" direction="row" gap="small">
          <Text>{file.uploaded_by || 'user'}</Text>
        </Box>
        <Box justify="center" direction="row" gap="small">
          <Text>{uploadedOnDate}</Text>
          <Text>{uploadedOnTime}</Text>
          <Text>{bytesToSize(file.size)}</Text>
          <Text>{file.filename}</Text>
          <Text>{file.read ? 'read' : 'new'}</Text>
        </Box>
        {file.upload_state === 'ready' ? (
          <Box justify="end" direction="row" gap="small">
            <Anchor
              onClick={markFileAsRead}
              download
              a11yTitle={intl.formatMessage(messages.labelDownload)}
              color="blue-active"
              label={intl.formatMessage(messages.labelDownload)}
              style={{ fontFamily: 'Roboto-Medium' }}
              title={intl.formatMessage(messages.labelDownload)}
              href={file.url}
            />
          </Box>
        ) : (
          <Box justify="end" direction="row" gap="small">
            <Text>{file.upload_state}</Text>
          </Box>
        )}
      </Grid>
    </Box>
  );
};
