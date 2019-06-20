import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { Dispatch } from 'redux';
import styled from 'styled-components';

import { deleteResource } from '../../data/genericReducers/resourceById/actions';
import { RootState } from '../../data/rootReducer';
import { deleteTimedTextTrack } from '../../data/sideEffects/deleteTimedTextTrack/deleteTimedTextTrack';
import { pollForTrack } from '../../data/sideEffects/pollForTrack';
import { useTimedTextTrackLanguageChoices } from '../../data/stores/useTimedTextTrackLanguageChoices';
import { requestStatus } from '../../types/api';
import { appStateSuccess } from '../../types/AppData';
import { LanguageChoice } from '../../types/LanguageChoice';
import { modelName } from '../../types/models';
import { TimedText, uploadState } from '../../types/tracks';
import { Maybe } from '../../utils/types';
import { ActionLink } from '../ActionLink/ActionLink';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { UploadStatusPicker } from '../UploadStatusPicker/UploadStatusPicker';

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
interface BaseTimedTextListItemProps {
  deleteTimedTextTrackRecord: (timedtexttrack: TimedText) => void;
  pollForTimedTextTrack: (
    resourceName: modelName.TIMEDTEXTTRACKS,
    resourceId: string,
  ) => Promise<requestStatus>;
  jwt: string;
  track: TimedText;
}

/**
 * Component. Displays one TimedTextTrack as part of a list of TimedTextTracks. Provides buttons for
 * the user to delete it or replace the linked video.
 * @param deleteTimedTextTrackRecord Action creator that takes a timedtexttrack to remove from the store.
 * @param jwt The token that will be used to interact with the API.
 * @param track The timedtexttrack to display.
 */
const BaseTimedTextListItem = ({
  deleteTimedTextTrackRecord,
  jwt,
  pollForTimedTextTrack,
  track,
}: BaseTimedTextListItemProps) => {
  const [error, setError] = useState('');

  const { choices, getChoices } = useTimedTextTrackLanguageChoices();

  // On load, get TTT language choices and start polling if necessary
  useEffect(() => {
    getChoices();

    if (track.is_ready_to_play === false) {
      window.setTimeout(async () => {
        const result = await pollForTimedTextTrack(
          modelName.TIMEDTEXTTRACKS,
          track.id,
        );
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
    choices.find(languageChoice => track.language === languageChoice.value);

  const deleteTrack = async () => {
    await deleteTimedTextTrack(jwt, track);
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
      </TimedTextListItemActions>
    </TimedTextListItemStyled>
  );
};

const mapStateToProps = (
  state: RootState<appStateSuccess>,
  { track }: Pick<BaseTimedTextListItemProps, 'track'>,
) => ({
  jwt: state.context.jwt,
  track,
});

/**
 * Component. Displays one TimedTextTrack as part of a list of TimedTextTracks. Provides buttons for
 * the user to delete it or replace the linked video.
 * @param deleteTimedTextTrackRecord Action creator that takes a timedtexttrack to remove from the store.
 * @param jwt The token that will be used to interact with the API.
 * @param track The timedtexttrack to display.
 */
export const TimedTextListItem = connect(
  mapStateToProps,
  null!,
  ({ jwt, track }, { dispatch }: { dispatch: Dispatch }) => ({
    deleteTimedTextTrackRecord: (timedtexttrack: TimedText) =>
      dispatch(deleteResource(modelName.TIMEDTEXTTRACKS, timedtexttrack)),
    jwt,
    pollForTimedTextTrack: pollForTrack(dispatch),
    track,
  }),
)(BaseTimedTextListItem);
