import { Box, Text } from 'grommet';
import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { LanguageChoice } from '../../types/LanguageChoice';
import { TimedTextTranscript } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { ActionLink } from '../ActionLink/ActionLink';
import { TranscriptReaderConnected } from '../TranscriptReaderConnected/TranscriptReaderConnected';

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
  jwt: string;
  getTimedTextTrackLanguageChoices: (jwt: string) => void;
  languageChoices: LanguageChoice[];
  transcripts: TimedTextTranscript[];
}

interface TranscriptsState {
  selectedTranscript: Nullable<TimedTextTranscript>;
  selectedLanguage: string;
}

export class Transcripts extends React.Component<
  TranscriptsProps,
  TranscriptsState
> {
  constructor(props: TranscriptsProps) {
    super(props);
    this.state = {
      selectedLanguage: '',
      selectedTranscript: null,
    };
  }

  componentDidMount() {
    const { jwt, getTimedTextTrackLanguageChoices } = this.props;

    getTimedTextTrackLanguageChoices(jwt);
  }

  disableTranscript() {
    this.setState({
      selectedLanguage: '',
      selectedTranscript: null,
    });
  }

  onSelectChange(e: React.SyntheticEvent<HTMLSelectElement>) {
    e.stopPropagation();

    const id = e.currentTarget.value;

    if (id === '') {
      this.disableTranscript();
      return;
    }

    const transcript = this.props.transcripts.find(ts => ts.id === id);

    if (transcript) {
      this.setState({
        selectedLanguage: e.currentTarget.value,
        selectedTranscript: transcript,
      });
    }
  }

  render() {
    const { languageChoices, transcripts } = this.props;
    const options = transcripts.map(transcript => {
      const language = languageChoices.find(
        languageChoice => languageChoice.value === transcript.language,
      );
      return {
        label: language ? language.label : transcript.language,
        value: transcript.id,
      };
    });
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
              onChange={this.onSelectChange.bind(this)}
              value={this.state.selectedLanguage}
            >
              <FormattedMessage {...messages.transcriptSelectPlaceholder}>
                {message => <option value={''}>{message}</option>}
              </FormattedMessage>
              {options.map(language => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </form>
        </Box>
        {this.state.selectedTranscript && (
          <Box>
            <TranscriptReaderConnected
              transcript={this.state.selectedTranscript}
              key={this.state.selectedTranscript.id}
            />
            <Box>
              <ActionLink
                margin={'small'}
                alignSelf="center"
                color={'status-critical'}
                label={<FormattedMessage {...messages.hideTranscript} />}
                onClick={this.disableTranscript.bind(this)}
              />
            </Box>
          </Box>
        )}
      </React.Fragment>
    );
  }
}
