import { Box, Button, Select, Text } from 'grommet';
import { Nullable } from 'lib-common';
import {
  TimedText,
  timedTextMode,
  TimedTextTranscript,
  useTimedTextTrack,
  TimedTextTrackState,
  FoldableItem,
} from 'lib-components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useFetchTimedTextTrackLanguageChoices } from '@lib-video/api/useFetchTimedTextTrackLanguageChoices';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

import { TranscriptReader } from './TranscriptReader';

const messages = defineMessages({
  info: {
    defaultMessage:
      'This widget allows you to read and downloads transcripts for the video.',
    description: 'Info of the widget used for uploading transcripts.',
    id: 'components.UploadTranscripts.info',
  },
  title: {
    defaultMessage: 'Transcripts',
    description: 'Title of the widget used for read and download transcripts.',
    id: 'components.UploadTranscripts.title',
  },
  hideTranscript: {
    defaultMessage: 'Hide transcript',
    description: 'Text to hide a displayed transcript',
    id: 'components.Transcripts.hideTranscript',
  },
  transcriptSelectPlaceholder: {
    defaultMessage: 'Choose a language',
    description: 'Placeholder for the transcript select box',
    id: 'components.Transcripts.transcriptSelect',
  },
  transcriptDownload: {
    defaultMessage: 'Download',
    description: 'Download Transcript',
    id: 'components.Transcripts.download',
  },
});

/*
 * Component. Displays the available choices for transcripts and plays a transcript when the user selects it.
 */
export const Transcripts = () => {
  const intl = useIntl();
  const video = useCurrentVideo();

  const timeTextFetcher = useCallback(
    (state: TimedTextTrackState) => state.getTimedTextTracks(),
    [],
  );
  const timedTextTracks: TimedText[] = useTimedTextTrack(timeTextFetcher);

  const { data } = useFetchTimedTextTrackLanguageChoices();
  const choices = useMemo(
    () =>
      data?.actions.POST.language.choices?.map((choice) => ({
        label: choice.display_name,
        value: choice.value,
      })),
    [data?.actions.POST.language.choices],
  );

  const transcripts = useMemo(() => {
    return timedTextTracks
      .filter((track) => track.is_ready_to_show)
      .filter((track) =>
        video.has_transcript === false &&
        video.should_use_subtitle_as_transcript
          ? timedTextMode.SUBTITLE === track.mode
          : timedTextMode.TRANSCRIPT === track.mode,
      ) as TimedTextTranscript[];
  }, [
    timedTextTracks,
    video.has_transcript,
    video.should_use_subtitle_as_transcript,
  ]);

  const options = transcripts.map((transcript) => {
    const language =
      choices &&
      choices.find(
        (languageChoice) => languageChoice.value === transcript.language,
      );
    return {
      label: language ? language.label : transcript.language,
      value: transcript.id,
    };
  });

  const [selectedOption, setSelectedOption] = useState({
    label: intl.formatMessage(messages.transcriptSelectPlaceholder),
    value: '',
  });

  const [selectedTranscript, setSelectedTranscript] = useState<{
    language: string;
    transcript: Nullable<TimedTextTranscript>;
  }>({
    language: '',
    transcript: null,
  });

  useEffect(() => {
    const onSelectChange = (option: { label: string; value: string }) => {
      if (option.value === '') {
        return setSelectedTranscript({
          language: '',
          transcript: null,
        });
      }
      const transcript = transcripts.find((ts) => ts.id === option.value);
      if (transcript) {
        setSelectedTranscript({
          language: option.label,
          transcript,
        });
      }
    };
    onSelectChange(selectedOption);
  }, [selectedOption, transcripts]);

  if (!transcripts || transcripts.length === 0) {
    return null;
  }

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue={true}
      title={intl.formatMessage(messages.title)}
    >
      <Box
        direction="row"
        gap="small"
        style={{
          marginTop: '0.75rem',
          marginBottom: '0.75rem',
        }}
      >
        <Box width="50%">
          <Select
            id="languages"
            name="language_choices"
            options={options}
            replace={false}
            labelKey="label"
            value={selectedOption.label}
            valueKey={{ key: 'value', reduce: true }}
            valueLabel={(label: string) => (
              <Box pad="small">
                <Text color="blue-active">{`${label}`}</Text>
              </Box>
            )}
            onChange={({
              option,
            }: {
              option: { label: string; value: string };
            }) => {
              setSelectedOption(option);
            }}
          />
        </Box>
        <Box width="50%">
          <Button
            a11yTitle={intl.formatMessage(messages.transcriptDownload)}
            download
            disabled={!selectedTranscript.transcript}
            label={intl.formatMessage(messages.transcriptDownload)}
            href={
              (selectedTranscript.transcript &&
                selectedTranscript.transcript.source_url) ??
              undefined
            }
            target="_blank"
            rel="noopener noreferrer"
            primary
            title={intl.formatMessage(messages.transcriptDownload)}
            style={{ height: '50px' }}
          />
        </Box>
      </Box>
      {selectedTranscript.transcript && (
        <Box>
          <TranscriptReader
            transcript={selectedTranscript.transcript}
            key={selectedTranscript.transcript.id}
          />
        </Box>
      )}
    </FoldableItem>
  );
};
