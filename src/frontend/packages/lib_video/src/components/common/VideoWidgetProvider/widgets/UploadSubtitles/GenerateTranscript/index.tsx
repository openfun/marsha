import { Button } from '@openfun/cunningham-react';
import {
  BinSVG,
  ToggleInput,
  Video,
  report,
  timedTextMode,
  useTimedTextTrack,
} from 'lib-components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useDeleteTimedTextTrack } from '@lib-video/api';
import { useGenerateTranscript } from '@lib-video/api/useGenerateTranscript';
import { useUpdateVideo } from '@lib-video/api/useUpdateVideo';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

const messages = defineMessages({
  generateTranscriptionLabel: {
    defaultMessage: 'Generate transcript',
    description: 'Label generate transcript button.',
    id: 'component.GenerateTranscript.generateTranscriptionLabel',
  },
  pendingTranscriptionGenerationMessage: {
    defaultMessage: 'Transcription generation is pending.',
    description: 'Message displayed when transcription generation is pending.',
    id: 'component.GenerateTranscript.pendingTranscriptionGenerationMessage',
  },
  errorTranscriptionGenerationMessage: {
    defaultMessage: 'Transcription generation has failed.',
    description: 'Message displayed when transcription generation has failed.',
    id: 'component.GenerateTranscript.errorTranscriptionGenerationMessage',
  },
});

export const GenerateTranscript = () => {
  const intl = useIntl();

  const video = useCurrentVideo();
  const generateTranscript = useGenerateTranscript({
    onSuccess: () => {
      toast.success(
        intl.formatMessage(messages.pendingTranscriptionGenerationMessage),
        {
          position: 'bottom-center',
        },
      );
    },
    onError: (err: unknown) => {
      report(err);
      toast.error(
        intl.formatMessage(messages.errorTranscriptionGenerationMessage),
        {
          position: 'bottom-center',
        },
      );
    },
  });

  return (
    <Button
      aria-label={intl.formatMessage(messages.generateTranscriptionLabel)}
      onClick={() => generateTranscript.mutate({ videoId: video.id })}
      color="secondary"
      title={intl.formatMessage(messages.generateTranscriptionLabel)}
      fullWidth
    >
      {intl.formatMessage(messages.generateTranscriptionLabel)}
    </Button>
  );
};
