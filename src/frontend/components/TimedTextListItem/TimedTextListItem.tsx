import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { deleteTimedTextTrack } from '../../data/sideEffects/deleteTimedTextTrack/deleteTimedTextTrack';
import { getTimedTextTrackLanguageChoices } from '../../data/sideEffects/getTimedTextTrackLanguageChoices/getTimedTextTrackLanguageChoices';
import { modelName } from '../../types/models';
import { TimedText } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { ActionLink } from '../ActionLink/ActionLink';
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
  jwt: Nullable<string>;
  track: TimedText;
}

/** State shape for the TimedTextListItem component. */
interface TimedTextListItemState {
  languageMap: { [key: string]: string };
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
    this.state = { languageMap: {} };
  }

  async componentDidMount() {
    const languageChoices = await getTimedTextTrackLanguageChoices(
      this.props.jwt,
    );

    this.setState({
      languageMap: languageChoices.reduce(
        (acc, choice) => ({ ...acc, [choice.value]: choice.label }),
        {},
      ),
    });
  }

  async deleteTimedTextTrack() {
    await deleteTimedTextTrack(this.props.jwt, this.props.track);
    this.props.deleteTimedTextTrackRecord(this.props.track);
  }

  render() {
    const { track } = this.props;
    const { languageMap } = this.state;

    return (
      <TimedTextListItemStyled>
        <TimedTextListItemLanguage>
          {languageMap[track.language]}
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
            <FormattedMessage {...messages.replace} />
          </Link>
        </TimedTextListItemActions>
      </TimedTextListItemStyled>
    );
  }
}
