import { Box } from 'grommet';
import { Nullable } from 'lib-common';
import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { useTimedTextTrackLanguageChoices } from '../../data/stores/useTimedTextTrackLanguageChoices';
import { TimedTextTranscript } from '../../types/tracks';
import { ActionLink } from '../ActionLink/ActionLink';
import { TranscriptReader } from '../TranscriptReader';

const messages = defineMessages({
  hideTranscript: {
    defaultMessage: 'Hide transcript',
    description: 'Text to hide a displayed transcript',
    id: 'components.Transcripts.hideTranscript',
  },
  transcriptLabel: {
    defaultMessage: 'Show a transcript',
    description: 'Text indicated to choose an available transcript language',
    id: 'components.Transcripts.transcriptLabel',
  },
  transcriptSelectPlaceholder: {
    defaultMessage: 'Choose a language',
    description: 'Placeholder for the transcript select box',
    id: 'components.Transcripts.transcriptSelect',
  },
});

const LabelChooseLanguage = styled.label`
  margin-right: 12px;
`;

interface TranscriptsProps {
  transcripts: TimedTextTranscript[];
}

/**
 * Component. Displays the available choices for transcripts and plays a transcript when the user selects it.
 * @param transcripts A list of available timed text tracks with mode TRANSCRIPT.
 */
export const Transcripts = ({ transcripts }: TranscriptsProps) => {
  const [selected, setSelected] = useState({
    language: '',
    transcript: null as Nullable<TimedTextTranscript>,
  });

  const { choices, getChoices } = useTimedTextTrackLanguageChoices(
    (state) => state,
  );

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

  const disableTranscript = () =>
    setSelected({
      language: '',
      transcript: null,
    });

  const onSelectChange = (e: React.SyntheticEvent<HTMLSelectElement>) => {
    e.stopPropagation();

    const id = e.currentTarget.value;
    if (id === '') {
      return disableTranscript();
    }

    const transcript = transcripts.find((ts) => ts.id === id);
    if (transcript) {
      setSelected({
        language: e.currentTarget.value,
        transcript,
      });
    }
  };

  useEffect(() => {
    getChoices();
  }, []);

  return (
    <React.Fragment>
      <Box align="center" justify="center" direction="row" pad="medium">
        <form>
          <LabelChooseLanguage htmlFor="languages">
            <FormattedMessage {...messages.transcriptLabel} />
          </LabelChooseLanguage>
          <select
            id="languages"
            name="language_choices"
            onChange={onSelectChange}
            value={selected.language}
          >
            <FormattedMessage {...messages.transcriptSelectPlaceholder}>
              {(message) => <option value={''}>{message}</option>}
            </FormattedMessage>
            {options.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
        </form>
      </Box>
      {selected.transcript && (
        <Box>
          <TranscriptReader
            transcript={selected.transcript}
            key={selected.transcript.id}
          />
          <Box>
            <ActionLink
              margin={'small'}
              alignSelf="center"
              color={'status-critical'}
              label={<FormattedMessage {...messages.hideTranscript} />}
              onClick={disableTranscript}
            />
          </Box>
        </Box>
      )}
    </React.Fragment>
  );
};
