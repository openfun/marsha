import { Anchor } from 'grommet';
import { colorsTokens } from 'lib-common';
import {
  Box,
  ObjectStatusPicker,
  RetryUploadButton,
  Text,
  TimedText,
  UploadingObject,
  uploadState,
} from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { LanguageChoice } from '@lib-video/types/SelectOptions';

import { DeleteTimedTextTrackItemUploadButton } from './DeleteTimedTextTrackItemUploadButton';

const messages = defineMessages({
  retryUploadFailedLabel: {
    defaultMessage: 'Retry',
    description:
      'Label of the button allowing to retry upload when it has failed.',
    id: 'component.TimedTextTrackItem.retryUploadFailedLabel',
  },
  languageNotFound: {
    defaultMessage: 'Unrecognized language',
    description:
      'Message displayed for the item when the language is not recognized.',
    id: 'component.TimedTextTrackItem.languageNotFound',
  },
});

interface TimedTextTrackItemProps {
  onRetryFailedUpload: (timedTextTrackId: TimedText['id']) => void;
  timedTextTrack: TimedText;
  uploadingObject?: UploadingObject;
  choices?: LanguageChoice[];
}

export const TimedTextTrackItem = ({
  onRetryFailedUpload,
  timedTextTrack,
  uploadingObject,
  choices,
}: TimedTextTrackItemProps) => {
  const intl = useIntl();

  const IS_UPLOAD_IN_PROGRESS =
    (timedTextTrack.upload_state === uploadState.PENDING && uploadingObject) ||
    timedTextTrack.upload_state === uploadState.PROCESSING;

  const languageChoice = choices
    ? choices.find((lang) => timedTextTrack.language.startsWith(lang.value))
    : null;

  const languageLabel = languageChoice
    ? languageChoice.label
    : intl.formatMessage(messages.languageNotFound);

  return (
    <Box
      direction="row"
      align="center"
      fill="horizontal"
      height="60px"
      gap="medium"
      pad={{ horizontal: 'small', vertical: 'small' }}
    >
      <Box align="center">
        <DeleteTimedTextTrackItemUploadButton timedTextTrack={timedTextTrack} />
      </Box>

      <Box width={{ min: '0px' }}>
        <Anchor href={timedTextTrack.source_url ?? undefined}>
          <Text weight="medium" truncate>
            {languageLabel}
          </Text>
        </Anchor>
      </Box>

      <Box
        align="center"
        direction="row"
        justify="center"
        margin={{ left: 'auto' }}
      >
        {timedTextTrack.upload_state !== uploadState.READY && (
          <React.Fragment>
            {IS_UPLOAD_IN_PROGRESS ? (
              <Text weight="medium" truncate>
                <ObjectStatusPicker
                  object={timedTextTrack}
                  uploadStatus={uploadingObject?.status}
                />
              </Text>
            ) : (
              <React.Fragment>
                <Box>
                  <Text color="clr-danger-300" weight="medium">
                    {intl.formatMessage(messages.retryUploadFailedLabel)}
                  </Text>
                </Box>

                <RetryUploadButton
                  color={colorsTokens['danger-500']}
                  onClick={() => onRetryFailedUpload(timedTextTrack.id)}
                />
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </Box>
    </Box>
  );
};
