import { Button } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';
import Select from 'react-select';
import { ActionMeta, ValueType } from 'react-select/lib/types';
import styled from 'styled-components';

import { createTimedTextTrack } from '../../data/sideEffects/createTimedTextTrack/createTimedTextTrack';
import { LanguageChoice } from '../../types/LanguageChoice';
import { modelName } from '../../types/models';
import { TimedText, timedTextMode } from '../../types/tracks';
import { theme } from '../../utils/theme/theme';
import { Maybe, Nullable } from '../../utils/types';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';

const messages = defineMessages({
  addTrackBtn: {
    defaultMessage: 'Upload the file',
    description:
      'Text for the button in the dashboard to go upload a new timed text file.',
    id: 'components.TimedTextCreationForm.addTrackBtn',
  },
  addTrackLabel: {
    defaultMessage: 'Add a language',
    description:
      'Label for the form that lets the instructor add a new timed text track.',
    id: 'components.TimedTextCreationForm.addTrackLabel',
  },
  error: {
    defaultMessage: 'There was an error during track creation.',
    description:
      'Generic error message when we fail to create a subtitle/transcript/caption track.',
    id: 'components.TimedTextCreationForm.error',
  },
});

const TimedTextCreationFormStyled = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
`;

const ErrorMessage = styled.div`
  color: ${normalizeColor('status-error', theme)};
`;

interface SelectOption {
  label: string;
  value: string;
}

/** Props shape for the TimedTextCreationForm component. */
export interface TimedTextCreationFormProps {
  createTimedTextTrack: (timedtexttrack: TimedText) => void;
  getTimedTextTrackLanguageChoices: (jwt: string) => void;
  jwt: string;
  languageChoices: LanguageChoice[];
  mode: timedTextMode;
}

/** State shape for the TimedTextCreationForm component. */
interface TimedTextCreationFormState {
  error?: 'creation' | 'schema';
  newTTLanguage?: string;
  newTTUploadId?: TimedText['id'];
}

/**
 * Component. Displays a form that allows the user to create a new timedtexttrack.
 * @param createTimedTextTrack Action creator that takes a timedtexttrack to insert into the store.
 * @param jwt The token that will be used to interact with the API.
 * @param mode The mode of the timedtexttracks we're creating.
 */
export class TimedTextCreationForm extends React.Component<
  TimedTextCreationFormProps,
  TimedTextCreationFormState
> {
  state: TimedTextCreationFormState = {};

  componentDidMount() {
    const { jwt, getTimedTextTrackLanguageChoices } = this.props;

    getTimedTextTrackLanguageChoices(jwt);
  }

  async createAndGoToUpload() {
    try {
      const newTTT = await createTimedTextTrack(
        this.props.jwt,
        this.state.newTTLanguage!,
        this.props.mode,
      );

      this.props.createTimedTextTrack(newTTT);
      this.setState({ newTTUploadId: newTTT.id });
    } catch (error) {
      this.setState({ error: 'creation' });
    }
  }

  onSelectChange(
    option: Maybe<Nullable<ValueType<SelectOption>>>,
    { action }: ActionMeta,
  ) {
    if (action === 'select-option' && option && !(option instanceof Array)) {
      this.setState({ newTTLanguage: option.value });
    }
  }

  render() {
    const { error, newTTLanguage, newTTUploadId } = this.state;
    const { languageChoices } = this.props;

    if (error === 'schema') {
      return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;
    }

    if (newTTUploadId) {
      return (
        <Redirect
          push
          to={UPLOAD_FORM_ROUTE(modelName.TIMEDTEXTTRACKS, newTTUploadId)}
        />
      );
    }

    return (
      <TimedTextCreationFormStyled>
        <FormattedMessage {...messages.addTrackLabel} />
        <Select
          onChange={this.onSelectChange.bind(this)}
          options={languageChoices}
          styles={{ input: styles => ({ ...styles, width: '8rem' }) }}
        />
        <Button
          color={'brand'}
          disabled={!newTTLanguage}
          label={<FormattedMessage {...messages.addTrackBtn} />}
          onClick={() => this.createAndGoToUpload()}
        />
        {error === 'creation' ? (
          <ErrorMessage>
            <FormattedMessage {...messages.error} />
          </ErrorMessage>
        ) : (
          ''
        )}
      </TimedTextCreationFormStyled>
    );
  }
}
