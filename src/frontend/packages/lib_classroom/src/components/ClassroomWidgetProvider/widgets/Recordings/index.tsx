import { Box } from 'grommet';
import { ClassroomRecording, FoldableItem, ItemList } from 'lib-components';
import React from 'react';
import { useIntl, defineMessages } from 'react-intl';

import { useCurrentClassroom } from 'hooks/useCurrentClassroom';

const messages = defineMessages({
  title: {
    defaultMessage: 'Recordings',
    description: 'Label for recordings in classroom creation form.',
    id: 'component.Recordings.title',
  },
  info: {
    defaultMessage: `All available recordings can be downloaded here.`,
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
});

export const Recordings = () => {
  const classroom = useCurrentClassroom();
  const intl = useIntl();

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
          <Box
            key={recording.id}
            direction="row"
            align="center"
            fill="horizontal"
            height="60px"
            gap="medium"
            pad="small"
          >
            <a
              title={intl.formatMessage(messages.downloadRecordingLabel)}
              href={recording.video_file_url}
              target="_blank"
              rel="noreferrer noopener"
            >
              {intl.formatDate(recording.started_at, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              }) +
                ' - ' +
                intl.formatDate(recording.started_at, {
                  hour: 'numeric',
                  minute: 'numeric',
                })}
            </a>
          </Box>
        )}
      </ItemList>
    </FoldableItem>
  );
};
