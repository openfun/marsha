import { useCurrentClassroom } from 'lib-classroom';
import {
  ClassroomRecording,
  FoldableItem,
  ItemList,
  useSiteConfig,
} from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Recording } from './Recording';

const messages = defineMessages({
  title: {
    defaultMessage: 'Recordings',
    description: 'Label for recordings in classroom creation form.',
    id: 'component.Recordings.title',
  },
  info: {
    defaultMessage:
      'All available recordings can be downloaded and converted to VOD here.',
    description: 'Helptext for the widget.',
    id: 'component.Recordings.info',
  },
  noRecordingsAvailable: {
    defaultMessage: 'No recordings available',
    description: 'Message when no recordings are available.',
    id: 'component.Recordings.noRecordingsAvailable',
  },
  downloadRecordingLabel: {
    defaultMessage: 'Download recording',
    description: 'Label for download recording button.',
    id: 'component.Recordings.downloadRecordingLabel',
  },
  convertVODLabel: {
    defaultMessage: 'Convert {recordingTitle} to VOD',
    description: 'Label for convert to VOD button.',
    id: 'component.Recordings.convertVODLabel',
  },
});

export const Recordings = () => {
  const classroom = useCurrentClassroom();
  const intl = useIntl();
  const { getSiteConfig } = useSiteConfig();
  const siteConfig = getSiteConfig();

  return (
    <FoldableItem
      infoText={intl.formatMessage(messages.info)}
      initialOpenValue
      title={intl.formatMessage(messages.title)}
    >
      <ItemList
        itemList={classroom.recordings}
        noItemsMessage={intl.formatMessage(messages.noRecordingsAvailable)}
      >
        {(recording: ClassroomRecording) => (
          <Recording
            key={recording.id}
            recording={recording}
            classroomTitle={classroom.title}
            conversionEnabled={
              classroom.vod_conversion_enabled &&
              siteConfig.vod_conversion_enabled
            }
          />
        )}
      </ItemList>
    </FoldableItem>
  );
};
