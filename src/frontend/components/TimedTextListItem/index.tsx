import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link, Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { deleteTimedTextTrack } from '../../data/sideEffects/deleteTimedTextTrack';
import { pollForTrack } from '../../data/sideEffects/pollForTrack';
import { useTimedTextTrack } from '../../data/stores/useTimedTextTrack';
import { useTimedTextTrackLanguageChoices } from '../../data/stores/useTimedTextTrackLanguageChoices';
import { requestStatus } from '../../types/api';
import { LanguageChoice } from '../../types/LanguageChoice';
import { modelName } from '../../types/models';
import { TimedText, uploadState } from '../../types/tracks';
import { Maybe } from '../../utils/types';
import { ActionLink } from '../ActionLink/ActionLink';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { UploadStatusPicker } from '../UploadStatusPicker';

const { PENDING, PROCESSING, UPLOADING } = uploadState;

const messages = defineMessages({
  delete: {
    defaultMessage: 'Delete',
    description: 'Link text to delete a subtitle/transcript/captions item.',
    id: 'components.TimedTextListItem.delete',
  },
  replace: {
    defaultMessage: 'Replace',
    description:
      'Link text to replace a subtitle/transcript/captions item with a new file (for the same language).',
    id: 'components.TimedTextListItem.replace',
  },
  upload: {
    defaultMessage: 'Upload',
    description:
      'Link text to upload a missing subtitle/transcript/captions item file.',
    id: 'components.TimedTextListItem.upload',
  },
  download: {
    defaultMessage: 'Download',
    description: 'Link text to download a subtitle/transcript/captions item.',
    id: 'components.TimedTextListItem.download',
  },
});

const TimedTextListItemStyled = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.15rem 0;
`;

const TimedTextListItemActions = styled.div`
  display: flex;
  align-items: center;
`;

const TimedTextListItemLanguage = styled.div`
  flex-basis: 10rem;
`;

const UploadStatusPickerStyled = styled(UploadStatusPicker)`
  flex-basis: 6rem;
`;

/** Props shape for the TimedTextListItem component. */
interface TimedTextListItemProps {
  track: TimedText;
}

export const TimedTextListItem = ({ track }: TimedTextListItemProps) => {
  const [error, setError] = useState('');

  const { choices, getChoices } = useTimedTextTrackLanguageChoices(
    (state) => state,
  );

  const deleteTimedTextTrackRecord = useTimedTextTrack(
    (state) => state.removeResource,
  );

  // On load, get TTT language choices and start polling if necessary
  useEffect(() => {
    getChoices();

    if ([PENDING, UPLOADING, PROCESSING].includes(track.upload_state)) {
      window.setTimeout(async () => {
        const result = await pollForTrack(modelName.TIMEDTEXTTRACKS, track.id);
        if (result === requestStatus.FAILURE) {
          setError('notFound');
        }
      }, 1000 * 10);
    }
  }, []);

  if (error) {
    return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;
  }

  const language: Maybe<LanguageChoice> =
    choices &&
    choices.find((languageChoice) => track.language === languageChoice.value);

  const deleteTrack = async () => {
    await deleteTimedTextTrack(track);
    deleteTimedTextTrackRecord(track);
  };

  return (
    <TimedTextListItemStyled>
      <TimedTextListItemLanguage>
        {language ? language.label : track.language}
      </TimedTextListItemLanguage>
      <UploadStatusPickerStyled state={track.upload_state} />
      <TimedTextListItemActions>
        <ActionLink
          color={'status-critical'}
          label={<FormattedMessage {...messages.delete} />}
          onClick={() => deleteTrack()}
        />
        &nbsp;/&nbsp;
        <Link to={UPLOAD_FORM_ROUTE(modelName.TIMEDTEXTTRACKS, track.id)}>
          <FormattedMessage
            {...(track.upload_state === uploadState.PENDING
              ? messages.upload
              : messages.replace)}
          />
        </Link>
        {track.upload_state === uploadState.READY && track.source_url && (
          <React.Fragment>
            &nbsp;/&nbsp;
            <a href={track.source_url}>
              <FormattedMessage {...messages.download} />
            </a>
          </React.Fragment>
        )}
      </TimedTextListItemActions>
    </TimedTextListItemStyled>
  );
};
