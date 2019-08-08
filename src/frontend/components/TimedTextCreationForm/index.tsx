import { Button } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';
import Select from 'react-select';
import { ActionMeta, ValueType } from 'react-select/src/types';
import styled from 'styled-components';

import { createTimedTextTrack } from '../../data/sideEffects/createTimedTextTrack';
import { useTimedTextTrack } from '../../data/stores/useTimedTextTrack';
import { useTimedTextTrackLanguageChoices } from '../../data/stores/useTimedTextTrackLanguageChoices';
import { modelName } from '../../types/models';
import { TimedText, timedTextMode } from '../../types/tracks';
import { report } from '../../utils/errors/report';
import { theme } from '../../utils/theme/theme';
import { Maybe } from '../../utils/types';
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
interface TimedTextCreationFormProps {
  excludedLanguages: string[];
  mode: timedTextMode;
}

const isSelectOption = (
  option: ValueType<SelectOption>,
): option is SelectOption => (option as SelectOption).value !== undefined;

/**
 * Component. Displays a form that allows the user to create a new timedtexttrack.
 */
export const TimedTextCreationForm = ({
  excludedLanguages,
  mode,
}: TimedTextCreationFormProps) => {
  const [error, setError] = useState(undefined as Maybe<'creation' | 'schema'>);
  const [newTTLanguage, setNewTTLanguage] = useState('');
  const [newTTUploadId, setNewTTUploadId] = useState('');

  const { choices, getChoices } = useTimedTextTrackLanguageChoices(
    state => state,
  );
  const doCreateTimedTextTrack = useTimedTextTrack(state => state.addResource);

  useEffect(() => {
    getChoices();
  }, []);

  const availableLanguages =
    choices &&
    choices.filter(language => !excludedLanguages.includes(language.value));

  const onSelectChange = (
    option: ValueType<SelectOption>,
    { action }: ActionMeta,
  ) => {
    if (action === 'select-option' && option && isSelectOption(option)) {
      setNewTTLanguage(option.value);
    }
  };

  const createAndGoToUpload = async () => {
    try {
      const newTTT = await createTimedTextTrack(newTTLanguage, mode);
      doCreateTimedTextTrack(newTTT);
      setNewTTUploadId(newTTT.id);
    } catch (error) {
      report(error); // it should work every time
      setError('creation');
    }
  };

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
        onChange={onSelectChange}
        options={availableLanguages}
        styles={{ input: styles => ({ ...styles, width: '8rem' }) }}
      />
      <Button
        color={'brand'}
        disabled={!newTTLanguage}
        label={<FormattedMessage {...messages.addTrackBtn} />}
        onClick={createAndGoToUpload}
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
};
