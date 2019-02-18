import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link, Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { deleteTimedTextTrack } from '../../data/sideEffects/deleteTimedTextTrack/deleteTimedTextTrack';
import { API_ENDPOINT } from '../../settings';
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
interface TimedTextListItemProps {
  deleteTimedTextTrackRecord: (timedtexttrack: TimedText) => void;
  getTimedTextTrackLanguageChoices: (jwt: string) => void;
  updateTimedTextTrackRecord: (timedtexttrack: TimedText) => void;
  jwt: string;
  languageChoices: LanguageChoice[];
  track: TimedText;
}

/** State shape for the TimedTextListItem component. */
interface TimedTextListItemState {
  error?: boolean;
}

/**
 * Component. Displays one TimedTextTrack as part of a list of TimedTextTracks. Provides buttons for
 * the user to delete it or replace the linked video.
 * @param deleteTimedTextTrackRecord Action creator that takes a timedtexttrack to remove from the store.
 * @param jwt The token that will be used to interact with the API.
 * @param track The timedtexttrack to display.
 */
export class TimedTextListItem extends React.Component<
  TimedTextListItemProps,
  TimedTextListItemState
> {
  constructor(props: TimedTextListItemProps) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const { jwt, getTimedTextTrackLanguageChoices } = this.props;

    getTimedTextTrackLanguageChoices(jwt);

    if (this.props.track.is_ready_to_play === false) {
      window.setTimeout(() => this.pollForTTT(), 1000 * 10);
    }
  }

  async pollForTTT(timer: number = 15, counter: number = 1) {
    try {
      const { track, jwt, updateTimedTextTrackRecord } = this.props;
      const response = await fetch(
        `${API_ENDPOINT}/timedtexttracks/${track.id}/`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      );

      const incomingTrack: TimedText = await response.json();

      if (incomingTrack.is_ready_to_play) {
        updateTimedTextTrackRecord(incomingTrack);
      } else if (counter < 20) {
        counter++;
        timer = timer * counter;
        window.setTimeout(() => this.pollForTTT(timer, counter), 1000 * timer);
      }
    } catch (error) {
      this.setState({ error: true });
    }
  }

  async deleteTimedTextTrack() {
    await deleteTimedTextTrack(this.props.jwt, this.props.track);
    this.props.deleteTimedTextTrackRecord(this.props.track);
  }

  render() {
    if (this.state.error) {
      return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;
    }

    const { track, languageChoices } = this.props;

    const language: Maybe<LanguageChoice> = languageChoices.find(
      languageChoice => track.language === languageChoice.value,
    );

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
            onClick={() => this.deleteTimedTextTrack()}
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
  }
}
