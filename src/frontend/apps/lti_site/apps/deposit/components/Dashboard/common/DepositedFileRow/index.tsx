import { Anchor, Box, Grid, ResponsiveContext, Text } from 'grommet';
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
      background={file.read ? '#F2F7FD' : 'white'}
      border={
        file.read
          ? false
          : { color: 'blue-active', side: 'all', size: 'xsmall' }
      }
      fill
      margin={{ top: 'xxsmall' }}
      pad="xsmall"
      round="small"
    >
      {size === 'small' || size === 'xsmall' ? (
        <Box pad="small">
          <Grid columns={['1fr', '1fr']}>
            <Box align="start">
              <Text size="medium">{file.author_name}</Text>
            </Box>
            <Box align="end" direction="row">
              <Text
                size="small"
                wordBreak="keep-all"
                margin={{ right: 'xxsmall' }}
              >
                {uploadedOnDate}&nbsp;{uploadedOnTime}
              </Text>
              <Text size="small">{bytesToSize(file.size)}</Text>
            </Box>
          </Grid>

          <Grid columns={['1fr', '1fr']}>
            <Box align="start">
              <Text
                title={file.filename}
                weight={file.read ? 'normal' : 'bolder'}
              >
                {size === 'small'
                  ? truncateFilename(file.filename, 70)
                  : truncateFilename(file.filename, 40)}
              </Text>
            </Box>
            {file.upload_state === 'ready' ? (
              <Box align="center" justify="end" direction="row" gap="small">
                <Box
                  align="center"
                  justify="center"
                  background="blue-active"
                  pad={{ horizontal: 'medium', vertical: 'xsmall' }}
                  round="xsmall"
                >
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
                </Box>
              </Box>
            ) : (
              <Box justify="end" direction="row" gap="small">
                <Text>{file.upload_state}</Text>
              </Box>
            )}
          </Grid>
        </Box>
      ) : (
        <Grid
          columns={{ count: 3, size: 'auto' }}
          gap="xxsmall"
          margin="xsmall"
          align="center"
        >
          <Box justify="start" direction="row" gap="small">
            <Text size="medium">{file.author_name}</Text>
          </Box>
          <Box justify="center" direction="row" gap="small">
            <Grid
              columns={['auto', 'xsmall', 'medium']}
              gap="xxsmall"
              align="center"
              justify="start"
            >
              <Text
                size="small"
                wordBreak="keep-all"
                margin={{ right: 'xxsmall' }}
              >
                {uploadedOnDate}&nbsp;{uploadedOnTime}
              </Text>
              <Text size="small">{bytesToSize(file.size)}</Text>
              <Text
                title={file.filename}
                weight={file.read ? 'normal' : 'bolder'}
              >
                {size === 'medium'
                  ? truncateFilename(file.filename, 40)
                  : size === 'large'
                  ? truncateFilename(file.filename, 60)
                  : file.filename}
              </Text>
            </Grid>
          </Box>
          {file.upload_state === 'ready' ? (
            <Box align="center" justify="end" direction="row" gap="small">
              <Box
                align="center"
                justify="center"
                background="blue-active"
                pad={{ horizontal: 'medium', vertical: 'xsmall' }}
                round="xsmall"
              >
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
              </Box>
            </Box>
          ) : (
            <Box justify="end" direction="row" gap="small">
              <Text>{file.upload_state}</Text>
            </Box>
          )}
        </Grid>
      )}
    </Box>
  );
};
